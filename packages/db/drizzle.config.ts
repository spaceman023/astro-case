import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  casing: "snake_case",
  dbCredentials: {
    // Populated from the environment at migrate/studio time. Migration
    // *generation* (db:generate) reads the schema only and needs no DB.
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/justice",
  },
  verbose: true,
  strict: true,
});
