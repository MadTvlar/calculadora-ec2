class DominioGruposRepository {
    constructor(pool) {
        this.pool = pool;
        this.table = 'dominio_grupos';
    }

    async create({ nome, descricao }) {

        // 1️ Verifica se já existe (ativo ou inativo)
        const [rows] = await this.pool.query(
            `SELECT grupo_id, grupo_ativo 
                FROM ${this.table} 
                WHERE nome = ? 
                LIMIT 1`,
            [nome]
        );

        if (rows.length > 0) {
            const grupo = rows[0];

            // 2️ Se estiver inativo → reativa e atualiza descrição
            if (grupo.grupo_ativo === 0) {
                await this.pool.query(
                    `UPDATE ${this.table}
                        SET grupo_ativo = 1,
                            descricao = ?
                        WHERE grupo_id = ?`,
                    [descricao, grupo.grupo_id]
                );

                return this.findById(grupo.grupo_id);
            }

            // 3️ Se já estiver ativo → erro
            const err = new Error('Grupo já existe');
            err.statusCode = 409;
            throw err;
        }

        // 4️ Se não existir → cria normalmente
        const [result] = await this.pool.query(
            `INSERT INTO ${this.table} (nome, descricao, grupo_ativo)
                VALUES (?, ?, 1)`,
            [nome, descricao]
        );

        return this.findById(result.insertId);
    }

    async findAll() {
        const [rows] = await this.pool.query(`
        SELECT g.*, t.nome AS rank_tipo_nome
        FROM ${this.table} g
        LEFT JOIN core_ranking_tipos t 
            ON t.id = g.rank_tipo_id
        WHERE g.grupo_ativo = 1
        ORDER BY g.nome ASC
    `);

        return rows;
    }

    async findGroupRanking() {
        const [rows] = await this.pool.query(`
        SELECT g.*, t.nome AS rank_tipo_nome
        FROM ${this.table} g
        LEFT JOIN core_ranking_tipos t 
            ON t.id = g.rank_tipo_id
        WHERE g.ranking = 1 AND g.grupo_ativo = 1
        ORDER BY g.nome ASC
    `);

        return rows;
    }

    async findById(grupo_id) {
        const sql = `
      SELECT grupo_id, nome, descricao, grupo_ativo, dt_criacao, dt_alteracao
        FROM ${this.table}
        WHERE grupo_id = ?
        AND grupo_ativo = 1
        LIMIT 1
        `;
        const [rows] = await this.pool.query(sql, [grupo_id]);
        return rows[0] || null;
    }

    async update(grupo_id, { nome, descricao }) {
        try {
            const fields = [];
            const values = [];

            if (nome !== undefined) {
                fields.push('nome = ?');
                values.push(nome);
            }

            if (descricao !== undefined) {
                fields.push('descricao = ?');
                values.push(descricao);
            }

            if (fields.length === 0) {
                return this.findById(grupo_id);
            }

            const sql = `
      UPDATE ${this.table}
      SET ${fields.join(', ')}
      WHERE grupo_id = ?
      AND grupo_ativo = 1
    `;

            values.push(grupo_id);

            const [result] = await this.pool.query(sql, values);

            if (result.affectedRows === 0) return null;

            return this.findById(grupo_id);

        } catch (error) {

            // TRATAMENTO DO UNIQUE
            if (error.code === 'ER_DUP_ENTRY') {
                const err = new Error('Grupo já existe');
                err.statusCode = 409;
                throw err;
            }

            throw error;
        }
    }

    // ATUALIZAR O TIPO DO RANKING
    async atualizarRankTipo(grupo_id, rank_tipo_id) {

        const sql = `
        UPDATE ${this.table}
        SET rank_tipo_id = ?
        WHERE grupo_id = ?
        AND grupo_ativo = 1
    `;

        const [result] = await this.pool.query(sql, [
            rank_tipo_id,
            grupo_id
        ]);

        if (result.affectedRows === 0) {
            return null;
        }

        return this.findById(grupo_id);
    }

    // DELETE LÓGICO
    async delete(grupo_id) {
        const sql = `
      UPDATE ${this.table}
      SET grupo_ativo = 0
      WHERE grupo_id = ?
      AND grupo_ativo = 1
    `;

        const [result] = await this.pool.query(sql, [grupo_id]);
        return result.affectedRows > 0;
    }
}

module.exports = DominioGruposRepository;