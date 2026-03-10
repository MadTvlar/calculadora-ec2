const connection = require('../../services/db');
const RankingConfigService = require('../../services/ranking/rankingConfig.service');

const service = new RankingConfigService(connection);

module.exports = {

    async getStatus(req, res, next) {
        try {
            const { mes_referente, grupo_id } = req.query;

            if (!mes_referente || !grupo_id) {
                return res.status(400).json({
                    message: 'mes_referente e grupo_id são obrigatórios.'
                });
            }

            // 🔥 TRATAMENTO DO "all"
            if (grupo_id === 'all') {
                return res.json({
                    message: 'Todos selecionados'
                });
            }

            const grupoIdNumber = Number(grupo_id);

            if (isNaN(grupoIdNumber)) {
                return res.status(400).json({
                    message: 'grupo_id inválido.'
                });
            }

            const result = await service.garantirConfig(
                mes_referente,
                grupoIdNumber
            );

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    },

    async fechar(req, res, next) {
        try {
            const { mes_referente, grupo_id } = req.body;

            if (!mes_referente || !grupo_id) {
                return res.status(400).json({
                    message: 'mes_referente e grupo_id são obrigatórios.'
                });
            }

            const grupoIdNumber = Number(grupo_id);

            if (isNaN(grupoIdNumber)) {
                return res.status(400).json({
                    message: 'grupo_id inválido.'
                });
            }

            const result = await service.fechar(
                mes_referente,
                grupoIdNumber
            );

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    },

    async reabrir(req, res, next) {
        try {
            const { mes_referente, grupo_id } = req.body;

            if (!mes_referente || !grupo_id) {
                return res.status(400).json({
                    message: 'mes_referente e grupo_id são obrigatórios.'
                });
            }

            const grupoIdNumber = Number(grupo_id);

            if (isNaN(grupoIdNumber)) {
                return res.status(400).json({
                    message: 'grupo_id inválido.'
                });
            }

            const result = await service.reabrir(
                mes_referente,
                grupoIdNumber
            );

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    }

};