const connection = require('../../services/db');
const RankingRegrasService = require('../../services/ranking/rankingRegras.service');

const service = new RankingRegrasService(connection);

module.exports = {

    async listarPorTipo(req, res, next) {
        try {
            const { rank_tipo_id } = req.params;

            if (!rank_tipo_id) {
                return res.status(400).json({
                    message: 'rank_tipo_id é obrigatório.'
                });
            }

            const result = await service.listarPorTipo(Number(rank_tipo_id));

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    },

    async criar(req, res, next) {
        try {
            const {
                rank_tipo_id,
                metrica_id,
                min_valor,
                max_valor,
                pontos,
                multiplica_por_metrica_id,
                ordem
            } = req.body;

            if (!rank_tipo_id || !metrica_id || min_valor === undefined || pontos === undefined) {
                return res.status(400).json({
                    message: 'Campos obrigatórios não informados.'
                });
            }

            const id = await service.criar({
                rank_tipo_id: Number(rank_tipo_id),
                metrica_id: Number(metrica_id),
                min_valor: Number(min_valor),
                max_valor: max_valor !== null ? Number(max_valor) : null,
                pontos: Number(pontos),
                multiplica_por_metrica_id: multiplica_por_metrica_id
                    ? Number(multiplica_por_metrica_id)
                    : null,
                ordem: ordem ? Number(ordem) : 1
            });

            return res.status(201).json({
                message: 'Regra criada com sucesso.',
                id
            });

        } catch (err) {
            return next(err);
        }
    },

    async atualizar(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    message: 'ID é obrigatório.'
                });
            }

            await service.atualizar(Number(id), req.body);

            return res.json({
                message: 'Regra atualizada com sucesso.'
            });

        } catch (err) {
            return next(err);
        }
    },

    async atualizarOrdem(req, res, next) {
        try {

            const ordens = req.body;

            const result = await service.atualizarOrdemMetricas(ordens);

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    },

    async remover(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    message: 'ID é obrigatório.'
                });
            }

            await service.remover(Number(id));

            return res.json({
                message: 'Regra removida com sucesso.'
            });

        } catch (err) {
            return next(err);
        }
    }
};