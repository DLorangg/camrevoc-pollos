-- ==============================================================================
-- Convivencia Familiar CAMREVOC 2026 — Migración de base de datos
-- ------------------------------------------------------------------------------
-- PROYECTO SUPABASE DONDE EJECUTAR: camrevoc-pollos (base principal)
--   (NO ejecutar en camrevoc-campa.)
-- DÓNDE: Supabase Dashboard → SQL Editor, ejecución MANUAL por una persona.
--   Este script NO fue ejecutado por el código ni por el agente que lo redactó.
-- IDEMPOTENTE: puede ejecutarse más de una vez sin duplicar ni romper objetos.
-- ACTUALIZACIÓN (celiaquía individual + tarifa escalonada en la app): si ya ejecutaste
--   la versión anterior de este script, volvé a ejecutar ESTE archivo completo. Agrega
--   `es_celiaco` por integrante, hace opcional el dato familiar obsoleto `hay_celiaco`
--   (sin borrar ni modificar datos existentes) y reemplaza la función de registro.
--   El precio NO se guarda en la base: se calcula en el servidor (src/config/convivencia.ts).
-- ALCANCE: crea únicamente objetos `convivencia_*`. No toca `pedidos`, `vales`,
--   `buzos_votos`, `inscriptos`, `pagos` ni Storage.
-- PRIVACIDAD: contiene datos personales (DNI, salud, menores). RLS habilitado
--   sin políticas => ningún acceso con anon/authenticated. Solo `service_role`
--   (Server Actions de Next.js) puede leer o escribir.
-- ==============================================================================

-- ─── 1. Inscripción familiar (cabecera) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.convivencia_inscripciones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- Clave de idempotencia generada por el navegador: un reintento del mismo
    -- envío nunca crea una segunda inscripción.
    envio_id    UUID NOT NULL,
    -- OBSOLETO: dato familiar de la primera versión. Se conserva solo para no perder
    -- inscripciones ya guardadas; las nuevas quedan en NULL (ver integrantes.es_celiaco).
    hay_celiaco BOOLEAN,
    CONSTRAINT convivencia_inscripciones_envio_id_key UNIQUE (envio_id)
);

-- Migración de la versión anterior: el dato familiar pasa a ser opcional (no se borra).
ALTER TABLE public.convivencia_inscripciones ALTER COLUMN hay_celiaco DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_convivencia_inscripciones_created_at
    ON public.convivencia_inscripciones (created_at DESC);

-- ─── 2. Integrantes de la inscripción ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.convivencia_integrantes (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscripcion_id       UUID NOT NULL
                         REFERENCES public.convivencia_inscripciones(id) ON DELETE CASCADE,
    -- Posición dentro de la familia (1 = titular vinculado a CAMREVOC).
    orden                INTEGER NOT NULL CHECK (orden >= 1),
    es_titular           BOOLEAN NOT NULL,
    nombre               TEXT NOT NULL CHECK (length(btrim(nombre)) > 0),
    apellido             TEXT NOT NULL CHECK (length(btrim(apellido)) > 0),
    dni                  TEXT NOT NULL CHECK (dni ~ '^[0-9]{7,9}$'),
    edad                 INTEGER NOT NULL CHECK (edad BETWEEN 0 AND 120),
    -- Etapa CAMREVOC. Obligatoria para el titular; NULL = no pertenece a CAMREVOC.
    etapa                TEXT CHECK (etapa IN (
                             '1ra Etapa','2da Etapa','3ra Etapa','4ta Etapa',
                             '5ta Etapa','6ta Etapa','7ma Etapa','Animador/a')),
    -- Parentesco con el titular. NULL solo para el titular.
    parentesco           TEXT,
    observaciones_salud  TEXT,
    -- ¿Es celíaco/a? Respuesta individual obligatoria para inscripciones nuevas.
    -- NULL únicamente en filas anteriores a este cambio (ver constraint más abajo).
    es_celiaco           BOOLEAN,
    -- Solo para menores de 18: ¿asiste con un adulto de su familia? NULL para adultos.
    menor_acompanado     BOOLEAN,
    -- Contacto de emergencia: se guarda completo o no se guarda.
    emergencia_nombre    TEXT,
    emergencia_vinculo   TEXT,
    emergencia_telefono  TEXT,

    CONSTRAINT convivencia_integrantes_orden_key UNIQUE (inscripcion_id, orden),
    CONSTRAINT convivencia_integrantes_dni_familia_key UNIQUE (inscripcion_id, dni),
    CONSTRAINT convivencia_integrantes_titular_chk CHECK (
        (es_titular AND parentesco IS NULL AND etapa IS NOT NULL AND orden = 1)
        OR (NOT es_titular AND parentesco IS NOT NULL AND orden > 1)
    ),
    CONSTRAINT convivencia_integrantes_menor_chk CHECK (
        edad < 18 OR menor_acompanado IS NULL
    ),
    CONSTRAINT convivencia_integrantes_emergencia_chk CHECK (
        (emergencia_nombre IS NULL AND emergencia_vinculo IS NULL AND emergencia_telefono IS NULL)
        OR (emergencia_nombre IS NOT NULL AND emergencia_vinculo IS NOT NULL AND emergencia_telefono IS NOT NULL)
    )
);

-- Migración de la versión anterior: agrega la columna sin tocar las filas existentes.
ALTER TABLE public.convivencia_integrantes ADD COLUMN IF NOT EXISTS es_celiaco BOOLEAN;

-- Obligatoriedad para filas NUEVAS sin invalidar las existentes (NOT VALID no revisa
-- filas previas). Las inscripciones anteriores conservan es_celiaco = NULL.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
         WHERE conname = 'convivencia_integrantes_celiaco_chk'
           AND conrelid = 'public.convivencia_integrantes'::regclass
    ) THEN
        ALTER TABLE public.convivencia_integrantes
            ADD CONSTRAINT convivencia_integrantes_celiaco_chk
            CHECK (es_celiaco IS NOT NULL) NOT VALID;
    END IF;
END $$;

-- Un único titular por inscripción.
CREATE UNIQUE INDEX IF NOT EXISTS idx_convivencia_integrantes_un_titular
    ON public.convivencia_integrantes (inscripcion_id) WHERE es_titular;

-- Búsqueda administrativa por DNI.
CREATE INDEX IF NOT EXISTS idx_convivencia_integrantes_dni
    ON public.convivencia_integrantes (dni);

-- ─── 3. Seguridad: RLS sin políticas + sin permisos para roles públicos ──────
ALTER TABLE public.convivencia_inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convivencia_integrantes   ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.convivencia_inscripciones FROM anon, authenticated;
REVOKE ALL ON public.convivencia_integrantes   FROM anon, authenticated;

-- ─── 4. Registro atómico de una inscripción completa ─────────────────────────
-- Inserta cabecera + integrantes en UNA sola transacción (una función plpgsql es
-- atómica) y es idempotente por `envio_id`: si ya existe, devuelve la existente.
-- Entrada p_integrantes: arreglo JSON ordenado; el elemento 0 es el titular. Claves:
--   nombre, apellido, dni, edad, etapa, parentesco, observaciones_salud, es_celiaco,
--   menor_acompanado, emergencia_nombre, emergencia_vinculo, emergencia_telefono
-- Devuelve: {"inscripcion_id": uuid, "cantidad_integrantes": n, "ya_existia": bool}
-- Firma anterior (con p_hay_celiaco): se elimina; reemplazada por la versión de abajo.
DROP FUNCTION IF EXISTS public.convivencia_registrar_inscripcion(UUID, BOOLEAN, JSONB);

CREATE OR REPLACE FUNCTION public.convivencia_registrar_inscripcion(
    p_envio_id    UUID,
    p_integrantes JSONB
) RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_id UUID;
    v_cantidad INTEGER;
BEGIN
    IF p_integrantes IS NULL OR jsonb_typeof(p_integrantes) <> 'array'
       OR jsonb_array_length(p_integrantes) = 0 THEN
        RAISE EXCEPTION 'p_integrantes debe ser un arreglo JSON no vacío';
    END IF;

    SELECT i.id INTO v_id
      FROM public.convivencia_inscripciones i
     WHERE i.envio_id = p_envio_id;

    IF v_id IS NOT NULL THEN
        SELECT count(*)::INTEGER INTO v_cantidad
          FROM public.convivencia_integrantes m WHERE m.inscripcion_id = v_id;
        RETURN jsonb_build_object(
            'inscripcion_id', v_id, 'cantidad_integrantes', v_cantidad, 'ya_existia', true);
    END IF;

    INSERT INTO public.convivencia_inscripciones (envio_id)
    VALUES (p_envio_id)
    ON CONFLICT (envio_id) DO NOTHING
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN
        -- Carrera: otro envío con la misma clave se insertó entre el SELECT y el INSERT.
        SELECT i.id INTO v_id
          FROM public.convivencia_inscripciones i
         WHERE i.envio_id = p_envio_id;
        SELECT count(*)::INTEGER INTO v_cantidad
          FROM public.convivencia_integrantes m WHERE m.inscripcion_id = v_id;
        RETURN jsonb_build_object(
            'inscripcion_id', v_id, 'cantidad_integrantes', v_cantidad, 'ya_existia', true);
    END IF;

    INSERT INTO public.convivencia_integrantes (
        inscripcion_id, orden, es_titular, nombre, apellido, dni, edad, etapa,
        parentesco, observaciones_salud, es_celiaco, menor_acompanado,
        emergencia_nombre, emergencia_vinculo, emergencia_telefono
    )
    SELECT
        v_id,
        t.ord::INTEGER,
        (t.ord = 1),
        t.elem->>'nombre',
        t.elem->>'apellido',
        t.elem->>'dni',
        (t.elem->>'edad')::INTEGER,
        NULLIF(t.elem->>'etapa', ''),
        NULLIF(t.elem->>'parentesco', ''),
        NULLIF(t.elem->>'observaciones_salud', ''),
        (t.elem->>'es_celiaco')::BOOLEAN,
        (t.elem->>'menor_acompanado')::BOOLEAN,
        NULLIF(t.elem->>'emergencia_nombre', ''),
        NULLIF(t.elem->>'emergencia_vinculo', ''),
        NULLIF(t.elem->>'emergencia_telefono', '')
    FROM jsonb_array_elements(p_integrantes) WITH ORDINALITY AS t(elem, ord);

    GET DIAGNOSTICS v_cantidad = ROW_COUNT;

    RETURN jsonb_build_object(
        'inscripcion_id', v_id, 'cantidad_integrantes', v_cantidad, 'ya_existia', false);
END;
$$;

-- Solo el service_role (Server Actions) puede invocar la función.
REVOKE ALL ON FUNCTION public.convivencia_registrar_inscripcion(UUID, JSONB)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convivencia_registrar_inscripcion(UUID, JSONB)
    TO service_role;
