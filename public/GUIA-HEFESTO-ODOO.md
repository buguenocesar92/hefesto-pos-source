# Hefesto POS 2.1 — Operación y transición a Odoo

## Qué contiene esta versión
- Ventas: productos por nombre/SKU/código de barras, cantidades fraccionarias hasta 3 decimales, descuento global, efectivo con vuelto, tarjeta, transferencia, fiado y combinación de efectivo/tarjeta/transferencia.
- Ventas en espera persistidas en servidor; retomar sin reservar stock, validar precios actuales al cobrar, retirar automáticamente al completar.
- Catálogo editable, archivo de productos, movimientos y conteos físicos con diferencias auditadas; lista CSV de reposición (sugerencia: reponer hasta dos veces el mínimo).
- Proveedores, órdenes de compra, cancelación de borradores, recepción completa única, costo promedio ponderado, saldo por pagar y registro de transferencias externas.
- Clientes, límites de crédito, fiados y abonos en efectivo.
- Apertura/cierre de caja, diferencias y entradas/salidas manuales.
- Anulación completa de ventas en su caja original abierta; devoluciones parciales/totales en la caja actualmente abierta con reposición y trazabilidad.
- Informes por período chileno, pagos, devoluciones, margen bruto histórico y cantidades por producto.
- Comprobantes internos imprimibles, exportaciones CSV/JSON, guía y código fuente descargable.

## Reglas monetarias propias
Pesos chilenos enteros. Los precios son finales; no se desglosan impuestos. Subtotal de cada línea redondeado al peso; descuento global en pesos. Stock negativo bloqueado. Un pago combinado debe sumar exactamente el total, sin vuelto; no combina fiado. El sistema registra tarjeta/transferencia pero no procesa pagos.

Las devoluciones conservan el precio y costo originales. El descuento se distribuye proporcionalmente a las líneas mediante diferencias acumuladas para preservar el total al devolver todo. Los reembolsos no pueden superar el importe disponible del medio original. Para una venta combinada, puede ser necesario dividir la devolución en varias operaciones por medio. El fiado devuelto reduce deuda, pero se bloquea si produciría saldo negativo después de abonos. Cada devolución permite elegir buen estado (repone stock) o dañados (no repone existencias vendibles). El destino se aplica a todas sus líneas; separa devoluciones si los estados difieren. El margen conserva el costo histórico de las unidades dañadas. La bitácora de stock registra la devolución dañada con cantidad neta cero y la cantidad física en el motivo.

El efectivo esperado es: fondo + ventas cobradas en efectivo + abonos + ajustes - reembolsos en efectivo de esa sesión. Una devolución posterior no modifica cierres anteriores. Las compras/pagos a proveedores no mueven efectivo de caja: el pago de proveedor es registro de transferencia bancaria externa. No se permite anular una venta con devoluciones; se devuelve lo pendiente.

Las compras nacen en borrador, sin efectos de stock/deuda. La recepción completa aplica una única vez existencias y costo promedio. La cancelación solo está permitida antes de recibir. No hay recepción parcial, devolución a proveedor ni imputación del pago a una factura específica: los pagos reducen el saldo agregado del proveedor.

## Seguridad de operaciones y persistencia
Cloudflare D1 mantiene un agregado JSON con versión. Las operaciones se validan en servidor y se guardan con compare-and-swap; un conflicto devuelve 409 sin sobrescribir cambios. La deduplicación por requestId se comprueba antes de validar la versión. El cliente guarda el carrito y la operación pendiente (acción, identificador y versión original) en sessionStorage antes del envío. Al recargar la misma pestaña comprueba si el servidor ya procesó el identificador, recuperando el comprobante sin repetir el cobro. Los reintentos conservan la versión original: una operación desactualizada se rechaza con 409 para revisión. Se impiden otras escrituras mientras exista una pendiente. El navegador debe permitir guardar la recuperación antes de enviar. Se advierte antes de salir con carrito activo. No es una cola offline: requiere internet y no garantiza recuperación al cerrar definitivamente la pestaña, borrar sus datos o usar otro dispositivo. No se guarda una copia local de la base completa.

La publicación sigue siendo privada para el propietario. No hay cuentas/roles de empleados ni multiempresa. Los datos anteriores se conservan; las nuevas colecciones se inicializan vacías sin reiniciar la información. Los productos de demostración originales siguen disponibles.

## Arquitectura / código
React + Vinext, Workers y D1. Fuente descargable desde Migración a Odoo, sin credenciales ni binarios de eleventa. El ZIP es fuente editable, no un instalador de Odoo ni un backup de datos.
- app/page.tsx: operación y navegación.
- components/operations.tsx: compras, proveedores, devoluciones e informes.
- lib/pos.ts y lib/advanced.ts: reglas de negocio.
- app/api/pos/route.ts: validación y control optimista de concurrencia.
- db/schema.ts / drizzle/: esquema y migración.
- tests/: escenarios de consistencia.

El almacenamiento agregado es adecuado para este piloto pequeño. Para alto volumen: normalizar tablas, paginar, separar auditoría inmutable, añadir organizaciones/cajas, permisos, respaldos automáticos y pruebas de carga. No se afirma disponibilidad ni rendimiento de producción.

## Exportaciones y corte a Odoo
El respaldo JSON v2 contiene productos, clientes, ventas/líneas/medios, devoluciones, movimientos, cajas, abonos, proveedores, compras, pagos a proveedores, ventas en espera, bitácora, configuración e IDs de operaciones. No hay restauración automática. Los CSV adicionales separan existencias actuales, saldos de clientes, saldos de proveedores y sesiones de caja, para conciliar el corte. Son archivos de conciliación, no importadores contables.

CSV de productos/contactos: campos de referencia con IDs externos estables. Validar nombres de columnas, unidades, categorías, impuestos y RUT contra la versión destino. CSV de reportes es analítico. Ninguno de estos archivos importa automáticamente movimientos contables.

1. Confirmar versión/edición de Odoo y módulos/localización chilena. Definir si Hefesto será marca sobre Odoo o aplicación conectada.
2. Preparar una instancia de pruebas; mapear compañía, productos, contactos, unidades, categorías, cuentas, diarios, impuestos y ubicaciones. Evitar crear referencias duplicadas.
3. Importar catálogos por ID externo y conciliar SKU/código/contactos.
4. Fijar fecha de corte, cerrar cajas y detener escrituras. Exportar copia final y conservarla.
5. Migrar existencias por ubicación como apertura. Separar saldos de clientes/proveedores del histórico; no duplicar deuda importando además documentos que la generen.
6. Decidir si el histórico queda consultable o se transforma con un adaptador específico. Ventas, devoluciones, compras y pagos requieren conciliación, no solo copiar columnas.
7. Conciliar cantidades por producto, importes por medio, devoluciones, saldos por contraparte y efectivo. Validar antes de activar operación real.
8. Para coexistencia, implementar outbox, claves idempotentes, reintentos y propietario único de cada dato. No hay conector activo en esta entrega.

## Validación / límites
Pruebas automáticas: stock, pagos insuficientes, descuentos, idempotencia, créditos, caja, anulaciones, recepciones únicas, costo promedio, deuda de proveedores, pagos combinados, ventas en espera y devoluciones con límites por medio y cantidad. Verificación TypeScript y compilación de cliente/servidor. La revisión visual e interacción en navegador no está disponible en el entorno de creación.

Pendientes antes de producción: SII, impuestos fiscales, roles/empleados, multiempresa/sucursales/cajas, devolución de productos dañados, compras con recepciones parciales, conciliación bancaria, pagos automáticos, backup/restauración probada, offline, periféricos y conector Odoo. La interfaz de impresión usa el navegador. No se anuncia equivalencia exacta con eleventa.

## Cambios 2.1 y comprobación
Recuperación de pestaña, reintentos con versión original, devoluciones dañadas, exportaciones de corte, SKU/códigos normalizados antes de detectar duplicados y redondeo de anulaciones fraccionarias. Las reglas trabajan sobre una copia y solo actualizan el estado al completar una operación válida. `tests/recovery.test.mjs` comprueba reintento persistido sin duplicación, rechazo atómico, redondeo, devoluciones dañadas y validación de recuperación. Se preservan las limitaciones de SII, roles, offline completo y conexión real con Odoo.
