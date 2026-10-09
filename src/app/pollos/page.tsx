import Image from "next/image";
import Link from "next/link";
import OrderForm from "@/components/OrderForm";
import HowItWorksModal from "@/components/HowItWorksModal";
import { ChevronLeft } from "lucide-react";
import { isVentaPollosCerrada } from "@/config/constants";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const isCerrada = isVentaPollosCerrada();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      {/* Botón Volver al inicio */}
      <div className="mx-auto mb-6 max-w-xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-amber-800 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Header */}
      <header className="mx-auto mb-8 max-w-xl text-center">
        {/* Logos emparejados armónicamente */}
        <div className="mb-6 flex items-center justify-center gap-3 sm:gap-5">
          <Link
            href="/"
            title="Volver al inicio"
            className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs transition-transform hover:scale-105"
          >
            <Image
              src="/logo.png"
              alt="Logo CamReVoc · Casa Salesiana Don Bosco Neuquén"
              width={64}
              height={64}
              className="h-14 w-14 object-contain rounded-xl sm:h-16 sm:w-16"
              priority
            />
          </Link>

          <div className="h-10 w-px bg-slate-200" aria-hidden="true" />

          <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xs">
            <Image
              src="/salesianos.png"
              alt="Logo Salesianos Don Bosco · Casa Don Bosco Neuquén"
              width={64}
              height={64}
              className="h-14 w-14 object-contain rounded-xl sm:h-16 sm:w-16"
              priority
            />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Gran Pollada 🍗
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Casa Salesiana Don Bosco Neuquén ·{" "}
          <strong className="font-semibold text-slate-900">CamReVoc</strong>
        </p>

        {/* Botón de instrucciones (solo visible mientras la venta esté activa) */}
        {!isCerrada && (
          <div className="mt-5 flex justify-center">
            <HowItWorksModal />
          </div>
        )}
      </header>

      {/* Main Card */}
      <main className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-xl shadow-slate-200/50 sm:px-8 sm:py-8">
        {isCerrada ? (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 shadow-xs">
              <span className="text-3xl">🍗</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                ¡La venta de pollos ha finalizado!
              </h2>
              <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
                Gracias a todos por participar de la Gran Pollada de CAMREVOC.
              </p>
            </div>
            <div className="pt-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-xs transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Volver al inicio</span>
              </Link>
            </div>
          </div>
        ) : (
          <OrderForm />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-10 pb-8 text-center space-y-2">
        <p className="text-xs text-slate-500">
          Cualquier consulta por WhatsApp con el coordinador de tu etapa.
        </p>
        <p className="text-xs text-slate-400">
          Diseñado con ❤️ por Dami Lorang
        </p>
      </footer>
    </div>
  );
}
