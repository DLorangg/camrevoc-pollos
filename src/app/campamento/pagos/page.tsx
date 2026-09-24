import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FamiliaPagosForm from "@/components/campamento/pagos/FamiliaPagosForm";

export const metadata: Metadata = {
  title: "Informar Pago · Campamento de Verano 2027 | CamReVoc",
  description:
    "Portal de autogestión para que las familias informen sus transferencias y comprobantes de pago de los Campamentos 2027.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function FamiliaPagosPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      {/* Botón Volver */}
      <div className="mx-auto max-w-xl mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-800 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Volver al inicio</span>
        </Link>
      </div>

      {/* Header */}
      <header className="mx-auto mb-8 max-w-xl text-center">
        {/* Logos */}
        <div className="mb-5 flex items-center justify-center gap-3 sm:gap-5">
          <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs">
            <Image
              src="/logo.png"
              alt="Logo CamReVoc · Casa Salesiana Don Bosco Neuquén"
              width={60}
              height={60}
              className="h-12 w-12 object-contain rounded-xl sm:h-14 sm:w-14"
              priority
            />
          </div>

          <div className="h-9 w-px bg-slate-200" aria-hidden="true" />

          <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs">
            <Image
              src="/salesianos.png"
              alt="Logo Salesianos Don Bosco · Casa Don Bosco Neuquén"
              width={60}
              height={60}
              className="h-12 w-12 object-contain rounded-xl sm:h-14 sm:w-14"
              priority
            />
          </div>
        </div>

        <span className="inline-block rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
          Autogestión de Pagos
        </span>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
          Informar Pago de Campamento 📄
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
          Casa Salesiana Don Bosco Neuquén · CamReVoc 2027
        </p>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-xl">
        <FamiliaPagosForm />
      </main>

      {/* Footer */}
      <footer className="mt-12 pb-8 text-center space-y-1.5 text-xs text-slate-400">
        <p>Casa Salesiana Don Bosco Neuquén · CamReVoc</p>
        <p>Diseñado con ❤️ por Dami Lorang</p>
      </footer>
    </div>
  );
}
