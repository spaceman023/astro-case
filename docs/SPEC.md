# Unified Justice Suite — Architecture Specification (v1)

> **Status:** Draft v1 (foundation spec). No application code yet — this document
> describes the target architecture the build will follow.
> **Scope of this document:** the shared canonical core and the metadata-driven form
> engine, plus the cross-cutting concerns (permissions, workflow, audit, storage) and a
> phased delivery plan.

---

## 1. Overview & Goals

### 1.1 Product vision

A single suite spanning three government domains — **Law Enforcement (LE)**,
**Prosecution (DA/ADA)**, and **Courts** — whose central value is **cross-domain data
sharing and seamless integration**. A case originates in LE (arrest / incident report),
flows to Prosecution (charging decision, discovery, plea), and to Courts (docketing,
hearings, disposition). The people, charges, and evidence that appear in all three phases
are the **same records**, referenced — never re-keyed, never copied.

The differentiator is not the UI framework or the form library. It is that a defendant,
a victim, a witness, an officer, an arrest charge, and a piece of evidence exist **once**
and are threaded through every phase of a case by reference. That eliminates the
re-entry, transcription errors, and reconciliation overhead that plague siloed justice
systems.

### 1.2 The three domains

| Domain | Owns | Produces | Consumes |
|---|---|---|---|
| **Law Enforcement** | Incidents, arrests, evidence intake, booking charges, citations, warrants | Arrest/incident reports submitted to the DA | — (origin) |
| **Prosecution** | Screening, charging decisions, discovery, plea agreements, case files | Filed charges, discovery packages | LE incident + parties + evidence + booking charges |
| **Courts** | Dockets, filings, hearings, orders, dispositions | Dispositions, orders, sentences | Prosecution filings + charges + parties |

### 1.3 v1 scope and non-goals

**In scope (v1 foundation):**

- Shared canonical data model (built first).
- Metadata-driven form engine (the heart of the product).
- Permissions (RBAC + ABAC, field- and row-level).
- Workflow state machines with cross-domain handoffs.
- Append-only audit and version history.
- Multi-tenant (parish/agency) isolation.

**Explicit non-goals for v1:**

- **No microservices / federated services.** v1 is a **modular monolith** on one Postgres.
  Agency-level federation and event-bus propagation are deferred; the module boundaries are
  drawn so they *could* be extracted later, but we do not pay that cost now.
- **No external-system exchange gateway** (NIEM / court-exchange contracts) yet — the
  canonical model is designed to make that additive later.
- **No CRDT-style automatic offline merge** — see §5.8 for the constrained v1 approach.

---

## 2. Architectural Decisions (ADRs)

### ADR-001: Modular monolith + shared canonical data model

**Decision.** One Postgres database, one deployable Next.js application. Each domain (LE,
Prosecution, Courts) is a **module** that reads and writes the *same* canonical tables
(`case`, `person`, `statute`, `evidence`, `case_party`, …). Data sharing is achieved by
**reference**, not by copy-and-sync.

**Rationale.** The product's whole reason to exist is seamless data sharing. A shared
canonical model gives that for free with strong consistency and no eventual-consistency
reconciliation. A monolith is dramatically cheaper to build and operate for v1, and the
package boundaries (§3) keep the option to extract services later.

**Tradeoffs.** Tighter coupling between domains; a single scaling/deploy unit; blast radius
of a bad migration is the whole suite. Mitigated by strict package dependency rules, RLS
tenant isolation, and per-module schema ownership conventions.

### ADR-002: Technology stack

| Layer | Choice | Notes |
|---|---|---|
| App framework | **React 19 + Next.js (App Router)** | RSC for data-loading, server actions for mutations |
| Forms | **TanStack Form** | "TanStack wherever possible"; chosen over React Hook Form for end-to-end type safety and granular subscriptions on deeply nested forms |
| Validation | **Zod** | Single source of truth; compiled from form metadata, shared client + server |
| Data fetching | **TanStack Query** | Autosave mutations, offline persistence, optimistic updates |
| Tables | **TanStack Table** | Case lists, charge grids, evidence logs |
| UI | **shadcn/ui + Radix** | Accessible primitives, design-system wrappers in `packages/ui` |
| Rich text | **TipTap or Lexical** | Legal document authoring (narratives, orders, agreements) |
| Database | **PostgreSQL** | Row-Level Security for tenant isolation |
| ORM | **Drizzle** | Typed schema, migrations, SQL-first |
| Monorepo | **Turborepo + pnpm** | Package boundaries enforced by ESLint |

### ADR-003: Metadata-driven forms (the central bet)

**Decision.** Forms are **not** hand-written React. Every form is a **versioned JSON
definition** (form → sections → fields) stored in the database, compiled at runtime to a
Zod schema and rendered by a generic dynamic renderer.

**Rationale.** Justice forms are enormous (100–500 fields), vary per parish/agency, and
change over time (statutes amend, policies shift). Hardcoding them turns every form into a
maintenance liability. Metadata-driven definitions let us: version forms, vary them per
tenant, add/remove fields without redeploying components, migrate data, and reuse
legal-specific controls (`StatuteLookup`, `ChargeGrid`, `PersonSelector`) everywhere. This
is how enterprise systems (Salesforce, ServiceNow, EHRs) avoid drowning in bespoke forms.

**Tradeoffs.** A real engine to build and test (compiler, renderer, rule evaluator,
versioning, migration). The compiler is the highest-risk component (§12). The payoff is
that once the engine exists, new forms are content, not code.

---

## 3. Monorepo & Package Architecture

### 3.1 Layout (Turborepo + pnpm)

```
justice-suite/
├─ apps/
│  └─ web/                      # the single Next.js 19 App Router deployable
│     ├─ app/                   # routes: /le, /prosecution, /courts, /admin/forms
│     ├─ server/                # server actions, route handlers, RSC loaders
│     └─ middleware.ts          # auth/session + tenant (parish/agency) resolution
├─ packages/
│  ├─ db/                       # Drizzle schema, migrations, connection, RLS policies
│  ├─ schema/                   # shared Zod domain types + DTOs (not form definitions)
│  ├─ auth/                     # session, RBAC/ABAC policy engine
│  ├─ form-engine/              # THE CORE: metadata types, Zod compiler, renderer, autosave
│  ├─ form-controls/            # domain widgets (PersonSelector, StatuteLookup, ChargeGrid…)
│  ├─ ui/                       # shadcn/ui wrappers, Radix primitives, design tokens
│  ├─ audit/                    # append-only audit writer + query helpers
│  ├─ workflow/                 # state-machine definitions + transition engine
│  ├─ storage/                  # attachment/document abstraction (S3-compatible)
│  ├─ rich-text/                # TipTap/Lexical config, schema, serializers
│  ├─ core-domain/              # canonical entity services (Person registry, Case spine)
│  ├─ domain-le/                # law-enforcement module
│  ├─ domain-prosecution/       # DA/ADA module
│  └─ domain-courts/            # courts module
├─ tooling/                     # eslint config, tsconfig, tailwind preset, tsup
├─ turbo.json
└─ pnpm-workspace.yaml
```

### 3.2 Package responsibilities & dependency direction

Dependencies flow one way and are enforced by ESLint boundary rules. Nothing below may
import from something above it.

```
schema        (pure types; depends on nothing)
  ▲
db            (Drizzle tables, migrations, RLS; depends on schema)
  ▲
audit ─ auth ─ storage ─ rich-text     (infrastructure; depend on db/schema)
  ▲
core-domain   (canonical entity services: personRegistry, caseService; depends on db, schema, audit)
  ▲
form-engine   (definition types, compileToZod, renderer; depends on schema, auth, audit)
  ▲
form-controls (domain widgets resolving against core-domain; depends on form-engine, core-domain, ui)
  ▲
workflow      (state machines; depends on core-domain, audit)
  ▲
domain-le / domain-prosecution / domain-courts
              (depend on core-domain, form-engine, form-controls, workflow)
  ▲
apps/web      (composition root; mounts modules, wires providers)
```

Key rules:

- `form-engine` knows **nothing** about specific domains — it renders any definition.
- Domain awareness lives in `form-controls` (the bridge) and `domain-*`.
- `core-domain` is **built first** and is the "shared core" the whole suite references.

### 3.3 Domain module plug-in contract

Each `domain-*` package exports a `ModuleManifest`. `apps/web` imports the manifests and
registers them at the composition root. Adding a domain = new package + one registration
line; no core changes.

```ts
// packages/<domain>/src/manifest.ts
export interface ModuleManifest {
  id: 'le' | 'prosecution' | 'courts';
  routes: RouteDef[];                 // Next.js route segments the module mounts
  formDefinitions: FormDefinition[];  // JSON form defs seeded for this domain
  workflows: WorkflowDefinition[];    // state machines for this domain
  controls?: ControlRegistration[];   // any domain-specific field controls
  permissions: PermissionContribution;// roles/policies this domain introduces
}
```

---

## 4. Canonical Data Model

The shared core is built first. All tables are multi-tenant (`tenant_id`) and soft-deleted
(`deleted_at`) unless noted. PKs are UUIDv7 (time-sortable) except the audit log
(`bigserial`).

### 4.1 The Case spine

`case` is the spine that threads the three domains. It holds **nullable foreign keys** to
each domain's *entry record*. The **same case row** gains a `prosecution_matter_id` when
the DA accepts it and a `court_docket_id` when it is filed — nothing is copied.

```
case
  id              uuid pk
  case_number     text        -- tenant-unique, generated
  tenant_id       uuid fk agency/parish     -- row-scoping anchor (RLS)
  origin_domain   enum(le|prosecution|court)
  status          enum         -- high-level lifecycle
  le_incident_id        uuid fk le_incident        null
  prosecution_matter_id uuid fk prosecution_matter null
  court_docket_id       uuid fk court_docket       null
  created_at / updated_at / deleted_at
```

Each domain entry record (`le_incident`, `prosecution_matter`, `court_docket`) holds that
domain's structured data — most of it as **form submissions** (§5.6), not wide bespoke
columns.

### 4.2 Person / Identity registry (deduplicated)

A person exists **once**, regardless of how many roles or cases they appear in.

```
person
  id             uuid pk
  canonical      bool          -- false = an alias head merged away
  merged_into_id uuid fk person null   -- dedup pointer (chain-resolvable)
  given_name / surname / dob / ...     -- best-known canonical attributes
  identifiers    jsonb         -- [{type: SSN|DL|SID|FBI, value, source}]
  created_at / updated_at / deleted_at

person_alias            -- name/dob variants observed across sources
person_match_candidate  -- fuzzy-match review queue feeding the merge workflow
```

Officers, attorneys, and judges are `person` rows **plus** a `staff_profile` (badge #,
POST/bar #, agency, active flag) so they can be selected without polluting the civilian
registry.

```
staff_profile
  id          uuid pk
  person_id   uuid fk person
  kind        enum(officer|attorney|judge|clerk)
  agency_id   uuid fk agency
  badge_or_bar text
  cert_status  text
  active       bool
```

### 4.3 Party / Role associations (polymorphic edges)

Roles are **edges** between a person and a case, scoped optionally to a domain phase. This
is what lets one person be a witness in the LE phase and the same referenced witness in the
prosecution phase.

```
case_party
  id             uuid pk
  case_id        uuid fk case
  person_id      uuid fk person
  role           enum(defendant|victim|witness|officer|attorney|judge|complainant|…)
  domain_context enum(le|prosecution|court) null   -- role scoped to a phase
  role_attributes jsonb                             -- role-specific fields
  valid_from / valid_to                             -- temporal (a role can end)
  created_at / deleted_at
```

Cross-case history ("this witness appeared in 4 prior cases") is a query over `case_party`
by `person_id` — a direct payoff of the shared registry.

### 4.4 Statute catalog (temporal) & Charge lifecycle

Statutes are **effective-dated** because a charge must reference the statute text *as it was
at the offense date*.

```
statute
  id            uuid pk
  jurisdiction  text
  code          text          -- e.g. "La. R.S. 14:30"
  title / text
  degree_class  text
  effective_from / effective_to
  superseded_by_id uuid fk statute null

charge
  id                    uuid pk
  case_id               uuid fk case
  defendant_party_id    uuid fk case_party
  statute_id            uuid fk statute        -- resolved by offense date
  counts                int
  offense_date          date
  charge_status         enum(booked|screened|filed|amended|dismissed|disposed)
  amended_from_charge_id uuid fk charge null    -- amendment chain
  disposition           jsonb
  created_at / deleted_at
```

The amendment chain links the LE **booking** charge → DA **filed** charge → any court
**amendment**, so nothing is overwritten and the full history is queryable.

### 4.5 Evidence & chain of custody

```
evidence
  id                   uuid pk
  case_id              uuid fk case
  type                 enum
  description          text
  collected_by_party_id uuid fk case_party    -- the officer
  collected_at         timestamptz
  custody_status       enum
  created_at / deleted_at

chain_of_custody_event      -- APPEND-ONLY per evidence item
  id           uuid pk
  evidence_id  uuid fk evidence
  actor_party_id uuid fk case_party
  action       enum(collected|transferred|analyzed|released|destroyed)
  location / at / notes
```

### 4.6 Documents & attachments (polymorphic)

Two flavors: **uploaded files** (S3 blobs) and **editor-authored legal documents**
(TipTap/Lexical JSON).

```
document
  id            uuid pk
  tenant_id     uuid
  storage_key   text          -- S3 object key (null for editor-authored)
  filename / mime / byte_size
  sha256        text
  rich_text_doc_id uuid fk rich_text_doc null   -- editor-authored body
  created_by / created_at / deleted_at

document_link           -- attach a document to anything
  id          uuid pk
  document_id uuid fk document
  entity_type enum(case|evidence|charge|form_submission|case_party)
  entity_id   uuid
```

### 4.7 Audit, Workflow, and Form-storage tables

```
audit_event             -- APPEND-ONLY. No UPDATE/DELETE grant at the DB role level.
  id          bigserial pk
  tenant_id   uuid
  actor_person_id uuid
  actor_role  text
  action      enum(create|update|delete|transition|view_sensitive|export)
  entity_type / entity_id
  before / after / diff  jsonb
  request_id / ip / at

workflow_instance
  id uuid pk, entity_type, entity_id, definition_id, current_state, tenant_id

workflow_transition     -- APPEND-ONLY history
  id uuid pk, instance_id, from_state, to_state, actor_person_id, reason, at
```

Form-storage tables are defined in §5.6.

### 4.8 Drizzle conventions

- **Polymorphic links** (`document_link`, `workflow_instance`, `audit_event`): model as an
  `entity_type` enum + `entity_id uuid` pair with a partial index per type. Drizzle has no
  native polymorphism and we accept **no cross-table FK** here — integrity is enforced by
  typed service-layer helpers (`linkDocumentToCase(...)`) plus periodic background
  validators. Never insert raw `(entity_type, entity_id)` pairs from callers.
- **Soft deletes** everywhere via `deleted_at timestamptz null`. A shared query helper
  appends `isNull(deleted_at)` by default; a `withDeleted()` escape hatch exists for
  audit/admin.
- **Temporal / versioning**: `statute` (effective-dating) and `case_party` (validity
  intervals) carry their own periods. Entity change history comes from the audit log and
  form snapshots — we deliberately avoid per-table shadow-history tables to keep the schema
  lean.
- **Tenant scoping**: every case-scoped table carries `tenant_id`; Postgres **Row-Level
  Security** enforces it as a hard boundary (belt-and-suspenders with app-layer ABAC). A
  per-request session sets `app.current_tenant` and `app.current_person`.
- **Keys**: UUIDv7 PKs for time-sortable high-volume tables; `bigserial` for the audit log.

---

## 5. Form Engine

The form engine is a first-class subsystem (`packages/form-engine`). It has its own metadata
types, a Zod compiler, a rule evaluator, a dynamic renderer, and storage/versioning tables.

### 5.1 Form-definition JSON schema

A form definition is a versioned JSON document (validated by a Zod **meta-schema** — a
"schema for schemas"). Shape:

```jsonc
{
  "id": "le.arrest_report",
  "version": 7,
  "title": "Arrest Report",
  "domain": "le",
  "entity": "le_incident",            // which case entry record it binds to
  "workflow": "le.report.standard",   // links to a workflow definition
  "permissions": { "editRoles": ["detective"], "supervisorReview": ["le_supervisor"] },
  "sections": [
    {
      "id": "narrative",
      "title": "Incident Narrative",
      "visibleWhen": null,
      "fields": [ /* Field[] */ ]
    },
    {
      "id": "witnesses",
      "title": "Witnesses",
      "repeatable": { "min": 0, "max": 50, "itemLabel": "Witness {{index}}" },
      "fields": [ /* Field[] applied per item */ ]
    }
  ]
}
```

Field object:

```jsonc
{
  "id": "arrestingOfficer",
  "type": "OfficerSelector",
  "label": "Arresting Officer",
  "required": true,
  "permissions": { "editRoles": ["detective"], "viewRoles": ["*"] },
  "validation": { "kind": "reference", "entity": "person", "role": "officer" },
  "visibleWhen": { "op": "eq", "field": "wasArrestMade", "value": true },
  "computed": null,
  "props": { "agencyScoped": true }
}
```

### 5.2 Field-type & control registry

Each field `type` maps to a **control component** plus a **Zod fragment generator**
(`toZod(field)`).

- **Primitives:** `Text`, `TextArea`, `Number`, `Currency`, `Date`, `DateTime`, `Boolean`,
  `Select`, `MultiSelect`, `RadioGroup`.
- **Domain controls** (in `form-controls`, resolve against `core-domain` services):
  - `PersonSelector` — dedup-aware search; returns `person_id`, creates a `case_party` edge.
  - `OfficerSelector` / `AttorneySelector` / `JudgeSelector` — `staff_profile`-filtered,
    agency-scoped.
  - `StatuteLookup` — effective-dated statute search by offense date.
  - `ChargeGrid` — repeatable charge editor (statute × counts × offense date); the DA
    screening workhorse.
  - `EvidencePicker` — attach/create evidence items.
  - `AddressEditor` — structured address + geocode.
  - `AttachmentField` — upload → `document` + `document_link`.
  - `RichTextField` — TipTap/Lexical, for narratives and legal document bodies.
- **Layout:** `Group`, `Divider`, `Computed` (read-only derived display).

### 5.3 Rule AST — visibility, computed, cross-field validation

Rules are a small **serializable JSON expression AST** (not JavaScript strings — safe,
versionable, and evaluable identically on both sides):

```jsonc
{ "op": "and", "args": [
  { "op": "eq", "field": "wasArrestMade", "value": true },
  { "op": "gt", "field": "charges.length", "value": 0 }
]}
```

One pure evaluator, `evaluateRule(ast, formValues)`, powers:

- **Conditional visibility** (`visibleWhen`) — live in the renderer.
- **Computed fields** (`computed`) — recompute from dependencies.
- **Cross-field validation** — the *same* evaluator runs server-side inside a generated
  `superRefine` (e.g. "if `disposition == guilty` then `sentence` is required").

### 5.4 Zod compilation (single source of truth)

`compileToZod(definition, ctx)` walks sections/fields and assembles a `z.object`, calling
each control's `toZod(field)` fragment generator. Repeatable sections become
`z.array(...).min/max`. Conditional required-ness and cross-field rules are appended as
`.superRefine()` closures generated from the rule AST.

- The **same compiled schema** validates on the client (TanStack Form `validators`) and on
  the server (server action revalidates before persisting). The compiler is **deterministic
  and pure**, so both sides produce identical schemas from the same definition version.
- On write, the server compiles a **permission-scoped** schema: fields the actor cannot edit
  are stripped/frozen, so a detective cannot submit changes to ADA-only fields even by
  forging the payload.

### 5.5 Dynamic renderer contract (TanStack Form)

```
<DynamicForm definition initialValues submission permissionCtx onSubmit>
  ├─ builds one TanStack Form instance; validators = compileToZod(definition, ctx)
  ├─ walks definition.sections
  └─ <Section section>                 // repeatable sections use TanStack Form's array API
        └─ <Field field>               // resolves control from registry by field.type
              ├─ permission → hidden | readOnly | editable
              ├─ subscribes to visibleWhen via a form store selector
              └─ renders <Control> bound to form.Field(name)
```

- `<Field>` is a thin adapter: it looks up `controlRegistry[field.type]` and passes the
  TanStack Form field API (`state`, `handleChange`, `handleBlur`) plus `field.props`.
  Controls stay dumb and reusable across domains.
- Repeatable collections render add/remove/reorder with per-item nested names
  (`witnesses[3].name`).
- Computed fields subscribe to their dependencies via store selectors and recompute via the
  rule-AST evaluator; they are written back read-only and **recomputed authoritatively on
  the server** at submit.

### 5.6 Storage: definitions, drafts, submissions, snapshots

```
form_definition
  id text            -- e.g. le.arrest_report
  version int
  tenant_id uuid null            -- null = global default; set = tenant override
  schema jsonb                   -- the definition document
  status enum(draft|published|retired)
  published_at
  PRIMARY KEY (id, version, tenant_id)

form_submission                  -- the live record bound to a case entity
  id uuid pk
  definition_id / definition_version
  entity_type / entity_id        -- e.g. le_incident:<uuid>
  data jsonb                      -- current values
  workflow_state / tenant_id
  version int                     -- optimistic-lock counter
  created_by / updated_at / deleted_at

form_submission_snapshot         -- immutable version history
  id uuid pk
  submission_id
  version_no int
  data jsonb                      -- frozen values
  definition_version
  reason enum(autosave-milestone|transition|manual)
  created_by / created_at

form_draft_local                 -- optional server mirror of offline drafts
  id uuid pk, submission_id, client_id, data jsonb, base_version, updated_at
```

### 5.7 Autosave & version history

- **Autosave:** a debounced (~1–2s idle) TanStack Query mutation upserts
  `form_submission.data`. Each autosave writes an `update` audit event carrying only the
  **diff** (to control audit volume).
- **Version history:** every workflow transition (Draft → Supervisor → Filed) and every
  manual "save version" writes a `form_submission_snapshot`. The **Filed** snapshot is the
  immutable legal record. The UI diffs any two snapshots, rendered per field label.

### 5.8 Offline & optimistic editing + conflict resolution

- **Local persistence:** form values persisted to IndexedDB (TanStack Query persister +
  dedicated offline store), keyed by `submission_id` + `base_version`.
- **Optimistic edits:** mutations queue in an outbox while offline; the UI reflects local
  state immediately.
- **Reconnect / conflict:** each submission carries a `version` counter. On flush the server
  compares `base_version`:
  - unchanged → apply;
  - server advanced → **field-level three-way merge** — non-overlapping field edits
    auto-merge; overlapping fields raise a per-field conflict UI (base vs. mine vs. theirs).
- Field-level (not document-level) conflict is essential because two roles editing
  *different* fields of the same form (detective + ADA) is the **normal** case. Because field
  permissions partition who-can-edit-what, most concurrent edits are non-overlapping by
  construction, keeping conflicts rare.
- **v1 constraint (risk mitigation):** ship permission-partitioned non-overlap + explicit
  conflict UI. Defer CRDT-style automatic merge until the engine is proven.

### 5.9 Definition versioning & in-flight draft migration

- Definitions are **immutable** per `(id, version, tenant_id)`. Publishing a new version
  bumps the number; existing submissions keep their `definition_version` pointer.
- A submission always renders/validates against **its own** `definition_version`, so an
  in-flight Draft never breaks when admins publish v8.
- **Migration:** a definition version may ship a declarative `migrations[]` list (field
  renames/moves/defaults, same AST style). When a draft is opened and a newer *compatible*
  version exists, the engine offers/auto-applies forward migration (rename map,
  add-with-default, drop-removed → archived in a snapshot). **Incompatible** changes keep the
  draft on its own version until manually migrated. Migrations are pure data transforms
  versioned alongside the definition.

---

## 6. Permissions (RBAC + ABAC)

Package: `packages/auth`.

### 6.1 Roles & assignments

Roles are per-tenant assignments: `user_role(tenant_id, person_id, role)`.

Roles: `detective`, `le_supervisor`, `ada`, `da_supervisor`, `clerk`, `judge`, `admin`.

### 6.2 Row scoping (ABAC)

Access to a `case`/submission is a function of `tenant_id` (RLS, hard boundary) **plus**
attributes: assigned-to, originating agency, domain phase, and sealed/juvenile flags. A
central policy engine evaluates `can(actor, action, resource)` using attribute predicates,
not just role checks.

### 6.3 Field scoping (three enforcement layers)

1. **Renderer** — hides or freezes fields per `field.permissions` (UX).
2. **Server** — compiles a **permission-scoped Zod schema** so forged writes to unauthorized
   fields are rejected (security).
3. **Database** — RLS + row policy for the record itself (hard boundary).

Sensitive reads (`view_sensitive`, e.g. juvenile/sealed records) are themselves audited.

---

## 7. Workflow State Machines

Package: `packages/workflow`. Definitions are declarative (states, transitions, guards,
side-effects), one per domain flow.

```
LE:           Draft → SupervisorReview → Approved → SubmittedToDA
Prosecution:  Screening → ChargingDecision(Accept|Reject|Divert) → Discovery → PleaOrTrial → Disposed
Courts:       Docketed → Scheduled → Hearing → Disposition → Closed
```

A transition runs **guards** (permission + validation — the compiled Zod must pass to leave
Draft), then **side-effects** (write a snapshot, write an audit event, execute the
cross-domain handoff). Transition history is append-only (`workflow_transition`).

**The cross-domain handoffs are where the "seamless integration" value is realized.** For
example, `SubmittedToDA` populates `prosecution_matter_id` on the *same* `case`, enqueues the
DA screening task, and the DA's screening form opens **pre-populated** from LE's submission
via the shared `case` / `person` / `charge` records — no re-keying. See
[`examples/case-thread.md`](examples/case-thread.md).

---

## 8. Audit & Compliance

- `audit_event` is **append-only**; the DB application role has no `UPDATE`/`DELETE` grant on
  it.
- Every create / update / transition / sensitive-view / export writes an event with actor,
  role, before/after diff, and `request_id`. Autosaves write diff-only events.
- Audit is written in the **same transaction** as the mutation for consistency; reporting and
  export read from a partitioned copy to avoid contention.

---

## 9. Storage & Documents

- Binary blobs live in S3-compatible object storage; metadata + `sha256` in `document`.
  Uploads are presigned, virus-scanned asynchronously, then linked via `document_link`.
- Editor-authored legal documents live as TipTap/Lexical JSON in `rich_text_doc`, rendered
  to PDF on filing and stored as an immutable `document`.

---

## 10. Cross-domain data-sharing scenario

See [`examples/case-thread.md`](examples/case-thread.md) for a full end-to-end walkthrough
demonstrating a Person and a Charge crossing LE → Prosecution → Courts **by reference**, with
no data copied. This is the core requirement and the product's reason to exist.

---

## 11. Security, tenancy & multi-parish configuration

- **Tenant = agency/parish.** Every case-scoped table carries `tenant_id`; RLS enforces
  isolation at the database, independent of application bugs.
- **Per-tenant form overrides:** `form_definition.tenant_id` lets a parish override a global
  form definition without forking the engine.
- **Session context:** middleware resolves the tenant and sets `app.current_tenant` /
  `app.current_person` per request for RLS and audit.
- **Sensitive data:** juvenile/sealed flags gate access via the policy engine and are audited
  on read.

---

## 12. Risks & open questions

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Zod compiler as single source of truth** — one deterministic compiler producing correct client + server + permission-scoped schemas incl. cross-field `superRefine` from the rule AST. If it drifts, security *and* UX break. | Build it first; test it hardest (golden tests: definition → expected schema → validation outcomes). |
| 2 | **Field-level offline conflict resolution** — three-way per-field merge across concurrent roles on legal records; risk of data loss. | v1: permission-partitioned non-overlap + explicit conflict UI. Defer CRDT auto-merge. |
| 3 | **Person registry deduplication** — bad merges are catastrophic in a justice context. | Reversible merges, `merged_into_id` chains, a review queue, full audit. |
| 4 | **Definition versioning + in-flight draft migration** — a Draft must never break on republish. | Submissions pin their `definition_version`; declarative migrations; incompatible-change detection. |
| 5 | **Polymorphic integrity without FKs** — `document_link` / `audit_event` / `workflow_instance` have no DB referential integrity. | Typed service-layer helpers only; background validators to catch dangling links. |

Open questions to resolve before/early in the build:

- TipTap vs. Lexical (needs a spike on collaborative editing + PDF export fidelity).
- Object storage target (self-hosted MinIO vs. cloud S3) per deployment environment.
- Concrete list of parishes/agencies and their form variance for v1.

---

## 13. Phased delivery plan

1. **Phase 0 — Foundation.** Turborepo/pnpm scaffold, `tooling`, CI, `db` package with the
   canonical core schema + migrations + RLS, `schema` and `auth` packages.
2. **Phase 1 — Shared core services.** `core-domain`: Person registry (incl. dedup/merge
   queue), Case spine + threading, Statute catalog, Evidence, `case_party`. `audit` package.
3. **Phase 2 — Form engine.** `form-engine`: definition types + meta-schema, `compileToZod`,
   rule evaluator, `<DynamicForm>` renderer, storage tables, autosave, snapshots, versioning.
   `form-controls` primitives + first domain controls (`PersonSelector`, `StatuteLookup`,
   `ChargeGrid`). **This is the highest-risk phase — see §12.**
4. **Phase 3 — First domain (LE).** `domain-le` with the arrest-report form definition and
   the LE workflow, end-to-end through Draft → SupervisorReview → SubmittedToDA.
5. **Phase 4 — Prosecution + the first cross-domain handoff.** `domain-prosecution` screening
   consuming LE's submission by reference (the integration proof).
6. **Phase 5 — Courts.** `domain-courts` docketing/hearings/disposition; the full case thread.
7. **Phase 6 — Hardening.** Offline/conflict, per-tenant overrides, reporting, exports.

---

## 14. Appendices

- [`examples/arrest-report.form.json`](examples/arrest-report.form.json) — an example
  metadata-driven form definition.
- [`examples/arrest-report.zod.ts`](examples/arrest-report.zod.ts) — illustrative compiled
  Zod output (sample, not executed).
- [`examples/case-thread.md`](examples/case-thread.md) — end-to-end cross-domain walkthrough.

### Proposed load-bearing file locations (greenfield — nothing exists yet)

- `packages/form-engine/src/types/definition.ts` — definition/section/field types + meta-schema.
- `packages/form-engine/src/compiler/compileToZod.ts` — the single-source-of-truth compiler.
- `packages/form-engine/src/rules/evaluateRule.ts` — the pure rule-AST evaluator.
- `packages/form-engine/src/renderer/DynamicForm.tsx` — the dynamic renderer.
- `packages/db/src/schema/core.ts` — canonical core tables.
- `packages/auth/src/policy.ts` — the `can(actor, action, resource)` engine.
