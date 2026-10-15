import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verificarAdminGeneralSession } from "@/app/campamento/actions/admin-general-auth";
import { obtenerDatosAdminGeneral } from "@/app/campamento/actions/admin-general-actions";
import AdminGeneralDashboard from "@/components/campamento/admin-general/AdminGeneralDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administración General · Campamentos 2027 | CamReVoc",
  description:
    "Panel general de consulta consolidada y exportación contable para Campamentos 2027 (Junín y Regina).",
  robots: { index: false, follow: false },
};

export default async function AdminGeneralPage() {
  const isAuth = await verificarAdminGeneralSession();
  if (!isAuth) {
    redirect("/campamento/admin-general/login");
  }

  const { ok, inscriptos, metricas, error } = await obtenerDatosAdminGeneral();

  if (!ok || !inscriptos || !metricas) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md space-y-3 rounded-3xl border border-rose-200 bg-white p-6 text-center shadow-lg">
          <h2 className="text-lg font-bold text-rose-900">
            Error al cargar el panel general
          </h2>
          <p className="text-xs text-slate-600">
            {error || "No se pudieron obtener los datos de Campamentos."}
          </p>
        </div>
      </div>
    );
  }

  return <AdminGeneralDashboard inscriptos={inscriptos} metricas={metricas} />;
}
