import {
  pgTable,
  text,
  uuid,
  integer,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { idPk, timestamps, softDelete } from "./helpers";
import { chargeStatusEnum } from "./enums";
import { caseTable, caseParty } from "./cases";

/**
 * Statute catalog — TEMPORAL / effective-dated (SPEC §4.4). A charge must
 * reference the statute text as it stood on the offense date, so entries are
 * effective_from/to and can be superseded.
 */
export const statute = pgTable(
  "statute",
  {
    id: idPk(),
    jurisdiction: text("jurisdiction").notNull(),
    /** e.g. "La. R.S. 14:67" */
    code: text("code").notNull(),
    title: text("title").notNull(),
    text: text("text"),
    degreeClass: text("degree_class"),
    effectiveFrom: date("effective_from"),
    effectiveTo: date("effective_to"),
    supersededById: uuid("superseded_by_id").references((): any => statute.id),
    ...timestamps(),
  },
  (t) => [
    index("statute_code_idx").on(t.jurisdiction, t.code),
    index("statute_effective_idx").on(t.effectiveFrom, t.effectiveTo),
  ],
);

/**
 * A charge instance applied to a defendant on a case (SPEC §4.4). The amendment
 * chain (booked → filed → amended) is preserved via amended_from_charge_id so
 * the LE booking charge, the DA filed charge, and any court amendment stay
 * linked rather than overwritten.
 */
export const charge = pgTable(
  "charge",
  {
    id: idPk(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => caseTable.id),
    defendantPartyId: uuid("defendant_party_id")
      .notNull()
      .references(() => caseParty.id),
    statuteId: uuid("statute_id")
      .notNull()
      .references(() => statute.id),
    counts: integer("counts").notNull().default(1),
    offenseDate: date("offense_date"),
    status: chargeStatusEnum("status").notNull().default("booked"),
    amendedFromChargeId: uuid("amended_from_charge_id").references(
      (): any => charge.id,
    ),
    disposition: jsonb("disposition").$type<Record<string, unknown>>(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("charge_case_idx").on(t.caseId),
    index("charge_defendant_idx").on(t.defendantPartyId),
    index("charge_status_idx").on(t.status),
  ],
);
