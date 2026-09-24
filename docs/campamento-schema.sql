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

-- 2. Tabla de pagos (Fase 2)
CREATE TABLE IF NOT EXISTS pagos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  inscripto_id UUID NOT NULL REFERENCES inscriptos(id) ON DELETE CASCADE,
  monto INTEGER NOT NULL CHECK (monto > 0),
  comprobante_url TEXT,
  observaciones TEXT,
  registrado_por TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pagos_inscripto_id ON pagos (inscripto_id);

-- 3. Tabla de PINs por Etapa (Fase 2.1)
CREATE TABLE IF NOT EXISTS etapas_pines (
  etapa TEXT PRIMARY KEY, -- ej: '1', '2', '3', etc.
  pin TEXT NOT NULL,
  es_default BOOLEAN DEFAULT true NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Storage Bucket: comprobantes-campa
-- En el dashboard de Supabase -> Storage -> Create new bucket:
--   Name: 'comprobantes-campa'
--   Public: true (o con RLS si se prefiere restringir)

