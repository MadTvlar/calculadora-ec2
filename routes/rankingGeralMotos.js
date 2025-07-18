require('dotenv').config();

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
  'LEONIDAS AUGUSTO PINEDO NETO'
]);

async function atualizarRankings(pool) {
  const referenteMes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  console.log(referenteMes);


  console.log('\nLimpando a tabela de ranking_geral');
  await pool.promise().query('TRUNCATE TABLE tropa_azul.ranking_geral');

  const inserirDados = async (dados, tipo, campoValor, incluirDadosExtras = false) => {
    for (let i = 0; i < dados.length; i++) {
      const { vendedor } = dados[i];
      const valor = dados[i][campoValor];
      const posicao = i + 1;

      if (representante.has(vendedor)) continue;

      if (vendedor && valor !== null && valor !== undefined) {
        const empresa = incluirDadosExtras ? dados[i].empresa || null : null;
        const id_microwork = incluirDadosExtras ? dados[i].id_microwork || null : null;

        await pool.promise().query(
          'INSERT INTO ranking_geral (tipo, filial, id_microwork, vendedor, valor, posicao, referente_mes) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [tipo, empresa, id_microwork, vendedor, valor, posicao, referenteMes]
        );
      }
    }
  };

  const [rankVolume] = await pool.promise().query(`
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
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')

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
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  ) AS uniao
  GROUP BY id_microwork, vendedor
  ORDER BY total_vendas DESC;
`);


  const [rankLLO] = await pool.promise().query(`
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
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')

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
    WHERE DATE_FORMAT(data_venda, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  ) AS uniao
  GROUP BY id_microwork, vendedor
  ORDER BY percentual_lucro DESC;
`);


  const [rankCaptacao] = await pool.promise().query(`
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
    AND DATE_FORMAT(data_conclusao, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  GROUP BY id_microwork, vendedor
  ORDER BY totalCaptado DESC;
`);


  const [rankContrato] = await pool.promise().query(`
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
  WHERE DATE_FORMAT(data_venda, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  GROUP BY id_microwork, empresa, vendedor
  ORDER BY totalContratos DESC;
`);


  const [rankRetorno] = await pool.promise().query(`
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
    COUNT(*) - SUM(CASE WHEN quantidade = -1 THEN 2 ELSE 0 END) AS quantidadeRetorno
  FROM microwork.vendas_motos
  WHERE retorno_porcent >= 2
    AND DATE_FORMAT(data_venda, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  GROUP BY id_microwork, empresa, vendedor
  ORDER BY quantidadeRetorno DESC;
`);



  const [retornoDetalhado] = await pool.promise().query(`
  SELECT 
    id_microwork,
    empresa,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''), 
        ' [0-9.-]+$', ''
      )
    ) AS vendedor,
    SUM(
      CASE 
        WHEN retorno_porcent >= 2 AND retorno_porcent < 4 THEN 
          CASE WHEN quantidade = -1 THEN -1 ELSE 1 END
        ELSE 0
      END
    ) AS r2,
    SUM(
      CASE 
        WHEN retorno_porcent >= 4 THEN 
          CASE WHEN quantidade = -1 THEN -1 ELSE 1 END
        ELSE 0
      END
    ) AS r4
  FROM microwork.vendas_motos
  WHERE DATE_FORMAT(data_venda, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
  GROUP BY id_microwork, empresa, vendedor;
`);


  const inserirRetornoPorTipo = async (dados) => {
    for (const { vendedor, r2, r4, empresa, id_microwork } of dados) {
      if (representante.has(vendedor)) continue;

      if (r2 > 0) {
        await pool.promise().query(
          'INSERT INTO ranking_geral (tipo, filial, id_microwork, vendedor, valor, referente_mes) VALUES (?, ?, ?, ?, ?, ?)',
          ['r2', empresa || null, id_microwork || null, vendedor, r2, referenteMes]
        );
      }

      if (r4 > 0) {
        await pool.promise().query(
          'INSERT INTO ranking_geral (tipo, filial, id_microwork, vendedor, valor, referente_mes) VALUES (?, ?, ?, ?, ?, ?)',
          ['r4', empresa || null, id_microwork || null, vendedor, r4, referenteMes]
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

  console.log('...Tabela de ranking_geral atualizada!');
}

module.exports = atualizarRankings;
