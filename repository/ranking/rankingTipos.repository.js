class RankingTiposRepository {
    constructor(connection) {
        this.connection = connection;
    }

    async findAll() {
        const [rows] = await this.connection.query(`
            SELECT *
            FROM core_ranking_tipos
            ORDER BY ano_referencia DESC, nome ASC
        `);

        return rows;
    }

    async findById(id) {
        const [rows] = await this.connection.query(`
            SELECT *
            FROM core_ranking_tipos
            WHERE id = ?
        `, [id]);

        return rows[0];
    }

    async create({ nome, descricao, ano_referencia }) {
        const [result] = await this.connection.query(`
            INSERT INTO core_ranking_tipos
            (nome, descricao, ano_referencia)
            VALUES (?, ?, ?)
        `, [nome, descricao, ano_referencia]);

        return result.insertId;
    }

    async update(id, { nome, descricao, ativo }) {
        await this.connection.query(`
            UPDATE core_ranking_tipos
            SET nome = ?,
                descricao = ?,
                ativo = ?
            WHERE id = ?
        `, [nome, descricao, ativo, id]);
    }
}

module.exports = RankingTiposRepository;