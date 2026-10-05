import Image from "next/image";
import Link from "next/link";
import OrderForm from "@/components/OrderForm";
import HowItWorksModal from "@/components/HowItWorksModal";
import { ChevronLeft } from "lucide-react";

export default function HomePage() {
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

        {/* Botón de instrucciones */}
        <div className="mt-5 flex justify-center">
          <HowItWorksModal />
        </div>
      </header>

      {/* Main Card */}
      <main className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-4 py-6 shadow-xl shadow-slate-200/50 sm:px-8 sm:py-8">
        <OrderForm />
      </main>

      {/* Footer */}
      <footer className="mt-10 pb-8 text-center space-y-2">
        <p className="text-xs text-slate-500">
          Cualquier consulta por WhatsApp con el coordinador de tu etapa .
        </p>
        <p className="text-xs text-slate-400">
          Diseñado con ❤️ por Dami Lorang
        </p>
      </footer>
    </div>
  );
}
