DO $$ BEGIN
	CREATE TYPE "entry_strategy"."caseModuleKey" AS ENUM('ambition', 'positioning');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entry_strategy"."strategyCaseModules" (
	"id" serial PRIMARY KEY NOT NULL,
	"caseId" integer NOT NULL,
	"userId" integer NOT NULL,
	"moduleKey" "entry_strategy"."caseModuleKey" NOT NULL,
	"payload" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "strategyCaseModules_case_module_uq" ON "entry_strategy"."strategyCaseModules" USING btree ("caseId","moduleKey");
--> statement-breakpoint
ALTER TABLE "entry_strategy"."strategyCaseModules" ENABLE ROW LEVEL SECURITY;
