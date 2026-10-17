# Hefesto POS 2.1

Aplicación privada de demostración con persistencia, ventas, caja, catálogo, stock, fiados, compras, proveedores y devoluciones. Código propio: no incluye ejecutables ni código de eleventa.

## Estructura
- `app/`: interfaz y endpoint del agregado de negocio.
- `lib/`: reglas y cálculos monetarios.
- `components/operations.tsx`: módulos ampliados y gráficos de informes.
- `db/` y `drizzle/`: esquema y migración de D1.
- `tests/`: escenarios de consistencia.
- `public/GUIA-HEFESTO-ODOO.md`: alcance, migración y limitaciones.

## Herramientas
Node >=22.13 y pnpm. Instalar dependencias con el lockfile proporcionado. El proyecto utiliza el runtime de Sites y el starter Vinext/Workers. `.openai/hosting.json` identifica el Site de origen: no publicar bajo ese ID desde otra cuenta. Para un nuevo despliegue, registrar un proyecto propio y configurar el binding D1 `DB` y sus migraciones con el flujo de esa plataforma.

## Verificación
```bash
node --experimental-strip-types tests/pos.test.mjs
node --experimental-strip-types tests/advanced.test.mjs
node --experimental-strip-types tests/recovery.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

La base guarda un agregado JSON con control de versión. Este diseño deberá normalizarse para producción de alto volumen. Los datos comerciales se descargan por separado desde la aplicación; el archivo de código fuente no contiene esos datos.

La publicación privada controla el acceso del propietario. No incluye gestión de empleados ni permisos de negocio. La aplicación no es un módulo Odoo y no emite documentos SII. Revisar la guía antes de migrar o utilizar con operaciones reales.

Versión 2.1: recuperación de carrito y operación pendiente al recargar la misma pestaña, devoluciones dañadas sin reposición, exportaciones de corte y validaciones de consistencia. Ver guía para límites de recuperación.
