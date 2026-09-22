"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import type { Vale, Pedido } from "@/types/database";

export interface ValeConPedido extends Vale {
  pedidos: Pick<Pedido, "nombre_comprador" | "animador_vendedor" | "etapa" | "estado_pago">;
}

export async function getVale(codigo: string): Promise<ValeConPedido | null> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("vales")
    .select(
      `*, pedidos(nombre_comprador, animador_vendedor, etapa, estado_pago)`,
    )
    .eq("codigo", codigo)
    .single<ValeConPedido>();

  if (error || !data) return null;
  return data;
}

export async function confirmarEntrega(
  valeId: string,
  codigo: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("vales")
      .update({
        estado_entrega: "Entregado",
        entregado_at: new Date().toISOString(),
      })
      .eq("id", valeId)
      .eq("estado_entrega", "Pendiente"); // seguridad: solo si aún está pendiente

    if (error) {
      console.error("Error al confirmar entrega en Supabase:", error);
      return { ok: false, error: error.message };
    }

    revalidatePath(`/vale/${codigo}`);
    revalidatePath("/admin");
    return { ok: true };
  } catch (err: unknown) {
    console.error("Error inesperado en confirmarEntrega:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error inesperado al confirmar entrega.",
    };
  }
}
