const RankingSnapshotService = require('../../services/ranking/snapshot/rankingSnapshot.service');
const connection = require('../../services/db');

exports.gerar = async (req, res) => {
    try {

        let { mes_referente } = req.body;

        if (!mes_referente) {
            return res.status(400).json({
                message: 'mes_referente é obrigatório (formato YYYY-MM)'
            });
        }

        const service = new RankingSnapshotService(connection);

        const resultado = await service.gerarSnapshot(mes_referente);

        return res.status(200).json(resultado);

    } catch (error) {

        console.error('Erro ao gerar snapshot:', error);

        return res.status(500).json({
            message: error.message || 'Erro interno ao gerar snapshot'
        });
    }
};