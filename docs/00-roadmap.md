# Learning Roadmap — Scalable Notification Service

This is a **learning project**. The goal isn't to have working code by tonight — it's to
understand *why* production notification systems (Uber, LinkedIn, Amazon) are built the way
they are, by building a simplified version ourselves.

## Rule of engagement

We move in **phases**. Each phase:
1. Teaches the concept from first principles (why it exists, what breaks without it).
2. Implements just enough code to prove the concept.
3. Ends with a recap + "could you explain this to someone else?" checkpoint.

We do **not** start Phase N+1 until Phase N's checkpoint is confirmed. This is intentional —
it mirrors how you'd actually learn distributed systems on the job: one primitive at a time,
each one motivated by a concrete failure of the previous approach.

## Phases

| # | Phase | Core Question |
|---|-------|----------------|
| 1 | System Design Foundations | Why can't the API just send the notification directly? |
| 2 | RabbitMQ Fundamentals | What is a broker, and how do producers/consumers talk through it? |
| 3 | Project Scaffolding | What does a modular NestJS service look like, and why this shape? |
| 4 | Database Design | How do we model notifications, preferences, tokens, logs? |
| 5 | Producer API | How does an HTTP request become a durable queue message? |
| 6 | Workers & Consumers | How does a message become a side effect, safely? |
| 7 | Retries & Dead Letter Queues | What happens when delivery fails? |
| 8 | FCM Integration | How does a push notification actually reach a phone? |
| 9 | Preferences & Routing (Fan-out) | How does one event become N channel-specific deliveries? |
| 10 | In-App Notifications + Delivery Logs | How do we track "did the user actually get this?" |
| 11 | Frontend (Next.js) | Bell, dropdown, history, FCM device registration |
| 12 | Admin & Broadcast APIs | Sending to one user vs many vs everyone |
| 13 | Scalability & Monitoring | How does this survive 10x traffic? |
| 14 | Security | What can go wrong, and who can abuse this? |
| 15 | Testing & Deployment | How do we trust it, and how do we ship it? |
| 16 | Recap & Future Improvements | Scheduling, templates, campaigns — what's next? |

Each phase gets its own doc in `/docs` once we complete it (matching the numbers above,
offset by one since this file is `00`).

## Where we are

**Currently in: Phase 2 — RabbitMQ Fundamentals.**
