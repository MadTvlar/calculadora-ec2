const connection = require('../../services/db');
const RankingMetricasService = require('../../services/ranking/rankingMetricas.service');

const service = new RankingMetricasService(connection);

module.exports = {

    async listar(req, res, next) {
        try {
            const result = await service.listar();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    },

    async criar(req, res, next) {
        try {
            const id = await service.criar(req.body);

            return res.status(201).json({
                message: 'Métrica criada com sucesso.',
                id
            });
        } catch (err) {
            return next(err);
        }
    },

    async atualizar(req, res, next) {
        try {
            const { id } = req.params;

            await service.atualizar(Number(id), req.body);

            return res.json({
                message: 'Métrica atualizada.'
            });
        } catch (err) {
            return next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            const data = await service.delete(Number(id));
            return res.json(data);
        } catch (err) {
            next(err);
        }
    }
};