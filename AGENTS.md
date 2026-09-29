<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Reglas de Agentes IA para CAMREVOC

Bienvenido al repositorio de **CAMREVOC (Casa Salesiana Don Bosco Neuquén)**. Estas reglas son de cumplimiento obligatorio para cualquier agente de Inteligencia Artificial que opere en este proyecto.

## 1. Fuente de Verdad y Contexto Permanente
- **`docs/` es la única fuente de verdad documental** del proyecto.
- **Jerarquía de resolución:**
  1. Las **decisiones humanas registradas en `docs/decisions.md`** tienen prioridad absoluta sobre cualquier documentación histórica, suposición previa o comentario antiguo.
  2. El **código real actual** tiene prioridad para describir el comportamiento vigente de la aplicación.
  3. La documentación de arquitectura y base de datos (`docs/architecture.md`, `docs/database.md`) rige las convenciones técnicas.
- **Antes de modificar código:** El agente DEBE leer la documentación correspondiente al módulo afectado:
  - Arquitectura transversal: `docs/architecture.md`, `docs/database.md`, `docs/decisions.md`.
  - Gran Pollada: `docs/pollos/README.md`, `docs/pollos/business-rules.md`, `docs/pollos/flujo.md`.
  - Campamentos: `docs/campamentos/README.md`, `docs/campamentos/business-rules.md`, `docs/campamentos/flujo.md`.
  - Datos bancarios e identidad: `docs/shared/bank-and-identity.md`.

## 2. Aislamiento de Supabase y Base de Datos
- Existen dos proyectos de Supabase independientes:
  - `camrevoc-pollos` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
  - `camrevoc-campa` (`NEXT_PUBLIC_CAMPAMENTO_SUPABASE_URL`, `CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY`).
- **NO modificar esquemas, tablas ni Storage de Supabase directamente** salvo que el usuario lo solicite de manera explícita e inequívoca.
- Respetar el aislamiento: nunca consultar tablas de Campamentos con el cliente de Pollos ni viceversa.

## 3. Seguridad y Manejo de Secretos
- **NUNCA mostrar, solicitar ni commitear valores de secretos**, contraseñas maestras, service role keys ni tokens de `.env.local`.
- Si falta información técnica o de permisos no documentada, registrarla formalmente como `NO DOCUMENTADO` o `REQUIERE DECISIÓN`; **nunca inventar credenciales ni suposiciones**.
- Conocer las decisiones de seguridad vigentes:
  - El canje público de vales con QR sin login es una decisión operativa intencional (el QR funciona como autorización práctica).
  - Los PINs de coordinación en texto plano representan una deuda técnica temporal aceptada por el usuario.

## 4. Convenciones de Código y Server Actions
- Next.js 16 App Router con React 19.
- Utilizar Server Actions (`"use server"`) para todas las mutaciones y operaciones privilegiadas con el Service Role.
- Nunca importar clientes con Service Role en Client Components (`"use client"`).
- Respetar la convención `proxy.ts` (Next.js 16) para la protección perimetral de rutas.
- **No modificar comportamiento no relacionado con la tarea:** Mantener el principio de mínima alteración y preservar docstrings o comentarios existentes.

## 5. Control de Versiones y Git
- **NO hacer commits.**
- **NO hacer git push.**
- Salvo solicitud explícita del usuario, el agente debe abstenerse de manipular el historial de Git. El desarrollador humano es la única persona que realiza commits y push al repositorio.
