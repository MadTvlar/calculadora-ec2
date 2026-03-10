const RankingMetricasRepository = require('../../repository/ranking/rankingMetricas.repository');

class RankingMetricasService {
    constructor(connection) {
        this.repo = new RankingMetricasRepository(connection);
    }

    async listar() {
        const metricas = await this.repo.findAll();

        return metricas.map(m => ({
            ...m,
            metrica: m.metrica
                .split('_')
                .map(p => p.charAt(0).toUpperCase() + p.slice(1))
                .join('_')
        }));
    }

    async criar(data) {
        if (!data.metrica) {
            throw new Error('Nome é obrigatório.');
        }

        return await this.repo.create(data);
    }

    async atualizar(id, data) {
        await this.repo.update(id, data);
    }

    async delete(id) {
        const deleted = await this.repo.delete(id);

        if (!deleted) {
            const err = new Error('Métrica não encontrada');
            err.statusCode = 404;
            throw err;
        }

        return { message: 'Métrica desativada com sucesso' };
    }
}

module.exports = RankingMetricasService;