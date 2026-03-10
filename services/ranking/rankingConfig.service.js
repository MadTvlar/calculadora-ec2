const RankingConfigRepository = require('../../repository/ranking/rankingConfig.repository');

class RankingConfigService {
    constructor(connection) {
        this.repo = new RankingConfigRepository(connection);
    }

    async garantirConfig(mes_referente, grupo_id) {
        let config = await this.repo.findByMesAndGrupo(mes_referente, grupo_id);

        if (!config) {
            await this.repo.create({ mes_referente, grupo_id });
            config = await this.repo.findByMesAndGrupo(mes_referente, grupo_id);
        }

        return config;
    }

    async estaFechado(mes_referente, grupo_id) {
        const config = await this.repo.findByMesAndGrupo(mes_referente, grupo_id);
        return Boolean(config?.fechado);
    }

    async fechar(mes_referente, grupo_id) {
        const config = await this.repo.findByMesAndGrupo(mes_referente, grupo_id);

        if (!config) {
            throw new Error('Configuração não encontrada para este mês/grupo.');
        }

        if (config.fechado) {
            throw new Error('Ranking já está fechado.');
        }

        await this.repo.fechar(mes_referente, grupo_id);

        return { message: 'Ranking fechado com sucesso.' };
    }

    async reabrir(mes_referente, grupo_id) {
        const config = await this.repo.findByMesAndGrupo(mes_referente, grupo_id);

        if (!config) {
            throw new Error('Configuração não encontrada para este mês/grupo.');
        }

        if (!config.fechado) {
            throw new Error('Ranking já está aberto.');
        }

        await this.repo.reabrir(mes_referente, grupo_id);

        return { message: 'Ranking reaberto com sucesso.' };
    }
}

module.exports = RankingConfigService;