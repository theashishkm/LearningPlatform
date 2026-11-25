import { loadEnvConfig } from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export async function withDatabase(run: (db: ReturnType<typeof drizzle>) => Promise<void>) {
  loadEnvConfig(process.cwd());
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Set DATABASE_URL in .env.local before connecting to PostgreSQL.");
  // The Supabase transaction pooler does not support prepared statements.
  const client = postgres(connectionString, { prepare: false, max: 1 });
  try {
    await run(drizzle(client));
  } finally {
    await client.end();
  }
}
