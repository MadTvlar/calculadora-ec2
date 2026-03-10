class RankingResultadoRepository {
    constructor(connection) {
        this.connection = connection;
    }

    /**
     * Buscar ranking por tipo e mês
     */
    async findByTipoAndMes(grupo_id, mes_referente) {

        const [rows] = await this.connection.query(`
            SELECT 
                r.posicao,
                r.total_pontos,
                r.bonus,
                r.vendas,
                r.llo,
                r.ritmo,
                r.captacao,
                r.retorno,
                r.nps,
                r.contratos,
                r.cny,
                r.clube,
                r.entrega_clube,
                r.atualizado_em,
                v.vendedor_id,
                v.nome,
                v.filial
            FROM core_ranking_resultado r
            JOIN dominio_vendedores v
                ON v.vendedor_id = r.vendedor_id
            WHERE r.grupo_id = ?
            AND r.mes_referente = ?
            AND r.ativo = 1
            ORDER BY r.posicao ASC
        `, [grupo_id, mes_referente]);

        return rows;
    }

    async findMetricasAtivas(rank_tipo_id) {

        const [rows] = await this.connection.query(`
            SELECT DISTINCT
                m.metrica,
                r.ordem
            FROM core_ranking_regras r
            JOIN core_ranking_metricas m 
                ON m.id = r.metrica_id
            WHERE r.rank_tipo_id = ?
            AND r.ativo = 1
            ORDER BY r.ordem ASC
    `, [rank_tipo_id]);

        return rows;
    }

    /**
     * Buscar ranking por grupo (descobre tipo automaticamente)
     */
    async findByGrupoAndMes(grupo_id, mes_referente) {

        return this.findByTipoAndMes(
            grupo_id,
            mes_referente
        );
    }

    /**
     * Buscar top 3
     */
    async findTop3(grupo_id, mes_referente) {

        const [rows] = await this.connection.query(`
            SELECT 
                r.posicao,
                r.total_pontos,
                v.nome,
                v.filial
            FROM core_ranking_resultado r
            JOIN dominio_vendedores v
                ON v.vendedor_id = r.vendedor_id
            WHERE r.grupo_id = ?
            AND r.mes_referente = ?
            ORDER BY r.posicao ASC
            LIMIT 3
        `, [grupo_id, mes_referente]);

        return rows;
    }

    /**
     * Última atualização do ranking
     */
    async findUltimaAtualizacao(grupo_id, mes_referente) {

        const [[row]] = await this.connection.query(`
            SELECT MAX(atualizado_em) as ultima_atualizacao
            FROM core_ranking_resultado
            WHERE grupo_id = ?
            AND mes_referente = ?
        `, [grupo_id, mes_referente]);

        return row?.ultima_atualizacao || null;
    }

}

module.exports = RankingResultadoRepository;