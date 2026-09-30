# Módulo Buzos 2027 (CAMREVOC)

El módulo de **Buzos 2027** gestiona la elección democrática del diseño único y oficial que utilizarán todos los animadores y coordinadores de CAMREVOC (Casa Salesiana Don Bosco Neuquén).

---

## 1. Principio Fundamental de Negocio

- **Elección Colectiva Única:** La votación define **un único diseño** para toda la comunidad de animadores y coordinadores. No es una selección individual de indumentaria por persona.
- **Acceso Directo por DNI:** Cada animador/coordinador ingresa únicamente su número de DNI (7 a 9 dígitos). No se requiere precarga de un padrón estricto ni login con contraseñas para los votantes.
- **Un Voto Activo por DNI:** Cada número de DNI cuenta con un único registro en la base de datos (`buzos_votos`). Si el votante vuelve a ingresar mientras la votación permanezca abierta, recupera su voto y puede modificar cualquier elección antes del cierre.
- **Alcance V1:** Esta versión abarca exclusivamente la votación y el cómputo de resultados. No incluye pagos, pedidos, saldos a favor ni talles (reservados para etapas posteriores).

---

## 2. Catálogo de Opciones y Flujo de Votación

El wizard de votación opera en las siguientes etapas secuenciales:

### Paso 0: Identificación por DNI
- La persona ingresa su DNI numérico.
- El servidor verifica si ya existe un voto registrado para ese DNI.
- Si existe, se cargan sus elecciones previas en pantalla para facilitar su revisión o edición.

### Paso 1: Frente del Buzo
Existen dos tipos de propuestas en `public/Buzos/Delante/`:
1. **Diseños SIN frase:** (`DONBOSCO MANGA.png`, `CRV MANGA.png`).
   - Poseen el logo institucional en el pecho y distintivo en manga.
   - **Regla:** Habilitan el **Paso 2 (Espalda)** para que la persona elija qué frase/diseño posterior prefiere.
2. **Diseños CON frase:** (`FRASE 1.png`, `FRASE 3.png`, `FRASE 4.png`, `FRASE 5.png`, `FRASE 6.png`, `FRASE 7.png`, `FRENTE 8.png`).
   - Ya contienen el lema o tipografía estampada al frente.
   - **Regla:** Se omite automáticamente la elección de espalda (`atras = NULL`), avanzando directo a CRV en Manga.

### Paso 2: Espalda (Condicional)
- Disponible únicamente si en el Paso 1 se eligió un frente sin frase.
- Opciones en `public/Buzos/Atras/`:
  - `2.png`: «Siempre Alegres» con ilustración de Don Bosco en amarillo.
  - `3.png`: «El que no vive para servir...» (versión color azul/verde).
  - `4.png`: «El que no vive para servir...» (versión monocromo blanco).
  - `5.png`: «Siempre Alegres» con siluetas comunitarias.
  - `11.png`: «Las calles se vuelven patios...» (versión blanco).
  - `12.png`: «Las calles se vuelven patios...» (versión verde y azul).
  - `CRV MANGA.png`: «Las calles se vuelven patios...» con vista de manga.

### Paso 3: Logo CRV en Manga (Votación Independiente)
- Pregunta: *«¿Querés agregar el logo CRV en la manga?»*
- Opciones: **Sí** / **No**.
- Esta elección es independiente de los mockups seleccionados en frente o espalda.

### Paso 4: Color Oficial del Buzo
- Opciones en `public/Buzos/Colores/`:
  - **Petróleo** (`#2F5D7C`)
  - **Malbec** (`#6B213F`)
  - **Marino** (`#101827`)
  - **Negro** (`#111111`)
- Muestra el círculo de color real de la tela y su nombre.

### Paso 5: Confirmación
- Resumen visual con imágenes y textos obligatorios:
  - *«El resultado de esta votación define un único diseño para todos los buzos 2027.»*
  - *«Podés modificar tu voto mientras la votación esté abierta.»*
- Al confirmar, se realiza un `upsert` atómico en la base de datos y se muestra la pantalla de agradecimiento sin revelar cómputos ni porcentajes a los votantes.

---

## 3. Cierre de la Votación

- Configurable de manera centralizada en [`src/config/buzos.ts`](file:///mnt/HDD/proyectos/camrevoc-pollos/src/config/buzos.ts):
  - `BUZOS_CONFIG.fechaCierreISO`: fecha y hora límite en huso horario de Argentina (`-03:00`).
  - `BUZOS_CONFIG.fechaCierreTexto`: texto para avisos en pantalla.
  - `BUZOS_CONFIG.forzarCierreManual`: switch de emergencia.
- **Validación del lado servidor:** [`src/app/buzos/actions/voto-actions.ts`](file:///mnt/HDD/proyectos/camrevoc-pollos/src/app/buzos/actions/voto-actions.ts) valida la expiración en cada solicitud, bloqueando altas o ediciones una vez cumplida la fecha.

---

## 4. Panel de Administración y Resultados (`/buzos/admin`)

- **Ruta:** `/buzos/admin` (con login en `/buzos/admin/login`).
- **Autenticación:** Protegido por contraseña mediante la variable de entorno `BUZOS_ADMIN_PASSWORD` (con fallback a `ADMIN_PASSWORD`).
- **Visualización:**
  - Cantidad total de votantes únicos (DNI).
  - Resultados clasificados por Frente (votos y %).
  - Resultados clasificados por Espalda (votos y %, con mención a quienes omitieron por frente con frase).
  - Resultados de Logo en Manga (Sí vs. No con barras comparativas).
  - Resultados clasificados por Color (votos y %).
  - Tabla de auditoría con el detalle de cada voto y fecha de última modificación.
