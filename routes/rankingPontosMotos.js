// Essa rota faz a orgnanização da pontuação dos KPI's em um Ranking por pontos

const fetchrankingPontosMotos = async (connection) => {
  const referente_mes = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  console.log('\nLimpando a tabela de ranking_pontos');
  await connection.query('TRUNCATE TABLE ranking_pontos');

  // console.log('\nBuscando vendas bônus dos dias 29, 30 e 31 de julho VENDAS BONUS EXTRA AQUI');

  // const [bonusVendas] = await connection.query(`
  //   SELECT 
  //     CASE 
  //       WHEN LOCATE('-', vendedor) > 0 AND LOCATE('(', vendedor) > 0 
  //       THEN TRIM(SUBSTRING(vendedor, LOCATE('-', vendedor) + 1, LOCATE('(', vendedor) - LOCATE('-', vendedor) - 1))
  //       ELSE TRIM(vendedor)
  //     END AS vendedor_normalizado,
  //     COUNT(*) AS vendas_bonus
  //   FROM microwork.vendas_motos
  //   WHERE DATE(data_venda) IN ('2025-07-29', '2025-07-30', '2025-07-31')
  //     AND MONTH(data_venda) = 7
  //   GROUP BY vendedor_normalizado
  // `);

  // // Criar objeto para acesso rápido ao bônus por vendedor
  // const bonusPorVendedor = {};
  // for (const row of bonusVendas) {
  //   bonusPorVendedor[row.vendedor_normalizado] = row.vendas_bonus;
  // }


  const [rankingGeral] = await connection.query(`
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

    // cálculo dos pontos conforme regras existentes
    let pontosPorVenda = 0;
    if (vendas >= 7 && vendas <= 9) pontosPorVenda = 50;
    else if (vendas >= 10 && vendas <= 14) pontosPorVenda = 60;
    else if (vendas >= 15 && vendas <= 22) pontosPorVenda = 70;
    else if (vendas >= 23) pontosPorVenda = 80;

    let pontoPorLLO = 0;
    if (vendas >= 7) {
      if (llo >= 10 && llo < 12) pontoPorLLO = 50 * vendas;
      else if (llo >= 12 && llo < 14) pontoPorLLO = 60 * vendas;
      else if (llo >= 14 && llo < 16) pontoPorLLO = 70 * vendas;
      else if (llo >= 16) pontoPorLLO = 80 * vendas;
    }

    let pontosPorCaptacao = 0;
    if (captacao >= 3 && captacao < 5) pontosPorCaptacao = 30;
    else if (captacao >= 5 && captacao < 8) pontosPorCaptacao = 40;
    else if (captacao >= 8 && captacao < 10) pontosPorCaptacao = 50;
    else if (captacao >= 10) pontosPorCaptacao = 60;

    let pontosPorContrato = 0;
    if (contrato >= 3 && contrato < 5) pontosPorContrato = 50;
    else if (contrato >= 5 && contrato < 8) pontosPorContrato = 60;
    else if (contrato >= 8 && contrato < 10) pontosPorContrato = 70;
    else if (contrato >= 10) pontosPorContrato = 80;

    let pontosPorRetorno = 0;
    if (retorno >= 3) {
      if (retorno < 5) pontosPorRetorno = r2 * 30;
      else if (retorno >= 5 && retorno < 8) pontosPorRetorno = r2 * 40;
      else if (retorno >= 8 && retorno < 10) pontosPorRetorno = r2 * 50;
      else if (retorno >= 10) pontosPorRetorno = r2 * 60;

      if (retorno < 5) pontosPorRetorno += r4 * 50;
      else if (retorno >= 5 && retorno < 8) pontosPorRetorno += r4 * 60;
      else if (retorno >= 8 && retorno < 10) pontosPorRetorno += r4 * 70;
      else if (retorno >= 10) pontosPorRetorno += r4 * 80;
    }

    let pontosPorNPS = 0;
    if (nps >= 95 && nps < 96) pontosPorNPS = 100;
    else if (nps >= 96 && nps < 97) pontosPorNPS = 200;
    else if (nps >= 97 && nps < 98) pontosPorNPS = 300;
    else if (nps >= 98) pontosPorNPS = 500;

    // const vendasBonus = bonusPorVendedor[vendedor.vendedor] || 0; // pega do objeto
    //  // AQUI É O CALCULO QUE VAI VALER DO BONUS BACKEND
    // const pontosBonus = vendasBonus * 50; // 50 pontos por venda bônus

    const pontosTotais = (pontosPorVenda * vendas) + pontoPorLLO +
      (captacao * pontosPorCaptacao) +
      (contrato * pontosPorContrato) +
      pontosPorRetorno + pontosPorNPS; //+ pontosBonus;

    // Busca id_microwork e filial via vendedor
    const [[usuario]] = await connection.query(`
      SELECT id_microwork, filial 
      FROM tropa_azul.ranking_geral 
      WHERE vendedor = ?
      LIMIT 1
    `, [vendedor.vendedor]);

    const idMicrowork = usuario ? usuario.id_microwork : null;
    const filial = usuario ? usuario.filial : null;

    await connection.query(`
      INSERT INTO ranking_pontos 
        (filial, id_microwork, vendedor, pontos, vendas, llo, captacao, contrato, retorno, NPS, referente_mes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        filial = VALUES(filial),
        pontos = VALUES(pontos),
        vendas = VALUES(vendas),
        llo = VALUES(llo),
        captacao = VALUES(captacao),
        contrato = VALUES(contrato),
        retorno = VALUES(retorno),
        NPS = VALUES(NPS),
        atualizado_em = CURRENT_TIMESTAMP
    `, [
      filial,
      idMicrowork,
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

  console.log('Tabela de ranking_pontos, atualizado!');
};

module.exports = fetchrankingPontosMotos;
