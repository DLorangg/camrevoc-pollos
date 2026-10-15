import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminGeneralLoginForm from "@/components/campamento/admin-general/AdminGeneralLoginForm";
import { verificarAdminGeneralSession } from "@/app/campamento/actions/admin-general-auth";

export const metadata: Metadata = {
  title: "Administración General · Campamentos 2027 | CamReVoc",
  description: "Acceso exclusivo para tesorería y coordinación general de Campamentos 2027.",
  robots: { index: false, follow: false },
};

export default async function AdminGeneralLoginPage() {
  const isAuth = await verificarAdminGeneralSession();
  if (isAuth) {
    redirect("/campamento/admin-general");
  }

  return <AdminGeneralLoginForm />;
}
