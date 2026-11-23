// No imports needed: web3, anchor, pg and assert are available in Solana Playground.

describe("Registro de ventas", () => {
  it("creates a business record owned by the connected wallet", async () => {
    const owner = pg.wallet.publicKey;
    const nombreNegocio = `Test-${Date.now()}`;
    const [registro] = web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("registro"),
        Buffer.from(nombreNegocio),
        owner.toBuffer(),
      ],
      pg.program.programId
    );

    const txHash = await pg.program.methods
      .crearRegistro(nombreNegocio)
      .accounts({
        owner,
        registro,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    await pg.connection.confirmTransaction(txHash);

    const cuenta = await pg.program.account.registro.fetch(registro);
    assert.equal(cuenta.nombreNegocio, nombreNegocio);
    assert(cuenta.owner.equals(owner));
    assert.equal(cuenta.clientes.length, 0);
    assert.equal(cuenta.idCounter, 0);
  });
});
