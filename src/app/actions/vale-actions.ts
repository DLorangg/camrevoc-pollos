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

    const { data: valeActualizado, error } = await supabase
      .from("vales")
      .update({
        estado_entrega: "Entregado",
        entregado_at: new Date().toISOString(),
      })
      .eq("id", valeId)
      .eq("estado_entrega", "Pendiente") // seguridad: solo si aún está pendiente
      .select("pedido_id")
      .single();

    if (error) {
      console.error("Error al confirmar entrega en Supabase:", error);
      return { ok: false, error: error.message };
    }

    // Verificar si todos los vales asociados a ese pedido_id quedaron en estado 'Entregado'
    if (valeActualizado?.pedido_id) {
      const { data: valesPedido } = await supabase
        .from("vales")
        .select("estado_entrega")
        .eq("pedido_id", valeActualizado.pedido_id);

      const todosEntregados =
        valesPedido &&
        valesPedido.length > 0 &&
        valesPedido.every((v) => v.estado_entrega === "Entregado");

      if (todosEntregados) {
        // Actualizar en pedidos si la columna existiera en el schema
        const { error: errPedido } = await supabase
          .from("pedidos")
          .update({
            estado_entrega: "Entregado",
          })
          .eq("id", valeActualizado.pedido_id);

        if (errPedido) {
          console.log(
            "[confirmarEntrega] Info: pedidos.estado_entrega no actualizado o columna inexistente:",
            errPedido.message,
          );
        }
      }
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
