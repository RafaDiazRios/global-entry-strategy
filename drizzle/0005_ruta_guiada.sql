-- Añadir el progreso de la ruta guiada al enum de bloques de caso.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'entry_strategy' AND t.typname = 'caseModuleKey' AND e.enumlabel = 'route'
  ) THEN
    ALTER TYPE "entry_strategy"."caseModuleKey" ADD VALUE 'route';
  END IF;
END $$;
