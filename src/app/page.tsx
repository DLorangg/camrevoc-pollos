import Image from "next/image";
import OrderForm from "@/components/OrderForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2E3192] to-[#1a1d5e] px-4 py-10 sm:px-6">
      {/* Header */}
      <header className="mx-auto mb-8 max-w-xl text-center">
        <div className="mb-4 flex justify-center">
          <Image
            src="/logo.png"
            alt="Logo Camrevoc · Casa Salesiana Don Bosco Neuquén"
            width={96}
            height={96}
            className="rounded-2xl shadow-lg"
            priority
          />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Venta de Pollos 🐔
        </h1>
        <p className="mt-2 text-blue-200">
          Casa Salesiana Don Bosco Neuquén ·{" "}
          <strong className="text-white">Camrevoc</strong>
        </p>
      </header>

      {/* Card */}
      <main className="mx-auto max-w-xl rounded-3xl bg-white px-6 py-8 shadow-2xl sm:px-8">
        <OrderForm />
      </main>

      <footer className="mt-8 text-center text-xs text-blue-300">
        Cualquier consulta por WhatsApp con tu animador/vendedor.
      </footer>
    </div>
  );
}
