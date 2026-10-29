-- ==============================================================================
-- CONTROL ATÓMICO DE STOCK MÁXIMO DE POLLOS (288 UNIDADES)
-- Proyecto Supabase: camrevoc-pollos (base principal)
--
-- ⚠️ ESTE SCRIPT ES PARA REVISIÓN. NO EJECUTAR EN PRODUCCIÓN SIN AUTORIZACIÓN.
-- ==============================================================================

-- 1. Función que valida el stock de forma atómica antes de insertar o actualizar un pedido
CREATE OR REPLACE FUNCTION public.check_stock_pollos()
RETURNS TRIGGER
LANGUAGE plpgsql
-- Se utiliza SECURITY INVOKER (principio de menor privilegio): las Server Actions
-- se conectan con service_role que ya posee los privilegios necesarios.
SECURITY INVOKER
-- Fijar search_path previene vulnerabilidades de resolución de esquemas (recomendación Supabase/PostgreSQL)
SET search_path = public, pg_temp
AS $$
DECLARE
  v_ocupados INTEGER;
  c_maximo CONSTANT INTEGER := 288;
BEGIN
  -- 1. Validación defensiva estricta de cantidad: nunca permitir NULL o valores no positivos
  IF NEW.cantidad_total IS NULL OR NEW.cantidad_total <= 0 THEN
    RAISE EXCEPTION 'La cantidad de pollos debe ser un número entero mayor a 0 (recibido: %)',
      NEW.cantidad_total
      USING ERRCODE = '23514'; -- check_violation
  END IF;

  -- 2. Solo se computan los pedidos cuyo estado_pago no sea 'Rechazado'
  --    (tratamiento explícito de NULL: COALESCE asume 'Pendiente', estado inicial del negocio)
  IF COALESCE(NEW.estado_pago, 'Pendiente') != 'Rechazado' THEN
    -- Bloqueo consultivo transaccional exclusivo (identificador 20261029 para stock de pollos).
    -- Serializa de manera estricta las inserciones y actualizaciones concurrentes en PostgreSQL.
    -- El bloqueo se libera automáticamente al terminar la transacción (COMMIT o ROLLBACK).
    PERFORM pg_advisory_xact_lock(20261029);

    -- Sumar la cantidad de pollos ya ocupados por pedidos existentes en la base de datos.
    -- En UPDATE (TG_OP = 'UPDATE'), excluye la fila actual (id != NEW.id) para no duplicar su cómputo.
    -- En INSERT (TG_OP = 'INSERT'), evalúa todas las filas existentes.
    SELECT COALESCE(SUM(cantidad_total), 0)
    INTO v_ocupados
    FROM public.pedidos
    WHERE COALESCE(estado_pago, 'Pendiente') != 'Rechazado'
      AND (TG_OP = 'INSERT' OR id != NEW.id);

    -- Verificar si la suma de los existentes más el nuevo pedido supera el stock máximo
    IF (v_ocupados + NEW.cantidad_total) > c_maximo THEN
      RAISE EXCEPTION 'STOCK_AGOTADO: No hay stock suficiente de pollos. Solicitados: %, disponibles: % (máximo: %)',
        NEW.cantidad_total, GREATEST(0, c_maximo - v_ocupados), c_maximo
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Trigger sobre la tabla pedidos
-- Solo reemplaza su propio trigger si ya existía; no afecta triggers ajenos.
DROP TRIGGER IF EXISTS trigger_check_stock_pollos ON public.pedidos;

CREATE TRIGGER trigger_check_stock_pollos
  BEFORE INSERT OR UPDATE OF cantidad_total, estado_pago
  ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_stock_pollos();

-- 3. Documentación en catálogo de PostgreSQL
COMMENT ON FUNCTION public.check_stock_pollos() IS
  'Garantiza atómicamente que la suma de pedidos activos (Aprobado + Pendiente) no supere los 288 pollos, serializando transacciones concurrentes con pg_advisory_xact_lock.';
