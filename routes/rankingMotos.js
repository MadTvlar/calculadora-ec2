const fetchrankingMotos = async (connection) => {
  const referente_mes = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  const [rankingGeral] = await connection.promise().query(`
    SELECT 
      vendedor_normalizado AS vendedor,
      MAX(CASE WHEN tipo = 'llo' THEN valor END) AS val_lucro,
      MAX(CASE WHEN tipo = 'volume' THEN valor END) AS val_vendas,
      MAX(CASE WHEN tipo = 'contratos' THEN valor END) AS val_contratos,
      MAX(CASE WHEN tipo = 'captacao' THEN valor END) AS val_captacao,
      MAX(CASE WHEN tipo = 'retorno' THEN valor END) AS val_retorno,
      MAX(CASE WHEN tipo = 'r2' THEN valor END) AS val_r2,
      MAX(CASE WHEN tipo = 'r4' THEN valor END) AS val_r4,
      MAX(n.nota_oficial) AS nota_oficial
    FROM (
      SELECT 
        r.*,
        CASE 
          WHEN LOCATE('-', r.vendedor) > 0 AND LOCATE('(', r.vendedor) > 0 
          THEN TRIM(SUBSTRING(r.vendedor, LOCATE('-', r.vendedor) + 1, LOCATE('(', r.vendedor) - LOCATE('-', r.vendedor) - 1))
          ELSE TRIM(r.vendedor)
        END AS vendedor_normalizado
      FROM ranking_geral r
    ) r
    LEFT JOIN nps n ON r.vendedor_normalizado = n.vendedores
    GROUP BY vendedor_normalizado
  `);

  for (const vendedor of rankingGeral) {
    const vendas = vendedor.val_vendas || 0;
    const llo = vendedor.val_lucro || 0;
    const captacao = vendedor.val_captacao || 0;
    const contrato = vendedor.val_contratos || 0;
    const retorno = vendedor.val_retorno || 0;
    const r2 = vendedor.val_r2 || 0;
    const r4 = vendedor.val_r4 || 0;
    const nps = vendedor.nota_oficial || 0;

    let pontosPorVenda = 0;
    if (vendas >= 7 && vendas <= 9) pontosPorVenda = 50;
    else if (vendas >= 10 && vendas <= 14) pontosPorVenda = 60;
    else if (vendas >= 15 && vendas <= 24) pontosPorVenda = 70;
    else if (vendas >= 25) pontosPorVenda = 80;

    if (vendas >= 7) {
      if (llo >= 13) pontosPorVenda += 80;
      else if (llo >= 12) pontosPorVenda += 70;
      else if (llo >= 11) pontosPorVenda += 60;
      else if (llo >= 10) pontosPorVenda += 50;
    }

    let pontosPorCaptacao = 0;
    if (captacao >= 3 && captacao <= 4) pontosPorCaptacao = 50;
    else if (captacao >= 5 && captacao <= 7) pontosPorCaptacao = 60;
    else if (captacao >= 8 && captacao <= 11) pontosPorCaptacao = 70;
    else if (captacao >= 12) pontosPorCaptacao = 80;

    let pontosPorContrato = 0;
    if (contrato >= 3 && contrato <= 4) pontosPorContrato = 50;
    else if (contrato >= 5 && contrato <= 7) pontosPorContrato = 60;
    else if (contrato >= 8 && contrato <= 11) pontosPorContrato = 70;
    else if (contrato >= 12) pontosPorContrato = 80;

    let pontosPorRetorno = 0;
    if (r2 >= 3 && r2 < 5) pontosPorRetorno = r2 * 50;
    else if (r2 >= 5 && r2 < 8) pontosPorRetorno = r2 * 60;
    else if (r2 >= 8 && r2 < 12) pontosPorRetorno = r2 * 70;
    else if (r2 >= 12) pontosPorRetorno = r2 * 80;

    if (r4 >= 3 && r4 < 5) pontosPorRetorno += r4 * 100;
    else if (r4 >= 5 && r4 < 8) pontosPorRetorno += r4 * 120;
    else if (r4 >= 8 && r4 < 12) pontosPorRetorno += r4 * 140;
    else if (r4 >= 12) pontosPorRetorno += r4 * 160;

    let pontosPorNPS = 0;
    if (nps >= 95 && nps < 96) pontosPorNPS = 100;
    else if (nps >= 96 && nps < 97) pontosPorNPS = 200;
    else if (nps >= 97 && nps < 98) pontosPorNPS = 300;
    else if (nps >= 98) pontosPorNPS = 500;

    const pontosTotais = (vendas * pontosPorVenda) +
      (captacao * pontosPorCaptacao) +
      (contrato * pontosPorContrato) +
      pontosPorRetorno + pontosPorNPS;

    await connection.promise().query(`
      INSERT INTO ranking_pontos 
        (vendedor, pontos, vendas, llo, captacao, contrato, retorno, NPS, referente_mes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        pontos = VALUES(pontos),
        vendas = VALUES(vendas),
        llo = VALUES(llo),
        captacao = VALUES(captacao),
        contrato = VALUES(contrato),
        retorno = VALUES(retorno),
        NPS = VALUES(NPS),
        atualizado_em = CURRENT_TIMESTAMP
    `, [
      vendedor.vendedor,
      pontosTotais,
      vendas,
      llo,
      captacao,
      contrato,
      retorno,
      nps,
      referente_mes
    ]);
  }

  console.log('Ranking de Motos por ponto, atualizado!')

};


module.exports = fetchrankingMotos;
