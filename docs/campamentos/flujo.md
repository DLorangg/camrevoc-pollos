# Flujo Operativo y de Coordinación — Campamentos 2027

Este documento detalla el flujo de inscripción familiar, el circuito de reporte y auditoría de pagos, y la operatoria del panel de coordinación por etapa.

---

## 1. Diagrama del Circuito de Campamentos

```mermaid
flowchart TD
    %% Actores
    FAM(["👨‍👩‍👧 Familia / Participante"])
    COORD(["🧑‍💼 Coordinador de Etapa\n(/campamento/coordinacion)"])
    SIST(["⚙️ Sistema Supabase Campa"])

    %% Paso 1: Inscripción
    subgraph P1["PASO 1 — Inscripción Pública (/campamento/inscripcion)"]
        A1["Ingresa DNI, Nombre, Apellido"]
        A2["Selecciona Etapa y Rol"]
        A3["Sistema asigna Destino y Tarifa\n(Junín $550k / Regina $200k)"]
        A4["Declara Régimen Alimentario\ny Dificultad de Pago"]
        A5["Envía inscripción"]
        A6["Validación: DNI único"]
        A7["Confirmación visual en pantalla\n(sin envío de emails)"]
    end

    %% Paso 2: Autogestión de Pagos
    subgraph P2["PASO 2 — Reporte de Pago Familiar (/campamento/pagos)"]
        B1["Familia ingresa DNI del participante"]
        B2["Sistema muestra saldo restante\ny alerta si hay pago previo rechazado"]
        B3["Opcional: Suma segundo hermano\ny desglosa montos parciales"]
        B4["Adjunta comprobante bancario (imagen/PDF)"]
        B5["Envía formulario de pago"]
        B6["Comprobante sube a 'comprobantes-campa'\nPago queda en estado PENDIENTE\n(No modifica el saldo aún)"]
    end

    %% Paso 3: Auditoría por Coordinación
    subgraph P3["PASO 3 — Auditoría (/campamento/etapa/[etapa])"]
        C1["Coordinador ingresa con PIN de su etapa"]
        C2["Entra a pestaña 'Pagos pendientes'"]
        C3["Abre y revisa comprobante adjunto"]
        C4{"¿Pago válido?"}
        C5["✅ Aprobar Pago:\nImpacta en saldo y métricas"]
        C6["❌ Observar / Rechazar:\nIngresa motivo obligatorio"]
        C7["Botón WhatsApp directo con la familia"]
        C8["Pestaña 'Rechazados':\nPermite 'Reconsiderar / Aprobar'"]
    end

    FAM --> A1 --> A2 --> A3 --> A4 --> A5 --> A6 --> A7
    A7 -.->|"Transfiere al banco"| B1
    FAM --> B1 --> B2 --> B3 --> B4 --> B5 --> B6
    B6 --> SIST
    SIST --> C1 --> C2 --> C3 --> C4
    C4 -->|Sí| C5
    C4 -->|No| C6 --> C7
    C6 --> C8
```

---

## 2. Detalle de los Circuitos

### Circuito 1: Inscripción Pública (/campamento/inscripcion)
1. **Lectura y Condiciones:** La pantalla exhibe las fechas oficiales de campamento, cronograma de carga de camiones para Junín y Regina, y los datos bancarios del Santander con botones de copiado rápido (`GRUPOSDBNQN`).
2. **Carga de Datos:** La familia ingresa apellido, nombre y DNI (numérico, sin puntos).
3. **Asignación Automática:** Al elegir la etapa (1ra a 7ma), la interfaz calcula y muestra en tiempo real el destino y la tarifa plana.
4. **Validación de Unicidad:** Se ejecuta `inscribirParticipante`. Si el DNI ya existe, se rechaza la operación informando en pantalla. Si no existe, se inserta en `inscriptos`.
5. **Confirmación:** Muestra el resumen y recuerda guardar el comprobante de pago. No se envían correos electrónicos.

### Circuito 2: Reporte Familiar de Pagos (/campamento/pagos)
1. **Identificación y Consulta de Saldo:** La familia ingresa el DNI del participante. El sistema busca la ficha y presenta: Nombre, Etapa, Destino, Total ya abonado (solo pagos aprobados) y Saldo pendiente.
2. **Alerta de Pagos Rechazados:** Si el participante posee pagos observados previamente por coordinación, se destaca un recuadro de advertencia con la fecha y el motivo exacto del rechazo.
3. **Flujo de Hermanos:** La familia puede activar la opción de incluir a un hermano en la misma transferencia. Al ingresar el DNI del segundo hijo, se valida su ficha y se habilita un desglose de importes parciales (ej: \$100.000 para el hijo 1 y \$100.000 para el hijo 2).
4. **Subida y Persistencia:** Se adjunta el archivo (imagen o PDF hasta 10 MB) y teléfono de contacto. El Server Action `subirPagoFamilia` sube el archivo a Storage y crea los registros en `pagos` con `estado = 'PENDIENTE'` y `subido_por = 'FAMILIA'`. El saldo restante no se descuenta hasta que coordinación audite el comprobante.

### Circuito 3: Auditoría en el Portal de Coordinación
1. **Acceso por Etapa (`/campamento/coordinacion`):**
   - El coordinador selecciona su etapa (1 a 7).
   - Elige su nombre de la lista de chips existentes o ingresa un nombre nuevo (auto-registro en `coordinadores_etapa`).
   - Tipea el PIN de la etapa.
   - Si la etapa conserva el PIN default (`crv2027-e[X]`), se muestra un banner amarillo recomendando el cambio de contraseña desde el modal integrado.
2. **Pestaña Pagos Pendientes:**
   - Exhibe tarjetas con participante, DNI, monto informado, teléfono y enlace directo al archivo de comprobante.
   - **Aprobar:** Cambia el registro a `APROBADO`. En ese instante el monto se deduce del saldo restante del participante y se actualizan las métricas de recaudación de la etapa.
   - **Observar / Rechazar:** Abre un modal donde el coordinador escribe la causa del rechazo (ej: "No coincide el importe", "Comprobante ilegible"). El pago pasa a `RECHAZADO`.
   - **Contacto Directo:** Botón de WhatsApp con texto preconfigurado mencionando el participante y el motivo para contactar rápidamente a la familia.
3. **Pestaña Rechazados:**
   - Muestra el historial de pagos observados. Cuenta con la acción *"Reconsiderar / Aprobar"* para subsanar rechazos involuntarios.
4. **Carga Manual de Pagos:**
   - Desde el padrón de inscriptos, el coordinador puede presionar *"Gestionar Pagos"* sobre cualquier participante e ingresar pagos en efectivo o fuera de plataforma. Estos se registran inmediatamente como `APROBADO` con `subido_por = 'COORDINADOR'`.
