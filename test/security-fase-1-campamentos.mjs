import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { registerHooks } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

console.log("==========================================================================");
console.log("SUITE DE PRUEBAS DE SEGURIDAD — FASE 1 + 1.1: CONTENCIÓN CAMPAMENTOS");
console.log("==========================================================================\n");

const projectRoot = process.cwd();

// ─── Estado en memoria para mocks de Next.js y Supabase (0 acceso a datos reales) ───
const cookieStore = new Map();
const revalidatedPaths = [];

const mockCookieJar = {
  get(name) {
    if (!cookieStore.has(name)) return undefined;
    return { name, value: cookieStore.get(name) };
  },
  set(name, value, options) {
    if (options && options.maxAge === 0) {
      cookieStore.delete(name);
      return;
    }
    cookieStore.set(name, value);
  },
  delete(name) {
    cookieStore.delete(name);
  },
};

function createInitialMockDbState() {
  return {
    clientCalls: 0,
    storageUploadCalls: 0,
    simulateStorageError: false,
    simulateDbErrorMessage: null, // Si se define, falla la siguiente mutación con este mensaje interno
    simulateConcurrentDeleteOnUpdate: false, // Si es true, el UPDATE devuelve 0 filas modificadas
    etapas_pines: [
      { etapa: "1", pin: "pin-seguro-etapa-1", es_default: false },
      { etapa: "2", pin: "pin-seguro-etapa-2", es_default: false },
    ],
    coordinadores_etapa: [
      { etapa: "1", nombre: "Coord Etapa Uno" },
      { etapa: "2", nombre: "Coord Etapa Dos" },
    ],
    inscriptos: [
      {
        id: "ins-etapa-1",
        nombre: "Participante",
        apellido: "EtapaUno",
        dni: "40000001",
        destino: "Junín",
        etapa: "1ra Etapa",
        rol: "Acampante",
        tarifa: 550000,
        dificultad_pago: false,
        regimen_alimentario: "Omnívoro",
        detalle_alimentario: null,
        quiere_aportar: false,
        contacto_donacion: null,
        created_at: "2026-10-01T12:00:00.000Z",
      },
      {
        id: "ins-etapa-2",
        nombre: "Participante",
        apellido: "EtapaDos",
        dni: "40000002",
        destino: "Junín",
        etapa: "2da Etapa",
        rol: "Acampante",
        tarifa: 550000,
        dificultad_pago: false,
        regimen_alimentario: "Omnívoro",
        detalle_alimentario: null,
        quiere_aportar: false,
        contacto_donacion: null,
        created_at: "2026-10-01T12:00:00.000Z",
      },
      {
        id: "ins-etapa-corrupta",
        nombre: "Participante",
        apellido: "EtapaInvalida",
        dni: "40000099",
        destino: "Junín",
        etapa: "12", // Valor corrupto que empieza con "1" pero no es una etapa válida
        rol: "Acampante",
        tarifa: 550000,
        dificultad_pago: false,
        regimen_alimentario: "Omnívoro",
        detalle_alimentario: null,
        quiere_aportar: false,
        contacto_donacion: null,
        created_at: "2026-10-01T12:00:00.000Z",
      },
    ],
    pagos: [
      {
        id: "pago-etapa-1",
        inscripto_id: "ins-etapa-1",
        monto: 100000,
        comprobante_url: "https://mock.supabase.co/storage/v1/object/public/comprobantes-campa/1.jpg",
        observaciones: "Cuota 1",
        registrado_por: "Familia",
        created_at: "2026-10-05T12:00:00.000Z",
        estado: "PENDIENTE",
        subido_por: "FAMILIA",
        motivo_rechazo: null,
        verificado_por: null,
        verificado_at: null,
        contacto_telefono: "2990000001",
        es_efectivo: false,
        recibido_por: null,
      },
      {
        id: "pago-etapa-2",
        inscripto_id: "ins-etapa-2",
        monto: 150000,
        comprobante_url: "https://mock.supabase.co/storage/v1/object/public/comprobantes-campa/2.jpg",
        observaciones: "Cuota 1 Etapa 2",
        registrado_por: "Familia",
        created_at: "2026-10-05T12:00:00.000Z",
        estado: "PENDIENTE",
        subido_por: "FAMILIA",
        motivo_rechazo: null,
        verificado_por: null,
        verificado_at: null,
        contacto_telefono: "2990000002",
        es_efectivo: false,
        recibido_por: null,
      },
      {
        id: "pago-huerfano",
        inscripto_id: "ins-inexistente",
        monto: 50000,
        comprobante_url: null,
        observaciones: "Registro inconsistente",
        registrado_por: "Familia",
        created_at: "2026-10-05T12:00:00.000Z",
        estado: "PENDIENTE",
        subido_por: "FAMILIA",
        motivo_rechazo: null,
        verificado_por: null,
        verificado_at: null,
        contacto_telefono: null,
        es_efectivo: false,
        recibido_por: null,
      },
      {
        id: "pago-etapa-corrupta",
        inscripto_id: "ins-etapa-corrupta",
        monto: 80000,
        comprobante_url: null,
        observaciones: "Pago de etapa inválida",
        registrado_por: "Familia",
        created_at: "2026-10-05T12:00:00.000Z",
        estado: "PENDIENTE",
        subido_por: "FAMILIA",
        motivo_rechazo: null,
        verificado_por: null,
        verificado_at: null,
        contacto_telefono: null,
        es_efectivo: false,
        recibido_por: null,
      },
    ],
  };
}

let mockDb = createInitialMockDbState();

function createMockQueryBuilder(tableName) {
  const filters = [];
  let pendingUpdate = null;

  const applyFilters = (rows) =>
    rows.filter((row) =>
      filters.every((fn) => fn(row)),
    );

  const builder = {
    select() {
      return builder;
    },
    eq(col, val) {
      filters.push((row) => row[col] === val);
      return builder;
    },
    ilike(col, pattern) {
      const prefix = String(pattern).replace(/%$/, "").toLowerCase();
      filters.push((row) => String(row[col] || "").toLowerCase().startsWith(prefix));
      return builder;
    },
    in(col, values) {
      const set = new Set(values);
      filters.push((row) => set.has(row[col]));
      return builder;
    },
    order() {
      return builder;
    },
    async maybeSingle() {
      if (pendingUpdate) {
        if (mockDb.simulateDbErrorMessage) {
          return { data: null, error: { message: mockDb.simulateDbErrorMessage } };
        }
        if (mockDb.simulateConcurrentDeleteOnUpdate) {
          return { data: null, error: null };
        }
        const matched = applyFilters(mockDb[tableName] || []);
        if (!matched[0]) {
          return { data: null, error: null };
        }
        for (const row of matched) {
          Object.assign(row, pendingUpdate);
        }
        return { data: { ...matched[0] }, error: null };
      }

      const matched = applyFilters(mockDb[tableName] || []);
      return { data: matched[0] ? { ...matched[0] } : null, error: null };
    },
    async single() {
      const matched = applyFilters(mockDb[tableName] || []);
      if (!matched[0]) {
        return { data: null, error: { message: "No rows found" } };
      }
      return { data: { ...matched[0] }, error: null };
    },
    async insert(payload) {
      if (mockDb.simulateDbErrorMessage) {
        return { data: null, error: { message: mockDb.simulateDbErrorMessage } };
      }
      const items = Array.isArray(payload) ? payload : [payload];
      for (const item of items) {
        const record = { id: item.id || `mock-${Date.now()}-${Math.random()}`, ...item };
        mockDb[tableName].push(record);
      }
      return { data: items, error: null };
    },
    async upsert(payload) {
      if (mockDb.simulateDbErrorMessage) {
        return { data: null, error: { message: mockDb.simulateDbErrorMessage } };
      }
      const items = Array.isArray(payload) ? payload : [payload];
      for (const item of items) {
        mockDb[tableName].push({ ...item });
      }
      return { data: items, error: null };
    },
    update(patch) {
      pendingUpdate = patch;
      return builder;
    },
    then(resolve, reject) {
      try {
        if (pendingUpdate) {
          if (mockDb.simulateDbErrorMessage) {
            return Promise.resolve({
              data: null,
              error: { message: mockDb.simulateDbErrorMessage },
            }).then(resolve, reject);
          }
          if (mockDb.simulateConcurrentDeleteOnUpdate) {
            return Promise.resolve({ data: [], error: null }).then(resolve, reject);
          }
          const matched = applyFilters(mockDb[tableName] || []);
          for (const row of matched) {
            Object.assign(row, pendingUpdate);
          }
          return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
        }
        const matched = applyFilters(mockDb[tableName] || []).map((r) => ({ ...r }));
        return Promise.resolve({ data: matched, error: null }).then(resolve, reject);
      } catch (err) {
        return Promise.reject(err).then(resolve, reject);
      }
    },
  };

  return builder;
}

function createMockSupabaseClient() {
  mockDb.clientCalls += 1;
  return {
    from(tableName) {
      return createMockQueryBuilder(tableName);
    },
    storage: {
      from() {
        return {
          async upload(filePath) {
            mockDb.storageUploadCalls += 1;
            if (mockDb.simulateStorageError) {
              return { data: null, error: { message: "INTERNAL_STORAGE_BUCKET_FAILURE_SECRET" } };
            }
            return { data: { path: filePath }, error: null };
          },
          getPublicUrl(filePath) {
            return {
              data: {
                publicUrl: `https://mock.supabase.co/storage/v1/object/public/comprobantes-campa/${filePath}`,
              },
            };
          },
        };
      },
    },
  };
}

globalThis.__MOCK_COOKIES__ = () => Promise.resolve(mockCookieJar);
globalThis.__MOCK_REVALIDATE_PATH__ = (p) => revalidatedPaths.push(p);
globalThis.__MOCK_CREATE_CAMPAMENTO_CLIENT__ = createMockSupabaseClient;

// ─── Registrar hooks de resolución para importar las Server Actions reales ───
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/headers") {
      return { url: "mock:next-headers", shortCircuit: true };
    }
    if (specifier === "next/cache") {
      return { url: "mock:next-cache", shortCircuit: true };
    }
    if (specifier === "@/lib/supabase/campamento") {
      return { url: "mock:supabase-campamento", shortCircuit: true };
    }
    if (specifier.startsWith("@/")) {
      const targetPath = path.join(projectRoot, "src", `${specifier.slice(2)}.ts`);
      return { url: pathToFileURL(targetPath).href, shortCircuit: true };
    }
    if (specifier.startsWith("./") && context.parentURL?.startsWith("file:")) {
      const parentDir = path.dirname(new URL(context.parentURL).pathname);
      const candidateTs = path.join(parentDir, `${specifier}.ts`);
      return { url: pathToFileURL(candidateTs).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "mock:next-headers") {
      return {
        format: "module",
        shortCircuit: true,
        source: "export const cookies = () => globalThis.__MOCK_COOKIES__();",
      };
    }
    if (url === "mock:next-cache") {
      return {
        format: "module",
        shortCircuit: true,
        source: "export const revalidatePath = (p) => globalThis.__MOCK_REVALIDATE_PATH__(p);",
      };
    }
    if (url === "mock:supabase-campamento") {
      return {
        format: "module",
        shortCircuit: true,
        source: "export const createCampamentoClient = () => globalThis.__MOCK_CREATE_CAMPAMENTO_CLIENT__();",
      };
    }
    return nextLoad(url, context);
  },
});

const TEST_SECRET = "test-only-server-secret-for-fase-1-campamentos-2026-hmac";
process.env.CAMPAMENTO_SESSION_SECRET = TEST_SECRET;
delete process.env.CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY;

const authModule = await import("../src/app/campamento/actions/coordinacion-auth.ts");
const pagosModule = await import("../src/app/campamento/actions/coordinacion-pagos.ts");

const { loginCoordinador, getCampaSession, logoutCoordinador } = authModule;
const {
  getInscriptosEtapa,
  aprobarPagoCampamento,
  observarPagoCampamento,
  actualizarPagoCampamento,
  registrarPagoCampamento,
} = pagosModule;

function buildCustomSignedCookie(payloadObj, secret = TEST_SECRET) {
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sigB64 = createHmac("sha256", secret)
    .update(`campa_etapa_session.v1.${payloadB64}`, "utf8")
    .digest("base64url");
  return `${payloadB64}.${sigB64}`;
}

async function resetSessionAndDb() {
  await logoutCoordinador();
  cookieStore.clear();
  revalidatedPaths.length = 0;
  mockDb = createInitialMockDbState();
  process.env.CAMPAMENTO_SESSION_SECRET = TEST_SECRET;
  delete process.env.CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY;
}

async function runSuite() {
  // =========================================================================
  // BLOQUE 1: INTEGRIDAD DE SESIÓN (CRÍTICA-02 + FASE 1.1)
  // =========================================================================
  console.log("1. Pruebas de Integridad de Sesión (campa_etapa_session HMAC-SHA256)");

  // 1.1 Cookie con firma válida -> aceptada
  await resetSessionAndDb();
  const loginRes = await loginCoordinador("1", "Coord Etapa Uno", "pin-seguro-etapa-1");
  assert.equal(loginRes.ok, true, "El login legítimo de etapa 1 debe ser exitoso");
  const rawSignedCookie = cookieStore.get("campa_etapa_session");
  assert.ok(rawSignedCookie && rawSignedCookie.includes("."), "La cookie debe tener formato payload.firma");
  const validSession = await getCampaSession();
  assert.deepEqual(validSession, {
    etapa: "1ra",
    etapaNum: "1",
    coordinador: "Coord Etapa Uno",
    esDefaultPin: false,
  });
  console.log("  ✓ Cookie con firma válida: ACEPTADA");

  // 1.2 Cookie con un carácter modificado -> rechazada
  const [origPayloadB64, origSigB64] = rawSignedCookie.split(".");
  const flippedSigChar = origSigB64[0] === "A" ? "B" : "A";
  cookieStore.set("campa_etapa_session", `${origPayloadB64}.${flippedSigChar}${origSigB64.slice(1)}`);
  assert.equal(await getCampaSession(), null, "Cookie con 1 carácter modificado en la firma debe ser rechazada");

  const flippedPayloadChar = origPayloadB64[0] === "A" ? "B" : "A";
  cookieStore.set("campa_etapa_session", `${flippedPayloadChar}${origPayloadB64.slice(1)}.${origSigB64}`);
  assert.equal(await getCampaSession(), null, "Cookie con 1 carácter modificado en el payload debe ser rechazada");
  console.log("  ✓ Cookie con un carácter modificado (payload o firma): RECHAZADA");

  // 1.3 Token firmado con un secreto diferente -> rechazado
  const now = Date.now();
  const wrongSecretCookie = buildCustomSignedCookie(
    {
      etapa: "1ra",
      etapaNum: "1",
      coordinador: "Coord Etapa Uno",
      esDefaultPin: false,
      iat: now - 1000,
      exp: now + 1000 * 60 * 60,
    },
    "otro-secreto-distinto-de-al-menos-32-caracteres-9999",
  );
  cookieStore.set("campa_etapa_session", wrongSecretCookie);
  assert.equal(await getCampaSession(), null, "Token firmado con otro secreto debe ser rechazado");
  console.log("  ✓ Token firmado con un secreto diferente: RECHAZADO");

  // 1.4 Cookie vencida -> rechazada
  const expiredCookie = buildCustomSignedCookie({
    etapa: "1ra",
    etapaNum: "1",
    coordinador: "Coord Etapa Uno",
    esDefaultPin: false,
    iat: now - 1000 * 60 * 60 * 11,
    exp: now - 1000, // Expiró hace 1 segundo
  });
  cookieStore.set("campa_etapa_session", expiredCookie);
  assert.equal(await getCampaSession(), null, "Cookie vencida debe ser rechazada");
  console.log("  ✓ Cookie vencida: RECHAZADA");

  // 1.5 Token con iat futuro (> 60s en el futuro) -> rechazado
  const futureIatCookie = buildCustomSignedCookie({
    etapa: "1ra",
    etapaNum: "1",
    coordinador: "Coord Etapa Uno",
    esDefaultPin: false,
    iat: now + 120_000, // 2 minutos en el futuro
    exp: now + 120_000 + 1000 * 60 * 60 * 2,
  });
  cookieStore.set("campa_etapa_session", futureIatCookie);
  assert.equal(await getCampaSession(), null, "Token con iat futuro debe ser rechazado");
  console.log("  ✓ Token con iat futuro: RECHAZADO");

  // 1.6 Token con vigencia superior a 12 horas (exp - iat > 12h) -> rechazado
  const excessiveLifetimeCookie = buildCustomSignedCookie({
    etapa: "1ra",
    etapaNum: "1",
    coordinador: "Coord Etapa Uno",
    esDefaultPin: false,
    iat: now - 1000,
    exp: now - 1000 + 1000 * 60 * 60 * 12 + 1000, // 12 horas + 1 segundo
  });
  cookieStore.set("campa_etapa_session", excessiveLifetimeCookie);
  assert.equal(await getCampaSession(), null, "Token con vigencia superior a 12 horas debe ser rechazado");
  console.log("  ✓ Token con vigencia superior a 12 horas: RECHAZADO");

  // 1.7 Cookie sin firma -> rechazada
  const unsignedJsonCookie = JSON.stringify({
    etapa: "1ra",
    etapaNum: "1",
    coordinador: "Coord Etapa Uno",
    esDefaultPin: false,
  });
  cookieStore.set("campa_etapa_session", unsignedJsonCookie);
  assert.equal(await getCampaSession(), null, "Cookie JSON sin firma debe ser rechazada");
  cookieStore.set("campa_etapa_session", `${origPayloadB64}.`);
  assert.equal(await getCampaSession(), null, "Cookie con firma vacía debe ser rechazada");
  console.log("  ✓ Cookie sin firma: RECHAZADA");

  // 1.8 Cookie con estructura inválida -> rechazada
  const invalidPayloads = [
    { etapa: "8va", etapaNum: "8", coordinador: "Coord", esDefaultPin: false, iat: now - 1000, exp: now + 60000 },
    { etapa: "2da", etapaNum: "1", coordinador: "Coord", esDefaultPin: false, iat: now - 1000, exp: now + 60000 },
    { etapa: "1ra", etapaNum: "1", coordinador: " ", esDefaultPin: false, iat: now - 1000, exp: now + 60000 },
    { etapa: "1ra", etapaNum: "1", coordinador: "Coord", esDefaultPin: false, iat: now - 1000 },
    { etapa: "1ra", etapaNum: "1", coordinador: "Coord", esDefaultPin: "no", iat: now - 1000, exp: now + 60000 },
  ];
  for (const badPayload of invalidPayloads) {
    cookieStore.set("campa_etapa_session", buildCustomSignedCookie(badPayload));
    assert.equal(await getCampaSession(), null, "Cookie con estructura inválida debe ser rechazada");
  }
  console.log("  ✓ Cookie con estructura inválida: RECHAZADA");

  // 1.9 Ausencia de CAMPAMENTO_SESSION_SECRET (o < 32 chars, incluso con SERVICE_ROLE presente) -> rechazado
  delete process.env.CAMPAMENTO_SESSION_SECRET;
  process.env.CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY =
    "service-role-key-de-mas-de-32-caracteres-que-no-debe-usarse-como-fallback";
  cookieStore.set("campa_etapa_session", rawSignedCookie);
  assert.equal(
    await getCampaSession(),
    null,
    "Sin CAMPAMENTO_SESSION_SECRET dedicado debe rechazar la sesión sin hacer fallback a SERVICE_ROLE_KEY",
  );
  cookieStore.clear();
  const loginSinSecreto = await loginCoordinador("1", "Coord Etapa Uno", "pin-seguro-etapa-1");
  assert.equal(loginSinSecreto.ok, false, "Sin CAMPAMENTO_SESSION_SECRET debe rechazar el login");
  assert.equal(cookieStore.has("campa_etapa_session"), false, "Nunca debe emitir una cookie si falta el secreto");

  // Secreto demasiado corto (< 32 caracteres)
  process.env.CAMPAMENTO_SESSION_SECRET = "secreto-corto-16-chars";
  const loginSecretoCorto = await loginCoordinador("1", "Coord Etapa Uno", "pin-seguro-etapa-1");
  assert.equal(loginSecretoCorto.ok, false, "Secreto menor a 32 caracteres debe ser rechazado");
  console.log("  ✓ Ausencia o longitud insuficiente de CAMPAMENTO_SESSION_SECRET (sin fallback): RECHAZADA\n");

  // =========================================================================
  // BLOQUE 2: AUTORIZACIÓN DE ETAPAS EN getInscriptosEtapa (CRÍTICA-01 + FASE 1.1)
  // =========================================================================
  console.log("2. Pruebas de Autorización y Validación Estricta de Etapas (getInscriptosEtapa)");

  // 2.1 Sin cookie -> acceso rechazado y 0 consultas a Supabase
  await resetSessionAndDb();
  const resSinCookie = await getInscriptosEtapa("1");
  assert.equal(resSinCookie.ok, false);
  assert.equal(resSinCookie.inscriptos.length, 0);
  assert.equal(mockDb.clientCalls, 0, "No debe instanciar ni consultar Supabase sin sesión válida");
  console.log("  ✓ Sin cookie: ACCESO RECHAZADO (0 consultas a la base de datos)");

  // 2.2 Cookie manipulada -> acceso rechazado
  await resetSessionAndDb();
  const forgedPayloadB64 = Buffer.from(
    JSON.stringify({
      etapa: "2da",
      etapaNum: "2",
      coordinador: "Atacante",
      esDefaultPin: false,
      iat: now - 1000,
      exp: now + 60000,
    }),
    "utf8",
  ).toString("base64url");
  cookieStore.set("campa_etapa_session", `${forgedPayloadB64}.${origSigB64}`);
  const resCookieManipulada = await getInscriptosEtapa("2");
  assert.equal(resCookieManipulada.ok, false);
  assert.equal(resCookieManipulada.inscriptos.length, 0);
  assert.equal(mockDb.clientCalls, 0);
  console.log("  ✓ Cookie manipulada: ACCESO RECHAZADO");

  // 2.3 Sesión de etapa 1 intentando consultar etapa 2 -> acceso rechazado
  await resetSessionAndDb();
  await loginCoordinador("1", "Coord Etapa Uno", "pin-seguro-etapa-1");
  const callsAfterLogin = mockDb.clientCalls;
  const resCrossEtapa = await getInscriptosEtapa("2");
  assert.equal(resCrossEtapa.ok, false);
  assert.equal(resCrossEtapa.inscriptos.length, 0);
  assert.equal(mockDb.clientCalls, callsAfterLogin);
  console.log("  ✓ Sesión de etapa 1 intentando consultar etapa 2: ACCESO RECHAZADO");

  // 2.4 Etapas inválidas ("8", "0", "12", "", "1%' OR '1'='1") -> rechazadas sin consultar BD
  for (const invalidStage of ["8", "0", "12", "", "   ", "1%' OR '1'='1", "etapa-1"]) {
    const callsBefore = mockDb.clientCalls;
    const resInvalid = await getInscriptosEtapa(invalidStage);
    assert.equal(resInvalid.ok, false, `Etapa inválida '${invalidStage}' debe ser rechazada`);
    assert.equal(resInvalid.inscriptos.length, 0);
    assert.equal(mockDb.clientCalls, callsBefore, "No debe consultar BD ante parámetro de etapa inválido");
  }
  console.log("  ✓ Parámetros de etapa inválidos ('8', '12', '', inyección): RECHAZADOS");

  // 2.5 Sesión válida de etapa 1 consultando etapa 1 -> acceso permitido y filtra registro corrupto ("12")
  const resEtapa1Valida = await getInscriptosEtapa("1");
  assert.equal(resEtapa1Valida.ok, true);
  assert.equal(
    resEtapa1Valida.inscriptos.length,
    1,
    "Solo debe incluir '1ra Etapa' y excluir el registro con etapa corrupta '12'",
  );
  assert.equal(resEtapa1Valida.inscriptos[0].id, "ins-etapa-1");
  assert.equal(resEtapa1Valida.pagosPendientes.length, 1);
  assert.equal(resEtapa1Valida.pagosPendientes[0].id, "pago-etapa-1");
  console.log("  ✓ Sesión válida de etapa 1 consultando etapa 1 (excluyendo etapa inválida '12'): ACCESO PERMITIDO\n");

  // =========================================================================
  // BLOQUE 3: PROTECCIÓN IDOR, STORAGE, CONCURRENCIA Y ERRORES (ALTO-01 + FASE 1.1)
  // =========================================================================
  console.log("3. Pruebas de Protección IDOR, Storage, Concurrencia y Errores Genéricos");

  await resetSessionAndDb();
  await loginCoordinador("1", "Coord Etapa Uno", "pin-seguro-etapa-1");

  // 3.1 Sesión de etapa 1 intentando modificar un pago de etapa 2 o de etapa corrupta ("12")
  assert.equal((await aprobarPagoCampamento("pago-etapa-2", "2")).ok, false);
  assert.equal((await aprobarPagoCampamento("pago-etapa-2", "1")).ok, false);
  assert.equal((await aprobarPagoCampamento("pago-etapa-corrupta", "1")).ok, false);
  assert.equal((await observarPagoCampamento("pago-etapa-2", "Intento IDOR", "1")).ok, false);
  assert.equal(
    (
      await actualizarPagoCampamento(
        "pago-etapa-2",
        { es_efectivo: true, recibido_por: "Atacante", observaciones: "Alterado" },
        "1",
      )
    ).ok,
    false,
  );
  assert.equal(mockDb.pagos.find((p) => p.id === "pago-etapa-2").estado, "PENDIENTE");
  assert.equal(mockDb.pagos.find((p) => p.id === "pago-etapa-corrupta").estado, "PENDIENTE");

  // 3.2 Intento IDOR en registrarPagoCampamento CON comprobante adjunto -> 0 llamadas a storage.upload
  const fakeFileIdor = new File([Buffer.from("contenido-prueba")], "comprobante.jpg", {
    type: "image/jpeg",
  });
  const formDataIdor = new FormData();
  formDataIdor.set("inscriptoId", "ins-etapa-2");
  formDataIdor.set("monto", "50000");
  formDataIdor.set("etapa", "1");
  formDataIdor.set("comprobante", fakeFileIdor);

  assert.equal(mockDb.storageUploadCalls, 0);
  const idorRegistrar = await registrarPagoCampamento(formDataIdor);
  assert.equal(idorRegistrar.ok, false);
  assert.equal(
    mockDb.storageUploadCalls,
    0,
    "Cero llamadas a storage.upload cuando el inscripto pertenece a otra etapa",
  );
  console.log("  ✓ Intento IDOR con comprobante adjunto: RECHAZADO (0 llamadas a storage.upload)");

  // 3.3 Pago inexistente o eliminado concurrentemente antes del UPDATE -> nunca devolver éxito
  assert.equal((await aprobarPagoCampamento("pago-no-existe", "1")).ok, false);
  assert.equal((await aprobarPagoCampamento("pago-huerfano", "1")).ok, false);

  mockDb.simulateConcurrentDeleteOnUpdate = true;
  const resConcurrentDeleteAprobar = await aprobarPagoCampamento("pago-etapa-1", "1");
  assert.equal(resConcurrentDeleteAprobar.ok, false, "No debe devolver ok: true si UPDATE afectó 0 filas");
  const resConcurrentDeleteActualizar = await actualizarPagoCampamento(
    "pago-etapa-1",
    { es_efectivo: false, recibido_por: null, observaciones: "Nota" },
    "1",
  );
  assert.equal(resConcurrentDeleteActualizar.ok, false);
  const resConcurrentDeleteObservar = await observarPagoCampamento("pago-etapa-1", "Motivo", "1");
  assert.equal(resConcurrentDeleteObservar.ok, false);
  mockDb.simulateConcurrentDeleteOnUpdate = false;
  console.log("  ✓ Pago inexistente o eliminado concurrentemente (0 filas en UPDATE): RECHAZADO");

  // 3.4 Fallo de subida de Storage -> abortar y no insertar pago
  mockDb.simulateStorageError = true;
  const pagosEtapa1Before = mockDb.pagos.filter((p) => p.inscripto_id === "ins-etapa-1").length;
  const formDataStorageFail = new FormData();
  formDataStorageFail.set("inscriptoId", "ins-etapa-1");
  formDataStorageFail.set("monto", "85000");
  formDataStorageFail.set("etapa", "1");
  formDataStorageFail.set("comprobante", fakeFileIdor);

  const resStorageFail = await registrarPagoCampamento(formDataStorageFail);
  assert.equal(resStorageFail.ok, false, "Debe abortar el registro si falla la subida del comprobante");
  assert.ok(
    !resStorageFail.error.includes("INTERNAL_STORAGE_BUCKET_FAILURE_SECRET"),
    "No debe filtrar el mensaje interno de Storage",
  );
  assert.equal(
    mockDb.pagos.filter((p) => p.inscripto_id === "ins-etapa-1").length,
    pagosEtapa1Before,
    "No debe insertar el pago en la tabla pagos cuando falla la subida del comprobante",
  );
  mockDb.simulateStorageError = false;
  console.log("  ✓ Fallo de subida de Storage: ABORTA REGISTRO (0 filas insertadas)");

  // 3.5 Error de Supabase en mutación -> no filtrar error.message original al cliente
  const internalSqlError = "FATAL_POSTGRES_ERROR_23505_DETAIL_TABLE_PAGOS_CONSTRAINT_INTERNAL";
  mockDb.simulateDbErrorMessage = internalSqlError;

  const errAprobar = await aprobarPagoCampamento("pago-etapa-1", "1");
  assert.equal(errAprobar.ok, false);
  assert.ok(!errAprobar.error.includes(internalSqlError), "No debe filtrar error.message en aprobarPagoCampamento");

  const errObservar = await observarPagoCampamento("pago-etapa-1", "Motivo", "1");
  assert.equal(errObservar.ok, false);
  assert.ok(!errObservar.error.includes(internalSqlError), "No debe filtrar error.message en observarPagoCampamento");

  const errActualizar = await actualizarPagoCampamento(
    "pago-etapa-1",
    { es_efectivo: false, recibido_por: null, observaciones: "Test" },
    "1",
  );
  assert.equal(errActualizar.ok, false);
  assert.ok(
    !errActualizar.error.includes(internalSqlError),
    "No debe filtrar error.message en actualizarPagoCampamento",
  );

  const formDataDbError = new FormData();
  formDataDbError.set("inscriptoId", "ins-etapa-1");
  formDataDbError.set("monto", "50000");
  formDataDbError.set("etapa", "1");
  const errRegistrar = await registrarPagoCampamento(formDataDbError);
  assert.equal(errRegistrar.ok, false);
  assert.ok(
    !errRegistrar.error.includes(internalSqlError),
    "No debe filtrar error.message en registrarPagoCampamento",
  );

  mockDb.simulateDbErrorMessage = null;
  console.log("  ✓ Errores internos de Supabase en mutaciones: NO FILTRADOS AL CLIENTE");

  // 3.6 Sesión de etapa 1 modificando/aprobando/observando/registrando pagos de etapa 1 -> permitido
  const okActualizar = await actualizarPagoCampamento(
    "pago-etapa-1",
    { es_efectivo: true, recibido_por: "Coord Etapa Uno", observaciones: "Recibido en reunión" },
    "1",
  );
  assert.equal(okActualizar.ok, true);
  assert.equal(mockDb.pagos.find((p) => p.id === "pago-etapa-1").es_efectivo, true);

  const okAprobar = await aprobarPagoCampamento("pago-etapa-1", "1", {
    observaciones: "Verificado OK",
  });
  assert.equal(okAprobar.ok, true);
  assert.equal(mockDb.pagos.find((p) => p.id === "pago-etapa-1").estado, "APROBADO");

  const okObservar = await observarPagoCampamento("pago-etapa-1", "Comprobante borroso", "1");
  assert.equal(okObservar.ok, true);
  assert.equal(mockDb.pagos.find((p) => p.id === "pago-etapa-1").estado, "RECHAZADO");

  const formDataValido = new FormData();
  formDataValido.set("inscriptoId", "ins-etapa-1");
  formDataValido.set("monto", "75000");
  formDataValido.set("etapa", "1");
  formDataValido.set("esEfectivo", "true");
  formDataValido.set("recibidoPor", "Coord Etapa Uno");
  const okRegistrar = await registrarPagoCampamento(formDataValido);
  assert.equal(okRegistrar.ok, true);
  assert.equal(
    mockDb.pagos.filter((p) => p.inscripto_id === "ins-etapa-1").length,
    2,
    "Debe haberse insertado el nuevo pago para el inscripto de etapa 1",
  );
  console.log("  ✓ Operaciones legítimas sobre etapa 1 autorizada: PERMITIDAS\n");

  console.log("==========================================================================");
  console.log("✓ TODAS LAS PRUEBAS DE SEGURIDAD (FASE 1 + FASE 1.1) PASARON EXITOSAMENTE");
  console.log("==========================================================================");
}

runSuite().catch((err) => {
  console.error("Fallo en la suite de pruebas de seguridad:", err);
  process.exit(1);
});
