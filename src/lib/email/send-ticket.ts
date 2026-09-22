import type { Resend } from "resend";
import type { ValeCreado } from "@/app/actions/create-order";

export interface SendTicketParams {
  to: string;
  nombreComprador: string;
  cantidadTotal: number;
  etapa: string;
  animadorVendedor: string;
  vales: ValeCreado[];
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const FECHA_ENTREGA = "Sábado 11 de Octubre de 2025";

function buildHtml(params: SendTicketParams): string {
  const { nombreComprador, cantidadTotal, etapa, animadorVendedor, vales } = params;

  const valesHtml = vales
    .map(
      (v) => `
    <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin-bottom:12px;">
      <p style="margin:0 0 4px 0;font-size:22px;font-weight:700;letter-spacing:2px;color:#15803d;font-family:monospace;">${v.codigo}</p>
      <p style="margin:0;color:#374151;font-size:15px;">
        <strong>${v.cantidad_pollos}</strong> pollo${v.cantidad_pollos !== 1 ? "s" : ""}
        ${v.destinatario ? `· Retira: <strong>${v.destinatario}</strong>` : ""}
      </p>
      <a href="${APP_URL}/vale/${v.codigo}"
         style="display:inline-block;margin-top:10px;background:#009B4D;color:#fff;text-decoration:none;padding:8px 18px;border-radius:8px;font-size:14px;font-weight:600;">
        Ver vale →
      </a>
    </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tus vales de pollos</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#2E3192;padding:28px 32px;text-align:center;">
          <p style="margin:0;font-size:24px;font-weight:700;color:#fff;">🐔 Camrevoc</p>
          <p style="margin:4px 0 0 0;font-size:13px;color:#c7d2fe;">Casa Salesiana Don Bosco Neuquén</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px;">
          <h1 style="font-size:22px;color:#111827;margin:0 0 8px 0;">¡Tus vales están confirmados! ✅</h1>
          <p style="color:#6b7280;margin:0 0 24px 0;font-size:15px;">
            Hola <strong>${nombreComprador}</strong>, tu pago fue aprobado. A continuación encontrás tus vales para retirar los pollos.
          </p>

          <!-- Resumen -->
          <div style="background:#eff6ff;border-radius:10px;padding:16px;margin-bottom:24px;font-size:14px;color:#1e40af;">
            <table width="100%" cellpadding="4">
              <tr><td><strong>Cantidad:</strong></td><td>${cantidadTotal} pollo${cantidadTotal !== 1 ? "s" : ""}</td></tr>
              <tr><td><strong>Etapa:</strong></td><td>${etapa}</td></tr>
              <tr><td><strong>Vendedor/Animador:</strong></td><td>${animadorVendedor}</td></tr>
              <tr><td><strong>Fecha de entrega:</strong></td><td>${FECHA_ENTREGA}</td></tr>
            </table>
          </div>

          <!-- Vales -->
          <h2 style="font-size:16px;color:#374151;margin:0 0 12px 0;">Tus vales</h2>
          ${valesHtml}

          <p style="color:#9ca3af;font-size:13px;margin-top:24px;">
            Presentá el código QR de cada vale en el puesto de retiro. ¡Gracias por participar!
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Casa Salesiana Don Bosco · Neuquén · Camrevoc</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendTicketEmail(
  resend: InstanceType<typeof Resend>,
  params: SendTicketParams,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: "Camrevoc - Don Bosco <onboarding@resend.dev>",
      to: params.to,
      subject: "¡Tus vales de pollos están confirmados! - Camrevoc",
      html: buildHtml(params),
    });

    if (error) {
      console.error("[sendTicketEmail] Resend error:", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("[sendTicketEmail] Exception:", msg);
    return { ok: false, error: msg };
  }
}
