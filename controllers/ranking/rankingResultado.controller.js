const RankingResultadoService = require('../../services/ranking/resultado/rankingResultado.service');
const connection = require('../../services/db');

exports.listar = async (req, res) => {
    try {

        let { grupo_id, mes } = req.query;

        if (!grupo_id || !mes) {
            return res.status(400).json({
                message: 'grupo_id e mes são obrigatórios'
            });
        }

        // 🔹 Padronizar mes para YYYY-MM-01
        if (mes.length === 7) {
            mes = mes + '-01';
        }

        const service = new RankingResultadoService(connection);

        const resultado = await service.obterRankingCompleto(
            grupo_id,
            mes
        );

        return res.status(200).json(resultado);

    } catch (error) {

        console.error('Erro ao listar ranking:', error);

        return res.status(500).json({
            message: error.message || 'Erro interno ao buscar ranking'
        });
    }
};