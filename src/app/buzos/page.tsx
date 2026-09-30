import Image from "next/image";
import Link from "next/link";
import { BUZOS_CONFIG, isVotacionAbierta } from "@/config/buzos";
import VotacionWizard from "@/components/buzos/VotacionWizard";
import { ChevronLeft, Shirt, Clock, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Votación Buzos 2027 · CAMREVOC",
  description:
    "Elegimos entre todos el diseño oficial para los Buzos 2027 de animadores y coordinadores de CAMREVOC.",
};

export default async function BuzosPage() {
  const abierta = isVotacionAbierta();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Barra de navegación superior */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Volver al inicio</span>
          </Link>

          <Link
            href="/buzos/admin"
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-purple-700 transition-colors"
            title="Acceso exclusivo administración"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Administración</span>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 space-y-8">
        {/* Cabecera Institucional */}
        <section className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-bold text-purple-800 shadow-2xs">
            <Shirt className="h-3.5 w-3.5" />
            <span>Animadores y Coordinadores</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            BUZOS 2027
          </h1>

          <p className="text-base sm:text-lg font-semibold text-purple-900 max-w-lg mx-auto leading-snug">
            Elegimos entre todos el diseño que vamos a usar este año.
          </p>

          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            El resultado de esta votación define un <strong>único diseño</strong> para todos los animadores y coordinadores.
          </p>

          <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {abierta ? (
                <>
                  Votación abierta hasta el{" "}
                  <strong className="text-slate-700">{BUZOS_CONFIG.fechaCierreTexto}</strong>
                </>
              ) : (
                <span className="font-bold text-amber-700">Votación cerrada</span>
              )}
            </span>
          </div>
        </section>

        {/* Wizard de Votación */}
        <VotacionWizard
          votacionAbierta={abierta}
          fechaCierreTexto={BUZOS_CONFIG.fechaCierreTexto}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 text-center text-xs text-slate-400 space-y-1">
        <p>CAMREVOC Neuquén · Casa Salesiana Don Bosco</p>
        <p>Buzos 2027</p>
      </footer>
    </div>
  );
}
