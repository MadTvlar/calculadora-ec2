class RankingRegrasRepository {
    constructor(connection) {
        this.connection = connection;
    }

    async findByTipo(rank_tipo_id) {
        const [rows] = await this.connection.query(`
            SELECT 
                r.*,
                m.metrica AS metrica,
                mp.metrica AS multiplica_por_metrica
            FROM core_ranking_regras r
            JOIN core_ranking_metricas m ON m.id = r.metrica_id
            LEFT JOIN core_ranking_metricas mp ON mp.id = r.multiplica_por_metrica_id
            WHERE r.rank_tipo_id = ?
            AND r.ativo = 1
            ORDER BY r.ordem ASC, r.min_valor ASC
        `, [rank_tipo_id]);

        return rows;
    }

    async create(data) {
        const {
            rank_tipo_id,
            metrica_id,
            min_valor,
            max_valor,
            pontos,
            multiplica_por_metrica_id,
            ordem
        } = data;

        const [result] = await this.connection.query(`
            INSERT INTO core_ranking_regras
            (rank_tipo_id, metrica_id, min_valor, max_valor, pontos, multiplica_por_metrica_id, ordem)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            rank_tipo_id,
            metrica_id,
            min_valor,
            max_valor,
            pontos,
            multiplica_por_metrica_id,
            ordem || 1
        ]);

        return result.insertId;
    }

    async update(id, data) {
        const {
            min_valor,
            max_valor,
            pontos,
            multiplica_por_metrica_id,
            ordem
        } = data;

        await this.connection.query(`
            UPDATE core_ranking_regras
            SET min_valor = ?,
                max_valor = ?,
                pontos = ?,
                multiplica_por_metrica_id = ?,
                ordem = ?
            WHERE id = ?
        `, [
            min_valor,
            max_valor,
            pontos,
            multiplica_por_metrica_id,
            ordem,
            id
        ]);
    }

    async atualizarOrdemMetricas(ordens) {

        for (const item of ordens) {

            const { metrica_id, ordem } = item;

            await this.connection.query(`
            UPDATE core_ranking_regras
            SET ordem = ?
            WHERE metrica_id = ?
        `, [ordem, metrica_id]);

        }

    }

    async delete(id) {
        await this.connection.query(`
            UPDATE core_ranking_regras
            SET ativo = 0
            WHERE id = ?
        `, [id]);
    }
}

module.exports = RankingRegrasRepository;