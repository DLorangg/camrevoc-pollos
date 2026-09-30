import Image from "next/image";
import Link from "next/link";
import {
  Drumstick,
  ArrowRight,
  ExternalLink,
  Tent,
  ReceiptText,
  Brain,
  Shirt,
  Clock,
} from "lucide-react";

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
          CAMREVOC Neuquén
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Casa Salesiana Don Bosco · Portal Digital
        </p>
      </header>

      {/* Cards */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 space-y-4 sm:space-y-5">
        {/* 1. Campamentos 2027 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:border-emerald-300 hover:shadow-emerald-100/50 sm:p-6">
          <Link
            href="/campamento/inscripcion"
            className="group flex items-center gap-4"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200 sm:h-16 sm:w-16">
              <Tent className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-emerald-700 sm:text-xl">
                Campamentos 2027 ⛺
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Inscripciones y consulta de pagos para Junín & Regina.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
          </Link>

          {/* Acciones principales */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
            <Link
              href="/campamento/inscripcion"
              className="group/btn flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-center text-xs font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 sm:text-sm"
            >
              <span>Inscribirme</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
            <Link
              href="/campamento/pagos"
              className="group/btn flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 sm:text-sm"
            >
              <ReceiptText className="h-3.5 w-3.5 text-slate-500 transition-colors group-hover/btn:text-slate-700" />
              <span>Ver mis pagos</span>
            </Link>
          </div>

          {/* Acceso para coordinadores */}
          <div className="mt-2.5 text-center">
            <Link
              href="/campamento/coordinacion"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-emerald-700 transition-colors"
            >
              <span>🔐 Portal de Coordinación por Etapa</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* 2. Gran Pollada */}
        <Link
          href="/pollos"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:border-amber-300 hover:shadow-amber-100/50 sm:p-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-200 sm:h-16 sm:w-16">
            <Drumstick className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Gran Pollada 🍗
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Reservá tus pollos para la gran pollada.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-600" />
        </Link>

        {/* 3. CamReQuiz — Recurso externo */}
        <a
          href="https://camrequiz.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 transition-all hover:border-indigo-300 hover:shadow-indigo-100/50 sm:p-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 transition-colors group-hover:bg-indigo-200 sm:h-16 sm:w-16">
            <Brain className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              CamReQuiz 🧠
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              El juego de preguntas de CAMREVOC.
            </p>
          </div>
          <ExternalLink className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-600" />
        </a>

        {/* Buzos 2027 — Próximamente */}
        <div
          aria-disabled="true"
          title="Próximamente disponible"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 opacity-60 shadow-xs select-none sm:p-6"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-16 sm:w-16">
            <Shirt className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-700 sm:text-xl">
                Buzos 2027 🧥
              </h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                Próximamente
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              Pedidos y diseño para animadores.
            </p>
          </div>
          <Clock className="h-5 w-5 shrink-0 text-slate-400" />
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-8 pt-4 text-center space-y-1.5">
        <p className="text-xs text-slate-500">
          CAMREVOC Neuquén · Casa Salesiana Don Bosco
        </p>
        <p className="text-xs text-slate-400">Diseñado con ❤️ por Dami Lorang</p>
      </footer>
    </div>
  );
}
