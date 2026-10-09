# Reglas de Negocio — Convivencia Familiar 2026

1. **Inscripción por familia.** Una inscripción agrupa a todos los integrantes; no hay inscripciones individuales por persona. Sin cupo máximo ni máximo de integrantes.
2. **Costo y pago (tarifa escalonada).** Depende de la cantidad total de integrantes inscriptos: 1 integrante = **$5.000**; 2 = **$10.000**; 3 o más = **$15.000 en total** (fijo, sin importar cuántos sean). Fórmula única en `calcularPrecioConvivencia()` (`src/config/convivencia.ts`). El formulario muestra el total en vivo al agregar/quitar integrantes; el servidor lo recalcula a partir de lo registrado y **nunca confía en un total enviado por el navegador**; el precio no se guarda en la base. Pago obligatorio **en efectivo el día de la actividad**. La web no registra pagos, comprobantes ni saldos.
3. **Titular = persona vinculada a CAMREVOC.** El primer integrante es quien se vincula directamente con CAMREVOC y puede ser de cualquier edad. Datos obligatorios: nombre, apellido, DNI, edad y etapa (1ra a 7ma Etapa o `Animador/a`).
4. **Integrantes adicionales.** Cantidad ilimitada. Obligatorios: nombre, apellido, DNI, edad y parentesco con el titular. La pertenencia a CAMREVOC **no se infiere** del parentesco: tienen un selector opcional de etapa (vacío = no pertenece).
5. **DNI.** Se normaliza quitando puntos, espacios y guiones y debe tener 7 a 9 dígitos (mismo criterio que Campamentos/Buzos). No puede repetirse dentro de una misma familia. Puede repetirse entre inscripciones distintas (no se bloquea); el panel lo señala como «DNI repetido».
6. **Edad.** Entero de 0 a 120. Menor de edad: menos de 18.
7. **Salud.** Observaciones de salud opcionales por integrante (máx. 500 caracteres). Se pregunta a **cada integrante** (titular y adicionales) «¿Es celíaco/a?» (Sí/No obligatorio, se guarda en el registro de esa persona). El dato familiar anterior (`hay_celiaco`) es obsoleto: no se usa en inscripciones nuevas. No se promete ni se menciona ningún alimento alternativo.
8. **Menores.** Para cada menor se pregunta si asiste acompañado por un adulto de su familia (obligatorio).
   - Si responde «No»: aviso de que debe presentar una **autorización firmada** (documento pendiente) y el contacto de emergencia (nombre, vínculo y teléfono) es **obligatorio**.
   - Si responde «Sí»: el contacto de emergencia es opcional, pero si se completa debe estar completo.
   - Para adultos no se guardan estos datos.
9. **No se solicita** teléfono ni correo del titular.
10. **Cierre.** Las inscripciones cierran el **viernes 16 de octubre de 2026 a las 23:59:59 (`America/Argentina/Buenos_Aires`)**. Se controla con el reloj del servidor en la página y en la Server Action. Pasado el plazo se muestra «Las inscripciones a la Convivencia Familiar finalizaron.» y se rechazan envíos, aunque la página haya quedado abierta. Fecha configurable en `src/config/convivencia.ts`.
11. **Consulta tras el cierre.** El panel de coordinación sigue mostrando todas las inscripciones después del cierre.
12. **Sin duplicados por reintento.** Cada envío lleva una clave de idempotencia; reintentar el mismo envío devuelve la inscripción ya creada.
13. **Éxito solo si hubo persistencia.** La pantalla de confirmación aparece únicamente cuando la base confirmó el registro.
