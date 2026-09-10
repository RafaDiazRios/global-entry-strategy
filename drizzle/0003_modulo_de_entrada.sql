-- Añadir el módulo de estrategia de entrada al enum de bloques de caso.
--
-- `ALTER TYPE ... ADD VALUE` no admite IF NOT EXISTS en todas las versiones, así que se
-- comprueba antes de añadirlo para que la migración se pueda repetir sin romper.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'entry_strategy' AND t.typname = 'caseModuleKey' AND e.enumlabel = 'entry'
  ) THEN
    ALTER TYPE "entry_strategy"."caseModuleKey" ADD VALUE 'entry';
  END IF;
END $$;
