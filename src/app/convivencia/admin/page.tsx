import { redirect } from "next/navigation";
import {
  verificarConvivenciaAdminSession,
  obtenerInscripcionesConvivencia,
} from "@/app/convivencia/actions/admin-actions";
import ConvivenciaAdminDashboard from "@/components/convivencia/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administración Convivencia Familiar · CAMREVOC",
  description: "Inscripciones de la Convivencia Familiar 2026 (uso exclusivo de coordinación).",
  robots: { index: false, follow: false },
};

export default async function ConvivenciaAdminPage() {
  const isAuth = await verificarConvivenciaAdminSession();
  if (!isAuth) {
    redirect("/convivencia/admin/login");
  }

  const { ok, inscripciones, error } = await obtenerInscripcionesConvivencia();

  if (!ok || !inscripciones) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-3 rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-lg">
          <h2 className="text-lg font-bold text-rose-900">Error al cargar inscripciones</h2>
          <p className="text-xs text-slate-600">{error || "No se pudieron obtener los datos."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <main className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <ConvivenciaAdminDashboard inscripciones={inscripciones} />
      </main>
    </div>
  );
}
