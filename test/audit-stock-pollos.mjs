import assert from "node:assert";

console.log("==================================================================");
console.log("SUITE DE PRUEBAS: AUDITORÍA DE CIERRE DE POLLOS POR STOCK");
console.log("==================================================================\n");

const STOCK_MAXIMO = 288;

// Mock de base de datos en memoria para simular pedidos
class MockPedidosDB {
  constructor(initialRows = []) {
    this.rows = JSON.parse(JSON.stringify(initialRows));
    this.lockActive = false;
  }

  // Simula consulta de stock de stock-pollos.ts
  async obtenerStock(simularFallo = false) {
    if (simularFallo) {
      return { ok: false, error: "Conexión rechazada por timeout de red." };
    }
    const ocupados = this.rows
      .filter((r) => (r.estado_pago || "Pendiente") !== "Rechazado")
      .reduce((sum, r) => sum + r.cantidad_total, 0);
    const restante = Math.max(0, STOCK_MAXIMO - ocupados);
    return {
      ok: true,
      stockMaximo: STOCK_MAXIMO,
      stockOcupado: ocupados,
      stockRestante: restante,
      stockAgotado: restante <= 0,
    };
  }

  // Simula el Trigger PostgreSQL con advisory lock
  async insertPedidoWithTrigger(newRow) {
    // 1. Validaciones defensivas de cantidad y estado nulos
    if (newRow.cantidad_total === null || newRow.cantidad_total === undefined || newRow.cantidad_total <= 0) {
      throw new Error("ERROR_SQL_23514: La cantidad de pollos debe ser un número entero mayor a 0");
    }

    const estado = newRow.estado_pago || "Pendiente";

    // 2. Lock consultivo transaccional
    if (estado !== "Rechazado") {
      // Simula espera si hay otro proceso con el lock
      while (this.lockActive) {
        await new Promise((res) => setTimeout(res, 5));
      }
      this.lockActive = true;

      try {
        const ocupados = this.rows
          .filter((r) => (r.estado_pago || "Pendiente") !== "Rechazado")
          .reduce((sum, r) => sum + r.cantidad_total, 0);

        if (ocupados + newRow.cantidad_total > STOCK_MAXIMO) {
          throw new Error(
            `STOCK_AGOTADO: No hay stock suficiente de pollos. Solicitados: ${newRow.cantidad_total}, disponibles: ${Math.max(0, STOCK_MAXIMO - ocupados)}`
          );
        }

        const id = newRow.id || `ped-${Date.now()}-${Math.random()}`;
        const inserted = { ...newRow, id, estado_pago: estado };
        this.rows.push(inserted);
        return inserted;
      } finally {
        this.lockActive = false;
      }
    } else {
      const id = newRow.id || `ped-${Date.now()}-${Math.random()}`;
      const inserted = { ...newRow, id, estado_pago: estado };
      this.rows.push(inserted);
      return inserted;
    }
  }

  // Simula UPDATE con Trigger (id != NEW.id)
  async updatePedidoWithTrigger(id, patch) {
    const idx = this.rows.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Pedido no encontrado");

    const oldRow = this.rows[idx];
    const newRow = { ...oldRow, ...patch };

    if (newRow.cantidad_total === null || newRow.cantidad_total === undefined || newRow.cantidad_total <= 0) {
      throw new Error("ERROR_SQL_23514: La cantidad de pollos debe ser un número entero mayor a 0");
    }

    const estado = newRow.estado_pago || "Pendiente";

    if (estado !== "Rechazado") {
      while (this.lockActive) {
        await new Promise((res) => setTimeout(res, 5));
      }
      this.lockActive = true;

      try {
        // Excluye id != NEW.id
        const ocupadosOtros = this.rows
          .filter((r) => r.id !== id && (r.estado_pago || "Pendiente") !== "Rechazado")
          .reduce((sum, r) => sum + r.cantidad_total, 0);

        if (ocupadosOtros + newRow.cantidad_total > STOCK_MAXIMO) {
          throw new Error(
            `STOCK_AGOTADO: No hay stock suficiente para actualizar pedido. Solicitados: ${newRow.cantidad_total}, disponibles: ${Math.max(0, STOCK_MAXIMO - ocupadosOtros)}`
          );
        }

        this.rows[idx] = newRow;
        return newRow;
      } finally {
        this.lockActive = false;
      }
    } else {
      this.rows[idx] = newRow;
      return newRow;
    }
  }
}

async function runTests() {
  // Inicializamos con el estado de producción: 269 pollos ocupados en 172 pedidos
  const db = new MockPedidosDB([
    { id: "ped-1", cantidad_total: 269, estado_pago: "Aprobado" },
  ]);

  // PRUEBA 1: Stock disponible y compra válida
  console.log("PRUEBA 1: Stock disponible y compra válida (pedido de 5 sobre 19)");
  const s1 = await db.obtenerStock();
  assert.strictEqual(s1.ok, true);
  assert.strictEqual(s1.stockRestante, 19);
  const ins1 = await db.insertPedidoWithTrigger({ cantidad_total: 5 });
  assert.strictEqual(ins1.cantidad_total, 5);
  const s1b = await db.obtenerStock();
  assert.strictEqual(s1b.stockRestante, 14);
  console.log("  ✓ Pasa: Compra de 5 aceptada, stock restante bajó a 14.\n");

  // PRUEBA 2: Compra exacta del remanente
  console.log("PRUEBA 2: Compra exacta del remanente (pedido de 14 sobre 14)");
  const ins2 = await db.insertPedidoWithTrigger({ cantidad_total: 14 });
  assert.strictEqual(ins2.cantidad_total, 14);
  const s2 = await db.obtenerStock();
  assert.strictEqual(s2.stockRestante, 0);
  assert.strictEqual(s2.stockAgotado, true);
  console.log("  ✓ Pasa: Compra exacta aceptada, stock restante es 0 y stockAgotado es true.\n");

  // PRUEBA 3: Pedido con stock agotado
  console.log("PRUEBA 3: Intento de compra con stock agotado (pedido de 1 sobre 0)");
  let errorAgotado = null;
  try {
    await db.insertPedidoWithTrigger({ cantidad_total: 1 });
  } catch (err) {
    errorAgotado = err.message;
  }
  assert.match(errorAgotado, /STOCK_AGOTADO/);
  console.log("  ✓ Pasa: Rechazado inmediatamente con mensaje:", errorAgotado, "\n");

  // PRUEBA 4: Rechazo de pedidos y liberación de stock
  console.log("PRUEBA 4: Rechazo administrativo de un pedido y liberación de stock");
  await db.updatePedidoWithTrigger(ins2.id, { estado_pago: "Rechazado" });
  const s4 = await db.obtenerStock();
  assert.strictEqual(s4.stockRestante, 14);
  assert.strictEqual(s4.stockAgotado, false);
  console.log("  ✓ Pasa: El pedido de 14 fue rechazado y liberó exactamente 14 unidades.\n");

  // PRUEBA 5: Pedido superior al stock restante
  console.log("PRUEBA 5: Pedido superior al stock restante (pedido de 15 sobre 14)");
  let errorExcedente = null;
  try {
    await db.insertPedidoWithTrigger({ cantidad_total: 15 });
  } catch (err) {
    errorExcedente = err.message;
  }
  assert.match(errorExcedente, /STOCK_AGOTADO/);
  console.log("  ✓ Pasa: Rechazado correctamente:", errorExcedente, "\n");

  // PRUEBA 6: Error de consulta de stock
  console.log("PRUEBA 6: Simulación de error al consultar stock en Supabase");
  const sError = await db.obtenerStock(true);
  assert.strictEqual(sError.ok, false);
  assert.strictEqual(typeof sError.error, "string");
  console.log("  ✓ Pasa: stock-pollos.ts retorna ok: false con mensaje:", sError.error, "\n");

  // PRUEBA 7: Actualización de un pedido existente
  console.log("PRUEBA 7: Actualización de datos de un pedido sin duplicar stock (id != NEW.id)");
  // Actualizamos el pedido ins1 (que tenía 5) para cambiar su cobrador o cantidad a 6
  await db.updatePedidoWithTrigger(ins1.id, { cantidad_total: 6 });
  const s7 = await db.obtenerStock();
  // Había 269 base + 6 de ins1 = 275 ocupados -> 13 restantes
  assert.strictEqual(s7.stockOcupado, 275);
  assert.strictEqual(s7.stockRestante, 13);
  console.log("  ✓ Pasa: Modificación de 5 a 6 pollos computada correctamente sin duplicación (restan 13).\n");

  // PRUEBA 8: Validación defensiva contra NULL en el trigger
  console.log("PRUEBA 8: Validación defensiva de cantidad NULL o negativa");
  let errNull = null;
  try {
    await db.insertPedidoWithTrigger({ cantidad_total: null });
  } catch (err) {
    errNull = err.message;
  }
  assert.match(errNull, /ERROR_SQL_23514/);
  console.log("  ✓ Pasa: Inserción con cantidad NULL rechazada por validación defensiva.\n");

  // PRUEBA 9: Concurrencia de solicitudes simultáneas en entorno aislado
  console.log("PRUEBA 9: Dos solicitudes simultáneas compitiendo por 13 pollos restantes (10 cada una)");
  // Restan 13 pollos. Dos clientes intentan comprar 10 pollos en paralelo
  const resultados = await Promise.allSettled([
    db.insertPedidoWithTrigger({ cantidad_total: 10 }),
    db.insertPedidoWithTrigger({ cantidad_total: 10 }),
  ]);

  const exitosos = resultados.filter((r) => r.status === "fulfilled");
  const fallidos = resultados.filter((r) => r.status === "rejected");

  assert.strictEqual(exitosos.length, 1, "Exactamente una solicitud debe tener éxito");
  assert.strictEqual(fallidos.length, 1, "Exactamente una solicitud debe ser rechazada");
  assert.match(fallidos[0].reason.message, /STOCK_AGOTADO/);

  const sFinal = await db.obtenerStock();
  assert.strictEqual(sFinal.stockOcupado, 285);
  assert.strictEqual(sFinal.stockRestante, 3);
  assert.ok(sFinal.stockOcupado <= STOCK_MAXIMO, "Nunca debe excederse el stock máximo de 288");
  console.log("  ✓ Pasa: 1 compra aceptada (10 pollos) y 1 rechazada por STOCK_AGOTADO.");
  console.log("    Total acumulado en DB:", sFinal.stockOcupado, "de 288 (Restan 3 pollos).");

  console.log("\n==================================================================");
  console.log("✓ TODAS LAS 9 PRUEBAS EJECUTADAS PASARON SATISFACTORIAMENTE");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Fallo en suite de pruebas:", err);
  process.exit(1);
});
