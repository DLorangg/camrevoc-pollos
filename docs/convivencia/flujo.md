# Flujo Funcional — Convivencia Familiar 2026

## 1. Inscripción (público, `/convivencia`)

1. La familia ve la información (fecha, horario, lugar, costo, pago en efectivo, qué llevar).
2. Completa los datos de la **persona vinculada a CAMREVOC** y, con «Agregar integrante», al resto de la familia (sin límite; se pueden quitar).
3. Para cada menor responde si va acompañado por un adulto de su familia; si no, ve el aviso de autorización firmada (pendiente) y completa el contacto de emergencia.
4. Responde, para cada integrante, «¿Es celíaco/a?». El formulario muestra el total a abonar según la cantidad de integrantes ($5.000 / $10.000 / $15.000 desde 3) y lo actualiza al agregar o quitar personas.
5. «Inscribir a mi familia»: el cliente valida (feedback temprano) y llama a la Server Action `createInscripcionConvivencia`.
6. El servidor: (a) verifica el plazo, (b) revalida todo, (c) llama a `convivencia_registrar_inscripcion` (transacción atómica e idempotente).
7. Si la base confirma → pantalla de éxito (cantidad de integrantes, total a abonar calculado por el servidor, fecha/horario/lugar, recordatorio de pago en efectivo, qué llevar). Si falla → mensaje de error indicando que **no** se guardó; reintentar reutiliza la misma clave y no duplica.
8. El botón se deshabilita durante el envío (anti doble clic).

## 2. Cierre

- Hasta el vie 16/10/2026 23:59:59 ART el formulario está disponible.
- Después: `/convivencia` muestra el mensaje de cierre en lugar del formulario; la Server Action rechaza con el mismo mensaje. Si la pestaña estaba abierta, el envío devuelve «cerrada» y la UI pasa al mensaje de cierre.

## 3. Coordinación (`/convivencia/admin`)

1. Login con la contraseña de coordinación (`/convivencia/admin/login`); cookie `httpOnly` de 8 horas.
2. Panel: totales (familias, personas, personas celíacas, total a cobrar en efectivo, menores sin adulto), búsqueda por DNI o nombre/apellido, filtros (con celíacos [incluye inscripciones anteriores con dato familiar], menores sin adulto, con observaciones de salud, por etapa) y detalle desplegable por familia: fecha de creación, código corto (`#XXXXXXXX`), integrantes, respuesta individual de celiaquía, salud, acompañamiento de menores y contacto de emergencia.
3. Sin sesión válida, cualquier acceso redirige al login; la acción de consulta también verifica la sesión.
4. Disponible también después del cierre. Solo lectura (sin pagos, estados ni autorizaciones).
