import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getVale } from "@/app/actions/vale-actions";
import ValeQR from "@/components/ValeQR";
import ConfirmarEntregaButton from "@/components/ConfirmarEntregaButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ codigo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  return {
    title: `Vale ${codigo} · Camrevoc`,
    robots: { index: false, follow: false },
  };
}

export default async function ValePage({ params }: Props) {
  const { codigo } = await params;
  const vale = await getVale(codigo);

  if (!vale) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const valeUrl = `${appUrl}/vale/${codigo}`;

  const pedidoPendiente =
    vale.pedidos.estado_pago === "Pendiente" || vale.pedidos.estado_pago === "Rechazado";
  const yaEntregado = vale.estado_entrega === "Entregado";

  // ─── Pago pendiente / rechazado ────────────────────────────────────────────

  if (pedidoPendiente) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4 py-12">
        <div className="w-full max-w-sm rounded-3xl border border-amber-200 bg-white p-8 shadow-xl text-center space-y-4">
          <Image src="/logo.png" alt="Camrevoc" width={64} height={64} className="mx-auto rounded-xl" />
          <span className="text-5xl">⏳</span>
          <h1 className="text-xl font-bold text-amber-700">Pago en revisión</h1>
          <p className="text-gray-600 text-sm">
            Este vale todavía no está habilitado para retiro. Tu transferencia está siendo verificada.
          </p>
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Estado del pedido:{" "}
            <strong>
              {vale.pedidos.estado_pago === "Rechazado" ? "⚠️ Rechazado" : "Pendiente"}
            </strong>
          </div>
          <p className="text-xs text-gray-400">Código: <span className="font-mono font-bold">{codigo}</span></p>
        </div>
      </div>
    );
  }

  // ─── Ya canjeado ───────────────────────────────────────────────────────────

  if (yaEntregado) {
    const hora = vale.entregado_at
      ? new Date(vale.entregado_at).toLocaleString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
        })
      : "—";

    return (
      <div className="flex min-h-screen flex-col bg-[#E52427]">
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
          <div className="w-full max-w-sm space-y-6">
            <Image
              src="/logo.png"
              alt="Camrevoc"
              width={72}
              height={72}
              className="mx-auto rounded-2xl opacity-90"
            />
            <div>
              <p className="text-6xl mb-2">⚠️</p>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                VALE YA CANJEADO
              </h1>
            </div>

            <div className="rounded-2xl bg-white/10 px-6 py-5 space-y-2 text-white">
              <p className="text-lg font-bold font-mono tracking-widest">{codigo}</p>
              <p className="text-sm opacity-90">
                <span className="font-semibold">{vale.cantidad_pollos}</span> pollo
                {vale.cantidad_pollos !== 1 ? "s" : ""}
                {vale.destinatario ? ` · ${vale.destinatario}` : ""}
              </p>
              <div className="mt-2 border-t border-white/20 pt-2">
                <p className="text-xs opacity-75">Entregado a las</p>
                <p className="text-2xl font-extrabold">{hora} hs</p>
              </div>
            </div>

            <p className="text-xs text-white/60">
              Si creés que esto es un error, contactá a tu animador/vendedor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vale válido ───────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-[#009B4D]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <Image
            src="/logo.png"
            alt="Camrevoc"
            width={72}
            height={72}
            className="mx-auto rounded-2xl shadow-lg"
          />

          {/* Status */}
          <div>
            <p className="text-5xl mb-1">✅</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              VALE VÁLIDO
            </h1>
          </div>

          {/* Vale details */}
          <div className="rounded-2xl bg-white/15 px-6 py-5 text-white space-y-3">
            <p className="text-4xl font-extrabold">
              {vale.cantidad_pollos}{" "}
              <span className="text-2xl font-bold">
                pollo{vale.cantidad_pollos !== 1 ? "s" : ""}
              </span>
            </p>

            <div className="border-t border-white/20 pt-3 space-y-1 text-sm text-left">
              <p>
                <span className="opacity-70">Retira:</span>{" "}
                <strong className="text-base">{vale.destinatario || vale.pedidos.nombre_comprador}</strong>
              </p>
              <p>
                <span className="opacity-70">Comprador:</span>{" "}
                {vale.pedidos.nombre_comprador}
              </p>
              <p>
                <span className="opacity-70">Etapa:</span>{" "}
                {vale.pedidos.etapa}
              </p>
              <p>
                <span className="opacity-70">Vendedor:</span>{" "}
                {vale.pedidos.animador_vendedor}
              </p>
            </div>

            <p className="font-mono text-sm opacity-75 tracking-widest pt-1">{codigo}</p>
          </div>

          {/* QR */}
          <ValeQR url={valeUrl} />

          {/* Confirm delivery button */}
          <ConfirmarEntregaButton valeId={vale.id} />

          <p className="text-xs text-white/60">
            Solo presionar al entregar físicamente los pollos.
          </p>
        </div>
      </div>
    </div>
  );
}
