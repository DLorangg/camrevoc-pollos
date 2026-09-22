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

// ─── Get dashboard data ───────────────────────────────────────────────────────

export interface DashboardData {
  pedidos: (Pedido & { vales: Vale[] })[];
  metrics: {
    totalSolicitados: number;
    totalAprobados: number;
    recaudacionAprobada: number;
    pendientesRevision: number;
  };
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
  const PRECIO_POLLO = 8_000;

  return {
    pedidos,
    metrics: {
      totalSolicitados: pedidos.reduce((s, p) => s + p.cantidad_total, 0),
      totalAprobados: aprobados.reduce((s, p) => s + p.cantidad_total, 0),
      recaudacionAprobada:
        aprobados.reduce((s, p) => s + p.cantidad_total, 0) * PRECIO_POLLO,
      pendientesRevision: pedidos.filter((p) => p.estado_pago === "Pendiente")
        .length,
    },
  };
}
