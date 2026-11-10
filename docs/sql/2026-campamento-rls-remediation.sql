-- ==============================================================================
-- MIGRACIÓN DE REMEDIACIÓN RLS: OBJETOS AUDITADOS DE CAMPAMENTOS [SEC-07]
-- Proyecto Supabase: camrevoc-campa (Módulo Campamentos)
-- 
-- OBJETIVO:
-- 1. Eliminación segura y condicional de la vista obsoleta 'vista_inscriptos_saldos'
--    con RESTRICT (abortando si relkind <> 'v').
-- 2. Habilitación de RLS y FORCE RLS en las 4 tablas auditadas:
--    - public.inscriptos
--    - public.pagos
--    - public.etapas_pines
--    - public.coordinadores_etapa
-- 3. Aplicación estricta del Principio de Mínimo Privilegio:
--    - Revocación de TODOS los privilegios a PUBLIC, anon, authenticated.
--    - Revocación de TODOS los privilegios a service_role (purgando TRUNCATE,
--      REFERENCES, TRIGGER preexistentes).
--    - inscriptos y pagos: GRANT SELECT, INSERT, UPDATE, DELETE a service_role.
--    - etapas_pines: GRANT SELECT, INSERT, UPDATE a service_role (sin DELETE).
--    - coordinadores_etapa: GRANT SELECT, INSERT, UPDATE a service_role (sin DELETE).
-- 4. Blindaje de secuencias asociadas a inscriptos y pagos:
--    - Revocación de TODOS los privilegios a PUBLIC, anon, authenticated y service_role.
--    - Otorgamiento exclusivo de USAGE a service_role (sin SELECT ni UPDATE).
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Eliminación Segura y Condicional de public.vista_inscriptos_saldos
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_relkind "char";
BEGIN
  SELECT c.relkind INTO v_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = 'vista_inscriptos_saldos';

  IF NOT FOUND THEN
    RAISE NOTICE 'El objeto public.vista_inscriptos_saldos no existe; omitiendo eliminación.';
  ELSIF v_relkind = 'v' THEN
    EXECUTE 'DROP VIEW public.vista_inscriptos_saldos RESTRICT;';
    RAISE NOTICE 'Vista public.vista_inscriptos_saldos eliminada de forma segura con RESTRICT.';
  ELSE
    RAISE EXCEPTION 'El objeto public.vista_inscriptos_saldos existe pero NO es una vista ordinaria (relkind=%). Abortando para prevenir pérdida de datos inesperada.', v_relkind
      USING ERRCODE = 'wrong_object_type';
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Blindaje de public.inscriptos
-- ------------------------------------------------------------------------------
ALTER TABLE public.inscriptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptos FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.inscriptos FROM PUBLIC;
REVOKE ALL ON TABLE public.inscriptos FROM anon;
REVOKE ALL ON TABLE public.inscriptos FROM authenticated;
REVOKE ALL ON TABLE public.inscriptos FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inscriptos TO service_role;

-- ------------------------------------------------------------------------------
-- 3. Blindaje de public.pagos
-- ------------------------------------------------------------------------------
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.pagos FROM PUBLIC;
REVOKE ALL ON TABLE public.pagos FROM anon;
REVOKE ALL ON TABLE public.pagos FROM authenticated;
REVOKE ALL ON TABLE public.pagos FROM service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pagos TO service_role;

-- ------------------------------------------------------------------------------
-- 4. Blindaje de public.etapas_pines (Sin DELETE: mínimo privilegio legítimo)
-- ------------------------------------------------------------------------------
ALTER TABLE public.etapas_pines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etapas_pines FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.etapas_pines FROM PUBLIC;
REVOKE ALL ON TABLE public.etapas_pines FROM anon;
REVOKE ALL ON TABLE public.etapas_pines FROM authenticated;
REVOKE ALL ON TABLE public.etapas_pines FROM service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.etapas_pines TO service_role;

-- ------------------------------------------------------------------------------
-- 5. Blindaje de public.coordinadores_etapa (Sin DELETE: mínimo privilegio legítimo)
-- ------------------------------------------------------------------------------
ALTER TABLE public.coordinadores_etapa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coordinadores_etapa FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.coordinadores_etapa FROM PUBLIC;
REVOKE ALL ON TABLE public.coordinadores_etapa FROM anon;
REVOKE ALL ON TABLE public.coordinadores_etapa FROM authenticated;
REVOKE ALL ON TABLE public.coordinadores_etapa FROM service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.coordinadores_etapa TO service_role;

-- ------------------------------------------------------------------------------
-- 6. Blindaje de Secuencias vinculadas a inscriptos y pagos
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_seq RECORD;
BEGIN
  FOR v_seq IN (
    SELECT DISTINCT s.relname
    FROM pg_class s
    JOIN pg_namespace sn ON sn.oid = s.relnamespace
    JOIN pg_depend d ON d.objid = s.oid AND d.deptype IN ('a', 'i')
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN pg_namespace tn ON tn.oid = t.relnamespace
    WHERE sn.nspname = 'public'
      AND tn.nspname = 'public'
      AND t.relname IN ('inscriptos', 'pagos')
      AND s.relkind = 'S'
  ) LOOP
    EXECUTE pg_catalog.format('REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC;', v_seq.relname);
    EXECUTE pg_catalog.format('REVOKE ALL ON SEQUENCE public.%I FROM anon;', v_seq.relname);
    EXECUTE pg_catalog.format('REVOKE ALL ON SEQUENCE public.%I FROM authenticated;', v_seq.relname);
    EXECUTE pg_catalog.format('REVOKE ALL ON SEQUENCE public.%I FROM service_role;', v_seq.relname);
    EXECUTE pg_catalog.format('GRANT USAGE ON SEQUENCE public.%I TO service_role;', v_seq.relname);
    RAISE NOTICE 'Secuencia public.% blindada: REVOKE ALL (incluido service_role) y GRANT USAGE exclusivo a service_role.', v_seq.relname;
  END LOOP;
END $$;

COMMIT;
