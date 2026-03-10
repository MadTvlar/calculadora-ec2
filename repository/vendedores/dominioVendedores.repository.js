class DominioVendedoresRepository {
    constructor(pool) {
        this.pool = pool;
        this.table = 'dominio_vendedores';
    }

    // Listar ativos
    async listarAtivos() {
        const [rows] = await this.pool.query(
            `SELECT vendedor_id, nome
       FROM ${this.table}
       WHERE vendedor_ativo = 1
       ORDER BY nome ASC`
        );
        return rows;
    }

    // Listar todos
    async listarTodos() {
        const [rows] = await this.pool.query(
            `SELECT vendedor_id, nome, vendedor_ativo
       FROM ${this.table}
       ORDER BY nome ASC`
        );
        return rows;
    }

    // Delete lógico
    async desativar(vendedor_id) {
        const [result] = await this.pool.query(
            `UPDATE ${this.table}
       SET vendedor_ativo = 0
       WHERE vendedor_id = ?`,
            [vendedor_id]
        );

        return result.affectedRows > 0;
    }

    // Reativar
    async reativar(vendedor_id) {
        const [result] = await this.pool.query(
            `UPDATE ${this.table}
       SET vendedor_ativo = 1
       WHERE vendedor_id = ?`,
            [vendedor_id]
        );

        return result.affectedRows > 0;
    }
}

module.exports = DominioVendedoresRepository;