import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con Service Role para el módulo de Buzos 2027.
 *
 * ⚠️ SOLO para uso en Server Actions o Route Handlers del servidor.
 *    Nunca importar este cliente desde un Client Component.
 */
export function createBuzosClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Verificá tu archivo .env.local."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
