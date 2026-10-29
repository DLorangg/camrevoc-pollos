import { createServiceClient } from "@/lib/supabase/server";
import { STOCK_MAXIMO_POLLOS } from "@/config/constants";

export interface StockPollosSuccess {
  ok: true;
  stockMaximo: number;
  stockOcupado: number;
  stockRestante: number;
  stockAgotado: boolean;
}

export interface StockPollosError {
  ok: false;
  error: string;
}

export type StockPollosResult = StockPollosSuccess | StockPollosError;

/**
 * Consulta en la base de datos la cantidad total de pollos ocupados por pedidos
 * cuyo estado de pago no sea 'Rechazado' (es decir, computa pedidos 'Aprobado' y 'Pendiente').
 *
 * Retorna un objeto discriminado con `ok: true` y la información de stock, o `ok: false`
 * con el motivo del fallo si la base de datos no pudo ser consultada.
 */
export async function obtenerStockPollos(): Promise<StockPollosResult> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("pedidos")
    .select("cantidad_total")
    .neq("estado_pago", "Rechazado");

  if (error) {
    console.error("[obtenerStockPollos] Error al consultar stock en Supabase:", error);
    return {
      ok: false,
      error: "No se pudo consultar la disponibilidad de stock en este momento.",
    };
  }

  const stockOcupado = (data ?? []).reduce(
    (acc, pedido) => acc + (pedido.cantidad_total || 0),
    0,
  );
  const stockRestante = Math.max(0, STOCK_MAXIMO_POLLOS - stockOcupado);
  const stockAgotado = stockRestante <= 0;

  return {
    ok: true,
    stockMaximo: STOCK_MAXIMO_POLLOS,
    stockOcupado,
    stockRestante,
    stockAgotado,
  };
}
