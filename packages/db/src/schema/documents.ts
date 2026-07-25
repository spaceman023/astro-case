import {
  pgTable,
  text,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { idPk, timestamps, softDelete } from "./helpers";
import { documentEntityEnum } from "./enums";
import { agency } from "./tenancy";

/**
 * Editor-authored legal document body (TipTap/Lexical JSON) — SPEC §4.6, §9.
 * Rendered to PDF on filing and stored as an immutable `document`.
 */
export const richTextDoc = pgTable("rich_text_doc", {
  id: idPk(),
  /** Serialized editor document (ProseMirror/Lexical JSON). */
  content: jsonb("content").$type<Record<string, unknown>>().notNull(),
  ...timestamps(),
});

/**
 * A document: either an uploaded blob (storage_key in object storage) or an
 * editor-authored legal doc (rich_text_doc_id). Metadata + sha256 here; bytes
 * live in S3-compatible storage (SPEC §4.6, §9).
 */
export const document = pgTable(
  "document",
  {
    id: idPk(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => agency.id),
    /** Object-storage key; null for editor-authored documents. */
    storageKey: text("storage_key"),
    filename: text("filename"),
    mime: text("mime"),
    byteSize: integer("byte_size"),
    sha256: text("sha256"),
    richTextDocId: uuid("rich_text_doc_id").references(() => richTextDoc.id),
    createdBy: uuid("created_by"),
    ...timestamps(),
    ...softDelete(),
  },
  (t) => [index("document_tenant_idx").on(t.tenantId)],
);

/**
 * Polymorphic attach-to-anything link (SPEC §4.6, §4.8). No cross-table FK on
 * (entity_type, entity_id) — integrity is enforced by typed service-layer
 * helpers plus background validators.
 */
export const documentLink = pgTable(
  "document_link",
  {
    id: idPk(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => document.id),
    entityType: documentEntityEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    ...timestamps(),
  },
  (t) => [
    index("document_link_document_idx").on(t.documentId),
    index("document_link_entity_idx").on(t.entityType, t.entityId),
  ],
);
