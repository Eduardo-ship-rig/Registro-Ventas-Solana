import { PublicKey } from "@solana/web3.js";

// Se crea el negocio solo si todavía no existe para esta wallet y este programa.
const nombre_negocio = "Mi tienda";
const owner = pg.wallet.publicKey;
const programa = pg.program;

if (!programa || !programa.programId) {
  throw new Error(
    "No se encontró el programa Anchor. Construye el programa y verifica su Program ID en Solana Playground."
  );
}

const programId = programa.programId;

function pdaRegistro(nombre) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("registro"), Buffer.from(nombre), owner.toBuffer()],
    programId
  );
}

async function verReporteNegocio(nombre) {
  const [registro] = pdaRegistro(nombre);
  const cuenta_registro = await programa.account.registro.fetch(registro);
  const formato_monto = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 0,
  });
  let total_ventas = 0;
  let total_vendido = 0;

  console.log("\n========== REPORTE DEL NEGOCIO ==========");
  console.log("Negocio:", cuenta_registro.nombreNegocio);
  console.log("Último ID asignado:", cuenta_registro.idCounter);
  console.log("Cantidad de clientes:", cuenta_registro.clientes.length);

  if (cuenta_registro.clientes.length === 0) {
    console.log("Este negocio todavía no tiene clientes.");
  }

  for (let i = 0; i < cuenta_registro.clientes.length; i++) {
    const cliente_key = cuenta_registro.clientes[i];
    const cliente = await programa.account.cliente.fetch(cliente_key);

    console.log(
      `\nCliente #${i + 1}: ${cliente.nombre}\n` +
        ` * ID: ${cliente.idCliente}\n` +
        ` * Compras registradas: ${cliente.compras}\n` +
        ` * PDA: ${cliente_key.toBase58()}`
    );

    if (cliente.historial.length === 0) {
      console.log("   Sin ventas registradas.");
      continue;
    }

    for (let j = 0; j < cliente.historial.length; j++) {
      const venta_key = cliente.historial[j];
      const venta = await programa.account.venta.fetch(venta_key);
      const monto = Number(venta.monto);

      total_ventas++;
      total_vendido += monto;
      console.log(
        `   Venta #${j + 1}: SKU ${venta.sku} | ${venta.descripcion} | ` +
          `$${formato_monto.format(monto)} | PDA: ${venta_key.toBase58()}`
      );
    }
  }

  console.log("\n---------------- RESUMEN ----------------");
  console.log("Clientes:", cuenta_registro.clientes.length);
  console.log("Ventas activas:", total_ventas);
  console.log(`Total registrado: $${formato_monto.format(total_vendido)}`);
  console.log(
    "Nota: este total es informativo; el programa no transfiere ese dinero."
  );
  console.log("==========================================\n");
}

async function crearSiNoExisteYVerReporte() {
  const balance = await pg.connection.getBalance(owner);
  console.log("Wallet:", owner.toBase58());
  console.log(`Balance: ${balance / web3.LAMPORTS_PER_SOL} SOL`);

  const [registro] = pdaRegistro(nombre_negocio);
  const cuenta_existente = await pg.connection.getAccountInfo(registro);

  if (!cuenta_existente) {
    console.log(
      `Creando "${nombre_negocio}". Esta primera ejecución enviará una transacción y usará SOL de Devnet.`
    );
    const tx = await programa.methods
      .crearRegistro(nombre_negocio)
      .accounts({
        owner,
        registro,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();
    console.log("Negocio creado. Transacción:", tx);
  } else {
    if (!cuenta_existente.owner.equals(programId)) {
      throw new Error(
        "La dirección calculada ya está ocupada por una cuenta que no pertenece a este programa."
      );
    }
    console.log(`El negocio "${nombre_negocio}" ya existe; no se enviará otra transacción.`);
  }

  await verReporteNegocio(nombre_negocio);
}

crearSiNoExisteYVerReporte().catch((error) => {
  console.error("No se pudo crear o consultar el negocio.");
  console.error("Detalle:", error);
  if (error.logs) console.error("Logs del programa:", error.logs);
});

// La primera ejecución crea el negocio si hace falta; las siguientes solo muestran el reporte.
