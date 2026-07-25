import {
  pgTable,
  text,
  uuid,
  jsonb,
  bigserial,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { idPk } from "./helpers";
import { auditActionEnum } from "./enums";

/**
 * APPEND-ONLY audit log (SPEC §4.7, §8). The application DB role must be granted
 * no UPDATE/DELETE on this table. Written in the same transaction as the
 * mutation it records. `tenant_id` / `entity_id` are intentionally FK-free so an
 * audit write can never fail on referential integrity.
 */
export const auditEvent = pgTable(
  "audit_event",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    tenantId: uuid("tenant_id"),
    actorPersonId: uuid("actor_person_id"),
    actorRole: text("actor_role"),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    before: jsonb("before").$type<Record<string, unknown>>(),
    after: jsonb("after").$type<Record<string, unknown>>(),
    diff: jsonb("diff").$type<Record<string, unknown>>(),
    requestId: text("request_id"),
    ip: text("ip"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_entity_idx").on(t.entityType, t.entityId),
    index("audit_tenant_at_idx").on(t.tenantId, t.at),
  ],
);

/**
 * A running workflow for some entity (SPEC §4.7, §7). Polymorphic
 * (entity_type, entity_id); current_state is a state in the referenced
 * definition's machine.
 */
export const workflowInstance = pgTable(
  "workflow_instance",
  {
    id: idPk(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    definitionId: text("definition_id").notNull(),
    currentState: text("current_state").notNull(),
    tenantId: uuid("tenant_id"),
  },
  (t) => [
    index("wf_instance_entity_idx").on(t.entityType, t.entityId),
    index("wf_instance_definition_idx").on(t.definitionId),
  ],
);

/** APPEND-ONLY transition history for a workflow instance (SPEC §4.7, §7). */
export const workflowTransition = pgTable(
  "workflow_transition",
  {
    id: idPk(),
    instanceId: uuid("instance_id")
      .notNull()
      .references(() => workflowInstance.id),
    fromState: text("from_state"),
    toState: text("to_state").notNull(),
    actorPersonId: uuid("actor_person_id"),
    reason: text("reason"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("wf_transition_instance_idx").on(t.instanceId)],
);
