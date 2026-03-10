class RankingMetricasRepository {
    constructor(connection) {
        this.connection = connection;
    }

    async findAll() {
        const [rows] = await this.connection.query(`
            SELECT id, metrica, descricao
            FROM core_ranking_metricas
            WHERE ativo = 1
            ORDER BY metrica ASC
        `);

        return rows;
    }

    async create({ metrica, descricao }) {
        const [result] = await this.connection.query(`
            INSERT INTO core_ranking_metricas (metrica, descricao)
            VALUES (?, ?)
        `, [metrica, descricao]);

        return result.insertId;
    }

    async update(id, { metrica, descricao, ativo }) {
        await this.connection.query(`
            UPDATE core_ranking_metricas
            SET metrica = ?,
                descricao = ?,
                ativo = ?
            WHERE id = ?
        `, [metrica, descricao, ativo, id]);
    }

    async delete(id) {
        const [result] = await this.connection.query(`
    UPDATE core_ranking_metricas
    SET ativo = 0
    WHERE id = ?
  `, [id]);

        return result.affectedRows > 0;
    }
}

module.exports = RankingMetricasRepository;