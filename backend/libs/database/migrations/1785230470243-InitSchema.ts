import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1785230470243 implements MigrationInterface {
    name = 'InitSchema1785230470243'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Required for uuid_generate_v4() used as the default on every primary key below.
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "name" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."device_tokens_platform_enum" AS ENUM('ios', 'android', 'web')`);
        await queryRunner.query(`CREATE TABLE "device_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "fcmToken" character varying NOT NULL, "platform" "public"."device_tokens_platform_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastUsedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_1140451a0ae3de0d57e9be48781" UNIQUE ("fcmToken"), CONSTRAINT "PK_84700be257607cfb1f9dc2e52c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_511957e3e8443429dc3fb00120" ON "device_tokens"  ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_619d48b7cedf9a5e2397cbb13e" ON "device_tokens"  ("isActive") `);
        await queryRunner.query(`CREATE TYPE "public"."notification_templates_category_enum" AS ENUM('transactional', 'promotional')`);
        await queryRunner.query(`CREATE TABLE "notification_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "titleTemplate" character varying NOT NULL, "bodyTemplate" character varying NOT NULL, "category" "public"."notification_templates_category_enum" NOT NULL, "defaultChannels" jsonb NOT NULL DEFAULT '[]', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8984071929794bfee03a46d2035" UNIQUE ("key"), CONSTRAINT "PK_76f0fc48b8d057d2ae7f3a2848a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_category_enum" AS ENUM('transactional', 'promotional')`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_status_enum" AS ENUM('pending', 'queued', 'processing', 'sent', 'failed')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "templateId" uuid, "title" character varying NOT NULL, "body" character varying NOT NULL, "category" "public"."notifications_category_enum" NOT NULL, "data" jsonb, "status" "public"."notifications_status_enum" NOT NULL DEFAULT 'pending', "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_notifications_user_created" ON "notifications"  ("userId", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."notification_delivery_logs_channel_enum" AS ENUM('push', 'email', 'sms', 'inapp', 'whatsapp')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_delivery_logs_status_enum" AS ENUM('queued', 'sent', 'delivered', 'failed', 'retrying', 'dead_lettered')`);
        await queryRunner.query(`CREATE TABLE "notification_delivery_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "notificationId" uuid NOT NULL, "channel" "public"."notification_delivery_logs_channel_enum" NOT NULL, "status" "public"."notification_delivery_logs_status_enum" NOT NULL DEFAULT 'queued', "providerMessageId" character varying, "errorMessage" text, "attemptCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d02cbec99bc30d81d79705caa0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_delivery_logs_notification_channel" ON "notification_delivery_logs"  ("notificationId", "channel") `);
        await queryRunner.query(`CREATE TYPE "public"."notification_preferences_channel_enum" AS ENUM('push', 'email', 'sms', 'inapp', 'whatsapp')`);
        await queryRunner.query(`CREATE TYPE "public"."notification_preferences_category_enum" AS ENUM('transactional', 'promotional')`);
        await queryRunner.query(`CREATE TABLE "notification_preferences" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "channel" "public"."notification_preferences_channel_enum" NOT NULL, "category" "public"."notification_preferences_category_enum" NOT NULL, "enabled" boolean NOT NULL DEFAULT true, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "uq_preference_user_channel_category" UNIQUE ("userId", "channel", "category"), CONSTRAINT "PK_e94e2b543f2f218ee68e4f4fad2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b70c44e8b00757584a39322559" ON "notification_preferences"  ("userId") `);
        await queryRunner.query(`CREATE TYPE "public"."queue_logs_event_enum" AS ENUM('published', 'consumed', 'acked', 'nacked', 'dead_lettered')`);
        await queryRunner.query(`CREATE TABLE "queue_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "messageId" character varying NOT NULL, "exchange" character varying NOT NULL, "routingKey" character varying NOT NULL, "queueName" character varying NOT NULL, "event" "public"."queue_logs_event_enum" NOT NULL, "payloadSnapshot" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_08c81f15170719dc08c5d1b1092" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "device_tokens" ADD CONSTRAINT "FK_511957e3e8443429dc3fb00120c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_4b3957148ccff1ea6ed6cfead41" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_delivery_logs" ADD CONSTRAINT "FK_891e1dd9583910cd73707548b08" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b70c44e8b00757584a393225593" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_b70c44e8b00757584a393225593"`);
        await queryRunner.query(`ALTER TABLE "notification_delivery_logs" DROP CONSTRAINT "FK_891e1dd9583910cd73707548b08"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_4b3957148ccff1ea6ed6cfead41"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_511957e3e8443429dc3fb00120c"`);
        await queryRunner.query(`DROP TABLE "queue_logs"`);
        await queryRunner.query(`DROP TYPE "public"."queue_logs_event_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b70c44e8b00757584a39322559"`);
        await queryRunner.query(`DROP TABLE "notification_preferences"`);
        await queryRunner.query(`DROP TYPE "public"."notification_preferences_category_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_preferences_channel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_delivery_logs_notification_channel"`);
        await queryRunner.query(`DROP TABLE "notification_delivery_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_delivery_logs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notification_delivery_logs_channel_enum"`);
        await queryRunner.query(`DROP INDEX "public"."idx_notifications_user_created"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_category_enum"`);
        await queryRunner.query(`DROP TABLE "notification_templates"`);
        await queryRunner.query(`DROP TYPE "public"."notification_templates_category_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_619d48b7cedf9a5e2397cbb13e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_511957e3e8443429dc3fb00120"`);
        await queryRunner.query(`DROP TABLE "device_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."device_tokens_platform_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
