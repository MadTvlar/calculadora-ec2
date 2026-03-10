const DominioGruposRepository = require('../../repository/grupos/dominioGrupos.repository');

class DominioGruposService {
    constructor(connection) {
        this.repo = new DominioGruposRepository(connection);
    }

    async create(payload) {
        if (!payload?.nome) {
            const err = new Error('Nome é obrigatório');
            err.statusCode = 400;
            throw err;
        }

        // Normalização do nome
        payload.nome = payload.nome.trim().toLowerCase();

        return this.repo.create(payload);
    }

    capitalizeWords(text) {
        return text
            .trim()
            .split(/\s+/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    async list() {
        const grupos = await this.repo.findAll();

        return grupos.map(g => ({
            ...g,
            nome: this.capitalizeWords(g.nome)
        }));
    }

    async listRanking() {
        const grupos = await this.repo.findGroupRanking();

        return grupos.map(g => ({
            ...g,
            nome: this.capitalizeWords(g.nome)
        }));
    }

    async getById(grupo_id) {
        const item = await this.repo.findById(grupo_id);
        if (!item) {
            const err = new Error('Grupo não encontrado');
            err.statusCode = 404;
            throw err;
        }
        return item;
    }

    async definirRankTipo(grupo_id, rank_tipo_id) {
        if (!grupo_id || !rank_tipo_id) {
            throw new Error('grupo_id e rank_tipo_id são obrigatórios.');
        }

        await this.repo.atualizarRankTipo(grupo_id, rank_tipo_id);
    }

    async update(grupo_id, payload) {
        if (payload?.nome) {
            payload.nome = payload.nome.trim().toLowerCase();
        }

        const updated = await this.repo.update(grupo_id, payload);

        if (!updated) {
            const err = new Error('Grupo não encontrado');
            err.statusCode = 404;
            throw err;
        }

        return updated;
    }

    async remove(grupo_id) {
        const ok = await this.repo.delete(grupo_id); // delete lógico
        if (!ok) {
            const err = new Error('Grupo não encontrado');
            err.statusCode = 404;
            throw err;
        }
        return { success: true };
    }
}

module.exports = DominioGruposService;