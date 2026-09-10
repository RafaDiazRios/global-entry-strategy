-- Cerrar el esquema a la API pública de Supabase.
--
-- Supabase publica una API REST sobre la base con dos roles anónimos, `anon` y
-- `authenticated`, cuya clave viaja en el navegador de cualquier aplicación del proyecto.
-- Esta herramienta no usa esa API: el servidor se conecta con su propia cadena de conexión.
-- Así que al esquema se le quita todo permiso a esos roles y se activa RLS sin políticas,
-- que en PostgreSQL significa "nadie, salvo el propietario de la tabla". El servidor
-- conecta como propietario y no se ve afectado.
--
-- Los roles solo existen en Supabase; en un PostgreSQL local el bloque no hace nada.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON SCHEMA "entry_strategy" FROM anon, authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA "entry_strategy" FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA "entry_strategy" FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "entry_strategy" REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA "entry_strategy" REVOKE ALL ON SEQUENCES FROM anon, authenticated;
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "entry_strategy"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entry_strategy"."strategyScenarios" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entry_strategy"."strategyApprovals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entry_strategy"."strategyApprovalMilestones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entry_strategy"."strategyCases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entry_strategy"."strategyCaseDocuments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "entry_strategy"."strategyEvidence" ENABLE ROW LEVEL SECURITY;
