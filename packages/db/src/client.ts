import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

/**
 * Create a Drizzle client over postgres.js. Pass a connection string (defaults
 * to DATABASE_URL). Use `snake_case` casing to match the schema's column names.
 *
 * Tenant isolation (SPEC §4.8, §11) is enforced by Postgres RLS: set the
 * per-request session vars `app.current_tenant` / `app.current_person` on the
 * connection before running tenant-scoped queries.
 */
export function createDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set and no connection string was provided.");
  }
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema, casing: "snake_case" });
}
