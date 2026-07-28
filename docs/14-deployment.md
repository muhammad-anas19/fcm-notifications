# 14 — Deployment: Running the Whole Stack Locally

Every previous phase has described one *piece* of this system — the broker, the API, the
workers, FCM, the database. This phase is about the unglamorous but essential question: how do
all of these pieces actually get started, in the right order, with the right configuration, on
one machine, without you manually juggling connection strings across five terminals?

## What's actually containerized here, and what isn't

For this project, **only RabbitMQ runs in Docker** (`backend/docker-compose.yml`). Postgres runs
natively on the host (a locally installed Postgres service) rather than in a container — that's
a deliberate choice for this environment, not a gap: the API and every worker just point
`DATABASE_URL` at `localhost` instead of a `postgres` service name, and everything else about the
architecture (migrations, schema, connection pooling) is identical either way. If you were
setting this up fresh with no existing Postgres install, containerizing Postgres too (as shown
further down) is the more common default.

The API and the three workers (`router-worker`, `push-worker`, `inapp-worker`) run as plain Node
processes during development — `nest start <app>` (or `node dist/apps/<app>/main.js` after
`nest build`) — each reading the same `backend/.env` file. This is enough to prove every
concept in this system end-to-end (we did exactly that in the smoke test: signup → admin send →
router fan-out → in-app delivery, all visible in RabbitMQ's management UI and the database).
Containerizing the app processes themselves is a deployment concern, not a functional one — see
the "containerizing everything" section below for how that step would look.

```bash
# What's actually running for local dev:
cd backend
docker compose up -d rabbitmq        # the one containerized piece
npm run migration:run                # against the native Postgres instance
npm run start:dev api                # or: npx nest start api
npm run start:dev router-worker
npm run start:dev push-worker        # needs FIREBASE_CREDENTIALS_PATH set to a real service account
npm run start:dev inapp-worker
```

## Why separate apps per worker, not one shared "worker" image

`docs/03-project-architecture.md` already made this call: `apps/router-worker`, `apps/push-worker`,
and `apps/inapp-worker` are three separate NestJS applications in the monorepo — each its own
`main.ts`, each its own `nest build`/`nest start` target — rather than one generic "worker" image
parameterized by an env var like `WORKER_QUEUE` that picks its behavior at runtime.

| | Separate apps per worker (what we built) | One image, `WORKER_QUEUE`-parameterized |
|---|---|---|
| Clarity | Each app's `main.ts`/module only wires what it needs (push-worker imports `ProvidersModule` for FCM; inapp-worker doesn't) | One codebase has to import every channel's dependencies whether a given instance uses them or not |
| Adding a channel | New `apps/email-worker`, own module, explicit dependencies | Add a case to a shared strategy/switch keyed off the queue name |
| Shared logic | Still shared — via `libs/messaging`, `libs/database`'s query services, `libs/domain` — just consumed by each app rather than living in one binary | Same shared libs, one binary |
| Right fit for | A monorepo where `nest build <app>` already gives you independent artifacts for free | A setup where you specifically want one Docker image and differentiate purely by config |

Both are legitimate; this project uses the monorepo apps directly because that's what `nest
generate app` gives you naturally, and because it keeps each worker's own dependencies explicit
in its own module rather than hidden behind a runtime switch. The shared plumbing (topology
declaration, retry/DLQ, ack/nack, the preferences and device-token queries) still lives in
exactly one place — `libs/messaging` and `libs/database` — so there's no meaningful duplication
either way; only the entry point differs.

## Environment variables

| Variable | Needed by | Purpose |
|---|---|---|
| `DATABASE_URL` | `api`, every worker | Postgres connection string |
| `RABBITMQ_URL` | `api`, every worker | AMQP connection string — the API publishes, workers consume |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | `api` only | Signs/verifies auth tokens — workers never see or validate JWTs, they only consume already-persisted, already-validated messages |
| `FIREBASE_CREDENTIALS_PATH` | `push-worker` only | Path to the FCM service account JSON — no other process needs it |

Note the asymmetry: `api` never needs FCM credentials, and workers never need `JWT_SECRET`. This
isn't accidental — it's the same separation of concerns from Phase 1: the API
validates/persists/publishes, workers deliver. Neither needs to know how to do the other's job,
and giving a process a secret it doesn't need is just unnecessary exposure (docs/11-security.md).

## Where migrations run: a dedicated step, not "on every boot"

It's tempting to just run migrations inside the API's own startup script — "call
`migration:run` then start listening." This breaks the moment you run more than one API replica:
if two `api` instances both boot at once (normal in any real deployment), both try to run
migrations concurrently against the same database, racing to apply the same schema change —
which can deadlock, partially apply a migration twice, or corrupt migration bookkeeping tables
outright.

The fix: migrations are their own explicit step (`npm run migration:run`), run once, before any
`api`/worker process starts — never implicitly on boot. In a fully containerized deployment
(below), this becomes a one-shot `migrate` service that every other service depends on via
`condition: service_completed_successfully`.

## Containerizing everything (the production-shaped version)

If you wanted this to run as a single `docker compose up` with no native dependencies at all —
the more typical starting point, and worth understanding even though this project's actual local
setup uses a native Postgres — it looks like this: add a Dockerfile per app (or one Dockerfile
with a build stage per app, since they share `libs/*`), add `postgres` back into
`docker-compose.yml`, and add one service per app:

```yaml
# docker-compose.yml (illustrative full version — this project's actual compose file only has rabbitmq)
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: notifications
      POSTGRES_PASSWORD: devpassword
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "15672:15672"

  migrate:
    build: { context: ., target: api }
    command: ["npm", "run", "migration:run"]
    depends_on:
      postgres: { condition: service_healthy }
    environment:
      DATABASE_URL: postgres://postgres:devpassword@postgres:5432/notifications

  api:
    build: { context: ., target: api }
    depends_on:
      migrate: { condition: service_completed_successfully }
      rabbitmq: { condition: service_started }
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://postgres:devpassword@postgres:5432/notifications
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      JWT_SECRET: dev-secret-change-in-real-deploys

  router-worker:
    build: { context: ., target: router-worker }
    depends_on:
      migrate: { condition: service_completed_successfully }
      rabbitmq: { condition: service_started }
    environment:
      DATABASE_URL: postgres://postgres:devpassword@postgres:5432/notifications
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672

  push-worker:
    build: { context: ., target: push-worker }
    depends_on:
      migrate: { condition: service_completed_successfully }
      rabbitmq: { condition: service_started }
    environment:
      DATABASE_URL: postgres://postgres:devpassword@postgres:5432/notifications
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672
      FIREBASE_CREDENTIALS_PATH: /run/secrets/firebase-service-account.json

  inapp-worker:
    build: { context: ., target: inapp-worker }
    depends_on:
      migrate: { condition: service_completed_successfully }
      rabbitmq: { condition: service_started }
    environment:
      DATABASE_URL: postgres://postgres:devpassword@postgres:5432/notifications
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672

volumes:
  pgdata:
```

Each `target:` here would be a build stage in a multi-stage Dockerfile that runs `nest build
<app-name>` and copies just that app's `dist/apps/<app-name>` output — since every app shares
one `node_modules` and one set of `libs/*`, a multi-stage Dockerfile avoids rebuilding shared
dependencies per app.

## Production-hardening notes (brief — this is a learning project, not a deadline)

This project's actual goal is learning the concepts, not running a 24/7 production deployment, so
these are noted rather than built:

- **Managed Postgres** (e.g. RDS, Cloud SQL, Neon) instead of a self-hosted instance — handles
  backups, failover, and patching for you.
- **A managed RabbitMQ** (e.g. CloudAMQP) instead of self-hosting a cluster. Running your **own
  highly-available RabbitMQ cluster** means owning quorum queue replication, network partition
  handling, and zero-downtime broker upgrades — real operational expertise that is a job in
  itself at companies that do it. A single-node broker (as configured here) is entirely
  sufficient to prove every concept in Phases 2–13; reaching for a managed broker in a real
  deployment is the practical choice specifically *because* self-hosting HA RabbitMQ is a much
  bigger undertaking than "add a service to docker-compose."
- Secrets (JWT secret, FCM credentials, DB password) would move out of plain environment
  variables into a secrets manager — the *rest* of this architecture (topic exchange,
  queue-per-channel, retry/DLQ, one app per worker) doesn't change at all moving from local dev
  to a real deployment. That portability is itself a payoff of the design decisions from earlier
  phases.

## Checkpoint

1. Why does running migrations as their own explicit step prevent a problem that running them
   inside the API's startup script would cause?
2. What specifically would break if two `api` replicas both tried to run migrations on boot?
3. Why does `push-worker` need `FIREBASE_CREDENTIALS_PATH` while `router-worker` and
   `inapp-worker` don't, and why does `api` need none of it?
4. This project keeps Postgres native but RabbitMQ containerized — what would you have to
   change (env vars, not architecture) to containerize Postgres too?

## Common interview angle

"How would you deploy a multi-service system with a database, a message broker, an API, and
background workers?" is testing whether you separate concerns correctly: migrations as a
controlled, one-time step (not implicit on every boot), workers as independently-scalable
processes distinct from the API (Phase 2's consumer/producer split made concrete at the
infrastructure level), and a clear line between "what this needs to run" versus "what it would
need to run at real production scale" (managed services over self-hosted HA clusters). The weak
answer treats deployment as an afterthought; the strong one shows the same first-principles
discipline used to design the messaging and API layers.
