# Registro de Ventas en Solana con PDAs


**Proyecto:** Aplicación de registro de ventas sobre Solana, basada en el proyecto guiado de [WayLearnLatam/Registro-Ventas-Solana-PDA](https://github.com/WayLearnLatam/Registro-Ventas-Solana-PDA).

- **Nombre:** Cesar Eduardo Albiter Castro
- **Correo de usuario:** [albitercesar11@gmail.com](mailto:albitercesar11@gmail.com)
- **Program ID (Devnet):** `9ftiFmp2SXUcxXSkvAsBtLzmJfKjFLksuyBQLSKrVqqs` · [Ver en Solana Explorer](https://explorer.solana.com/address/9ftiFmp2SXUcxXSkvAsBtLzmJfKjFLksuyBQLSKrVqqs?cluster=devnet)
- **Wallet de Phantom (dirección pública):** `5paw95QFudhAzEaQr5EWpL8xuEBmPV3Dq1Ym5PuU6un`

## Resumen del proyecto

Desarrollé una aplicación web para consultar y administrar un registro de ventas en Solana Devnet. El frontend, hecho con React y Vite, se conecta a una wallet para crear el registro del negocio, agregar clientes, registrar ventas, corregir importes y hacer devoluciones. Organicé el código del programa Anchor, sus pruebas, cliente e imágenes dentro de `programaBackend/` y adapté la interfaz para que use el Program ID indicado arriba. Las transacciones requieren aprobación de la wallet y utilizan SOL de prueba de Devnet.

## Propósito

Programa de Solana (Rust + Anchor) para un negocio pequeño: un **Registro** del negocio, sus **Clientes** y las **Ventas** de cada cliente. Cada cuenta es una PDA derivada de su padre:

```
registro <- ["registro", nombre_negocio, owner]
cliente  <- ["cliente",  registro, id_cliente (u16 LE)]
venta    <- ["venta",    cliente,  sku]
```

La pertenencia queda garantizada por las seeds y la autoridad por `has_one = owner`.

## Instrucciones del programa

| Instrucción | Qué hace |
| --- | --- |
| `crear_registro` | Crea el Registro del negocio. |
| `crear_cliente` | Alta de cliente; el programa asigna el id con `id_counter`. |
| `registrar_venta` | Crea la Venta y actualiza `historial` y `compras` del Cliente. |
| `cambiar_monto` | Corrige el monto de una Venta existente. |
| `hacer_devolucion` | Cierra la cuenta de la Venta (`close = owner`) y actualiza el Cliente. |
| `eliminar_cliente` | **Baja de cliente (sesión 5).** Solo si `historial` está vacío y `compras == 0`; cierra la cuenta, retira su referencia del Registro y **no** modifica `id_counter`. |

## Aporte propio

Sobre la base guiada (que ya incluye la baja de cliente) añadí **validaciones de negocio en Rust**. Cinco de ellas tienen su caso de rechazo probado en `tests/anchor.test.ts` (columna **Prueba**); la sexta, `ClienteNoRegistrado`, es una protección adicional que no se puede provocar por el flujo normal y no tiene prueba propia:

| Regla nueva | Error | Dónde | Prueba |
| --- | --- | --- | --- |
| El monto debe ser mayor a 0 | `MontoInvalido` | `registrar_venta`, `cambiar_monto` | Sí |
| El SKU no puede estar vacío ni exceder 5 caracteres | `SkuInvalido` | `registrar_venta` | Sí (SKU de 6 caracteres) |
| La descripción no puede exceder 50 caracteres | `DescripcionInvalida` | `registrar_venta` | Sí (51 caracteres) |
| Máximo 10 clientes por Registro | `RegistroLleno` | `crear_cliente` | Sí (cliente número 11) |
| Máximo 10 ventas por Cliente | `HistorialLleno` | `registrar_venta` | Sí (venta número 11) |
| El cliente debe estar referenciado en el Registro | `ClienteNoRegistrado` | `eliminar_cliente` | No |

**Qué mejora:** antes, una venta de monto 0 se aceptaba, y un SKU largo o el cliente número 11 fallaban con un error de serialización poco claro. Ahora el programa rechaza esos casos con un error específico y sin modificar ningún estado.
**Cómo se comprueba:** pruebas `[APORTE]` de `tests/anchor.test.ts` (ver tabla de evidencias).

Además corregí los ejemplos de `client/client.ts`: el SKU `"Sabritas"` (8 caracteres) excedía `max_len(5)`; ahora es `"SAB01"`.

## Cómo ejecutarlo

### Compatibilidad del frontend

El frontend y el cliente generado de esta copia están configurados para el programa desplegado en
`9ftiFmp2SXUcxXSkvAsBtLzmJfKjFLksuyBQLSKrVqqs`. La interfaz expone sus cinco instrucciones
compatibles: crear registro, crear cliente, registrar venta, corregir monto y hacer devolución.
No incluye eliminar cliente, porque esa instrucción no existe en dicho despliegue.

El backend compatible con este frontend está en `programaBackend/` y usa el ID
`9ftiFmp2SXUcxXSkvAsBtLzmJfKjFLksuyBQLSKrVqqs`. El código de ejemplo en `programa/` conserva
otra variante del programa (ID `6oWpDCks3gXPfDiGhzPS2ypQUv2SQ36YZt9QVY9yLAbX`) que sí incluye
eliminar cliente. No despliegues esa variante si quieres seguir usando los datos del programa `9fti…`.

1. Abre [Solana Playground](https://beta.solpg.io), pega el contenido de `programaBackend/src/lib.rs`,
   `programaBackend/tests/anchor.test.ts` y `programaBackend/client/client.ts`, conéctalo a **Devnet**
   y pide SOL de prueba en https://faucet.solana.com.
2. **Build** → **Deploy**. Anota el Program ID.
3. **Test** (`tests/anchor.test.ts`) para correr las pruebas automáticas.
4. `client/client.ts`: descomenta la operación que quieras probar y pulsa **Run**.
5. Para usar el frontend ya configurado para `9fti…`: `npm install`, `npm run verificar` y `npm run dev`. Conecta una wallet en Devnet. No vuelvas a importar `tmp-idl/registro-final.json` sin confirmar primero su Program ID: corresponde a la variante `6oWp…`.

## Pruebas y evidencias (Devnet)

Negocio de la práctica: **Tiendas 3B**. Cliente: Isaac K (id 1).
Wallet de la práctica: `4nDoX1ZSuzZTM4a4Xc6CKyLybK5DiJAW1NZZ7iwe8Gty`.

Además de las operaciones reales de abajo, `tests/anchor.test.ts` ejecuta **14 pruebas automáticas contra Devnet y las 14 pasan** (captura en `evidencias/`).

### Operaciones reales (cliente `client/client.ts`)

| Caso | Resultado esperado | Resultado observado | Transacción |
| --- | --- | --- | --- |
| Crear Registro | Se crea la cuenta Registro | Creado | [Explorer](https://explorer.solana.com/tx/3Thsnj8C9VrV4vBuRg4Lgq1FT6WXvJgrMdmzg3eN39w9kg611wwz6c7K6WctzxnD87pGouxWW8L8oXXN8bsqsRaV?cluster=devnet) |
| Crear Cliente | Cliente id 1 creado y referenciado en el Registro | "Cliente Isaac K creado con id: 1" | [Explorer](https://explorer.solana.com/tx/3TYp9AvRJVKb15YPgkRp7PdtqQ9cE8QPakqynKhDuaE5UdnccMsPGVwMB8UptdgAPnZyPiAnXHP8P7GGT9gPQdjZ?cluster=devnet) |
| Registrar venta válida (SKU `SAB01`) | Se crea Venta; `compras` y `historial` del Cliente se actualizan | Venta creada | [Explorer](https://explorer.solana.com/tx/2WDj87VvaJpNMdgDWiBc4Nuk9bD7S3wCZLCq47eZ4whbZrSu2eoWvAzQqwSPVPpHH4D7XRphZiJmVFKmPcbbjxCV?cluster=devnet) |
| Registrar una segunda venta | Se crea otra Venta del mismo cliente | Venta creada | [Explorer](https://explorer.solana.com/tx/3ipWTvAiwqea5K9rMqtmVidXndvNRDkuiroJDWNLoXcmWXtKST9dE3axpiVvFt5PQftz5n5BnDdvqQ3rjg8r1KZD?cluster=devnet) |
| Corregir el importe | Cambia el monto de la misma Venta | Monto actualizado | [Explorer](https://explorer.solana.com/tx/4LWPj36qyWnDoguBTfdjB8WhcXbQKuW9v5wjLRj6PsyP1KySaHcHdqzGTHiAitvVE5kc7k4XbFJN9f49UvzzGviA?cluster=devnet) |
| Devolución válida (1.ª venta) | Se cierra la Venta; Cliente actualizado | Venta cerrada | [Explorer](https://explorer.solana.com/tx/p5EivMSbdAoyfsVhb5g9c8q5Q7C57DuiwpuJJykt5AUYkuzZm83mKhMoNk7u8gx6Z8WZbnzEmNrfuFSqguvwoob?cluster=devnet) |
| Devolución válida (2.ª venta) | Se cierra la Venta; Cliente sin ventas | Venta cerrada | [Explorer](https://explorer.solana.com/tx/3RVGny3B1WptkYFMEsueLvKJN8nixkej6AHf4kJqrKkxvbJiUzhhDneER148zPvBVA3JZ2qqCmEBBMWvzhWeWkGd?cluster=devnet) |
| **Baja de cliente vacío** | Se cierra Cliente, se retira su referencia, `id_counter` no retrocede | `verClientes` muestra "Ultimo id asignado: 1" y "Registro vacío, aún no hay clientes" | [Explorer](https://explorer.solana.com/tx/hj2C61WX2DHMmAP3pFjY5qzGy3DyTrYLHQjG8ykoA9iLwSPDbbA6hZM5v8YUuhc43uCmYk5NLWjdQoZ8JbZeeTn?cluster=devnet) |
| **Baja con ventas activas** | Rechazo del programa; cuentas y referencias intactas | `AnchorError ... Error Code: ClienteConVentas. Error Number: 6002` en `lib.rs`; el cliente siguió existiendo y pudo devolverse después | Rechazo en simulación (sin transacción); captura en `evidencias/` |

### Rechazos probados con las pruebas automáticas

| Caso | Error esperado | Prueba |
| --- | --- | --- |
| Wallet no autorizada | `NoOwner`; datos intactos | `RECHAZA wallet no autorizada (NoOwner)` ✔ |
| Venta ajena al cliente | `ConstraintSeeds` | `RECHAZA venta ajena al cliente (ConstraintSeeds)` ✔ |
| **[Aporte]** Monto = 0 al registrar y al corregir | `MontoInvalido`; no se crea la cuenta | `[APORTE] RECHAZA monto = 0 ...` ✔ |
| **[Aporte]** SKU de 6 caracteres | `SkuInvalido` | `[APORTE] RECHAZA sku de mas de 5 caracteres` ✔ |
| Baja con ventas activas | `ClienteConVentas`; cuentas intactas | `RECHAZA dar de baja a un cliente con ventas activas` ✔ |
| El siguiente alta no reutiliza ids | Marta recibe id 3 | `El siguiente cliente recibe id 3` ✔ |
| **[Aporte]** Descripción de 51 caracteres | `DescripcionInvalida`; no se crea la cuenta | `[APORTE] RECHAZA descripcion de mas de 50 caracteres` ✔ |
| **[Aporte]** Cliente número 11 | `RegistroLleno` | `[APORTE] RECHAZA el cliente numero 11` ✔ |
| **[Aporte]** Venta número 11 de un cliente | `HistorialLleno` | `[APORTE] RECHAZA la venta 11 de un cliente` ✔ |

Los rechazos fallan en la simulación previa, por eso no tienen firma consultable en el Explorer.

### Prueba en la aplicación web (frontend + wallet Solflare, Devnet)

Negocio de la prueba: **Pruebas**. Wallet de la prueba: `iMEDL72Hzn5s71v1ZshQJGRvW8bwHNjMKvLvES4zVdF` (Solflare, Devnet).

| Caso | Resultado | Evidencia |
| --- | --- | --- |
| Baja de cliente vacío desde la pestaña **Eliminar cliente** | Operación confirmada; el cliente se cierra y el registro conserva el último ID asignado | [Explorer](https://explorer.solana.com/tx/5FJE66mBaCvgtDSBNCZcSPUPHiKicTEgXq7CpvUp6Vnx5Qh2XVwmnC63QMfC1JrTehtx4riCphf63ErmaXbUiaEN?cluster=devnet) |
| Baja con ventas activas | El programa rechaza la operación (`ClienteConVentas`) | Captura en `evidencias/` |

El frontend se verifica con `npm run verificar` (comprobación de tipos, 9 pruebas del proyecto y compilación) y `npm run comprobar:idl` (IDL, Program ID y cliente generado coherentes).

## Estructura del repositorio

```
programaBackend/src/lib.rs       Backend Anchor compatible con el ID 9fti…
programaBackend/tests/            Pruebas del backend
programaBackend/client/           Cliente de Solana Playground
programaBackend/images/           Imágenes del proyecto original
programa/src/lib.rs            Programa Anchor (Rust)
programa/tests/anchor.test.ts  Pruebas del programa (Playground)
programa/client/client.ts      Cliente de TypeScript
idl.json / tmp-idl/            IDL exportado de la versión desplegada
clients/js/                    Cliente generado a partir del IDL
src/                           Frontend (React + Vite); baja de cliente en src/solana/acciones.ts y src/components/Registro.tsx
evidencias/                    Capturas de las pruebas
```

## Notas de seguridad y alcance

Proyecto educativo en Devnet. No incluye claves ni secretos. Antes de un uso real faltaría revisar límites de almacenamiento, gestión de autoridades del programa y reintentos de transacciones.
