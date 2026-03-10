class CoreGruposVendedoresRepository {
    constructor(pool) {
        this.pool = pool;
        this.table = 'core_grupos_vendedores';
    }

    // Vincular vendedor a grupo
    async vincular(grupo_id, vendedor_id) {
        try {
            await this.pool.query(
                `INSERT INTO ${this.table} (grupo_id, vendedor_id)
         VALUES (?, ?)`,
                [grupo_id, vendedor_id]
            );

            return { grupo_id, vendedor_id };

        } catch (error) {

            if (error.code === 'ER_DUP_ENTRY') {
                const err = new Error('Vendedor já vinculado ao grupo');
                err.statusCode = 409;
                throw err;
            }

            throw error;
        }
    }

    // Listar vendedores de um grupo
    async listarPorGrupo(grupo_id) {
        const [rows] = await this.pool.query(`
            SELECT 
                cgv.grupo_id,
                g.nome AS grupo_nome,
                cgv.vendedor_id,
                v.nome AS vendedor_nome
                FROM core_grupos_vendedores cgv
                JOIN dominio_grupos g 
                ON g.grupo_id = cgv.grupo_id
                JOIN dominio_vendedores v 
                ON v.vendedor_id = cgv.vendedor_id
                WHERE cgv.grupo_id = ?
                ORDER BY v.nome ASC
        `, [grupo_id]);

        return rows;
    }

    // Remover vínculo
    async remover(grupo_id, vendedor_id) {
        const [result] = await this.pool.query(
            `DELETE FROM ${this.table}
                WHERE grupo_id = ?
                AND vendedor_id = ?`,
            [grupo_id, vendedor_id]
        );

        return result.affectedRows > 0;
    }

    // Listar todos vínculos
    async listarTodos() {
        const [rows] = await this.pool.query(`
            SELECT 
                cgv.grupo_id,
                g.nome AS grupo_nome,
                cgv.vendedor_id,
                v.nome AS vendedor_nome
                FROM core_grupos_vendedores cgv
                JOIN dominio_grupos g 
                ON g.grupo_id = cgv.grupo_id
                JOIN dominio_vendedores v 
                ON v.vendedor_id = cgv.vendedor_id
                ORDER BY g.nome ASC, v.nome ASC
        `);

        return rows;
    }
}

module.exports = CoreGruposVendedoresRepository;