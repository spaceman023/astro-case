import { pgEnum } from "drizzle-orm/pg-core";

/** The three justice domains a case threads through. */
export const domainEnum = pgEnum("domain", ["le", "prosecution", "court"]);

/** High-level case lifecycle (per-domain workflow state is tracked separately). */
export const caseStatusEnum = pgEnum("case_status", [
  "open",
  "closed",
  "sealed",
]);

/** How a person is related to a case, optionally scoped to a domain phase. */
export const partyRoleEnum = pgEnum("party_role", [
  "defendant",
  "victim",
  "witness",
  "officer",
  "attorney",
  "judge",
  "complainant",
  "clerk",
  "other",
]);

/** Justice-staff kinds that carry a staff_profile in addition to a person row. */
export const staffKindEnum = pgEnum("staff_kind", [
  "officer",
  "attorney",
  "judge",
  "clerk",
]);

/** RBAC roles (assigned per-tenant). */
export const roleEnum = pgEnum("role", [
  "detective",
  "le_supervisor",
  "ada",
  "da_supervisor",
  "clerk",
  "judge",
  "admin",
]);

/** Charge lifecycle across the amendment chain (booked → filed → amended → …). */
export const chargeStatusEnum = pgEnum("charge_status", [
  "booked",
  "screened",
  "filed",
  "amended",
  "dismissed",
  "disposed",
]);

/** Evidence classification. */
export const evidenceTypeEnum = pgEnum("evidence_type", [
  "physical",
  "digital",
  "document",
  "biological",
  "weapon",
  "narcotic",
  "currency",
  "other",
]);

/** Current custody state of an evidence item. */
export const custodyStatusEnum = pgEnum("custody_status", [
  "collected",
  "stored",
  "checked_out",
  "in_analysis",
  "released",
  "destroyed",
]);

/** Append-only chain-of-custody actions. */
export const custodyActionEnum = pgEnum("custody_action", [
  "collected",
  "transferred",
  "analyzed",
  "checked_out",
  "checked_in",
  "released",
  "destroyed",
]);

/** Polymorphic target types a document may attach to. */
export const documentEntityEnum = pgEnum("document_entity", [
  "case",
  "evidence",
  "charge",
  "form_submission",
  "case_party",
]);

/** Audited action kinds (append-only audit log). */
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "transition",
  "view_sensitive",
  "export",
]);

/** Publication state of a form definition version. */
export const formStatusEnum = pgEnum("form_status", [
  "draft",
  "published",
  "retired",
]);

/** Why an immutable form submission snapshot was taken. */
export const snapshotReasonEnum = pgEnum("snapshot_reason", [
  "autosave_milestone",
  "transition",
  "manual",
]);
