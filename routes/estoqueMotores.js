const axios = require('axios');
require('dotenv').config();

async function fetchEstoqueMotores(pool) {

  console.log('\nLimpando estoque_motores.');
  await pool.promise().query('TRUNCATE TABLE microwork.estoque_motores');


  const filtros = `ESemProposta=False;
FabricacaoInicial=0;
ESomenteComReservaOuComProposta=False;
ESomenteMontada=False;
Situacao=2,3,30,14,13,17,29,8,27,12,45;
EComProposta=False;
CategoriaModelo=null;
ESomenteEmMontagem=False;
TipoDoModelo=null;
Estado=null;
Modelo=null;
Patio=null;
Dias_aaa_Estoque=null;
EComReserva=False;
ESemReserva=False;
AnoFinal=9999;
AnoInicial=0;
FabricacaoFinal=9999`;

  const response = await axios.post(process.env.API_URL_MICROWORK, {
    idrelatorioconfiguracao: 47,
    idrelatorioconsulta: 11,
    idrelatorioconfiguracaoleiaute: 47,
    idrelatoriousuarioleiaute: 1058,
    ididioma: 1,
    listaempresas: [6, 7],
    filtros: filtros
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_TOKEN_MICROWORK}`
    }
  });

  const dados = response.data;

  for (const motor of dados) {
    const query = `
      INSERT INTO microwork.estoque_motores (patio, chassi, modelo, cor, dias_estoque, icms_compra, situacao, custo_contabil)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        patio = VALUES(patio),
        modelo = VALUES(modelo),
        cor = VALUES(cor),
        dias_estoque = VALUES(dias_estoque),
        icms_compra = VALUES(icms_compra),
        situacao = VALUES(situacao),
        custo_contabil = VALUES(custo_contabil)
    `;

    const values = [
      motor.patio,
      motor.chassi,
      motor.modelo,
      motor.cor,
      motor.diasestoque,
      motor.valoricmsrecuperado,
      motor.situacaoestoque,
      motor.valorcustocontabil
    ];

    await pool.promise().query(query, values);
    console.log(`Chassi ${motor.chassi} inserido com sucesso.`);
  }

  console.log('Tabela estoque_motores, Atualizado!')
}

module.exports = fetchEstoqueMotores;
