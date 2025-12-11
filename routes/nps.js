// Essa rota faz a orgnanização da pontuação do mês selecionado na variavel mesReferente do NPS

async function atualizarNPS(pool, sendLog, mesReferente) {

  sendLog(`Limpando a tabela tropa_azul.nps`)
  await pool.query(`TRUNCATE TABLE nps`);

<<<<<<< HEAD
  console.log(`Limpando a tabela tropa_azul.nps`)
  await connection.query(`TRUNCATE TABLE nps`);

  // SELECIONAR A DATA NA QUAL A PONTUAÇÃO IRÁ VALER
  const mesReferente = '2025-11';

  const [resultados] = await connection.query(`
=======
  const [resultados] = await pool.query(`
>>>>>>> 5a31b3e0901e5d52396d4c09257b43691dae0dd3
  SELECT 
    id_microwork,
    vendedor AS vendedores,
    SUM(promotora) AS promotoras,
    SUM(neutra) AS neutras,
    SUM(detratora) AS detratoras
    FROM nps_geral
    WHERE DATE_FORMAT(data, '%Y-%m') = ?
    GROUP BY id_microwork, vendedor
`, [mesReferente]);


  for (const row of resultados) {
    const { id_microwork, vendedores, promotoras, neutras, detratoras } = row;
    const total = parseInt(promotoras) + parseInt(neutras) + parseInt(detratoras);

    let nota_oficial = 0;
    if (total >= 3) {
      nota_oficial = ((parseInt(promotoras) - parseInt(detratoras)) / total) * 100;
    }

    await pool.query(`
      INSERT INTO nps (id_microwork, vendedores, promotoras, neutras, detratoras, nota_oficial, atualizado_em)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        vendedores = VALUES(vendedores),
        promotoras = VALUES(promotoras),
        neutras = VALUES(neutras),
        detratoras = VALUES(detratoras),
        nota_oficial = VALUES(nota_oficial),
        atualizado_em = NOW()
    `, [id_microwork, vendedores, promotoras, neutras, detratoras, nota_oficial]);
  }

  sendLog(`tabela tropa_azul.nps atualizado!`)
}

module.exports = atualizarNPS;
