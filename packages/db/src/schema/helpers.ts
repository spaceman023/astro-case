import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Reusable column snippets. Each is a factory returning a fresh builder so the
 * same column can be spread into many tables (Drizzle requires distinct builder
 * instances per table).
 */

/**
 * Primary key. Defaults to gen_random_uuid() (UUIDv4).
 * NOTE: SPEC §4.8 calls for UUIDv7 (time-sortable). Swap the default for a
 * uuidv7() expression once the deployment's Postgres (or a pg extension)
 * provides it; the column type is unchanged.
 */
export const idPk = () => uuid("id").primaryKey().defaultRandom();

/** created_at / updated_at, timezone-aware, defaulting to now(). */
export const timestamps = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Soft-delete marker (SPEC §4.8). Queries should filter isNull(deleted_at) by
 * default; admin/audit paths may opt in to deleted rows.
 */
export const softDelete = () => ({
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
