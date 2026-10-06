-- ==============================================================================
-- MIGRACIÓN: Soporte Transversal de Pagos en Efectivo
-- ==============================================================================

-- 1. En proyecto Supabase: camrevoc-pollos
-- Tabla: pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS es_efectivo BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS recibido_por TEXT;

-- 2. En proyecto Supabase: camrevoc-campa
-- Tabla: pagos
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS es_efectivo BOOLEAN DEFAULT false;
ALTER TABLE pagos ADD COLUMN IF NOT EXISTS recibido_por TEXT;
