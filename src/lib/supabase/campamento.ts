import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para el proyecto de Campamentos.
 *
 * ⚠️  SOLO para uso en Server Actions / Route Handlers del servidor.
 *     Usa la service_role key, por lo que elude RLS.
 *
 * Se conecta al proyecto Supabase **separado** del de pollos, usando
 * las variables de entorno:
 *   NEXT_PUBLIC_CAMPAMENTO_SUPABASE_URL
 *   CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY
 */
export function createCampamentoClient() {
  const url = process.env.NEXT_PUBLIC_CAMPAMENTO_SUPABASE_URL;
  const key = process.env.CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_CAMPAMENTO_SUPABASE_URL o " +
        "CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY. Verificá tu archivo .env.local.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
