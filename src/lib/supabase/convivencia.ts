import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con Service Role para el módulo Convivencia Familiar.
 * Opera sobre el proyecto principal `camrevoc-pollos`, con tablas propias
 * (`convivencia_*`).
 *
 * ⚠️ SOLO para uso en Server Actions o Server Components.
 *    Nunca importar este cliente desde un Client Component.
 */
export function createConvivenciaClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
