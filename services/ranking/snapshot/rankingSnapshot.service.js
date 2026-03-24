const ensureVendedor = require('../../ensureVendedor');

class RankingSnapshotService {
    constructor(connection) {
        this.connection = connection;
    }

    async gerarSnapshot(mes_referente) {

        // normaliza mês
        if (mes_referente.length === 10) {
            mes_referente = mes_referente.substring(0, 7);
        }

        console.log('SNAPSHOT INICIANDO:', mes_referente);

        // Volume de vendas
        const [volumeNovas] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                SUM(quantidade) AS vendasNovas
            FROM microwork.vendas_motos
            WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // Volume de vendas Seminovas
        const [volumeSeminovas] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                SUM(quantidade) AS vendasSeminovas
            FROM microwork.vendas_seminovas
            WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // LLO
        const [llo] = await this.connection.query(`
            SELECT
                vendedor_id,
                ROUND(SUM(lucro_ope) / NULLIF(SUM(valor_venda_real), 0) * 100, 2) AS llo
            FROM (
                SELECT
                    id_microwork AS vendedor_id,
                    lucro_ope,
                    valor_venda_real
                FROM microwork.vendas_motos
                WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?

                UNION ALL

                SELECT
                    id_microwork AS vendedor_id,
                    lucro_ope,
                    valor_venda_real
                FROM microwork.vendas_seminovas
                WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            ) AS base
            GROUP BY vendedor_id
        `, [mes_referente, mes_referente]);

        // ritmo (primeiros 15 dias) Novas
        const [ritmoNovas] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                SUM(quantidade) AS ritmoNovas
            FROM microwork.vendas_motos
            WHERE data_venda >= CONCAT(?, '-01')
            AND data_venda < CONCAT(?, '-16')
            GROUP BY id_microwork
        `, [mes_referente, mes_referente]);

        // ritmo (primeiros 15 dias) Seminovas
        const [ritmoSeminovas] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                SUM(quantidade) AS ritmoSeminovas
            FROM microwork.vendas_seminovas
            WHERE data_venda >= CONCAT(?, '-01')
            AND data_venda < CONCAT(?, '-16')
            GROUP BY id_microwork
        `, [mes_referente, mes_referente]);

        // Captação
        const [captacao] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                COUNT(*) AS captacao
            FROM microwork.captacao_motos
            WHERE DATE_FORMAT(data_conclusao, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // Contratos
        const [contratos] = await this.connection.query(`
            SELECT
                id_microwork AS vendedor_id,
                COUNT(*) AS contratos
            FROM microwork.contratos_motos
            WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // CNY
        const [cny] = await this.connection.query(`
            SELECT
                id_microwork AS vendedor_id,
                COUNT(*) AS cny
            FROM microwork.contratos_motos
            WHERE administrador = 'YAC'
            AND DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // CLUB
        const [club] = await this.connection.query(`
            SELECT
                id_microwork AS vendedor_id,
                COUNT(*) AS club
            FROM microwork.contratos_motos
            WHERE administrador = 'LIBERACRED'
            AND DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // Entrega club
        const [entrega_club] = await this.connection.query(`
            SELECT
                id_microwork AS vendedor_id,
                COUNT(*) AS entrega_club
            FROM microwork.vendas_motos
            WHERE tipo_venda = 'LIBERA CRED'
            AND DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // Retorno + R2 + R4 Novas
        const [retornoNovas] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 2 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS retornoNovas,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 2 AND retorno_porcent < 4 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS r2Novas,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 4 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS r4Novas

            FROM microwork.vendas_motos
            WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // Retorno + R2 + R4 Seminovas
        const [retornoSeminovas] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 2 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS retornoSeminovas,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 2 AND retorno_porcent < 4 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS r2Seminovas,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 4 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS r4Seminovas

            FROM microwork.vendas_seminovas
            WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // NPS
        const [nps] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                CASE 
                    WHEN COUNT(*) >= 3 
                    THEN ROUND(((SUM(promotora) - SUM(detratora)) / COUNT(*)) * 100, 2)
                    ELSE 0
                END AS nps
            FROM nps_geral
            WHERE DATE_FORMAT(data, '%Y-%m') = ?
            AND id_microwork IS NOT NULL
            AND id_microwork <> ''
            GROUP BY id_microwork
        `, [mes_referente]);

        // vendedores
        const [vendedoresInfo] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                MAX(vendedor) AS vendedor,
                MAX(empresa) AS empresa
            FROM microwork.vendas_motos
            GROUP BY id_microwork
        `);

        const mapaVendedores = {};

        for (const v of vendedoresInfo) {
            mapaVendedores[v.vendedor_id] = {
                nome: v.vendedor,
                empresa: v.empresa
            };
        }

        // mapa consolidado
        const mapa = {};

        const merge = (rows, campo) => {
            for (const row of rows) {

                if (!mapa[row.vendedor_id]) {
                    mapa[row.vendedor_id] = {
                        vendasNovas: 0,
                        vendasSeminovas: 0,
                        llo: 0,
                        ritmo: 0,
                        retornoNovas: 0,
                        retornoSeminovas: 0,
                        captacao: 0,
                        contratos: 0,
                        cny: 0,
                        club: 0,
                        entrega_club: 0,
                        nps: 0,
                        r2Novas: 0,
                        r2Seminovas: 0,
                        r4Novas: 0,
                        r4Seminovas: 0
                    };
                }

                mapa[row.vendedor_id][campo] = row[campo] || 0;
            }
        };

        merge(volumeSeminovas, 'vendasSeminovas');
        merge(volumeNovas, 'vendasNovas');
        merge(llo, 'llo');
        merge(ritmoSeminovas, 'ritmoSeminovas');
        merge(ritmoNovas, 'ritmoNovas');
        merge(captacao, 'captacao');
        merge(contratos, 'contratos');
        merge(cny, 'cny');
        merge(club, 'club');
        merge(entrega_club, 'entrega_club');
        merge(retornoSeminovas, 'retornoSeminovas');
        merge(retornoSeminovas, 'r2Seminovas');
        merge(retornoSeminovas, 'r4Seminovas');
        merge(retornoNovas, 'retornoNovas');
        merge(retornoNovas, 'r2Novas');
        merge(retornoNovas, 'r4Novas');
        merge(nps, 'nps');

        // UPSERT
        const promises = [];

        for (const vendedor_id in mapa) {

            const info = mapaVendedores[vendedor_id];

            const nome = info?.nome || `VENDEDOR ${vendedor_id}`;
            const empresa = info?.empresa || null;

            await ensureVendedor(
                this.connection,
                console.log,
                vendedor_id,
                nome,
                empresa
            );

            const dados = mapa[vendedor_id];

            promises.push(
                this.connection.query(`
                    INSERT INTO core_ranking_snapshot
                    (
                        vendedor_id,
                        mes_referente,
                        vendas,
                        llo,
                        ritmo,
                        retorno,
                        captacao,
                        nps,
                        contratos,
                        cny,
                        club,
                        entrega_club,
                        r2,
                        r4
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
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
                        r2 = VALUES(r2),
                        r4 = VALUES(r4),
                        atualizado_em = CURRENT_TIMESTAMP
                `, [
                    vendedor_id,
                    `${mes_referente}-01`,
                    Number(dados.vendasNovas || 0) + Number(dados.vendasSeminovas || 0),
                    dados.llo,
                    Number(dados.ritmoNovas || 0) + Number(dados.ritmoSeminovas || 0),
                    Number(dados.retornoNovas || 0) + Number(dados.retornoSeminovas || 0),
                    dados.captacao,
                    dados.nps,
                    dados.contratos,
                    dados.cny,
                    dados.club,
                    dados.entrega_club,
                    Number(dados.r2Novas || 0) + Number(dados.r2Seminovas || 0),
                    Number(dados.r4Novas || 0) + Number(dados.r2Novas || 0)
                ])
            );
        }

        await Promise.all(promises);

        console.log('SNAPSHOT FINALIZADO');

        return { message: 'Snapshot gerado com sucesso.' };
    }
}

module.exports = RankingSnapshotService;