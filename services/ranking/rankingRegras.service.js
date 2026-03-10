const RankingRegrasRepository = require('../../repository/ranking/rankingRegras.repository');

class RankingRegrasService {
    constructor(connection) {
        this.repo = new RankingRegrasRepository(connection);
        this.connection = connection;
    }

    async listarPorTipo(rank_tipo_id) {
        return await this.repo.findByTipo(rank_tipo_id);
    }

    // 🔥 NORMALIZA VALORES
    normalizarNumero(valor) {
        if (valor === undefined || valor === null || valor === '') {
            return null;
        }
        const numero = Number(valor);
        return Number.isNaN(numero) ? null : numero;
    }

    async criar(data) {

        let {
            rank_tipo_id,
            metrica_id,
            min_valor,
            max_valor
        } = data;

        min_valor = this.normalizarNumero(min_valor);
        max_valor = this.normalizarNumero(max_valor);

        if (min_valor === null) {
            throw new Error('min_valor é obrigatório.');
        }

        if (max_valor !== null && min_valor >= max_valor) {
            throw new Error('min_valor deve ser menor que max_valor.');
        }

        return await this.repo.create({
            ...data,
            min_valor,
            max_valor
        });
    }

    async atualizar(id, data) {

        let {
            rank_tipo_id,
            metrica_id,
            min_valor,
            max_valor
        } = data;

        min_valor = this.normalizarNumero(min_valor);
        max_valor = this.normalizarNumero(max_valor);

        if (min_valor === null) {
            throw new Error('min_valor é obrigatório.');
        }

        if (max_valor !== null && min_valor >= max_valor) {
            throw new Error('min_valor deve ser menor que max_valor.');
        }

        await this.repo.update(id, {
            ...data,
            min_valor,
            max_valor
        });
    }

    async atualizarOrdemMetricas(ordens) {

        if (!Array.isArray(ordens) || ordens.length === 0) {
            throw new Error('Lista de ordens inválida');
        }

        for (const item of ordens) {

            if (!item.metrica_id || !item.ordem) {
                throw new Error('Dados de ordenação inválidos');
            }

        }

        await this.repo.atualizarOrdemMetricas(ordens);

        return {
            message: 'Ordem das métricas atualizada com sucesso'
        };
    }

    async remover(id) {
        await this.repo.delete(id);
    }
}

module.exports = RankingRegrasService;