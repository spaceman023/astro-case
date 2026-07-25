import {
  pgTable,
  text,
  uuid,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { idPk, timestamps, softDelete } from "./helpers";
import { domainEnum, caseStatusEnum, partyRoleEnum } from "./enums";
import { agency } from "./tenancy";
import { person } from "./identity";

/**
 * Domain entry records. Each is the per-domain "front door" for a case; its
 * structured data lives mostly in form_submission rows (SPEC §4.1). Kept lean —
 * a case references these via nullable FKs and is threaded, not copied.
 */
export const leIncident = pgTable("le_incident", {
  id: idPk(),
  caseId: uuid("case_id").references((): any => caseTable.id),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => agency.id),
  incidentNumber: text("incident_number"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }),
  reportedAt: timestamp("reported_at", { withTimezone: true }),
  ...timestamps(),
  ...softDelete(),
});

export const prosecutionMatter = pgTable("prosecution_matter", {
  id: idPk(),
  caseId: uuid("case_id").references((): any => caseTable.id),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => agency.id),
  matterNumber: text("matter_number"),
  screenedAt: timestamp("screened_at", { withTimezone: true }),
  /** accept | reject | divert */
  decision: text("decision"),
  ...timestamps(),
  ...softDelete(),
});

export const courtDocket = pgTable("court_docket", {
  id: idPk(),
  caseId: uuid("case_id").references((): any => caseTable.id),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => agency.id),
  docketNumber: text("docket_number"),
  filedAt: timestamp("filed_at", { withTimezone: true }),
  dispositionAt: timestamp("disposition_at", { withTimezone: true }),
  ...timestamps(),
  ...softDelete(),
});

/**
 * The Case spine (SPEC §4.1). Threads the three domains via nullable FKs to each
 * domain's entry record. The SAME row gains prosecution_matter_id / court_docket_id
 * as the case advances — nothing is duplicated between domains.
 */
export const caseTable = pgTable(
  "case",
  {
    id: idPk(),
    caseNumber: text("case_number").notNull(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => agency.id),
    originDomain: domainEnum("origin_domain").notNull(),
    status: caseStatusEnum("status").notNull().default("open"),
    leIncidentId: uuid("le_incident_id").references(() => leIncident.id),
    prosecutionMatterId: uuid("prosecution_matter_id").references(
      () => prosecutionMatter.id,
    ),
    courtDocketId: uuid("court_docket_id").references(() => courtDocket.id),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("case_number_tenant_uq").on(t.tenantId, t.caseNumber),
    index("case_tenant_idx").on(t.tenantId),
    index("case_status_idx").on(t.status),
  ],
);

/**
 * Party/role edge (SPEC §4.3): a person's relationship to a case, optionally
 * scoped to a domain phase. The same person_id appears across LE / prosecution /
 * court contexts — cross-case history is a query over this table by person_id.
 */
export const caseParty = pgTable(
  "case_party",
  {
    id: idPk(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => caseTable.id),
    personId: uuid("person_id")
      .notNull()
      .references(() => person.id),
    role: partyRoleEnum("role").notNull(),
    domainContext: domainEnum("domain_context"),
    roleAttributes: jsonb("role_attributes").$type<Record<string, unknown>>(),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("case_party_case_idx").on(t.caseId),
    index("case_party_person_idx").on(t.personId),
    index("case_party_role_idx").on(t.role),
  ],
);
