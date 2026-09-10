-- Añadir el módulo de vía de acceso y socio al enum de bloques de caso.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'entry_strategy' AND t.typname = 'caseModuleKey' AND e.enumlabel = 'partnering'
  ) THEN
    ALTER TYPE "entry_strategy"."caseModuleKey" ADD VALUE 'partnering';
  END IF;
END $$;
