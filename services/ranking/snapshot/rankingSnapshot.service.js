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
        const [volume] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                SUM(quantidade) AS vendas
            FROM microwork.vendas_motos
            WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // LLO
        const [llo] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                ROUND(SUM(lucro_ope) / NULLIF(SUM(valor_venda_real),0) * 100, 2) AS llo
            FROM microwork.vendas_motos
            WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // ritmo (primeiros 15 dias)
        const [ritmo] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,
                SUM(quantidade) AS ritmo
            FROM microwork.vendas_motos
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

        // CLUBE
        const [clube] = await this.connection.query(`
            SELECT
                id_microwork AS vendedor_id,
                COUNT(*) AS clube
            FROM microwork.contratos_motos
            WHERE administrador = 'LIBERACRED'
            AND DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // Entrega clube
        const [entrega_clube] = await this.connection.query(`
            SELECT
                id_microwork AS vendedor_id,
                COUNT(*) AS entrega_clube
            FROM microwork.vendas_motos
            WHERE tipo_venda = 'LIBERA CRED'
            AND DATE_FORMAT(data_venda, '%Y-%m') = ?
            GROUP BY id_microwork
        `, [mes_referente]);

        // Retorno + R2 + R4
        const [retorno] = await this.connection.query(`
            SELECT 
                id_microwork AS vendedor_id,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 2 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS retorno,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 2 AND retorno_porcent < 4 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS r2,

                SUM(
                    CASE 
                        WHEN retorno_porcent >= 4 
                        THEN quantidade
                        ELSE 0
                    END
                ) AS r4

            FROM microwork.vendas_motos
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
                        vendas: 0,
                        llo: 0,
                        ritmo: 0,
                        retorno: 0,
                        captacao: 0,
                        contratos: 0,
                        cny: 0,
                        clube: 0,
                        entrega_clube: 0,
                        nps: 0,
                        r2: 0,
                        r4: 0
                    };
                }

                mapa[row.vendedor_id][campo] = row[campo] || 0;
            }
        };

        merge(volume, 'vendas');
        merge(llo, 'llo');
        merge(ritmo, 'ritmo');
        merge(captacao, 'captacao');
        merge(contratos, 'contratos');
        merge(cny, 'cny');
        merge(clube, 'clube');
        merge(entrega_clube, 'entrega_clube');
        merge(retorno, 'retorno');
        merge(retorno, 'r2');
        merge(retorno, 'r4');
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
                        clube,
                        entrega_clube,
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
                        clube = VALUES(clube),
                        entrega_clube = VALUES(entrega_clube),
                        r2 = VALUES(r2),
                        r4 = VALUES(r4),
                        atualizado_em = CURRENT_TIMESTAMP
                `, [
                    vendedor_id,
                    `${mes_referente}-01`,
                    dados.vendas,
                    dados.llo,
                    dados.ritmo,
                    dados.retorno,
                    dados.captacao,
                    dados.nps,
                    dados.contratos,
                    dados.cny,
                    dados.clube,
                    dados.entrega_clube,
                    dados.r2,
                    dados.r4
                ])
            );
        }

        await Promise.all(promises);

        console.log('SNAPSHOT FINALIZADO');

        return { message: 'Snapshot gerado com sucesso.' };
    }
}

module.exports = RankingSnapshotService;