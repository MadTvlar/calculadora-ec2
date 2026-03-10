const DominioVendedoresRepository = require('../../repository/vendedores/dominioVendedores.repository');

class DominioVendedoresService {
    constructor(connection) {
        this.repo = new DominioVendedoresRepository(connection);
    }

    async listarAtivos() {
        return this.repo.listarAtivos();
    }

    async listarTodos() {
        return this.repo.listarTodos();
    }

    async desativar(vendedor_id) {
        if (!vendedor_id) {
            const err = new Error('vendedor_id é obrigatório');
            err.statusCode = 400;
            throw err;
        }

        const atualizado = await this.repo.desativar(Number(vendedor_id));

        if (!atualizado) {
            const err = new Error('Vendedor não encontrado');
            err.statusCode = 404;
            throw err;
        }

        return { success: true };
    }

    async reativar(vendedor_id) {
        if (!vendedor_id) {
            const err = new Error('vendedor_id é obrigatório');
            err.statusCode = 400;
            throw err;
        }

        const atualizado = await this.repo.reativar(Number(vendedor_id));

        if (!atualizado) {
            const err = new Error('Vendedor não encontrado');
            err.statusCode = 404;
            throw err;
        }

        return { success: true };
    }
}

module.exports = DominioVendedoresService;