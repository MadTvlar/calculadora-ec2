const CoreGruposVendedoresRepository = require('../../repository/grupos/coreGruposVendedores.repository');

class CoreGruposVendedoresService {
    constructor(connection) {
        this.repo = new CoreGruposVendedoresRepository(connection);
    }

    async vincular(grupo_id, vendedor_id) {
        if (!grupo_id || !vendedor_id) {
            const err = new Error('grupo_id e vendedor_id são obrigatórios');
            err.statusCode = 400;
            throw err;
        }

        return this.repo.vincular(grupo_id, vendedor_id);
    }

    async listarPorGrupo(grupo_id) {
        if (!grupo_id) {
            const err = new Error('grupo_id é obrigatório');
            err.statusCode = 400;
            throw err;
        }

        return this.repo.listarPorGrupo(grupo_id);
    }

    async remover(grupo_id, vendedor_id) {
        const removido = await this.repo.remover(grupo_id, vendedor_id);

        if (!removido) {
            const err = new Error('Vínculo não encontrado');
            err.statusCode = 404;
            throw err;
        }

        return { success: true };
    }

    async listarTodos() {
        return this.repo.listarTodos();
    }
}

module.exports = CoreGruposVendedoresService;