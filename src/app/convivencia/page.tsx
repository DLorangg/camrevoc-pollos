import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ShieldCheck, Users, Clock } from "lucide-react";
import {
  CONVIVENCIA_CONFIG,
  isInscripcionConvivenciaAbierta,
} from "@/config/convivencia";
import ConvivenciaInscripcionForm from "@/components/convivencia/InscripcionForm";
import {
  ConvivenciaDatosActividad,
  ConvivenciaQueLlevar,
} from "@/components/convivencia/ActividadInfo";

// El cierre depende de la hora actual: evaluar en cada request (no prerenderizar).
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Convivencia Familiar 2026 · CAMREVOC",
  description:
    "Inscribí a tu familia a la Convivencia Familiar CAMREVOC 2026: sábado 17 de octubre de 10:00 a 18:00 en la Planta de Campamentos N.º 1.",
};

export default async function ConvivenciaPage() {
  const abierta = isInscripcionConvivenciaAbierta();

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            title="Volver al inicio"
            className="group flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <Image
              src="/logo.png"
              alt="Logo CamReVoc"
              width={24}
              height={24}
              className="rounded-lg object-contain"
            />
            <span>Volver al inicio</span>
          </Link>
          <Link
            href="/convivencia/admin"
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors hover:text-sky-700"
            title="Acceso exclusivo coordinación"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Coordinación</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-4 pt-8 sm:px-6">
        <section className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-bold text-sky-800 shadow-2xs">
            <Users className="h-3.5 w-3.5" />
            <span>Inscripción por familia</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            {CONVIVENCIA_CONFIG.nombre}
          </h1>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-slate-600 sm:text-base">
            Una jornada para compartir en familia con toda la comunidad de CAMREVOC.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {abierta ? (
              <span>
                Inscripciones abiertas hasta el{" "}
                <strong className="text-slate-700">{CONVIVENCIA_CONFIG.fechaCierreTexto}</strong>
              </span>
            ) : (
              <span className="font-bold text-amber-700">Inscripciones cerradas</span>
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50 sm:p-6">
          <ConvivenciaDatosActividad />
          <hr className="border-slate-100" />
          <ConvivenciaQueLlevar />
        </section>

        <section>
          <ConvivenciaInscripcionForm abierta={abierta} />
        </section>
      </main>

      <footer className="mt-16 space-y-1 text-center text-xs text-slate-400">
        <p>CAMREVOC Neuquén · Casa Salesiana Don Bosco</p>
        <p>Convivencia Familiar 2026</p>
      </footer>
    </div>
  );
}
