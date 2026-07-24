# Cross-domain data-sharing walkthrough — one case, three domains, zero re-keying

This traces a single case from arrest to disposition, showing how **the same records**
(`person`, `charge`, `evidence`, `case`) are referenced across Law Enforcement,
Prosecution, and Courts. Nothing is copied between domains — the integration value is that
data is *shared by reference* on the `case` spine (see [`../SPEC.md`](../SPEC.md) §4, §7).

Legend: **[NEW]** = a row created; **[REF]** = an existing row referenced, not copied.

---

## 1. Law Enforcement — arrest report

Detective Alvarez files `le.arrest_report` (see [`arrest-report.form.json`](arrest-report.form.json)).

- **[NEW]** `case` — `origin_domain = le`, `le_incident_id` set. `case_number` generated.
- **[NEW]** `le_incident` — the domain entry record; its structured data is a `form_submission`.
- **[NEW]** `person` **P1** (arrestee "Jordan Vale") — created via `PersonSelector`; the
  dedup check found no match.
- **[REF]** `person` **P2** (Detective Alvarez) — already a `person` + `staff_profile`;
  referenced as the arresting officer, not recreated.
- **[NEW]** `case_party` rows: (P1, `defendant`, ctx `le`), (P2, `officer`, ctx `le`),
  (P3 witness, `witness`, ctx `le`).
- **[NEW]** `charge` **C1** — `La. R.S. 14:67` (theft), `charge_status = booked`,
  `defendant_party_id → P1`, statute resolved as-of `occurredAt`.
- **[NEW]** `evidence` **E1** + `chain_of_custody_event`.

Workflow: `Draft → SupervisorReview → Approved → SubmittedToDA`. The `SubmittedToDA`
transition's side-effect **populates `case.prosecution_matter_id`** and enqueues the DA
screening task. **Same `case` row** — no new case is created for prosecution.

---

## 2. Prosecution — screening & charging

ADA Chen opens the DA screening form. It is **pre-populated from LE's submission by
reference**:

- **[REF]** `case` — same row; now has both `le_incident_id` and `prosecution_matter_id`.
- **[REF]** `person` **P1** — the *same* arrestee; the ADA sees P1's cross-case history
  (a query over `case_party` by `person_id`), e.g. two prior cases. No re-entry.
- **[REF]** `charge` **C1** — the LE booking charge is shown as the starting point.
- **[REF]** `evidence` **E1** — visible in discovery without a hand-off copy.

Charging decision (Accept): the ADA amends the charge rather than overwriting it.

- **[NEW]** `charge` **C2** — `La. R.S. 14:67(B)`, `charge_status = filed`,
  `amended_from_charge_id → C1`. The amendment **chain** (C1 booked → C2 filed) is intact
  and queryable; the LE record is never mutated.
- **[NEW]** `case_party` (P4 ADA Chen, `attorney`, ctx `prosecution`).

Workflow: `Screening → ChargingDecision(Accept) → Discovery → PleaOrTrial`. Filing triggers
the handoff that **populates `case.court_docket_id`**.

---

## 3. Courts — docketing, hearing, disposition

The clerk opens the matter; it is again the **same `case`**, now threaded to all three
domains via `le_incident_id`, `prosecution_matter_id`, `court_docket_id`.

- **[REF]** `person` **P1** — the defendant on the docket is the *same* person row.
- **[REF]** `charge` **C2** — the filed charge is what the court adjudicates.
- **[NEW]** `court_docket` + hearings; **[NEW]** `case_party` (P5 judge, `judge`, ctx `court`).
- Disposition (guilty plea): **[NEW]** `charge` disposition recorded on **C2**; a
  cross-field rule requires `sentence` when `disposition = guilty` (enforced by the same
  compiled Zod on client and server).

Workflow: `Docketed → Scheduled → Hearing → Disposition → Closed`.

---

## 4. What made this "seamless"

| Shared record | LE | Prosecution | Courts |
|---|---|---|---|
| `case` **(spine)** | created | referenced (+ `prosecution_matter_id`) | referenced (+ `court_docket_id`) |
| `person` P1 (defendant) | created | referenced (+ history) | referenced |
| `person` P2 (officer) | referenced | referenced | — |
| `charge` | C1 booked | C2 filed (amends C1) | C2 adjudicated |
| `evidence` E1 | collected | discovery (ref) | ref |

- **One person, one row** — dedup at intake means the defendant, victims, witnesses, and
  officer are entered once and referenced everywhere (`SPEC.md` §4.2–4.3).
- **One case spine** — nullable FKs thread the domains; each phase adds a pointer, not a copy
  (`SPEC.md` §4.1).
- **Amendment chains, not overwrites** — booking → filed → amended stay linked (`SPEC.md` §4.4).
- **Workflow handoffs do the wiring** — transition side-effects populate the next domain's
  pointer and pre-fill its forms (`SPEC.md` §7).
- **One validation source of truth** — the same compiled Zod runs on both client and server
  at every step (`SPEC.md` §5.4).
