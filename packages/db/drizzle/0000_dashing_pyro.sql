CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete', 'transition', 'view_sensitive', 'export');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('open', 'closed', 'sealed');--> statement-breakpoint
CREATE TYPE "public"."charge_status" AS ENUM('booked', 'screened', 'filed', 'amended', 'dismissed', 'disposed');--> statement-breakpoint
CREATE TYPE "public"."custody_action" AS ENUM('collected', 'transferred', 'analyzed', 'checked_out', 'checked_in', 'released', 'destroyed');--> statement-breakpoint
CREATE TYPE "public"."custody_status" AS ENUM('collected', 'stored', 'checked_out', 'in_analysis', 'released', 'destroyed');--> statement-breakpoint
CREATE TYPE "public"."document_entity" AS ENUM('case', 'evidence', 'charge', 'form_submission', 'case_party');--> statement-breakpoint
CREATE TYPE "public"."domain" AS ENUM('le', 'prosecution', 'court');--> statement-breakpoint
CREATE TYPE "public"."evidence_type" AS ENUM('physical', 'digital', 'document', 'biological', 'weapon', 'narcotic', 'currency', 'other');--> statement-breakpoint
CREATE TYPE "public"."form_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TYPE "public"."party_role" AS ENUM('defendant', 'victim', 'witness', 'officer', 'attorney', 'judge', 'complainant', 'clerk', 'other');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('detective', 'le_supervisor', 'ada', 'da_supervisor', 'clerk', 'judge', 'admin');--> statement-breakpoint
CREATE TYPE "public"."snapshot_reason" AS ENUM('autosave_milestone', 'transition', 'manual');--> statement-breakpoint
CREATE TYPE "public"."staff_kind" AS ENUM('officer', 'attorney', 'judge', 'clerk');--> statement-breakpoint
CREATE TABLE "agency" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"jurisdiction" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "agency_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" "role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"canonical" boolean DEFAULT true NOT NULL,
	"merged_into_id" uuid,
	"given_name" text,
	"surname" text,
	"middle_name" text,
	"dob" date,
	"identifiers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "person_alias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"given_name" text,
	"surname" text,
	"dob" date,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person_match_candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"score" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"kind" "staff_kind" NOT NULL,
	"agency_id" uuid NOT NULL,
	"badge_or_bar" text,
	"cert_status" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "case_party" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"role" "party_role" NOT NULL,
	"domain_context" "domain",
	"role_attributes" jsonb,
	"valid_from" timestamp with time zone,
	"valid_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "case" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_number" text NOT NULL,
	"tenant_id" uuid NOT NULL,
	"origin_domain" "domain" NOT NULL,
	"status" "case_status" DEFAULT 'open' NOT NULL,
	"le_incident_id" uuid,
	"prosecution_matter_id" uuid,
	"court_docket_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "court_docket" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"tenant_id" uuid NOT NULL,
	"docket_number" text,
	"filed_at" timestamp with time zone,
	"disposition_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "le_incident" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"tenant_id" uuid NOT NULL,
	"incident_number" text,
	"occurred_at" timestamp with time zone,
	"reported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "prosecution_matter" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"tenant_id" uuid NOT NULL,
	"matter_number" text,
	"screened_at" timestamp with time zone,
	"decision" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "charge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"defendant_party_id" uuid NOT NULL,
	"statute_id" uuid NOT NULL,
	"counts" integer DEFAULT 1 NOT NULL,
	"offense_date" date,
	"status" charge_status DEFAULT 'booked' NOT NULL,
	"amended_from_charge_id" uuid,
	"disposition" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "statute" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" text NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"text" text,
	"degree_class" text,
	"effective_from" date,
	"effective_to" date,
	"superseded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chain_of_custody_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" uuid NOT NULL,
	"actor_party_id" uuid,
	"action" "custody_action" NOT NULL,
	"location" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"type" "evidence_type" NOT NULL,
	"description" text,
	"collected_by_party_id" uuid,
	"collected_at" timestamp with time zone,
	"custody_status" "custody_status" DEFAULT 'collected' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"storage_key" text,
	"filename" text,
	"mime" text,
	"byte_size" integer,
	"sha256" text,
	"rich_text_doc_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "document_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"entity_type" "document_entity" NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rich_text_doc" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"actor_person_id" uuid,
	"actor_role" text,
	"action" "audit_action" NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"diff" jsonb,
	"request_id" text,
	"ip" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_instance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"definition_id" text NOT NULL,
	"current_state" text NOT NULL,
	"tenant_id" uuid
);
--> statement-breakpoint
CREATE TABLE "workflow_transition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instance_id" uuid NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"actor_person_id" uuid,
	"reason" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_definition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"version" integer NOT NULL,
	"tenant_id" uuid,
	"schema" jsonb NOT NULL,
	"status" "form_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_draft_local" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"client_id" text NOT NULL,
	"data" jsonb NOT NULL,
	"base_version" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_submission" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"definition_id" uuid NOT NULL,
	"definition_version" integer NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"workflow_state" text,
	"tenant_id" uuid NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "form_submission_snapshot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"version_no" integer NOT NULL,
	"data" jsonb NOT NULL,
	"definition_version" integer NOT NULL,
	"reason" "snapshot_reason" NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_merged_into_id_person_id_fk" FOREIGN KEY ("merged_into_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_alias" ADD CONSTRAINT "person_alias_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_match_candidate" ADD CONSTRAINT "person_match_candidate_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_match_candidate" ADD CONSTRAINT "person_match_candidate_candidate_id_person_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_match_candidate" ADD CONSTRAINT "person_match_candidate_reviewed_by_person_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_profile" ADD CONSTRAINT "staff_profile_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_party" ADD CONSTRAINT "case_party_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_party" ADD CONSTRAINT "case_party_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_le_incident_id_le_incident_id_fk" FOREIGN KEY ("le_incident_id") REFERENCES "public"."le_incident"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_prosecution_matter_id_prosecution_matter_id_fk" FOREIGN KEY ("prosecution_matter_id") REFERENCES "public"."prosecution_matter"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case" ADD CONSTRAINT "case_court_docket_id_court_docket_id_fk" FOREIGN KEY ("court_docket_id") REFERENCES "public"."court_docket"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_docket" ADD CONSTRAINT "court_docket_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "court_docket" ADD CONSTRAINT "court_docket_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "le_incident" ADD CONSTRAINT "le_incident_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "le_incident" ADD CONSTRAINT "le_incident_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prosecution_matter" ADD CONSTRAINT "prosecution_matter_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prosecution_matter" ADD CONSTRAINT "prosecution_matter_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_defendant_party_id_case_party_id_fk" FOREIGN KEY ("defendant_party_id") REFERENCES "public"."case_party"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_statute_id_statute_id_fk" FOREIGN KEY ("statute_id") REFERENCES "public"."statute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charge" ADD CONSTRAINT "charge_amended_from_charge_id_charge_id_fk" FOREIGN KEY ("amended_from_charge_id") REFERENCES "public"."charge"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statute" ADD CONSTRAINT "statute_superseded_by_id_statute_id_fk" FOREIGN KEY ("superseded_by_id") REFERENCES "public"."statute"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chain_of_custody_event" ADD CONSTRAINT "chain_of_custody_event_evidence_id_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chain_of_custody_event" ADD CONSTRAINT "chain_of_custody_event_actor_party_id_case_party_id_fk" FOREIGN KEY ("actor_party_id") REFERENCES "public"."case_party"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_case_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."case"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_collected_by_party_id_case_party_id_fk" FOREIGN KEY ("collected_by_party_id") REFERENCES "public"."case_party"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_rich_text_doc_id_rich_text_doc_id_fk" FOREIGN KEY ("rich_text_doc_id") REFERENCES "public"."rich_text_doc"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_link" ADD CONSTRAINT "document_link_document_id_document_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_transition" ADD CONSTRAINT "workflow_transition_instance_id_workflow_instance_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."workflow_instance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_definition" ADD CONSTRAINT "form_definition_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_draft_local" ADD CONSTRAINT "form_draft_local_submission_id_form_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission" ADD CONSTRAINT "form_submission_definition_id_form_definition_id_fk" FOREIGN KEY ("definition_id") REFERENCES "public"."form_definition"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission" ADD CONSTRAINT "form_submission_tenant_id_agency_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."agency"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_submission_snapshot" ADD CONSTRAINT "form_submission_snapshot_submission_id_form_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."form_submission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_tenant_person_role_uq" ON "user_role" USING btree ("tenant_id","person_id","role");--> statement-breakpoint
CREATE INDEX "person_surname_idx" ON "person" USING btree ("surname");--> statement-breakpoint
CREATE INDEX "person_dob_idx" ON "person" USING btree ("dob");--> statement-breakpoint
CREATE INDEX "person_merged_into_idx" ON "person" USING btree ("merged_into_id");--> statement-breakpoint
CREATE INDEX "person_alias_person_idx" ON "person_alias" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "person_match_person_idx" ON "person_match_candidate" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "staff_profile_person_idx" ON "staff_profile" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "staff_profile_agency_idx" ON "staff_profile" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "case_party_case_idx" ON "case_party" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "case_party_person_idx" ON "case_party" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "case_party_role_idx" ON "case_party" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "case_number_tenant_uq" ON "case" USING btree ("tenant_id","case_number");--> statement-breakpoint
CREATE INDEX "case_tenant_idx" ON "case" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "case_status_idx" ON "case" USING btree ("status");--> statement-breakpoint
CREATE INDEX "charge_case_idx" ON "charge" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "charge_defendant_idx" ON "charge" USING btree ("defendant_party_id");--> statement-breakpoint
CREATE INDEX "charge_status_idx" ON "charge" USING btree ("status");--> statement-breakpoint
CREATE INDEX "statute_code_idx" ON "statute" USING btree ("jurisdiction","code");--> statement-breakpoint
CREATE INDEX "statute_effective_idx" ON "statute" USING btree ("effective_from","effective_to");--> statement-breakpoint
CREATE INDEX "coc_evidence_idx" ON "chain_of_custody_event" USING btree ("evidence_id");--> statement-breakpoint
CREATE INDEX "evidence_case_idx" ON "evidence" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "document_tenant_idx" ON "document" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "document_link_document_idx" ON "document_link" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_link_entity_idx" ON "document_link" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_event" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_tenant_at_idx" ON "audit_event" USING btree ("tenant_id","at");--> statement-breakpoint
CREATE INDEX "wf_instance_entity_idx" ON "workflow_instance" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "wf_instance_definition_idx" ON "workflow_instance" USING btree ("definition_id");--> statement-breakpoint
CREATE INDEX "wf_transition_instance_idx" ON "workflow_transition" USING btree ("instance_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_definition_key_version_tenant_uq" ON "form_definition" USING btree ("key","version","tenant_id");--> statement-breakpoint
CREATE INDEX "form_definition_key_idx" ON "form_definition" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "form_draft_submission_client_uq" ON "form_draft_local" USING btree ("submission_id","client_id");--> statement-breakpoint
CREATE INDEX "form_submission_entity_idx" ON "form_submission" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "form_submission_tenant_idx" ON "form_submission" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "form_snapshot_submission_idx" ON "form_submission_snapshot" USING btree ("submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "form_snapshot_submission_version_uq" ON "form_submission_snapshot" USING btree ("submission_id","version_no");