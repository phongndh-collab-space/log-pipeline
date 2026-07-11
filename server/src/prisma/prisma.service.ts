import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "../../prisma/generated/client";

const { Client } = require("pg");

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.ensureLocalDatabase();
    await this.$connect();
    await this.ensureTables();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async ensureLocalDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return;

    const appDatabaseUrl = new URL(databaseUrl);
    const databaseName = appDatabaseUrl.pathname.replace("/", "");
    if (!databaseName) return;

    const maintenanceUrl = new URL(databaseUrl);
    maintenanceUrl.pathname = "/postgres";

    const client = new Client({
      connectionString: maintenanceUrl.toString()
    });

    await client.connect();
    try {
      const result = await client.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [databaseName]
      );

      if (result.rowCount === 0) {
        await client.query(`CREATE DATABASE "${databaseName.replace(/"/g, "\"\"")}"`);
      }
    } finally {
      await client.end();
    }
  }

  private async ensureTables() {
    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" SERIAL NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'local',
        "account" TEXT NOT NULL,
        "username" TEXT NOT NULL,
        "passwordHash" TEXT,
        "avatar" TEXT NOT NULL DEFAULT '',
        "role" INTEGER NOT NULL DEFAULT 1,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
    `);

    await this.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "User_account_key" ON "User"("account");
    `);

    await this.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BackupLog" (
        "id" SERIAL NOT NULL,
        "eventTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "requestId" TEXT NOT NULL,
        "serviceName" TEXT NOT NULL,
        "clientIp" TEXT NOT NULL,
        "method" TEXT NOT NULL,
        "path" TEXT NOT NULL,
        "statusCode" INTEGER NOT NULL,
        "statusGroup" TEXT,
        "latencyMs" INTEGER NOT NULL,
        "isError" INTEGER NOT NULL DEFAULT 0,
        "userAgent" TEXT NOT NULL,
        "rawMessage" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BackupLog_pkey" PRIMARY KEY ("id")
      );
    `);
  }
}
