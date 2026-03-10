const connection = require('../../services/db');
const CoreGruposVendedoresService = require('../../services/grupos/coreGruposVendedores.service');

const service = new CoreGruposVendedoresService(connection);

module.exports = {

    // POST → Vincular vendedor a grupo
    async vincular(req, res, next) {
        try {
            const { grupo_id, vendedor_id } = req.body;

            const result = await service.vincular(
                Number(grupo_id),
                Number(vendedor_id)
            );

            return res.status(201).json(result);

        } catch (err) {
            return next(err);
        }
    },

    // GET → Listar vendedores de um grupo
    async listarPorGrupo(req, res, next) {
        try {
            const { grupo_id } = req.params;

            const result = await service.listarPorGrupo(
                Number(grupo_id)
            );

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    },

    // DELETE → Remover vínculo
    async remover(req, res, next) {
        try {
            const { grupo_id, vendedor_id } = req.params;

            const result = await service.remover(
                Number(grupo_id),
                Number(vendedor_id)
            );

            return res.json(result);

        } catch (err) {
            return next(err);
        }
    },

    // GET → Listar todos vínculos
    async listarTodos(req, res, next) {
        try {
            const result = await service.listarTodos();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    }

};