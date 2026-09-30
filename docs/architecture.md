# Arquitectura General de CAMREVOC

Este documento describe la arquitectura técnica del repositorio unificado de **CAMREVOC (Casa Salesiana Don Bosco Neuquén)**. Es la fuente de verdad arquitectónica para cualquier desarrollador o agente de Inteligencia Artificial que deba interactuar con el proyecto.

---

## 1. Stack Tecnológico Base

- **Framework:** Next.js `16.3.5` (App Router).
- **Librería de Interfaz:** React `19.2.8` (React Server Components y Server Actions).
- **Estilos:** Tailwind CSS `v4` utilizando la integración `@tailwindcss/postcss`.
- **Bases de Datos y Almacenamiento:** PostgreSQL y Object Storage provistos por **Supabase** a través de `@supabase/supabase-js` (`^2.116.0`) y `@supabase/ssr` (`^0.12.7`).
- **Correo Electrónico:** Resend (`^6.28.1`) para emails transaccionales.
- **Utilidades:**
  - `nanoid` (`^6.0.1`): generación de identificadores y códigos alfanuméricos únicos.
  - `qrcode` / `qrcode.react`: codificación y visualización de códigos QR para vales.
  - `lucide-react`: iconografía estándar de la aplicación.

---

## 2. Estructura del Monolito Modular

El repositorio opera como una única aplicación web Next.js que alberga **dos dominios de negocio completamente desacoplados** bajo un mismo árbol de rutas:

```
src/app/
├── page.tsx                     # Landing institucional unificada (/)
├── layout.tsx                   # RootLayout general con fuentes Geist y metadatos
├── globals.css                  # Estilos globales de Tailwind v4
│
├── pollos/                      # MÓDULO 1: Gran Pollada Solidaria
│   ├── page.tsx                 # Portal de compra y carga de ventas (/pollos)
│   ├── vale/[codigo]/page.tsx   # Visualización pública y canje de vale QR (/pollos/vale/[codigo])
│   ├── admin/
│   │   ├── page.tsx             # Panel de control de finanzas y logística (/pollos/admin)
│   │   ├── layout.tsx           # Layout administrativo
│   │   └── login/page.tsx       # Acceso por contraseña maestra (/pollos/admin/login)
│   └── actions/                 # Server Actions exclusivas de Pollos
│
├── campamento/                  # MÓDULO 2: Campamentos de Verano 2027
│   ├── inscripcion/page.tsx     # Formulario público de inscripción (/campamento/inscripcion)
│   ├── pagos/page.tsx           # Portal familiar de consulta de saldo y subida de pago (/campamento/pagos)
│   ├── coordinacion/page.tsx    # Portal de acceso por PIN para coordinadores (/campamento/coordinacion)
│   ├── etapa/[etapa]/page.tsx   # Dashboard de gestión y auditoría por etapa (/campamento/etapa/[etapa])
│   └── actions/                 # Server Actions exclusivas de Campamentos
│
└── buzos/                       # MÓDULO 3: Buzos 2027 (Elección Colectiva)
    ├── page.tsx                 # Wizard público de votación por DNI (/buzos)
    ├── admin/
    │   ├── page.tsx             # Panel de cómputo y resultados (/buzos/admin)
    │   └── login/page.tsx       # Acceso administrativo con contraseña (/buzos/admin/login)
    └── actions/                 # Server Actions exclusivas de Buzos
```

### Principio de Aislamiento
A pesar de compartir el mismo runtime de Node.js / Next.js, **Pollos, Campamentos y Buzos mantienen sus lógicas y modelos de datos desacoplados**. Cada módulo encapsula sus propias Server Actions, componentes en `src/components/[modulo]/` y configuraciones en `src/config/`. Campamentos utiliza su propio proyecto Supabase (`camrevoc-campa`), mientras que Buzos y Pollos operan sobre el proyecto principal (`camrevoc-pollos`) con tablas independientes.

---

## 3. Separación de Proyectos de Supabase

Por limitaciones de cuota del plan gratuito de Supabase (especialmente en almacenamiento de archivos y concurrencia de conexiones), cada módulo se conecta a un proyecto PostgreSQL independiente:

| Módulo | Proyecto Supabase | Variables de Entorno | Tipo de Acceso |
|---|---|---|---|
| **Pollos** | `camrevoc-pollos` | `NEXT_PUBLIC_SUPABASE_URL`<br>`NEXT_PUBLIC_SUPABASE_ANON_KEY`<br>`SUPABASE_SERVICE_ROLE_KEY` | • **Cliente Browser** (`src/lib/supabase/client.ts`) para subida directa de comprobantes con anon key.<br>• **Cliente Servidor Service Role** (`src/lib/supabase/server.ts`) para Server Actions. |
| **Campamentos** | `camrevoc-campa` | `NEXT_PUBLIC_CAMPAMENTO_SUPABASE_URL`<br>`CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY` | • **Únicamente Cliente Servidor Service Role** (`src/lib/supabase/campamento.ts`). No existe cliente browser anónimo. |

> ⚠️ **Regla Crítica:** Nunca importar `src/lib/supabase/server.ts` ni `src/lib/supabase/campamento.ts` desde un Client Component (`"use client"`). Ambos clientes utilizan claves de servicio (`service_role`) que eluden las políticas RLS y otorgan acceso irrestricto a la base de datos.

---

## 4. Convención `proxy.ts` (Next.js 16)

Next.js 16 incorpora `proxy.ts` como evolución oficial para el control perimetral previo a la resolución de rutas:
- Archivo ubicado en [src/proxy.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/src/proxy.ts).
- Exporta la función `proxy(request: NextRequest)` con `config.matcher: ["/pollos/admin", "/pollos/admin/:path*"]`.
- Su objetivo actual es proteger las rutas administrativas de Pollos:
  1. Si un usuario sin la cookie `admin_session === "authenticated"` intenta acceder a `/pollos/admin`, es redirigido a `/pollos/admin/login?from=...`.
  2. Si un usuario autenticado accede a `/pollos/admin/login`, es redirigido directamente a `/pollos/admin`.
- **Rutas de Campamento:** El portal de coordinación de Campamentos (`/campamento/coordinacion` y `/campamento/etapa/[etapa]`) **no** está interceptado por `proxy.ts`; su autorización se resuelve a nivel de Server Component en la propia página mediante `getCampaSession()`.

---

## 5. Código Compartido vs. Específico

### Código Realmente Compartido
- **RootLayout y Estilos:** [src/app/layout.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/layout.tsx), [src/app/globals.css](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/globals.css).
- **Activos Estáticos e Identidad:** [public/logo.png](file:///mnt/HDD/proyectos/camrevoc-pollos/public/logo.png), [public/salesianos.png](file:///mnt/HDD/proyectos/camrevoc-pollos/public/salesianos.png).
- **Landing Institucional:** [src/app/page.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/page.tsx).
- **Configuración de Redirecciones:** [next.config.ts](file:///mnt/HDD/proyectos/camrevoc-pollos/next.config.ts) (redirecciones históricas de `/admin` y `/vale` hacia `/pollos/*`).
- **Dependencias:** [package.json](file:///mnt/HDD/proyectos/camrevoc-pollos/package.json).
- **Entidad Bancaria Común:** Aunque la cuenta corriente Santander (CBU, CUIT y Alias `GRUPOSDBNQN`) es compartida por la institución, cada módulo tiene su propio archivo de configuración con motivos de transferencia diferenciados (`src/config/constants.ts` vs. `src/config/campamento.ts`).

### Código Específico (Sin Dependencia Cruzada)
- Cada módulo implementa sus propios componentes visuales:
  - Pollos: `src/components/OrderForm.tsx`, `ValeQR.tsx`, `ConfirmarEntregaButton.tsx`, `src/components/admin/*`.
  - Campamentos: `src/components/campamento/*`.
- Cada módulo gestiona sus propias sesiones y cookies:
  - Pollos: `admin_session` (string fijo) y `admin_operator` (nombre del operador).
  - Campamentos: `campa_etapa_session` (JSON con etapa y nombre de coordinador).

---

## 6. Convenciones de Desarrollo y Límites

1. **Mutaciones mediante Server Actions:** Todas las escrituras hacia Supabase se canalizan a través de funciones `"use server"` en Node.js, validando datos en el servidor antes de insertar o actualizar.
2. **Escala Operativa:** La arquitectura está dimensionada para operaciones comunitarias medianas:
   - Pollada: hasta ~400 pollos.
   - Campamentos: hasta ~300 inscriptos distribuidos en 7 etapas.
3. **Ausencia de `basePath` Global:** La aplicación no utiliza `basePath: '/pollos'`. Todo el enrutamiento reside de forma nativa en la raíz del App Router.

---

## 7. Dónde Buscar Contexto antes de Modificar Código

| Tarea a Realizar | Documentación Primaria a Consultar |
|---|---|
| Modificar esquema, tablas o storage | `docs/database.md` |
| Comprender decisiones previas o deuda técnica | `docs/decisions.md` |
| Modificar ventas, ranking, vales o panel de pollos | `docs/pollos/README.md`, `docs/pollos/business-rules.md`, `docs/pollos/flujo.md` |
| Modificar inscripción, pagos o coordinación de campamentos | `docs/campamentos/README.md`, `docs/campamentos/business-rules.md`, `docs/campamentos/flujo.md` |
| Cambiar cuentas bancarias o identidad | `docs/shared/bank-and-identity.md` |
