import {
  pgTable,
  text,
  uuid,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { idPk, timestamps, softDelete } from "./helpers";
import { evidenceTypeEnum, custodyStatusEnum, custodyActionEnum } from "./enums";
import { caseTable, caseParty } from "./cases";

/** Evidence item on a case (SPEC §4.5). */
export const evidence = pgTable(
  "evidence",
  {
    id: idPk(),
    caseId: uuid("case_id")
      .notNull()
      .references(() => caseTable.id),
    type: evidenceTypeEnum("type").notNull(),
    description: text("description"),
    /** The collecting officer, as a case_party edge. */
    collectedByPartyId: uuid("collected_by_party_id").references(
      () => caseParty.id,
    ),
    collectedAt: timestamp("collected_at", { withTimezone: true }),
    custodyStatus: custodyStatusEnum("custody_status")
      .notNull()
      .default("collected"),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [index("evidence_case_idx").on(t.caseId)],
);

/**
 * APPEND-ONLY chain of custody per evidence item (SPEC §4.5). Never updated or
 * deleted — each transfer/analysis/release is a new row.
 */
export const chainOfCustodyEvent = pgTable(
  "chain_of_custody_event",
  {
    id: idPk(),
    evidenceId: uuid("evidence_id")
      .notNull()
      .references(() => evidence.id),
    actorPartyId: uuid("actor_party_id").references(() => caseParty.id),
    action: custodyActionEnum("action").notNull(),
    location: text("location"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    notes: text("notes"),
  },
  (t) => [index("coc_evidence_idx").on(t.evidenceId)],
);
