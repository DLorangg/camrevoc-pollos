import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCampaSession } from "@/app/campamento/actions/coordinacion-auth";
import { getInscriptosEtapa } from "@/app/campamento/actions/coordinacion-pagos";
import { normalizarEtapa, COORDINADORES_POR_ETAPA } from "@/config/campamento-coordinadores";
import EtapaDashboard from "@/components/campamento/coordinacion/EtapaDashboard";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ etapa: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { etapa } = await params;
  const num = normalizarEtapa(etapa);
  const cfg = num ? COORDINADORES_POR_ETAPA[num] : null;

  return {
    title: `Coordinación ${cfg?.nombreEtapa || etapa} · Campamentos 2027 | CamReVoc`,
    robots: { index: false, follow: false },
  };
}

export default async function EtapaPage({ params }: Props) {
  const { etapa } = await params;
  const etapaNum = normalizarEtapa(etapa);

  if (!etapaNum) {
    redirect("/campamento/coordinacion");
  }

  // Validar sesión
  const session = await getCampaSession();
  if (!session) {
    redirect("/campamento/coordinacion");
  }

  // Si la sesión no coincide con la etapa solicitada, redirigir a la etapa de su sesión
  if (session.etapaNum !== etapaNum) {
    redirect(`/campamento/etapa/${session.etapaNum}`);
  }

  const { inscriptos, metricas, etapaConfig, ok, error } = await getInscriptosEtapa(etapaNum);

  if (!ok || !etapaConfig) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="text-lg font-bold">Error al cargar la etapa</h2>
          <p className="mt-1 text-sm">{error || "No se pudieron obtener los datos."}</p>
        </div>
      </div>
    );
  }

  return (
    <EtapaDashboard
      inscriptos={inscriptos}
      metricas={metricas}
      etapaConfig={etapaConfig}
      coordinadorActual={session.coordinador}
    />
  );
}
