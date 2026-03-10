const RankingResultadoRepository = require('../../../repository/ranking/rankingResultado.repository');

class RankingResultadoService {

    constructor(connection) {
        this.repo = new RankingResultadoRepository(connection);
    }

    /**
     * Listar ranking por grupo e mês
     */
    async listarPorGrupo(grupo_id, mes_referente) {

        if (!grupo_id) {
            throw new Error('grupo_id é obrigatório');
        }

        if (!mes_referente) {
            throw new Error('mes_referente é obrigatório');
        }

        const ranking = await this.repo.findByGrupoAndMes(
            grupo_id,
            mes_referente
        );

        return ranking;
    }

    /**
     * Buscar top 3
     */
    async top3(grupo_id, mes_referente) {

        if (!grupo_id || !mes_referente) {
            throw new Error('grupo_id e mes_referente são obrigatórios');
        }

        const ranking = await this.repo.findByGrupoAndMes(
            grupo_id,
            mes_referente
        );

        return ranking.slice(0, 3);
    }

    /**
     * Buscar última atualização
     */
    async ultimaAtualizacao(grupo_id, mes_referente) {

        const [[grupo]] = await this.repo.connection.query(`
            SELECT rank_tipo_id
            FROM dominio_grupos
            WHERE grupo_id = ?
        `, [grupo_id]);

        if (!grupo?.rank_tipo_id) return null;

        return await this.repo.findUltimaAtualizacao(
            grupo.rank_tipo_id,
            mes_referente
        );
    }

    /**
     * Ranking completo + metadados
     */
    async obterRankingCompleto(grupo_id, mes_referente) {

        if (!grupo_id || !mes_referente) {
            throw new Error('grupo_id e mes_referente são obrigatórios');
        }

        const lista = await this.repo.findByGrupoAndMes(
            grupo_id,
            mes_referente
        );

        // Descobrir tipo do ranking
        const [[grupo]] = await this.repo.connection.query(`
        SELECT rank_tipo_id
        FROM dominio_grupos
        WHERE grupo_id = ?
    `, [grupo_id]);

        if (!grupo?.rank_tipo_id) {
            return {
                total_registros: 0,
                ultima_atualizacao: null,
                metricas_ativas: [],
                ranking: []
            };
        }

        // Buscar métricas ativas
        const metricasAtivas = await this.repo.findMetricasAtivas(
            grupo.rank_tipo_id
        );

        // Buscar última atualização
        const ultimaAtualizacao = await this.repo.findUltimaAtualizacao(
            grupo.rank_tipo_id,
            mes_referente
        );

        return {
            total_registros: lista.length,
            ultima_atualizacao: ultimaAtualizacao,
            metricas_ativas: metricasAtivas,
            ranking: lista
        };
    }

}

module.exports = RankingResultadoService;