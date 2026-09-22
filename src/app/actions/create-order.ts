"use server";

import { customAlphabet } from "nanoid";
import { createServiceClient } from "@/lib/supabase/server";
import type { ValeInsert } from "@/types/database";

// Alfabeto para los códigos de vales: solo mayúsculas + dígitos, sin ambiguos.
const genCodigo = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 4);

export interface ValeInput {
  cantidad_pollos: number;
  destinatario: string;
}

export interface CreateOrderInput {
  nombre_comprador: string;
  whatsapp: string;
  email: string;
  etapa: string;
  animador_vendedor: string;
  cantidad_total: number;
  comprobantes_urls: string[];
  vales: ValeInput[];
}

export interface ValeCreado {
  codigo: string;
  cantidad_pollos: number;
  destinatario: string;
}

export interface CreateOrderResult {
  ok: true;
  pedido_id: string;
  vales: ValeCreado[];
}

export interface CreateOrderError {
  ok: false;
  error: string;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult | CreateOrderError> {
  // Validación básica server-side
  const sumaVales = input.vales.reduce((s, v) => s + v.cantidad_pollos, 0);
  if (sumaVales !== input.cantidad_total) {
    return {
      ok: false,
      error: `La suma de pollos en los vales (${sumaVales}) no coincide con el total del pedido (${input.cantidad_total}).`,
    };
  }

  const supabase = createServiceClient();

  // 1. Insertar pedido
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      nombre_comprador: input.nombre_comprador.trim(),
      whatsapp: input.whatsapp.trim(),
      email: input.email.trim().toLowerCase(),
      etapa: input.etapa.trim(),
      animador_vendedor: input.animador_vendedor.trim(),
      cantidad_total: input.cantidad_total,
      comprobantes_urls: input.comprobantes_urls,
      estado_pago: "Pendiente",
    })
    .select("id")
    .single();

  if (pedidoError || !pedido) {
    console.error("[createOrder] Error al insertar pedido:", pedidoError);
    return {
      ok: false,
      error: "No se pudo registrar el pedido. Intentá nuevamente.",
    };
  }

  // 2. Generar e insertar vales
  const valesInsert: ValeInsert[] = input.vales.map((v) => ({
    pedido_id: pedido.id,
    codigo: `CRV-${genCodigo()}`,
    cantidad_pollos: v.cantidad_pollos,
    destinatario: v.destinatario.trim() || null,
    estado_entrega: "Pendiente",
  }));

  const { data: valesCreados, error: valesError } = await supabase
    .from("vales")
    .insert(valesInsert)
    .select("codigo, cantidad_pollos, destinatario");

  if (valesError || !valesCreados) {
    console.error("[createOrder] Error al insertar vales:", valesError);
    // Intentamos limpiar el pedido huérfano
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    return {
      ok: false,
      error: "No se pudieron generar los vales. Intentá nuevamente.",
    };
  }

  return {
    ok: true,
    pedido_id: pedido.id,
    vales: valesCreados.map((v) => ({
      codigo: v.codigo,
      cantidad_pollos: v.cantidad_pollos,
      destinatario: v.destinatario ?? "",
    })),
  };
}
