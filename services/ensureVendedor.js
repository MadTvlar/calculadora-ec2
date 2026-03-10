// inserir vendedores novos
async function ensureVendedor(pool, sendLog, vendedorId, nome, filial) {
    if (!vendedorId) return;

    const sql = `
      INSERT IGNORE INTO dominio_vendedores (vendedor_id, nome, filial )
      VALUES (?, ?, ?)
    `;

    try {
        const [result] = await pool.query(sql, [vendedorId, nome, filial]);

        if (result.affectedRows > 0) {
            sendLog(`Vendedor ${nome}, inserido com sucesso.`);
        }
    } catch (error) {
        if (sendLog) {
            sendLog(`Erro ao salvar vendedor ${nome} (${vendedorId}): ${error.message}`);
        }
    }
}

module.exports = ensureVendedor;