"use server";

import { customAlphabet } from "nanoid";
import { createServiceClient } from "@/lib/supabase/server";
import { isVentaPollosCerrada } from "@/config/constants";
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
  animador_vendedor?: string;
  cantidad_total: number;
  comprobantes_urls: string[];
  vales: ValeInput[];
  es_efectivo?: boolean;
  recibido_por?: string | null;
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
  // Validación de fecha límite de venta
  if (isVentaPollosCerrada()) {
    return {
      ok: false,
      error: "¡La venta de pollos ha finalizado! Gracias a todos por participar de la Gran Pollada de CAMREVOC.",
    };
  }

  // Validación básica server-side
  const sumaVales = input.vales.reduce((s, v) => s + v.cantidad_pollos, 0);
  if (sumaVales !== input.cantidad_total) {
    return {
      ok: false,
      error: `La suma de pollos en los vales (${sumaVales}) no coincide con el total del pedido (${input.cantidad_total}).`,
    };
  }

  const esEfectivo = Boolean(input.es_efectivo);
  const recibidoPor = esEfectivo ? (input.recibido_por || "").trim() : null;

  if (esEfectivo && !recibidoPor) {
    return {
      ok: false,
      error: "Para pagos en efectivo, debés indicar quién recibió el dinero.",
    };
  }

  // Comprobante obligatorio
  if (
    !input.comprobantes_urls ||
    input.comprobantes_urls.length === 0 ||
    input.comprobantes_urls.every((u) => !u?.trim())
  ) {
    return {
      ok: false,
      error: esEfectivo
        ? "El comprobante/recibo del pago en efectivo es obligatorio para registrar el pedido."
        : "El comprobante de transferencia es obligatorio para registrar el pedido.",
    };
  }

  const supabase = createServiceClient();
  const nombreUnificado = input.nombre_comprador.trim();
  const animadorUnificado = (input.animador_vendedor || input.nombre_comprador).trim();

  // 1. Insertar pedido (mapeando el nombre único a ambas columnas)
  const baseInsert = {
    nombre_comprador: nombreUnificado,
    whatsapp: input.whatsapp.trim(),
    email: input.email.trim().toLowerCase(),
    etapa: input.etapa.trim(),
    animador_vendedor: animadorUnificado,
    cantidad_total: input.cantidad_total,
    comprobantes_urls: input.comprobantes_urls,
    estado_pago: "Pendiente" as const,
  };

  let pedido: { id: string } | null = null;
  let pedidoError: { message: string } | null = null;

  const { data: insertedData, error: err } = await supabase
    .from("pedidos")
    .insert({
      ...baseInsert,
      es_efectivo: esEfectivo,
      recibido_por: recibidoPor,
    })
    .select("id")
    .single();

  if (err && err.message?.includes("es_efectivo") && !esEfectivo) {
    // Si la base de datos aún no tiene la migración pero es transferencia, reintentar sin las columnas nuevas
    console.warn("[createOrder] Columna es_efectivo no disponible en DB, reintentando inserción básica...");
    const retry = await supabase
      .from("pedidos")
      .insert(baseInsert)
      .select("id")
      .single();
    pedido = retry.data;
    pedidoError = retry.error;
  } else {
    pedido = insertedData;
    pedidoError = err;
  }

  if (pedidoError || !pedido) {
    console.error("[createOrder] Error al insertar pedido:", pedidoError);
    return {
      ok: false,
      error: pedidoError?.message?.includes("es_efectivo")
        ? "La base de datos requiere la migración de pagos en efectivo (columna 'es_efectivo'). Contactá al administrador."
        : "No se pudo registrar el pedido. Intentá nuevamente.",
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
