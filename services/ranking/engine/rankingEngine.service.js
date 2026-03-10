class RankingEngineService {
    constructor(connection) {
        this.connection = connection;

        this.metricasCompostas = {
            // exemplo futuro
            // faturamento_total: (d) => Number(d.fat_a||0) + Number(d.fat_b||0),
        };
    }

    normalizarKey(key) {
        return String(key ?? '').trim().toLowerCase();
    }

    resolverValorMetrica(dados, metricaCodigo) {
        const k = this.normalizarKey(metricaCodigo);
        if (!k) return 0;

        const fn = this.metricasCompostas[k];
        if (typeof fn === 'function') return Number(fn(dados)) || 0;

        for (const key in dados) {
            if (this.normalizarKey(key) === k) {
                return Number(dados[key]) || 0;
            }
        }

        return 0;
    }

    async calcularParaGrupo(grupo_id, mes_referente) {

        console.log('ENGINE EXECUTANDO');

        // 1 Buscar tipo de ranking do grupo
        const [[grupo]] = await this.connection.query(`
            SELECT rank_tipo_id
            FROM dominio_grupos
            WHERE grupo_id = ?
        `, [grupo_id]);

        if (!grupo || !grupo.rank_tipo_id) {
            throw new Error('Grupo sem tipo de ranking definido.');
        }

        const rankTipoId = grupo.rank_tipo_id;

        // 2 Verificar se ranking está fechado
        const [[config]] = await this.connection.query(`
            SELECT fechado
            FROM core_ranking_config_mes
            WHERE grupo_id = ?
            AND mes_referente = ?
        `, [grupo_id, mes_referente]);

        if (config?.fechado) {
            throw new Error('Ranking está fechado para este mês.');
        }

        // 3 Buscar regras
        const [regras] = await this.connection.query(`
            SELECT 
                r.*,
                m.metrica AS metrica_codigo,
                r.bonus  AS bonus,
                mp.metrica AS multiplica_codigo
            FROM core_ranking_regras r
            JOIN core_ranking_metricas m 
                ON m.id = r.metrica_id
            LEFT JOIN core_ranking_metricas mp
                ON mp.id = r.multiplica_por_metrica_id
            WHERE r.rank_tipo_id = ?
            AND r.ativo = 1
            ORDER BY r.ordem ASC, r.min_valor ASC
        `, [rankTipoId]);

        // 4 Buscar vendedores do grupo
        const [vendedores] = await this.connection.query(`
            SELECT v.vendedor_id
            FROM dominio_vendedores v
            JOIN core_grupos_vendedores gv 
                ON gv.vendedor_id = v.vendedor_id
            WHERE gv.grupo_id = ?
            AND v.vendedor_ativo = TRUE
        `, [grupo_id]);

        const vendedoresIds = vendedores.map(v => v.vendedor_id);

        // 5 Atualizar status ativo/inativo
        if (vendedoresIds.length > 0) {

            await this.connection.query(`
                UPDATE core_ranking_resultado
                SET ativo = 0
                WHERE grupo_id = ?
                AND mes_referente = ?
                AND vendedor_id NOT IN (?)
            `, [grupo_id, mes_referente, vendedoresIds]);

            await this.connection.query(`
                UPDATE core_ranking_resultado
                SET ativo = 1
                WHERE grupo_id = ?
                AND mes_referente = ?
                AND vendedor_id IN (?)
            `, [grupo_id, mes_referente, vendedoresIds]);
        }

        // 6 Buscar snapshot do mês
        const [metricasMes] = await this.connection.query(`
            SELECT *
            FROM core_ranking_snapshot
            WHERE mes_referente = ?
        `, [mes_referente]);

        const mapaMetricas = {};
        for (const m of metricasMes) {
            mapaMetricas[m.vendedor_id] = m;
        }

        const resultados = [];

        for (const vendedor of vendedores) {

            const dados = mapaMetricas[vendedor.vendedor_id];
            if (!dados) continue;

            let totalPontos = 0;
            let totalBonus = 0;

            const vendas = Number(dados.vendas || 0);
            const liberaCred = Number(dados.club || 0);

            const podeReceberPontos = vendas >= 5 && liberaCred >= 5;
            const podeReceberBonus = vendas >= 7;

            // cálculo das regras
            for (const regra of regras) {

                const valor = this.resolverValorMetrica(dados, regra.metrica_codigo);

                const min = regra.min_valor !== null && regra.min_valor !== undefined
                    ? Number(regra.min_valor)
                    : 0;

                const max = (regra.max_valor !== null && regra.max_valor !== undefined)
                    ? Number(regra.max_valor)
                    : null;

                if (valor < min) continue;
                if (max !== null && valor > max) continue;

                const pontos = Number(regra.pontos || 0);
                let calculado = 0;

                if (regra.multiplica_codigo) {
                    const multiplicador = this.resolverValorMetrica(dados, regra.multiplica_codigo);
                    calculado = pontos * multiplicador;
                } else {
                    calculado = pontos;
                }

                if (podeReceberPontos || Number(regra.rank_tipo_id != 1)) {
                    totalPontos += calculado;
                }

                if (Number(regra.bonus) === 1 && podeReceberBonus) {
                    totalBonus += calculado;
                }
            }

            // 7 Ajustes manuais
            const [[ajuste]] = await this.connection.query(`
                SELECT SUM(pontos) as total_ajuste
                FROM core_ranking_ajustes
                WHERE grupo_id = ?
                AND vendedor_id = ?
                AND mes_referente = ?
            `, [grupo_id, vendedor.vendedor_id, mes_referente]);

            const totalAjuste = Number(ajuste?.total_ajuste || 0);
            totalPontos += totalAjuste;

            // 8 Advertência
            const [[adv]] = await this.connection.query(`
                SELECT ativo
                FROM core_ranking_advertencias
                WHERE vendedor_id = ?
                AND mes_referente = ?
            `, [vendedor.vendedor_id, mes_referente]);

            if (adv?.ativo) {
                totalPontos = 0;
            }

            resultados.push({
                vendedor_id: vendedor.vendedor_id,
                ...dados,
                total_pontos: totalPontos,
                bonus: totalBonus
            });
        }

        // 9 Ordenar ranking
        const rankingOrdenado = resultados
            .sort((a, b) => b.total_pontos - a.total_pontos);

        // 10 Salvar resultado
        for (let posicao = 1; posicao <= rankingOrdenado.length; posicao++) {

            const r = rankingOrdenado[posicao - 1];

            await this.connection.query(`
        INSERT INTO core_ranking_resultado
        (
            mes_referente,
            rank_tipo_id,
            grupo_id,
            vendedor_id,
            posicao,
            total_pontos,
            bonus,
            vendas,
            llo,
            ritmo,
            retorno,
            captacao,
            nps,
            contratos,
            cny,
            club,
            entrega_club
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            posicao = VALUES(posicao),
            total_pontos = VALUES(total_pontos),
            bonus = VALUES(bonus),
            vendas = VALUES(vendas),
            llo = VALUES(llo),
            ritmo = VALUES(ritmo),
            retorno = VALUES(retorno),
            captacao = VALUES(captacao),
            nps = VALUES(nps),
            contratos = VALUES(contratos),
            cny = VALUES(cny),
            club = VALUES(club),
            entrega_club = VALUES(entrega_club),
            atualizado_em = CURRENT_TIMESTAMP
    `, [
                mes_referente,
                rankTipoId,
                grupo_id,
                r.vendedor_id,
                posicao,
                r.total_pontos,
                r.bonus,
                r.vendas,
                r.llo,
                r.ritmo,
                r.retorno,
                r.captacao,
                r.nps,
                r.contratos,
                r.cny,
                r.club,
                r.entrega_club
            ]);
        }

        return {
            message: 'Ranking calculado com pontos e bônus atualizados com sucesso.'
        };
    }

    async calcularTodosGrupos(mes_referente) {

        console.log(`ENGINE GERAL - Calculando ranking do mês ${mes_referente}`);

        // buscar grupos com ranking aberto no mês
        const [grupos] = await this.connection.query(`
        SELECT grupo_id
        FROM core_ranking_config_mes
        WHERE mes_referente = ?
        AND fechado = 0
    `, [mes_referente]);

        if (!grupos.length) {
            console.log('ENGINE GERAL - Nenhum grupo aberto para cálculo');

            return {
                message: 'Nenhum grupo aberto para cálculo neste mês.',
                grupos_processados: 0
            };
        }

        console.log(`ENGINE GERAL - ${grupos.length} grupos encontrados`);

        const resultados = [];

        for (const grupo of grupos) {

            console.log(`ENGINE - Calculando grupo ${grupo.grupo_id}`);

            try {

                const r = await this.calcularParaGrupo(
                    grupo.grupo_id,
                    mes_referente
                );

                resultados.push({
                    grupo_id: grupo.grupo_id,
                    status: 'ok',
                    message: r.message
                });

                console.log(`ENGINE - Grupo ${grupo.grupo_id} calculado`);

            } catch (err) {

                resultados.push({
                    grupo_id: grupo.grupo_id,
                    status: 'erro',
                    message: err.message
                });

                console.error(`ENGINE - Erro no grupo ${grupo.grupo_id}:`, err.message);
            }
        }

        console.log('ENGINE GERAL - Cálculo finalizado');

        return {
            message: 'Cálculo geral finalizado.',
            grupos_processados: resultados.length,
            resultados
        };
    }
}

module.exports = RankingEngineService;