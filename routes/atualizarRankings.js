require('dotenv').config();

const representante = new Set([
  '53.562.394 HUDSON SANTOS DE LIMA', 'KEDMA NASCIMENTO MORAES', 'JANDERSON MOCAMBIQUE DE SOUZA', 'C J T SIMAO TRANSPORTE POR NAVEGACAO FLUVIAL LTDA', '53.017.883 LUCIDALVA GARCIA DE SOUZA', '53.376.541 MATHEUS SILVA DE SOUZA',
  'A C DE ALMEIDA', 'K. S. S. CARDOSO', 'L. C. M. DOS SANTOS', 'M A P ANGELIN CORPORATE LTDA', 'ODUÉNAVI DE MELO RIBEIRO PEREIRA', 'MOTO AMIL EIRELLI-ME', '47.551.394 JULIANA DA COSTA BEZERRA', '47.551.394 JULIANA DA COSTA BEZERRA '
]);

async function atualizarRankings(pool) {
  const referenteMes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  await pool.promise().query('DELETE FROM ranking_geral WHERE referente_mes = ?', [referenteMes]);

  const inserirDados = async (dados, tipo, campoValor) => {
    for (let i = 0; i < dados.length; i++) {
      const { vendedor } = dados[i];
      const valor = dados[i][campoValor];
      const posicao = i + 1;

      // Pula se o ID for de representante
      if (representante.has(vendedor)) continue;

      if (vendedor && valor !== null && valor !== undefined) {
        await pool.promise().query(
          'INSERT INTO ranking_geral (tipo, vendedor, valor, posicao, referente_mes) VALUES (?, ?, ?, ?, ?)',
          [tipo, vendedor, valor, posicao, referenteMes]
        );
      }
    }
  };

  const [rankVolume] = await pool.promise().query(`
  SELECT 
    id_microwork,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(vendedor, '^[0-9. ]+', ''),
        ' [0-9.-]+$',
        ''
      )
    ) AS vendedor,
    SUM(quantidade) AS total_vendas
  FROM mk_vendas_motos
  GROUP BY id_microwork, vendedor
  ORDER BY total_vendas DESC;
`);



  const [rankLLO] = await pool.promise().query(`
  SELECT 
    NULL AS id_microwork,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(vendedor, '^[0-9. ]+', ''),
        ' [0-9.-]+$',
        ''
      )
    ) AS vendedor,
    ROUND(SUM(lucro_ope) / SUM(valor_venda) * 100, 2) AS percentual_lucro
  FROM mk_vendas_motos
  GROUP BY 
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(vendedor, '^[0-9. ]+', ''),
        ' [0-9.-]+$',
        ''
      )
    )
  ORDER BY percentual_lucro DESC;
`);



  const [rankCaptacao] = await pool.promise().query(`
  SELECT 
    NULL AS id_microwork,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(SUBSTRING(
            vendedor,
            LOCATE('-', vendedor) + 1,
            LOCATE('(', vendedor) - LOCATE('-', vendedor) - 1
          )),
          '^[0-9. ]+',
          ''
        ),
        ' [0-9.-]+$',
        ''
      )
    ) AS vendedor,
    COUNT(*) AS totalCaptado
  FROM captacao_motos
  WHERE vendedor IS NOT NULL
  GROUP BY 
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(SUBSTRING(
            vendedor,
            LOCATE('-', vendedor) + 1,
            LOCATE('(', vendedor) - LOCATE('-', vendedor) - 1
          )),
          '^[0-9. ]+',
          ''
        ),
        ' [0-9.-]+$',
        ''
      )
    )
  ORDER BY totalCaptado DESC;
`);


  const [rankContrato] = await pool.promise().query(`
  SELECT 
    NULL AS id_microwork,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(vendedor),
          '^[0-9. ]+',
          ''
        ),
        ' [0-9.-]+$',
        ''
      )
    ) AS vendedor,
    COUNT(*) AS totalContratos
  FROM contratos_motos
  GROUP BY 
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(vendedor),
          '^[0-9. ]+',
          ''
        ),
        ' [0-9.-]+$',
        ''
      )
    )
  ORDER BY totalContratos DESC;
`);


  const [rankRetorno] = await pool.promise().query(`
  SELECT 
    NULL AS id_microwork,
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(vendedor),
          '^[0-9. ]+',
          ''
        ),
        ' [0-9.-]+$',
        ''
      )
    ) AS vendedor,
    COUNT(*) AS quantidadeRetorno
  FROM mk_vendas_motos
  WHERE retorno_porcent >= 2
  GROUP BY 
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(vendedor),
          '^[0-9. ]+',
          ''
        ),
        ' [0-9.-]+$',
        ''
      )
    )
  ORDER BY quantidadeRetorno DESC;
`);

  const [retornoDetalhado] = await pool.promise().query(`
  SELECT 
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''), 
        ' [0-9.-]+$', ''
      )
    ) AS vendedor,
    SUM(CASE WHEN retorno_porcent >= 2 AND retorno_porcent < 4 THEN 1 ELSE 0 END) AS r2,
    SUM(CASE WHEN retorno_porcent >= 4 THEN 1 ELSE 0 END) AS r4
  FROM mk_vendas_motos
  GROUP BY 
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(TRIM(vendedor), '^[0-9. ]+', ''), 
        ' [0-9.-]+$', ''
      )
    );
`);

  const inserirRetornoPorTipo = async (dados) => {
    for (const { vendedor, r2, r4 } of dados) {
      if (representante.has(vendedor)) continue;

      if (r2 > 0) {
        await pool.promise().query(
          'INSERT INTO ranking_geral (tipo, vendedor, valor, referente_mes) VALUES (?, ?, ?, ?)',
          ['r2', vendedor, r2, referenteMes]
        );
      }

      if (r4 > 0) {
        await pool.promise().query(
          'INSERT INTO ranking_geral (tipo, vendedor, valor, referente_mes) VALUES (?, ?, ?, ?)',
          ['r4', vendedor, r4, referenteMes]
        );
      }
    }
  };


  await inserirRetornoPorTipo(retornoDetalhado);



  await inserirDados(rankVolume, 'volume', 'total_vendas');
  await inserirDados(rankLLO, 'llo', 'percentual_lucro');
  await inserirDados(rankCaptacao, 'captacao', 'totalCaptado');
  await inserirDados(rankContrato, 'contratos', 'totalContratos');
  await inserirDados(rankRetorno, 'retorno', 'quantidadeRetorno');

  console.log('Todos os rankings foram inseridos com sucesso.');
}

module.exports = atualizarRankings;
