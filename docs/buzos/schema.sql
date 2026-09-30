-- ==============================================================================
-- Tabla de Votación de Buzos 2027 (CAMREVOC)
-- Proyecto Supabase: camrevoc-pollos (base principal)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.buzos_votos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dni TEXT NOT NULL,
    frente TEXT NOT NULL,
    atras TEXT, -- NULL cuando el frente elegido ya tiene frase
    crv_manga BOOLEAN NOT NULL DEFAULT false,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Restricción UNIQUE sobre DNI para impedir votos duplicados (un único voto activo por persona)
CREATE UNIQUE INDEX IF NOT EXISTS idx_buzos_votos_dni ON public.buzos_votos (dni);

-- Trigger para mantener actualizado automáticamente el campo updated_at
CREATE OR REPLACE FUNCTION update_buzos_votos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_buzos_votos_updated_at ON public.buzos_votos;
CREATE TRIGGER trigger_buzos_votos_updated_at
    BEFORE UPDATE ON public.buzos_votos
    FOR EACH ROW
    EXECUTE FUNCTION update_buzos_votos_updated_at();

-- Habilitar RLS de forma defensiva (las Server Actions operan con service_role)
ALTER TABLE public.buzos_votos ENABLE ROW LEVEL SECURITY;
