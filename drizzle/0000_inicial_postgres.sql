-- Esquema inicial en PostgreSQL.
--
-- Sustituye a las cuatro migraciones de MySQL: la aplicación cambió de motor al pasar a
-- Supabase y no hay datos que conservar. Cada sentencia es idempotente para que aplicar
-- esta migración sobre una base donde las tablas ya existen no rompa nada.

CREATE SCHEMA IF NOT EXISTS "entry_strategy";
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."approvalRecommendation" AS ENUM('advance', 'test');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."approvalStatus" AS ENUM('not_started', 'in_review', 'approved', 'changes_requested', 'on_hold', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."evidenceAuthor" AS ENUM('user', 'ai');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."evidenceKind" AS ENUM('document', 'public_data', 'interview', 'assumption', 'ai_extraction');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."evidenceStatus" AS ENUM('accepted', 'suggested', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."milestoneStatus" AS ENUM('pending', 'in_progress', 'blocked', 'complete', 'not_applicable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."scenarioObjective" AS ENUM('market', 'resources', 'learning', 'coordination');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "entry_strategy"."userRole" AS ENUM('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."strategyApprovalMilestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"approvalId" integer NOT NULL,
	"title" varchar(220) NOT NULL,
	"responsible" varchar(160),
	"dueAt" timestamp with time zone,
	"status" "entry_strategy"."milestoneStatus" DEFAULT 'pending' NOT NULL,
	"evidence" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."strategyApprovals" (
	"id" serial PRIMARY KEY NOT NULL,
	"scenarioId" integer NOT NULL,
	"userId" integer NOT NULL,
	"countryCode" varchar(3) NOT NULL,
	"countryName" varchar(120) NOT NULL,
	"recommendation" "entry_strategy"."approvalRecommendation" NOT NULL,
	"status" "entry_strategy"."approvalStatus" DEFAULT 'not_started' NOT NULL,
	"responsible" varchar(160) NOT NULL,
	"reviewer" varchar(160),
	"reviewAt" timestamp with time zone NOT NULL,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."strategyCaseDocuments" (
	"id" serial PRIMARY KEY NOT NULL,
	"caseId" integer NOT NULL,
	"userId" integer NOT NULL,
	"filename" varchar(260) NOT NULL,
	"mimeType" varchar(120) NOT NULL,
	"storageKey" varchar(500),
	"textContent" text,
	"bytes" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."strategyCases" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(200) NOT NULL,
	"decisionQuestion" text,
	"companyName" varchar(180),
	"homeCountry" varchar(120),
	"industry" varchar(180),
	"subIndustry" varchar(180),
	"caseYear" integer,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."strategyEvidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"caseId" integer NOT NULL,
	"userId" integer NOT NULL,
	"kind" "entry_strategy"."evidenceKind" NOT NULL,
	"claim" text NOT NULL,
	"sourceLabel" varchar(300) NOT NULL,
	"documentId" integer,
	"locator" varchar(160),
	"quote" text,
	"url" varchar(1000),
	"retrievedAt" varchar(80),
	"reliability" integer DEFAULT 3 NOT NULL,
	"targetPath" varchar(160),
	"countryCode" varchar(3),
	"createdBy" "entry_strategy"."evidenceAuthor" DEFAULT 'user' NOT NULL,
	"status" "entry_strategy"."evidenceStatus" DEFAULT 'accepted' NOT NULL,
	"quoteVerified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."strategyScenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"name" varchar(180) NOT NULL,
	"companyName" varchar(180) NOT NULL,
	"homeCountry" varchar(120) NOT NULL,
	"industry" varchar(180) NOT NULL,
	"businessModel" varchar(120) NOT NULL,
	"objective" "entry_strategy"."scenarioObjective" NOT NULL,
	"horizonYears" integer NOT NULL,
	"caseId" integer,
	"inputJson" jsonb NOT NULL,
	"resultJson" jsonb NOT NULL,
	"sourceRefreshAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "entry_strategy"."userRole" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strategyApprovalMilestones_approvalId_idx" ON "entry_strategy"."strategyApprovalMilestones" USING btree ("approvalId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strategyApprovals_userId_scenarioId_idx" ON "entry_strategy"."strategyApprovals" USING btree ("userId","scenarioId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "strategyApprovals_scenario_country_uq" ON "entry_strategy"."strategyApprovals" USING btree ("scenarioId","countryCode");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strategyCaseDocuments_caseId_idx" ON "entry_strategy"."strategyCaseDocuments" USING btree ("caseId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strategyCases_userId_idx" ON "entry_strategy"."strategyCases" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strategyEvidence_caseId_status_idx" ON "entry_strategy"."strategyEvidence" USING btree ("caseId","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strategyScenarios_userId_idx" ON "entry_strategy"."strategyScenarios" USING btree ("userId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "strategyScenarios_caseId_idx" ON "entry_strategy"."strategyScenarios" USING btree ("caseId");