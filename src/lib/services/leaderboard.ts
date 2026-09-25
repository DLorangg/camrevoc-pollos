import { PRECIO_POLLO } from "@/config/constants";
import type { Pedido } from "@/types/database";

export interface VendedorLeaderboard {
  posicion: number;
  nombre: string;
  etapa: string;
  pollosAprobados: number;
  pollosPendientes: number;
  pedidosCount: number;
  recaudado: number;
}

export type PedidoForLeaderboard = Pick<
  Pedido,
  "nombre_comprador" | "estado_pago" | "cantidad_total"
> & {
  animador_vendedor?: string | null;
  etapa?: string | null;
  created_at?: string;
};

/**
 * Normaliza la clave de agrupación para un vendedor/animador:
 * - Quita espacios sobrantes al inicio y final (trim).
 * - Convierte a minúsculas (toLowerCase).
 * - Remueve tildes / diacríticos para que "Damián" y "Damian" agrupen juntos.
 * - Colapsa múltiples espacios intermedios.
 */
export function normalizeSellerKey(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Evalúa la calidad de formato de un nombre para elegir la versión más prolija:
 * - Da el puntaje más alto a nombres en Title Case ("Juan Pérez", "Damián").
 * - Da bonus a nombres con tildes correctamente escritas ("Damián" > "Damian").
 * - Penaliza si está todo en mayúsculas ("JUAN PÉREZ") o todo en minúsculas ("juan perez").
 */
export function scoreNameFormat(name: string): number {
  const trimmed = name.trim();
  if (!trimmed) return -10;

  let score = 0;
  const words = trimmed.split(/\s+/).filter(Boolean);

  // Bonus por Title Case en cada palabra
  const isTitleCase =
    words.length > 0 &&
    words.every((w) => /^[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü0-9]*$/.test(w));

  if (isTitleCase) {
    score += 10;
  } else if (/[A-ZÁÉÍÓÚÑÜ]/.test(trimmed)) {
    score += 3;
  }

  // Bonus por conservar tildes correctamente
  if (/[áéíóúÁÉÍÓÚñÑüÜ]/.test(trimmed)) {
    score += 2;
  }

  // Penaliza si está todo en mayúsculas sostenidas
  if (trimmed.length > 3 && trimmed === trimmed.toUpperCase()) {
    score -= 4;
  }

  // Penaliza si está todo en minúsculas
  if (trimmed === trimmed.toLowerCase()) {
    score -= 3;
  }

  return score;
}

/**
 * Da un formato limpio al nombre si vino todo en minúsculas o todo en mayúsculas,
 * preservando tildes y caracteres especiales.
 */
export function formatDisplayName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return "Sin nombre";

  const isAllLower = trimmed === trimmed.toLowerCase();
  const isAllUpper = trimmed === trimmed.toUpperCase();

  if (isAllLower || isAllUpper) {
    return trimmed
      .split(" ")
      .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
  }

  return trimmed;
}

/**
 * Agrupa los pedidos por vendedor normalizado, suma pollos aprobados y pendientes,
 * y conserva la versión visible con mejor formato (la última registrada o con mejor capitalización).
 */
export function calculateVendedorLeaderboard(
  pedidos: PedidoForLeaderboard[],
  precioPollo: number = PRECIO_POLLO,
  limit: number = 10
): VendedorLeaderboard[] {
  const vendedoresMap = new Map<
    string,
    {
      nombre: string;
      bestScore: number;
      lastCreatedAt: string | null;
      etapa: string;
      pollosAprobados: number;
      pollosPendientes: number;
      pedidosCount: number;
    }
  >();

  for (const p of pedidos) {
    const rawNombre = p.animador_vendedor?.trim() || p.nombre_comprador?.trim() || "Sin nombre";
    const key = normalizeSellerKey(rawNombre);
    if (!key) continue;

    const formattedCandidate = formatDisplayName(rawNombre);
    const candidateScore = scoreNameFormat(rawNombre);
    const orderDate = p.created_at || null;

    const existing = vendedoresMap.get(key);

    if (!existing) {
      vendedoresMap.set(key, {
        nombre: formattedCandidate,
        bestScore: candidateScore,
        lastCreatedAt: orderDate,
        etapa: p.etapa?.trim() || "—",
        pollosAprobados: p.estado_pago === "Aprobado" ? p.cantidad_total : 0,
        pollosPendientes: p.estado_pago === "Pendiente" ? p.cantidad_total : 0,
        pedidosCount: p.estado_pago === "Aprobado" ? 1 : 0,
      });
    } else {
      // 1. Decidir nombre visible:
      // - Si el candidato tiene mejor formato (p. ej. mayúsculas o tildes), gana.
      // - Si tienen el mismo formato, gana la fecha más reciente (última registrada).
      const isHigherScore = candidateScore > existing.bestScore;
      const isSameScoreAndNewer =
        candidateScore === existing.bestScore &&
        Boolean(orderDate && existing.lastCreatedAt && new Date(orderDate) > new Date(existing.lastCreatedAt));

      if (isHigherScore || isSameScoreAndNewer) {
        existing.nombre = formattedCandidate;
        existing.bestScore = Math.max(existing.bestScore, candidateScore);
        if (orderDate) {
          existing.lastCreatedAt = orderDate;
        }
      }

      // 2. Sumar cantidades de pollos compartiendo la clave normalizada
      if (p.estado_pago === "Aprobado") {
        existing.pollosAprobados += p.cantidad_total;
        existing.pedidosCount += 1;
      } else if (p.estado_pago === "Pendiente") {
        existing.pollosPendientes += p.cantidad_total;
      }

      // 3. Etapa: si no tenía asignada y este pedido sí tiene, actualizarla
      if (p.etapa?.trim() && (!existing.etapa || existing.etapa === "—")) {
        existing.etapa = p.etapa.trim();
      }
    }
  }

  return Array.from(vendedoresMap.values())
    .filter((v) => v.pollosAprobados > 0 || v.pollosPendientes > 0)
    .sort((a, b) => b.pollosAprobados - a.pollosAprobados || b.pollosPendientes - a.pollosPendientes)
    .slice(0, limit)
    .map((v, idx) => ({
      posicion: idx + 1,
      nombre: v.nombre,
      etapa: v.etapa,
      pollosAprobados: v.pollosAprobados,
      pollosPendientes: v.pollosPendientes,
      pedidosCount: v.pedidosCount,
      recaudado: v.pollosAprobados * precioPollo,
    }));
}
