const connection = require('../../services/db');
const RankingTiposService = require('../../services/ranking/rankingTipos.service');

const service = new RankingTiposService(connection);

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
                message: 'Tipo de ranking criado com sucesso.',
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
                message: 'Tipo atualizado.'
            });
        } catch (err) {
            return next(err);
        }
    }
};