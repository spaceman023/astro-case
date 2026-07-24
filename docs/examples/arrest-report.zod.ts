/**
 * ILLUSTRATIVE ONLY — a hand-written approximation of what
 * `compileToZod(arrestReportDefinition, ctx)` (SPEC.md §5.4) produces at runtime
 * from `arrest-report.form.json`. It is NOT executed and NOT the source of truth:
 * the real schema is generated from the metadata definition so client and server
 * validate identically. Shown here only to make the compiler's output concrete.
 */
import { z } from "zod";

/** A reference field resolves to a canonical `person` id + creates a case_party edge. */
const PersonRef = z.object({
  personId: z.string().uuid(),
  partyId: z.string().uuid().optional(), // set once the case_party edge exists
});

/** ChargeGrid rows — statute resolved as-of the offense date (temporal catalog). */
const ChargeRow = z.object({
  statuteId: z.string().uuid(),
  counts: z.number().int().positive(),
  offenseDate: z.coerce.date(),
});

const Witness = z.object({
  person: PersonRef,
  statement: z.string().max(4000).optional(),
});

const EvidenceItem = z.object({
  evidenceId: z.string().uuid(),
});

/**
 * Base object. Conditionally-required fields (arrest.*) are modeled as optional
 * here and enforced by the superRefine below, exactly as the compiler emits them
 * from each field's `visibleWhen` + `required` and the definition's crossFieldRules.
 */
const base = z.object({
  // incident
  incidentNumber: z.string().min(1),
  occurredAt: z.coerce.date().max(new Date(), "Date/Time Occurred cannot be in the future"),
  location: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    region: z.string().min(1),
    postalCode: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }),
  reportingOfficer: PersonRef,

  // arrest (conditionally required)
  wasArrestMade: z.boolean(),
  arrestee: PersonRef.optional(),
  arrestingOfficer: PersonRef.optional(),
  arrestAt: z.coerce.date().optional(),

  // charges (conditionally required)
  charges: z.array(ChargeRow).default([]),

  // repeatable collections
  witnesses: z.array(Witness).max(50).default([]),
  evidence: z.array(EvidenceItem).max(200).default([]),

  // narrative
  narrative: z.string().min(1),

  // supervisor (permission-scoped: stripped from a detective's write schema)
  supervisorApproved: z.boolean().optional(),
  supervisorNotes: z.string().optional(),
});

export const ArrestReportSchema = base.superRefine((v, ctx) => {
  if (v.wasArrestMade) {
    // required-when-visible (from visibleWhen + required)
    if (!v.arrestee)
      ctx.addIssue({ code: "custom", path: ["arrestee"], message: "Arrestee is required." });
    if (!v.arrestingOfficer)
      ctx.addIssue({ code: "custom", path: ["arrestingOfficer"], message: "Arresting Officer is required." });
    if (!v.arrestAt)
      ctx.addIssue({ code: "custom", path: ["arrestAt"], message: "Date/Time of Arrest is required." });

    // crossFieldRules.arrestRequiresCharge
    if (v.charges.length < 1)
      ctx.addIssue({ code: "custom", path: ["charges"], message: "An arrest must have at least one booking charge." });

    // crossFieldRules.arrestAtAfterOccurred
    if (v.arrestAt && v.arrestAt < v.occurredAt)
      ctx.addIssue({ code: "custom", path: ["arrestAt"], message: "Arrest time cannot precede the time the incident occurred." });
  }
});

/** Inferred TypeScript type — one source of truth, frontend + backend + API. */
export type ArrestReport = z.infer<typeof ArrestReportSchema>;
