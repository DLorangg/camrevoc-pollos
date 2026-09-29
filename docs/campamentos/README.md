# Módulo Campamentos — Temporada de Verano 2027

El módulo **Campamentos** centraliza la inscripción institucional, el reporte de transferencias bancarias de las familias y la auditoría operativa y financiera para la temporada de **Campamentos de Verano 2027** de CamReVoc (destinos Junín de los Andes y Villa Regina).

---

## 1. Propósito y Problemática Resuelta

- **Padrón Único y Validación de DNI:** Reemplaza los formularios dispersos (Google Forms) por un registro unificado en base de datos que previene inscripciones duplicadas mediante validación de DNI en tiempo real.
- **Autogestión Financiera para Familias:** Permite a los responsables consultar en cualquier momento su saldo restante ingresando únicamente el DNI, sin necesidad de consultar manualmente a los coordinadores.
- **Auditoría Descentralizada por Etapa:** Otorga a cada equipo de coordinación un panel protegido por PIN para auditar transferencias, aprobar o rechazar comprobantes con motivos explícitos y contactar a las familias con un clic por WhatsApp.
- **Gestión de Hermanos:** Permite imputar una única transferencia bancaria a dos hermanos (con soporte planificado para 3 o más hermanos).

---

## 2. Rutas del Módulo

| Ruta | Acceso | Propósito | Componente Clave |
|---|---|---|---|
| `/campamento/inscripcion` | Público | Ficha de confirmación de asistencia, rol, datos médicos básicos y donaciones. | [InscripcionForm.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/campamento/InscripcionForm.tsx) |
| `/campamento/pagos` | Público | Consulta de saldo por DNI, desglose de hermanos y subida de comprobantes. | [FamiliaPagosForm.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/campamento/pagos/FamiliaPagosForm.tsx) |
| `/campamento/coordinacion` | Público / Login | Acceso por etapa mediante selección de nombre y PIN de seguridad. | [CoordinacionLoginForm.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/campamento/coordinacion/CoordinacionLoginForm.tsx) |
| `/campamento/etapa/[etapa]` | Protegido (Cookie) | Dashboard de etapa: padrón, auditoría de pagos pendientes, rechazados y cambio de PIN. | [EtapaDashboard.tsx](file:///mnt/HDD/proyectos/camrevoc-pollos/src/components/campamento/coordinacion/EtapaDashboard.tsx) |

---

## 3. Actores del Módulo

1. **Familias / Participantes:**
   - Inscriben a los participantes (crvquistas, animadores o coordinadores).
   - Consultan su estado de cuenta ingresando el DNI en `/campamento/pagos`.
   - Informan comprobantes bancarios y distribuyen el monto entre hermanos.
2. **Coordinadores de Etapa:**
   - Ingresan a su etapa correspondiente con el PIN de etapa.
   - Auditan los comprobantes subidos por las familias (aprueban o rechazan con motivo).
   - Cargan manualmente pagos recibidos fuera del circuito web.
   - Monitorean alertas de dificultades económicas informadas y requerimientos nutricionales especiales.
3. **Tesorería General (Proyectado / Pendiente):**
   - Vista administrativa global consolidando recaudación de las 7 etapas y exportaciones contables.

---

## 4. Server Actions

Ubicadas en [src/app/campamento/actions/](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/campamento/actions/):

- **`inscripcion.ts` (`inscribirParticipante`):** Valida formato de DNI, previene duplicados en la tabla `inscriptos`, asigna automáticamente destino y tarifa según la etapa, y persiste el registro.
- **`familia-pagos.ts`:**
  - `buscarInscriptoPorDni(dni)`: Obtiene datos del participante, computa total abonado (solo pagos aprobados), saldo pendiente y alerta si tiene pagos rechazados.
  - `subirPagoFamilia(formData)`: Sube el comprobante a `comprobantes-campa` y registra un pago en `pagos` por cada hermano con `estado = 'PENDIENTE'` y `subido_por = 'FAMILIA'`.
- **`coordinacion-auth.ts`:**
  - `loginCoordinador(etapa, coordinador, pin)`: Valida el PIN contra `etapas_pines`, auto-registra al coordinador en `coordinadores_etapa` y genera la cookie HTTP-Only `campa_etapa_session`.
  - `getCampaSession()`: Lee y deserializa la sesión del coordinador.
  - `logoutCoordinador()`: Destruye la cookie de sesión.
  - `actualizarPinEtapa(actual, nuevo, confirmacion)`: Permite cambiar el PIN de la etapa en `etapas_pines` (mínimo 6 caracteres).
- **`coordinacion-pagos.ts`:**
  - `getInscriptosEtapa(etapaParam)`: Consulta inscriptos y pagos de la etapa, computando métricas de recaudación en tiempo real.
  - `aprobarPagoCampamento(pagoId, etapaNum)`: Pasa el pago a `'APROBADO'`, guardando auditor y timestamp; descuenta del saldo restante.
  - `observarPagoCampamento(pagoId, motivo, etapaNum)`: Pasa el pago a `'RECHAZADO'` registrando el motivo explicativo obligatorio.
  - `registrarPagoCampamento(formData)`: Registra un pago manual directo ingresado por el coordinador (`estado = 'APROBADO'`, `subido_por = 'COORDINADOR'`).

---

## 5. Integración con Supabase

- **Proyecto:** `camrevoc-campa`.
- **Tablas:** `inscriptos`, `pagos`, `etapas_pines`, `coordinadores_etapa`.
- **Storage:** Bucket público `comprobantes-campa`.
- **Seguridad:** Todas las mutaciones y consultas operan en el backend a través del cliente `createCampamentoClient()` que utiliza `CAMPAMENTO_SUPABASE_SERVICE_ROLE_KEY`. No se utiliza Supabase Auth ni clientes browser directos.
