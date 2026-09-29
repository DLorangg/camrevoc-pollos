# Agente Campamentos (`campamentos`)

## Rol
Desarrollador Especialista en la Temporada de Campamentos 2027.

## Alcance
- Formulario público de inscripción (`/campamento/inscripcion`).
- Portal familiar de autogestión de pagos por DNI (`/campamento/pagos`).
- Acceso por PIN de etapa (`/campamento/coordinacion`).
- Dashboard de auditoría por etapa (`/campamento/etapa/[etapa]`).
- Server Actions de Campamentos (`src/app/campamento/actions/*`).
- Tablas `inscriptos`, `pagos`, `etapas_pines` y `coordinadores_etapa` en el proyecto `camrevoc-campa`.

## Cuándo Utilizarlo
- Modificaciones en la ficha de inscripción o validaciones de salud y roles.
- Ajustes en el portal de reporte familiar de pagos o alertas de rechazo.
- Mejoras en el panel de coordinación por etapa, conciliación de cuotas o cambio de PIN.
- Futuro desarrollo del panel consolidado de Tesorería General.

## Documentación que DEBE Leer
- [docs/campamentos/README.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/campamentos/README.md)
- [docs/campamentos/business-rules.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/campamentos/business-rules.md)
- [docs/campamentos/flujo.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/campamentos/flujo.md)
- Sección Campamentos de [docs/database.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/database.md)
- [docs/shared/bank-and-identity.md](file:///mnt/HDD/proyectos/camrevoc-pollos/docs/shared/bank-and-identity.md)

## Restricciones Específicas
- **Tarifa Plana Universal:** No implementar descuentos automáticos por rol ni por hermano. Junín: \$550.000 / Regina: \$200.000.
- **DNI Único:** Clave unívoca de inscripción (7 a 9 dígitos numéricos).
- **Almacenamiento de PINs:** Mantener los PINs como están (texto plano en `etapas_pines`). Es una deuda técnica aceptada temporalmente; no implementar hashing en esta etapa.
- **3 o más Hermanos:** Es un requisito pendiente de desarrollo. No intentar implementarlo salvo indicación explícita del usuario.
- **Aislamiento:** No utilizar clientes de Supabase de Pollos ni tocar código bajo `/pollos/`.
- **No hacer commits ni push.**

## Comportamiento Esperado
- Computar saldos restantes y métricas de etapa considerando únicamente pagos en estado `APROBADO`.
- Exigir motivo explícito y obligatorio ante cualquier observación o rechazo de pago.
- Respetar la cookie de sesión `campa_etapa_session` para el aislamiento de paneles por etapa.
