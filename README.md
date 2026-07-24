# Unified Justice Suite

A unified **Law Enforcement + Prosecution + Courts** management suite built around
**cross-domain data sharing and seamless integration** — a case originates in law
enforcement, flows to prosecution, and to the courts, with the people, charges, and
evidence shared **by reference**, never re-keyed.

> **Status:** Specification phase. This repository currently contains the architecture
> and design specs — no application code yet.

## Documentation

- **[docs/SPEC.md](docs/SPEC.md)** — architecture specification: modular monolith + shared
  canonical data model, the metadata-driven form engine, permissions (RBAC/ABAC), workflow
  state machines, audit, and the phased delivery plan.
- **[docs/DESIGN.md](docs/DESIGN.md)** — design system & UI/UX guide: shadcn/ui-based,
  compact/data-dense, dark-first, with a themeable token system.
- **[packages/ui/src/styles/globals.css](packages/ui/src/styles/globals.css)** — the theme
  engine: shadcn-compatible semantic tokens, dark-first defaults, density modes, and several
  built-in alternate themes.
- **Examples** — [`docs/examples/`](docs/examples): a metadata form definition
  ([`arrest-report.form.json`](docs/examples/arrest-report.form.json)), its illustrative
  compiled Zod ([`arrest-report.zod.ts`](docs/examples/arrest-report.zod.ts)), and an
  end-to-end cross-domain walkthrough ([`case-thread.md`](docs/examples/case-thread.md)).

## Intended stack

React 19 · Next.js (App Router) · TanStack Form/Query/Table · Zod · shadcn/ui + Radix ·
TipTap/Lexical · PostgreSQL + Drizzle (RLS) · Turborepo + pnpm.
