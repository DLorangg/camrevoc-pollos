import { redirect } from "next/navigation";
import {
  verificarBuzosAdminSession,
  obtenerResultadosAdmin,
} from "@/app/buzos/actions/admin-actions";
import AdminDashboard from "@/components/buzos/AdminDashboard";

export const metadata = {
  title: "Administración Buzos 2027 · CAMREVOC",
  description: "Cómputo oficial de la votación de buzos para animadores y coordinadores.",
};

export default async function BuzosAdminPage() {
  const isAuth = await verificarBuzosAdminSession();
  if (!isAuth) {
    redirect("/buzos/admin/login");
  }

  const { ok, resultados, error } = await obtenerResultadosAdmin();

  if (!ok || !resultados) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-3xl border border-rose-200 bg-white p-6 text-center space-y-3 shadow-lg">
          <h2 className="text-lg font-bold text-rose-900">Error al cargar resultados</h2>
          <p className="text-xs text-slate-600">{error || "No se pudieron obtener los datos."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <AdminDashboard resultados={resultados} />
      </main>
    </div>
  );
}
