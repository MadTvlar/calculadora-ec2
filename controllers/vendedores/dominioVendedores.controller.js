const connection = require('../../services/db');
const DominioVendedoresService = require('../../services/vendedores/dominioVendedores.service');

const service = new DominioVendedoresService(connection);

module.exports = {

    // GET listar apenas ativos
    async listarAtivos(req, res, next) {
        try {
            const result = await service.listarAtivos();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    },

    // GET listar todos
    async listarTodos(req, res, next) {
        try {
            const result = await service.listarTodos();
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    },

    // DELETE lógico
    async desativar(req, res, next) {
        try {
            const { vendedor_id } = req.params;

            const result = await service.desativar(Number(vendedor_id));

            return res.json(result);
        } catch (err) {
            return next(err);
        }
    },

    // Reativar vendedor
    async reativar(req, res, next) {
        try {
            const { vendedor_id } = req.params;

            const result = await service.reativar(Number(vendedor_id));

            return res.json(result);
        } catch (err) {
            return next(err);
        }
    }

};