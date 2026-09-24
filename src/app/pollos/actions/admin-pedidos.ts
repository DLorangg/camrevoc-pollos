"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTicketEmail } from "@/lib/email/send-ticket";
import type { Pedido, Vale } from "@/types/database";

const ADMIN_SESSION_COOKIE = "admin_session";
const OPERATOR_COOKIE = "admin_operator";

async function assertAdmin() {
  const jar = await cookies();
  if (jar.get(ADMIN_SESSION_COOKIE)?.value !== "authenticated") {
    throw new Error("No autorizado.");
  }
}

async function currentOperator(): Promise<string> {
  const jar = await cookies();
  return jar.get(OPERATOR_COOKIE)?.value ?? "Desconocido";
}

// ─── Approve pedido ───────────────────────────────────────────────────────────

export async function approvePedido(
  pedidoId: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const operator = await currentOperator();
  const supabase = createServiceClient();

  // 1. Update pedido
  const { error: updateError } = await supabase
    .from("pedidos")
    .update({
      estado_pago: "Aprobado",
      aprobado_por: operator,
      revisado_at: new Date().toISOString(),
    })
    .eq("id", pedidoId);

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  // 2. Fetch pedido + vales for email
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", pedidoId)
    .single<Pedido>();

  const { data: vales } = await supabase
    .from("vales")
    .select("*")
    .eq("pedido_id", pedidoId)
    .returns<Vale[]>();

  // 3. Send email (non-blocking; errors are logged but don't fail the action)
  if (pedido && vales) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const emailResult = await sendTicketEmail(resend, {
      to: pedido.email,
      nombreComprador: pedido.nombre_comprador,
      cantidadTotal: pedido.cantidad_total,
      etapa: pedido.etapa,
      animadorVendedor: pedido.animador_vendedor,
      vales: vales.map((v) => ({
        codigo: v.codigo,
        cantidad_pollos: v.cantidad_pollos,
        destinatario: v.destinatario ?? "",
      })),
    });

    if (!emailResult.ok) {
      console.error("[approvePedido] Email send failed:", emailResult.error);
      // Continue — don't block approval because of email failure
    }
  }

  revalidatePath("/admin");
  return { ok: true };
}

// ─── Reject pedido ────────────────────────────────────────────────────────────

export async function rejectPedido(
  pedidoId: string,
  motivo: string,
): Promise<{ ok: boolean; error?: string }> {
  await assertAdmin();
  const operator = await currentOperator();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("pedidos")
    .update({
      estado_pago: "Rechazado",
      aprobado_por: `${operator} (rechazó): ${motivo}`,
      revisado_at: new Date().toISOString(),
    })
    .eq("id", pedidoId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

import { PRECIO_POLLO, ETAPAS } from "@/config/constants";

// ─── Get dashboard data ───────────────────────────────────────────────────────

export interface EtapaStat {
  etapa: string;
  aprobados: number;
  pendientes: number;
  total: number;
  recaudado: number;
  porcentajeLider: number;
  esLider: boolean;
}

export interface VendedorLeaderboard {
  posicion: number;
  nombre: string;
  etapa: string;
  pollosAprobados: number;
  pollosPendientes: number;
  pedidosCount: number;
  recaudado: number;
}

export interface DashboardData {
  pedidos: (Pedido & { vales: Vale[] })[];
  metrics: {
    totalSolicitados: number;
    totalAprobados: number;
    recaudacionAprobada: number;
    pendientesRevision: number;
    totalEntregados: number;
  };
  rankingEtapas: EtapaStat[];
  leaderboardVendedores: VendedorLeaderboard[];
}

export async function getDashboardData(): Promise<DashboardData> {
  await assertAdmin();
  const supabase = createServiceClient();

  const { data: pedidos, error } = await supabase
    .from("pedidos")
    .select("*, vales(*)")
    .order("created_at", { ascending: false })
    .returns<(Pedido & { vales: Vale[] })[]>();

  if (error || !pedidos) {
    throw new Error(error?.message ?? "No se pudieron cargar los pedidos.");
  }

  const aprobados = pedidos.filter((p) => p.estado_pago === "Aprobado");

  // 1. Agrupación por Etapas (Meta grupal)
  const etapasMap = new Map<string, { aprobados: number; pendientes: number }>();
  for (const e of ETAPAS) {
    etapasMap.set(e, { aprobados: 0, pendientes: 0 });
  }

  for (const p of pedidos) {
    const e = p.etapa?.trim() || "Otra";
    const current = etapasMap.get(e) ?? { aprobados: 0, pendientes: 0 };
    if (p.estado_pago === "Aprobado") {
      current.aprobados += p.cantidad_total;
    } else if (p.estado_pago === "Pendiente") {
      current.pendientes += p.cantidad_total;
    }
    etapasMap.set(e, current);
  }

  let maxAprobados = 0;
  for (const val of etapasMap.values()) {
    if (val.aprobados > maxAprobados) maxAprobados = val.aprobados;
  }
  if (maxAprobados === 0) {
    for (const val of etapasMap.values()) {
      const t = val.aprobados + val.pendientes;
      if (t > maxAprobados) maxAprobados = t;
    }
  }

  const rankingEtapas: EtapaStat[] = Array.from(etapasMap.entries())
    .map(([etapa, stat]) => {
      const total = stat.aprobados + stat.pendientes;
      const base = maxAprobados > 0 ? (stat.aprobados > 0 ? stat.aprobados : total) : 0;
      const porcentaje = maxAprobados > 0 ? Math.round((base / maxAprobados) * 100) : 0;
      return {
        etapa,
        aprobados: stat.aprobados,
        pendientes: stat.pendientes,
        total,
        recaudado: stat.aprobados * PRECIO_POLLO,
        porcentajeLider: Math.min(100, Math.max(0, porcentaje)),
        esLider: false,
      };
    })
    .sort((a, b) => b.aprobados - a.aprobados || b.total - a.total);

  if (rankingEtapas.length > 0 && (rankingEtapas[0].aprobados > 0 || rankingEtapas[0].total > 0)) {
    rankingEtapas[0].esLider = true;
  }

  // 2. Leaderboard de Vendedores (Top 10)
  const vendedoresMap = new Map<
    string,
    {
      nombre: string;
      etapa: string;
      pollosAprobados: number;
      pollosPendientes: number;
      pedidosCount: number;
    }
  >();

  for (const p of pedidos) {
    const rawNombre = p.animador_vendedor || p.nombre_comprador || "Sin nombre";
    const key = rawNombre.trim().toLowerCase();
    const existing = vendedoresMap.get(key) ?? {
      nombre: rawNombre.trim(),
      etapa: p.etapa?.trim() || "—",
      pollosAprobados: 0,
      pollosPendientes: 0,
      pedidosCount: 0,
    };

    if (p.estado_pago === "Aprobado") {
      existing.pollosAprobados += p.cantidad_total;
      existing.pedidosCount += 1;
    } else if (p.estado_pago === "Pendiente") {
      existing.pollosPendientes += p.cantidad_total;
    }

    if (p.etapa?.trim()) {
      existing.etapa = p.etapa.trim();
    }

    vendedoresMap.set(key, existing);
  }

  const leaderboardVendedores: VendedorLeaderboard[] = Array.from(vendedoresMap.values())
    .filter((v) => v.pollosAprobados > 0 || v.pollosPendientes > 0)
    .sort((a, b) => b.pollosAprobados - a.pollosAprobados || b.pollosPendientes - a.pollosPendientes)
    .slice(0, 10)
    .map((v, idx) => ({
      posicion: idx + 1,
      nombre: v.nombre,
      etapa: v.etapa,
      pollosAprobados: v.pollosAprobados,
      pollosPendientes: v.pollosPendientes,
      pedidosCount: v.pedidosCount,
      recaudado: v.pollosAprobados * PRECIO_POLLO,
    }));

  return {
    pedidos,
    metrics: {
      totalSolicitados: pedidos.reduce((s, p) => s + p.cantidad_total, 0),
      totalAprobados: aprobados.reduce((s, p) => s + p.cantidad_total, 0),
      recaudacionAprobada:
        aprobados.reduce((s, p) => s + p.cantidad_total, 0) * PRECIO_POLLO,
      pendientesRevision: pedidos.filter((p) => p.estado_pago === "Pendiente").length,
      totalEntregados: pedidos.reduce(
        (s, p) =>
          s +
          p.vales
            .filter((v) => v.estado_entrega === "Entregado")
            .reduce((vs, v) => vs + v.cantidad_pollos, 0),
        0,
      ),
    },
    rankingEtapas,
    leaderboardVendedores,
  };
}
