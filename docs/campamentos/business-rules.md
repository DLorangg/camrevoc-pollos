# Reglas de Negocio — Módulo Campamentos

Este documento define las políticas institucionales, contables y operativas que rigen los Campamentos de Verano 2027.

---

## 1. Etapas, Destinos y Tarifas (Temporada Enero 2027)

La temporada se divide de forma estricta entre dos destinos:

| Destino | Etapas Asignadas | Fechas de Campamento | Carga de Camión | Tarifa Plana Universal |
|---|---|---|---|---|
| **Junín de los Andes** | 1ra, 2da, 3ra, 6ta y 7ma Etapa | Miércoles 20 al Domingo 24 de Enero 2027 | Martes 19 de Enero 2027 | **\$550.000 ARS** |
| **Villa Regina** | 4ta y 5ta Etapa | Miércoles 27 al Domingo 31 de Enero 2027 | Miércoles 27 de Enero 2027 | **\$200.000 ARS** |

### Reglas Arancelarias
1. **Determinación Unívoca:** La etapa elegida por el participante determina de forma automática e inalterable el destino, las fechas y la tarifa base.
2. **Tarifa Plana Universal:** Todos los participantes abonan exactamente el mismo arancel asignado a su campamento, sin distinciones de rol (`CRVQUISTA`, `ANIMADOR` o `COORDINADOR` abonan lo mismo).
3. **Política de Descuentos:** No existen promociones, tarifas reducidas ni descuentos automáticos por hermanos.

---

## 2. Padrón e Identidad del Participante

1. **Clave de Unicidad (DNI):** El DNI (numérico, entre 7 y 9 dígitos, sin puntos ni espacios) es el identificador principal. No se admiten inscripciones duplicadas con el mismo DNI en la tabla `inscriptos`.
2. **Roles:** Tres opciones excluyentes: `CRVQUISTA`, `ANIMADOR` o `COORDINADOR`.
3. **Régimen Alimentario y Salud:**
   - Opciones: *Omnívoro, Vegetariano, Celíaco, Vegano, Otros*.
   - Si se selecciona `"Otros"`, el campo de detalle de alimentos prohibidos y alergias es **estrictamente obligatorio**.
4. **Dificultad de Pago:** Campo booleano declarativo (`dificultad_pago`). No bloquea la inscripción ni modifica la tarifa; sirve como bandera visual de alerta para el acompañamiento pastoral y seguimiento de coordinación.
5. **Sección Solidaria:** Opción voluntaria (`quiere_aportar` y `contacto_donacion`) para familias interesadas en donar dinero, mercadería o materiales para los campamentos.

---

## 3. Circuito Contable y de Pagos

### Estados Individuales de un Pago (`pagos.estado`)
- **`PENDIENTE`:** Registrado por la familia mediante `/campamento/pagos`. **No descuenta del saldo restante** hasta que un coordinador lo valide.
- **`APROBADO`:** Convalidado por un coordinador (o cargado manualmente por este). Se descuenta de forma inmediata del saldo adeudado del participante y actualiza las métricas de recaudación de la etapa.
- **`RECHAZADO`:** Desestimado por coordinación debido a monto no acreditado o comprobante ilegible. Requiere obligatoriamente un texto en `motivo_rechazo`. No impacta en saldos.

### Estados Calculados del Participante
Calculados dinámicamente en memoria sumando exclusivamente pagos en estado `APROBADO`:
- **`PENDIENTE`:** Total abonado aprobado = $0.
- **`PARCIAL`:** Total abonado aprobado > $0 y < Tarifa de la etapa.
- **`PAGADO`:** Total abonado aprobado >= Tarifa de la etapa.

### Pagos en Cuotas
Las familias pueden realizar pagos parciales sucesivos a lo largo de los meses hasta completar el total de la tarifa asignada.

---

## 4. Política de Hermanos y Transferencias Compartidas

1. **Estado Actual en Código:** La interfaz `/campamento/pagos` permite a una familia vincular un segundo hermano en una misma operación, desglosando los importes correspondientes a cada uno. El sistema genera dos registros en la tabla `pagos` (uno por hermano) con `estado = 'PENDIENTE'`, compartiendo la misma URL del comprobante respaldatorio en Storage.
2. **Requisito Pendiente (3 o más Hermanos):**
   - **Decisión Humana Definitiva:** El sistema debe soportar **3 o más hermanos** cubiertos por una misma transferencia y comprobante bancario.
   - **Estado:** Clasificado como **requisito pendiente de implementación futura** (no modificar el código en esta fase).

---

## 5. Coordinación y Seguridad por PIN

1. **Autenticación por Etapa:** El acceso a `/campamento/coordinacion` requiere seleccionar la etapa (1 a 7), elegir o ingresar el nombre del coordinador y tipear el PIN de etapa.
2. **PINs Iniciales:** Por defecto son `crv2027-e1` a `crv2027-e7` en la tabla `etapas_pines`.
3. **Cambio de PIN:** Los coordinadores pueden actualizar su PIN desde el dashboard de etapa ingresando el PIN actual y un nuevo PIN de al menos 6 caracteres.
4. **Almacenamiento en Texto Plano (Deuda Técnica Aceptada):**
   - **Decisión Humana Definitiva:** Los PINs se mantienen almacenados en texto plano en la tabla `etapas_pines` de Supabase por simplicidad operativa en esta etapa.
   - **Clasificación:** Deuda técnica de seguridad aceptada temporalmente.
5. **Auto-Registro de Coordinadores:** Los coordinadores escriben su nombre al iniciar sesión por primera vez; el sistema los registra automáticamente en `coordinadores_etapa` para que en futuras sesiones figuren como botones de selección rápida.
6. **Pagos Manuales:** Un coordinador puede cargar un pago recibido en efectivo o canal externo desde el modal del participante. Estos pagos se insertan de forma inmediata como `estado = 'APROBADO'` y `subido_por = 'COORDINADOR'`.
