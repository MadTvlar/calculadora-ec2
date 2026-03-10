const connection = require('../../services/db');
const RankingEngineService = require('../../services/ranking/engine/rankingEngine.service');

const service = new RankingEngineService(connection);

module.exports = {

    async calcularManual(req, res, next) {
        try {

            let { grupo_id, mes_referente } = req.body;

            if (!grupo_id || !mes_referente) {
                return res.status(400).json({
                    message: 'grupo_id e mes_referente são obrigatórios.'
                });
            }

            if (mes_referente && mes_referente.length === 7) {
                mes_referente = mes_referente + '-01';
            }

            const result = await service.calcularParaGrupo(
                Number(grupo_id),
                mes_referente
            );

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    },

    async calcularGeral(req, res, next) {
        try {

            let { mes_referente } = req.body;

            if (!mes_referente) {
                return res.status(400).json({
                    message: 'mes_referente é obrigatório.'
                });
            }

            if (mes_referente.length === 7) {
                mes_referente = mes_referente + '-01';
            }

            const result = await service.calcularTodosGrupos(
                mes_referente
            );

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    }

};