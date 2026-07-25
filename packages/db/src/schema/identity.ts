import {
  pgTable,
  text,
  uuid,
  boolean,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { idPk, timestamps, softDelete } from "./helpers";
import { staffKindEnum } from "./enums";

/** A single identifier record inside person.identifiers. */
export type PersonIdentifier = {
  type: "SSN" | "DL" | "SID" | "FBI" | "DOC" | "OTHER";
  value: string;
  source?: string;
};

/**
 * Deduplicated identity registry (SPEC §4.2). A person exists ONCE regardless of
 * how many roles/cases reference them. `merged_into_id` points an alias head at
 * its canonical survivor; merges are reversible and audited.
 */
export const person = pgTable(
  "person",
  {
    id: idPk(),
    /** false once merged away into another canonical person. */
    canonical: boolean("canonical").notNull().default(true),
    mergedIntoId: uuid("merged_into_id").references((): any => person.id),
    givenName: text("given_name"),
    surname: text("surname"),
    middleName: text("middle_name"),
    dob: date("dob"),
    /** [{ type, value, source }] — SSN/DL/SID/FBI/… */
    identifiers: jsonb("identifiers")
      .$type<PersonIdentifier[]>()
      .notNull()
      .default([]),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("person_surname_idx").on(t.surname),
    index("person_dob_idx").on(t.dob),
    index("person_merged_into_idx").on(t.mergedIntoId),
  ],
);

/** Name/DOB variants observed for a person across source systems (SPEC §4.2). */
export const personAlias = pgTable(
  "person_alias",
  {
    id: idPk(),
    personId: uuid("person_id")
      .notNull()
      .references(() => person.id),
    givenName: text("given_name"),
    surname: text("surname"),
    dob: date("dob"),
    source: text("source"),
    ...timestamps(),
  },
  (t) => [index("person_alias_person_idx").on(t.personId)],
);

/**
 * Fuzzy-match review queue feeding the dedup/merge workflow (SPEC §4.2, risk #3).
 * A candidate pairs two person rows with a score for a human to confirm/reject.
 */
export const personMatchCandidate = pgTable(
  "person_match_candidate",
  {
    id: idPk(),
    personId: uuid("person_id")
      .notNull()
      .references(() => person.id),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => person.id),
    score: text("score").notNull(),
    /** pending | confirmed | rejected */
    status: text("status").notNull().default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => person.id),
    ...timestamps(),
  },
  (t) => [index("person_match_person_idx").on(t.personId)],
);

/**
 * Justice-staff profile attached to a person (SPEC §4.2). Lets officers,
 * attorneys, judges, and clerks be selected without polluting the civilian
 * registry, and carries their credentials.
 */
export const staffProfile = pgTable(
  "staff_profile",
  {
    id: idPk(),
    personId: uuid("person_id")
      .notNull()
      .references(() => person.id),
    kind: staffKindEnum("kind").notNull(),
    /** Owning agency; staff selectors are agency-scoped. */
    agencyId: uuid("agency_id").notNull(),
    /** Badge number, bar number, or equivalent credential id. */
    badgeOrBar: text("badge_or_bar"),
    certStatus: text("cert_status"),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    index("staff_profile_person_idx").on(t.personId),
    index("staff_profile_agency_idx").on(t.agencyId),
  ],
);
