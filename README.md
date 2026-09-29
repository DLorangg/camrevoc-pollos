# CAMREVOC · Casa Salesiana Don Bosco Neuquén

Plataforma digital unificada de gestión comunitaria, comercial y pastoral para los grupos juveniles de **CamReVoc** (Campamentos Recreativos Vocacionales), perteneciente a la Casa Salesiana Don Bosco de Neuquén, Argentina.

---

## 📌 Módulos Principales

El repositorio alberga dos módulos independientes sobre un único monolito en Next.js:

1. **Gran Pollada Solidaria (`/pollos`):**
   - Preventa de pollos a beneficio de la obra comunitaria.
   - Carga de ventas por animadores/crvquistas y cómputo de ranking interno.
   - Adjunto obligatorio de comprobantes bancarios.
   - Emisión de vales web con código QR anti-duplicados y canje físico en la parrilla.
   - Panel de control de finanzas y logística en `/pollos/admin`.

2. **Campamentos de Verano 2027 (`/campamento`):**
   - Ficha pública de confirmación de asistencia por etapas (Junín de los Andes y Villa Regina).
   - Portal familiar de autogestión de pagos por DNI (`/campamento/pagos`) con seguimiento de saldos y soporte de transferencias compartidas entre hermanos.
   - Panel de auditoría de transferencias para los coordinadores de cada etapa (`/campamento/coordinacion`), protegido por PIN.

---

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router) + React 19.
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) v4.
- **Bases de Datos & Storage:** [Supabase](https://supabase.com/) (dos proyectos independientes: `camrevoc-pollos` y `camrevoc-campa`).
- **Emails Transaccionales:** [Resend](https://resend.com/) (dominio verificado `camrevoc.com.ar`).
- **Control Perimetral:** `src/proxy.ts` (convención oficial Next.js 16).

---

## 📚 Documentación Canónica (`docs/`)

Toda la documentación técnica, reglas de negocio y registro de decisiones reside en la carpeta [`docs/`](file:///mnt/HDD/proyectos/camrevoc-pollos/docs). **Es la fuente de verdad definitiva del repositorio**:

```
docs/
├── architecture.md          # Arquitectura general, App Router, proxy.ts y separación de Supabase
├── database.md              # Esquemas de base de datos de ambos proyectos, tablas y Storage
├── decisions.md             # Registro de decisiones de arquitectura y negocio (ADR)
├── shared/
│   └── bank-and-identity.md # Cuentas bancarias Santander, logos e identidad institucional
├── pollos/
│   ├── README.md            # Guía técnica del módulo Pollos
│   ├── business-rules.md    # Precios, vales, ranking y reglas comerciales
│   └── flujo.md             # Circuito completo de venta, aprobación y canje
└── campamentos/
    ├── README.md            # Guía técnica del módulo Campamentos 2027
    ├── business-rules.md    # Tarifas planas, etapas, destinos y reglas de cobro
    └── flujo.md             # Flujo de inscripción, reporte familiar y auditoría
```

---

## 🚀 Desarrollo Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar variables de entorno locales en `.env.local` (ver `docs/architecture.md`).
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🤖 Agentes de IA

Las definiciones y alcances de los agentes especializados para este repositorio residen en [`.agents/agents/`](file:///mnt/HDD/proyectos/camrevoc-pollos/.agents/agents/) y las reglas globales en [`AGENTS.md`](file:///mnt/HDD/proyectos/camrevoc-pollos/AGENTS.md).
