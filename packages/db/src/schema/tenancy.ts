import { pgTable, text, uuid, uniqueIndex } from "drizzle-orm/pg-core";
import { idPk, timestamps, softDelete } from "./helpers";
import { roleEnum } from "./enums";
import { person } from "./identity";

/**
 * Tenant = agency / parish. The row-scoping anchor for RLS (SPEC §4.8, §11).
 * Every case-scoped table carries `tenant_id` referencing this table.
 */
export const agency = pgTable("agency", {
  id: idPk(),
  /** Stable slug used in URLs / config, unique across the deployment. */
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  /** le | prosecution | court — the agency's primary domain. */
  kind: text("kind").notNull(),
  jurisdiction: text("jurisdiction"),
  ...timestamps(),
  ...softDelete(),
});

/**
 * RBAC assignment: a person holds a role within a tenant (SPEC §6.1).
 * A person may hold several roles across several tenants.
 */
export const userRole = pgTable(
  "user_role",
  {
    id: idPk(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => agency.id),
    personId: uuid("person_id")
      .notNull()
      .references(() => person.id),
    role: roleEnum("role").notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [
    uniqueIndex("user_role_tenant_person_role_uq").on(
      t.tenantId,
      t.personId,
      t.role,
    ),
  ],
);
