// src/controllers/dominioGrupos.controller.js
const connection = require('../../services/db');
const DominioGruposService = require('../../services/grupos/dominioGrupos.service');

const service = new DominioGruposService(connection);

module.exports = {

    // POST /dominio/grupos
    async create(req, res, next) {
        try {
            const data = await service.create(req.body);
            return res.status(201).json(data);
        } catch (err) {
            return next(err);
        }
    },

    // GET /dominio/grupos
    async list(req, res, next) {
        try {
            const data = await service.list();
            return res.json(data);
        } catch (err) {
            return next(err);
        }
    },

    async listRanking(req, res, next) {
        try {
            const data = await service.listRanking();
            return res.json(data);
        } catch (err) {
            return next(err);
        }
    },

    // GET /dominio/grupos/:grupo_id
    async getById(req, res, next) {
        try {
            const { grupo_id } = req.params;
            const data = await service.getById(Number(grupo_id));
            return res.json(data);
        } catch (err) {
            return next(err);
        }
    },

    // PUT /dominio/grupos/:grupo_id
    async update(req, res, next) {
        try {
            const { grupo_id } = req.params;
            const data = await service.update(Number(grupo_id), req.body);
            return res.json(data);
        } catch (err) {
            return next(err);
        }
    },

    // PATCH /dominio/grupos/:grupo_id/rank-tipo
    async definirRankTipo(req, res, next) {
        try {
            const { grupo_id } = req.params;
            const { rank_tipo_id } = req.body;

            if (!rank_tipo_id) {
                return res.status(400).json({
                    message: 'rank_tipo_id é obrigatório.'
                });
            }

            await service.definirRankTipo(
                Number(grupo_id),
                Number(rank_tipo_id)
            );

            return res.json({
                message: 'Tipo de ranking vinculado ao grupo com sucesso.'
            });

        } catch (err) {
            return next(err);
        }
    },

    // DELETE /dominio/grupos/:grupo_id
    async remove(req, res, next) {
        try {
            const { grupo_id } = req.params;
            const data = await service.remove(Number(grupo_id));
            return res.json(data);
        } catch (err) {
            return next(err);
        }
    },
};