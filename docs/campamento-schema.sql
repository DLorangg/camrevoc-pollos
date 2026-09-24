-- ==============================================================================
-- SCHEMA SUPABASE: PROYECTO CAMPAMENTOS 2027 (CAMREVOC)
-- ==============================================================================

-- 1. Tabla de inscriptos
CREATE TABLE IF NOT EXISTS inscriptos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  apellido TEXT NOT NULL,
  nombre TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  etapa TEXT NOT NULL,
  rol TEXT NOT NULL,
  destino TEXT NOT NULL,
  tarifa INTEGER NOT NULL,
  dificultad_pago BOOLEAN DEFAULT false,
  regimen_alimentario TEXT DEFAULT 'Omnívoro',
  detalle_alimentario TEXT,
  quiere_aportar BOOLEAN DEFAULT false,
  contacto_donacion TEXT
);

CREATE INDEX IF NOT EXISTS idx_inscriptos_dni ON inscriptos (dni);
CREATE INDEX IF NOT EXISTS idx_inscriptos_etapa ON inscriptos (etapa);

-- 2. Tabla de pagos (Fase 2 y Circuito de Autogestión)
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  inscripto_id UUID NOT NULL REFERENCES inscriptos(id) ON DELETE CASCADE,
  monto INTEGER NOT NULL CHECK (monto > 0),
  comprobante_url TEXT,
  observaciones TEXT,
  registrado_por TEXT, -- Opcional / NULL si es cargado por la familia
  estado TEXT DEFAULT 'APROBADO' NOT NULL, -- 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'
  subido_por TEXT DEFAULT 'COORDINADOR' NOT NULL, -- 'FAMILIA' | 'COORDINADOR'
  contacto_telefono TEXT,
  verificado_por TEXT,
  verificado_at TIMESTAMPTZ,
  motivo_rechazo TEXT
);

CREATE INDEX IF NOT EXISTS idx_pagos_inscripto_id ON pagos (inscripto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON pagos (estado);

-- 3. Tabla de PINs por Etapa (Fase 2.1)
CREATE TABLE IF NOT EXISTS etapas_pines (
  etapa TEXT PRIMARY KEY, -- ej: '1', '2', '3', etc.
  pin TEXT NOT NULL,
  es_default BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Tabla de Coordinadores por Etapa (Auto-registro y selector dinámico)
CREATE TABLE IF NOT EXISTS coordinadores_etapa (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  etapa TEXT NOT NULL, -- ej: '1', '2', etc. o '1ra Etapa'
  nombre TEXT NOT NULL,
  UNIQUE(etapa, nombre)
);

CREATE INDEX IF NOT EXISTS idx_coordinadores_etapa ON coordinadores_etapa (etapa);

-- 5. Storage Bucket: comprobantes-campa
-- En el dashboard de Supabase -> Storage -> Create new bucket:
--   Name: 'comprobantes-campa'
--   Public: true (o con RLS si se prefiere restringir)


