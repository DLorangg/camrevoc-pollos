import Image from "next/image";
import OrderForm from "@/components/OrderForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="mx-auto mb-8 max-w-xl text-center">
        <div className="mb-5 flex justify-center">
          <Image
            src="/logo.png"
            alt="Logo Camrevoc · Casa Salesiana Don Bosco Neuquén"
            width={88}
            height={88}
            className="rounded-2xl shadow-md"
            priority
          />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Pollada Solidaria 🐔
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Casa Salesiana Don Bosco Neuquén ·{" "}
          <strong className="font-semibold text-slate-900">Camrevoc</strong>
        </p>
      </header>

      {/* Main Card */}
      <main className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-xl shadow-slate-200/50 sm:px-8">
        <OrderForm />
      </main>

      {/* Footer */}
      <footer className="mt-10 pb-8 text-center space-y-2">
        <p className="text-xs text-slate-500">
          Cualquier consulta por WhatsApp con tu animador/vendedor.
        </p>
        <p className="text-xs text-slate-400">
          Diseñado con ❤️ por Dami Lorang
        </p>
      </footer>
    </div>
  );
}
