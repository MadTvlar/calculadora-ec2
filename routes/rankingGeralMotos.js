// Essa rota faz a orgnanização da pontuação por KPI's do mês selecionado na variavel mesReferente do NPS

require('dotenv').config();
<<<<<<< HEAD
// Altere aqui o mês que você deseja consultar (formato 'YYYY-MM') mudar mes do rank
const referenteMes = '2025-11';
=======
>>>>>>> 5a31b3e0901e5d52396d4c09257b43691dae0dd3

async function atualizarRankings(pool,sendLog, mesReferente) {
  const representante = new Set([
  'HUDSON SANTOS DE LIMA',
  'KEDMA NASCIMENTO MORAES',
  'JANDERSON MOCAMBIQUE DE SOUZA',
  'C J T SIMAO TRANSPORTE POR NAVEGACAO FLUVIAL LTDA',
  'LUCIDALVA GARCIA DE SOUZA',
  'MATHEUS SILVA DE SOUZA',
  'A C DE ALMEIDA',
  'K. S. S. CARDOSO',
  'L. C. M. DOS SANTOS',
  'M A P ANGELIN CORPORATE LTDA',
  'ODUÉNAVI DE MELO RIBEIRO PEREIRA',
  'MOTO AMIL EIRELLI-ME',
  'KLAUSBERG DA SILVA LIMA',
  'LUCIANO LINQUEO LESSE DOS SANTOS',
  'JACKSON IURY ROCHA DA SILVA',
  'JULIANA DA COSTA BEZERRA',
  'SHIRLENE PINHO DE SOUZA',
  'FRANSUILDO DOS SANTOS SILVA',
  'LUCIANO LINQUEO LESSE DOS SANTOS',
  'EDNALDO PEREIRA DO VALE',
  'LEONIDAS AUGUSTO PINEDO NETO',
  'DROGARIA CENTRAL  COMERCIO VAREJISTA DE MEDICAMENTOS LTDA',
  'NAYARA SERRAO DA SILVA',
  'ANA BEATRIZ CONCEICAO PEREIRA',
  'ANTONIA CLEANE DA SILVA FERREIRA',
  'DENISE HOLANDA LOURENÇO',
  'FRANCISCO VANDICKSON ALVES DE SOUZA',
  'JHON WESLLEY ARAUJO DA SILVA',
  'JIMMY ALBERT MAGALHAES GUIMARAES',
  'KAMILA JENNIFER LIMA BARROSO',
  'LUIZ LUCAS MATOS DE ALMEIDA',
  'RAFAEL FERREIRA DA SILVA',
  'RUAN FERNANDES DE LIMA',
  'SHAYANNE CUNHA DA SILVA',
  'GLEBER DE SOUZA MORAES JÚNIOR',
  'FERNANDO PEREIRA DA SILVA',
]);

  sendLog('\nLimpando a tabela de ranking_geral');
  await pool.query('TRUNCATE TABLE tropa_azul.ranking_geral');

  const inserirDados = async (dados, tipo, campoValor, incluirDadosExtras = false) => {
    for (let i = 0; i < dados.length; i++) {
      const { vendedor } = dados[i];
      const valor = dados[i][campoValor];
      const posicao = i + 1;

      if (representante.has(vendedor)) continue;
        sendLog(`Trabalhando na pontuação do vendedor ${vendedor}`)
        
      if (vendedor && valor !== null && valor !== undefined) {
        const empresa = incluirDadosExtras ? dados[i].empresa || null : null;
        const id_microwork = incluirDadosExtras ? dados[i].id_microwork || null : null;

        await pool.query(
          'INSERT INTO ranking_geral (tipo, filial, id_microwork, vendedor, valor, posicao, referente_mes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tipo, empresa, id_microwork, vendedor, valor, posicao, mesReferente]
        );
      }
    }
  };

  const [rankVolume] = await pool.query(`
  SELECT 
    id_microwork,
    ANY_VALUE(empresa) AS empresa,
    vendedor,
    SUM(quantidade) AS total_vendas
  FROM (
    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(vendedor, '^[0-9. ]+', ''),
          ' [0-9.-]+$',
          ''
        )
      ) AS vendedor,
      quantidade
    FROM microwork.vendas_motos
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?

    UNION ALL

    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(vendedor, '^[0-9. ]+', ''),
          ' [0-9.-]+$',
          ''
        )
      ) AS vendedor,
      quantidade
    FROM microwork.vendas_seminovas
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
  ) AS uniao
  GROUP BY id_microwork, vendedor
  ORDER BY total_vendas DESC;
`, [mesReferente, mesReferente]);


  const [rankLLO] = await pool.query(`
  SELECT 
    id_microwork,
    ANY_VALUE(empresa) AS empresa,
    vendedor,
    ROUND(SUM(lucro_ope) / SUM(valor_venda_real) * 100, 2) AS percentual_lucro
  FROM (
    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(vendedor, '^[0-9. ]+', ''),
          ' [0-9.-]+$',
          ''
        )
      ) AS vendedor,
      lucro_ope,
      valor_venda_real
    FROM microwork.vendas_motos
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?

    UNION ALL

    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(vendedor, '^[0-9. ]+', ''),
          ' [0-9.-]+$',
          ''
        )
      ) AS vendedor,
      lucro_ope,
      valor_venda_real
    FROM microwork.vendas_seminovas
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
  ) AS uniao
  GROUP BY id_microwork, vendedor
  ORDER BY percentual_lucro DESC;
`, [mesReferente, mesReferente]);


  const [rankCaptacao] = await pool.query(`
  SELECT 
    id_microwork,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''),
        ' [0-9.-]+$',
        ''
      )
    ) AS vendedor,
    COUNT(*) AS totalCaptado
  FROM microwork.captacao_motos
  WHERE vendedor IS NOT NULL
    AND DATE_FORMAT(data_conclusao, '%Y-%m') = ?
  GROUP BY id_microwork, vendedor
  ORDER BY totalCaptado DESC;
`, [mesReferente]);


  const [rankContrato] = await pool.query(`
  SELECT 
    id_microwork,
    empresa,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''),
        ' [0-9.-]+$',
        ''
      )
    ) AS vendedor,
    COUNT(*) AS totalContratos
  FROM microwork.contratos_motos
  WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
  GROUP BY id_microwork, empresa, vendedor
  ORDER BY totalContratos DESC;
`, [mesReferente]);


  const [rankRetorno] = await pool.query(`
  WITH vendas AS (
    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''),
          ' [0-9.-]+$',
          ''
        )
      ) AS vendedor,
      quantidade,
      retorno_porcent,
      data_venda
    FROM microwork.vendas_motos

    UNION ALL

    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''),
          ' [0-9.-]+$',
          ''
        )
      ) AS vendedor,
      quantidade,
      retorno_porcent,
      data_venda
    FROM microwork.vendas_seminovas
  )
  SELECT
    id_microwork,
    empresa,
    vendedor,
    COUNT(*) - SUM(CASE WHEN quantidade = -1 THEN 2 ELSE 0 END) AS quantidadeRetorno
  FROM vendas
  WHERE retorno_porcent >= 2
    AND DATE_FORMAT(data_venda, '%Y-%m') = ?
  GROUP BY id_microwork, empresa, vendedor
  ORDER BY quantidadeRetorno DESC;
`, [mesReferente]);


  const [retornoDetalhado] = await pool.query(`
  WITH vendas AS (
    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''), 
          ' [0-9.-]+$', ''
        )
      ) AS vendedor,
      quantidade,
      retorno_porcent,
      data_venda
    FROM microwork.vendas_motos

    UNION ALL

    SELECT 
      id_microwork,
      empresa,
      TRIM(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''), 
          ' [0-9.-]+$', ''
        )
      ) AS vendedor,
      quantidade,
      retorno_porcent,
      data_venda
    FROM microwork.vendas_seminovas
  )
  SELECT 
    id_microwork,
    empresa,
    vendedor,
    SUM(
      CASE 
        WHEN retorno_porcent >= 2 AND retorno_porcent < 4
          THEN CASE WHEN quantidade = -1 THEN -1 ELSE 1 END
        ELSE 0
      END
    ) AS r2,
    SUM(
      CASE 
        WHEN retorno_porcent >= 4
          THEN CASE WHEN quantidade = -1 THEN -1 ELSE 1 END
        ELSE 0
      END
    ) AS r4
  FROM vendas
  WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
  GROUP BY id_microwork, empresa, vendedor;
`, [mesReferente]);



  const inserirRetornoPorTipo = async (dados) => {
    for (const { vendedor, r2, r4, empresa, id_microwork } of dados) {
      if (representante.has(vendedor)) continue;

      if (r2 > 0) {
        await pool.query(
          'INSERT INTO ranking_geral (tipo, filial, id_microwork, vendedor, valor, referente_mes) VALUES (?, ?, ?, ?, ?, ?)',
          ['r2', empresa || null, id_microwork || null, vendedor, r2, mesReferente]
        );
      }

      if (r4 > 0) {
        await pool.query(
          'INSERT INTO ranking_geral (tipo, filial, id_microwork, vendedor, valor, referente_mes) VALUES (?, ?, ?, ?, ?, ?)',
          ['r4', empresa || null, id_microwork || null, vendedor, r4, mesReferente]
        );
      }
    }
  };


  await inserirRetornoPorTipo(retornoDetalhado);
  await inserirDados(rankVolume, 'volume', 'total_vendas', true); // inclui empresa e id_microwork
  await inserirDados(rankLLO, 'llo', 'percentual_lucro', true); // agora com empresa e id_microwork
  await inserirDados(rankCaptacao, 'captacao', 'totalCaptado', true); // inclui empresa e id_microwork
  await inserirDados(rankContrato, 'contratos', 'totalContratos', true); // inclui empresa como filial
  await inserirDados(rankRetorno, 'retorno', 'quantidadeRetorno', true); // inclui empresa e id_microwork

  sendLog('Tabela de ranking_geral atualizada!');
}

module.exports = atualizarRankings;
