import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { idPk, timestamps, softDelete } from "./helpers";
import { formStatusEnum, snapshotReasonEnum } from "./enums";
import { agency } from "./tenancy";

/**
 * Metadata-driven form definition (SPEC §5.6). Immutable per (key, version,
 * tenant). `key` is the logical id (e.g. "le.arrest_report"); a null tenant is a
 * global default, a set tenant is a per-parish override (SPEC §11).
 *
 * NOTE: uses a surrogate uuid PK so submissions can hold a single-column FK.
 * The uniqueIndex on (key, version, tenant_id) treats NULL tenants as distinct
 * per SQL semantics; a coalesce-based unique index should replace it if multiple
 * global rows per (key,version) must be prevented at the DB level.
 */
export const formDefinition = pgTable(
  "form_definition",
  {
    id: idPk(),
    /** Logical definition id, e.g. "le.arrest_report". */
    key: text("key").notNull(),
    version: integer("version").notNull(),
    /** null = global default; set = tenant override. */
    tenantId: uuid("tenant_id").references(() => agency.id),
    /** The definition document (form → sections → fields). */
    schema: jsonb("schema").$type<Record<string, unknown>>().notNull(),
    status: formStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("form_definition_key_version_tenant_uq").on(
      t.key,
      t.version,
      t.tenantId,
    ),
    index("form_definition_key_idx").on(t.key),
  ],
);

/**
 * The live submission bound to a case entity (SPEC §5.6). `version` is the
 * optimistic-lock counter used for field-level offline conflict resolution
 * (SPEC §5.8). A submission always validates against its own definition_version.
 */
export const formSubmission = pgTable(
  "form_submission",
  {
    id: idPk(),
    definitionId: uuid("definition_id")
      .notNull()
      .references(() => formDefinition.id),
    definitionVersion: integer("definition_version").notNull(),
    /** e.g. entityType "le_incident", entityId <uuid>. */
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    workflowState: text("workflow_state"),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => agency.id),
    /** optimistic-lock version counter. */
    version: integer("version").notNull().default(0),
    createdBy: uuid("created_by"),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("form_submission_entity_idx").on(t.entityType, t.entityId),
    index("form_submission_tenant_idx").on(t.tenantId),
  ],
);

/**
 * Immutable version history (SPEC §5.7). Every transition and manual save writes
 * a frozen snapshot; the "Filed" snapshot is the legal record.
 */
export const formSubmissionSnapshot = pgTable(
  "form_submission_snapshot",
  {
    id: idPk(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => formSubmission.id),
    versionNo: integer("version_no").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    definitionVersion: integer("definition_version").notNull(),
    reason: snapshotReasonEnum("reason").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("form_snapshot_submission_idx").on(t.submissionId),
    uniqueIndex("form_snapshot_submission_version_uq").on(
      t.submissionId,
      t.versionNo,
    ),
  ],
);

/** Optional server mirror of an offline draft (SPEC §5.6, §5.8). */
export const formDraftLocal = pgTable(
  "form_draft_local",
  {
    id: idPk(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => formSubmission.id),
    clientId: text("client_id").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    baseVersion: integer("base_version").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("form_draft_submission_client_uq").on(
      t.submissionId,
      t.clientId,
    ),
  ],
);
