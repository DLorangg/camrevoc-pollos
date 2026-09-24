import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CoordinacionLoginForm from "@/components/campamento/coordinacion/CoordinacionLoginForm";
import { getCampaSession } from "@/app/campamento/actions/coordinacion-auth";

export const metadata: Metadata = {
  title: "Coordinación · Campamentos 2027 | CamReVoc",
  description: "Acceso exclusivo para coordinadores de etapa.",
  robots: { index: false, follow: false },
};

export default async function CoordinacionLoginPage() {
  const session = await getCampaSession();
  if (session && session.etapaNum) {
    redirect(`/campamento/etapa/${session.etapaNum}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <CoordinacionLoginForm />
    </div>
  );
}
