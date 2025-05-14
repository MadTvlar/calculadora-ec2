const axios = require('axios');
require('dotenv').config();

async function fetchEstoqueMotos(pool) {

  await pool.promise().query('TRUNCATE TABLE estoque_motos');
  console.log('Tabela estoque_motos limpa com sucesso.');

  const filtros = `ESemProposta=False;
        FabricacaoInicial=0;
        ESomenteComReservaOuComProposta=False;
        ESomenteMontada=False;
        Situacao=2,3,30,14,13,17,29,8,27,12;
        EComProposta=False;
        CategoriaModelo=null;
        ESomenteEmMontagem=False;
        TipoDoModelo=4,3;
        Estado=1;
        Modelo=null;
        Patio=null;
        EComReserva=False;
        ESemReserva=False;
        AnoFinal=9999;
        AnoInicial=0;
        FabricacaoFinal=9999`;

  const response = await axios.post(process.env.API_URL_MICROWORK, {
    idrelatorioconfiguracao: 47,
    idrelatorioconsulta: 11,
    idrelatorioconfiguracaoleiaute: 47,
    idrelatoriousuarioleiaute: 1084,
    ididioma: 1,
    listaempresas: [3, 4, 5, 8, 9, 10, 11, 12, 13],
    filtros: filtros
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_TOKEN_MICROWORK}`
    }
  });

  const dados = response.data;

  for (const moto of dados) {
    const query = `
      INSERT INTO estoque_motos (empresa, patio, chassi, modelo, cor, ano, dias_estoque, situacao, custo_contabil, situacao_reserva, data_reserva, destino_reserva, observacao_reserva, dias_reserva)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        empresa = VALUES(empresa), 
        patio = VALUES(patio),
        modelo = VALUES(modelo),
        cor = VALUES(cor),
        ano = VALUES(ano),
        dias_estoque = VALUES(dias_estoque),
        situacao = VALUES(situacao),
        custo_contabil = VALUES(custo_contabil),
        situacao_reserva = VALUES(situacao_reserva),
        data_reserva = VALUES(data_reserva),
        destino_reserva = VALUES(destino_reserva),
        observacao_reserva = VALUES(observacao_reserva),
        dias_reserva = VALUES(dias_reserva)
    `;

    const values = [
      moto.descricaoreduzida,
      moto.patio,
      moto.chassi,
      moto.modelo,
      moto.cor,
      moto.anomodfabr,
      moto.diasestoque,
      moto.situacaoestoque,
      moto.valorcustocontabil,
      moto.situacaoreserva,
      moto.datareserva ? moto.datareserva.substring(0, 10) : null,
      moto.nomereserva,
      moto.observacaoreserva,
      moto.diasreserva
    ];

    await pool.promise().query(query, values);
    console.log(`Chassi ${moto.chassi} inserido com sucesso.`);
  }
}

module.exports = fetchEstoqueMotos;
