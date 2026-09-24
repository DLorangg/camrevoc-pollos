import Image from "next/image";
import Link from "next/link";
import { Drumstick, Tent, ArrowRight, ReceiptText } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="px-4 pt-12 pb-6 text-center">
        <div className="mx-auto mb-6 flex items-center justify-center gap-3 sm:gap-5">
          <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs">
            <Image
              src="/logo.png"
              alt="Logo CamReVoc · Casa Salesiana Don Bosco Neuquén"
              width={72}
              height={72}
              className="h-16 w-16 object-contain rounded-xl sm:h-20 sm:w-20"
              priority
            />
          </div>

          <div className="h-12 w-px bg-slate-200" aria-hidden="true" />

          <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs">
            <Image
              src="/salesianos.png"
              alt="Logo Salesianos Don Bosco · Casa Don Bosco Neuquén"
              width={72}
              height={72}
              className="h-16 w-16 object-contain rounded-xl sm:h-20 sm:w-20"
              priority
            />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          CamReVoc
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Casa Salesiana Don Bosco · Neuquén
        </p>
      </header>

      {/* Cards */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-4 sm:space-y-5">
        {/* Gran Pollada */}
        <Link
          href="/pollos"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:border-amber-300 hover:shadow-amber-100/50 sm:p-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-200 sm:h-16 sm:w-16">
            <Drumstick className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Gran pollada 🍗
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Reservá tus pollos para la gran pollada.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-600" />
        </Link>

        {/* Campamentos 2027 */}
        <Link
          href="/campamento/inscripcion"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:border-emerald-300 hover:shadow-emerald-100/50 sm:p-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200 sm:h-16 sm:w-16">
            <Tent className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Campamentos 2027 ⛺
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Inscribite al Campamento de Verano — Junín & Regina, Enero 2027.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
        </Link>

        {/* Informar Pago de Campamento */}
        <Link
          href="/campamento/pagos"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4.5 shadow-md shadow-slate-200/40 transition-all hover:border-sky-300 hover:shadow-sky-100/40 sm:p-5"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 transition-colors group-hover:bg-sky-200 sm:h-14 sm:w-14">
            <ReceiptText className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Informar Pago de Campamento 📄
            </h2>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
              Subí tu comprobante de transferencia y consultá tu saldo.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-sky-600" />
        </Link>

        {/* Portal Coordinación Campamentos */}
        <div className="pt-2 text-center">
          <Link
            href="/campamento/coordinacion"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
          >
            <span>🔐 Portal de Coordinación por Etapa</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 pt-4 text-center space-y-1.5">
        <p className="text-xs text-slate-500">
          Casa Salesiana Don Bosco Neuquén · CamReVoc
        </p>
        <p className="text-xs text-slate-400">Diseñado con ❤️ por Dami Lorang</p>
      </footer>
    </div>
  );
}
