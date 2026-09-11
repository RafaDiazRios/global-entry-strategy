-- Añadir la tesis al enum de bloques de caso.
--
-- No hay columna de «modo»: un caso con tesis enunciada es un caso en modo trabajo. El modo
-- se deduce del contenido en lugar de configurarse, así que no puede desincronizarse.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'entry_strategy' AND t.typname = 'caseModuleKey' AND e.enumlabel = 'thesis'
  ) THEN
    ALTER TYPE "entry_strategy"."caseModuleKey" ADD VALUE 'thesis';
  END IF;
END $$;
