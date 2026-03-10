const RankingTiposRepository = require('../../repository/ranking/rankingTipos.repository');

class RankingTiposService {
    constructor(connection) {
        this.repo = new RankingTiposRepository(connection);
    }

    async listar() {
        return await this.repo.findAll();
    }

    async criar(data) {
        if (!data.nome || !data.ano_referencia) {
            throw new Error('Nome e ano_referencia são obrigatórios.');
        }

        return await this.repo.create(data);
    }

    async atualizar(id, data) {
        await this.repo.update(id, data);
    }
}

module.exports = RankingTiposService;