const axios = require('axios');
require('dotenv').config();

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

const dataInicial = `${year}-${month}-01 00:00:00`;
const dataFinal = `${year}-${month}-31 23:59:59`;

async function fetchMkcaptacaoMotos(pool) {

  console.log('Iniciando a consulta API de Contratos Motos')

  const filtros = `DataInicial=${dataInicial};
        DataFinal=${dataFinal};
        TipoVeiculoAvaliacao=null;
        VeiculoSituacao=null;
        Vendedor=null;
        Avaliador=null;
        Modelo=null`;

  const response = await axios.post(process.env.API_URL_MICROWORK, {
    idrelatorioconfiguracao: 531,
    idrelatorioconsulta: 198,
    idrelatorioconfiguracaoleiaute: 531,
    idrelatoriousuarioleiaute: 1099,
    ididioma: 1,
    listaempresas: [3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15],
    filtros: filtros
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_TOKEN_MICROWORK}`,
      'Host': 'microworkcloud.com.br'
    }
  });

  const dados = response.data;

  for (const moto of dados) {

    const query = `
    INSERT INTO captacao_motos (
    empresa, n_avaliacao, data_conclusao, situacao, vendedor, avaliador, tipo, pessoa, modelo, cor, placa, chassi, valor_compra, data_emissao, valor_venda)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
   ON DUPLICATE KEY UPDATE
          empresa = VALUES(empresa),
          n_avaliacao = VALUES(n_avaliacao),
          data_conclusao = VALUES(data_conclusao),
          situacao = VALUES(situacao),
          vendedor = VALUES(vendedor),
          avaliador = VALUES(avaliador),
          tipo = VALUES(tipo),
          pessoa = VALUES(pessoa),
          modelo = VALUES(modelo),
          cor = VALUES(cor),
          placa = VALUES(placa),
          valor_compra = VALUES(valor_compra),
          data_emissao = VALUES(data_emissao),
          valor_venda = VALUES(valor_venda)
`;

    const values = [
      moto.empresa,
      moto.numeroavaliacao,
      moto.dataconclusao ? moto.dataconclusao.substring(0, 10) : null,
      moto.situacao,
      moto.vendedorcompleto,
      moto.avaliador,
      moto.tipoavaliacao,
      moto.pessoa,
      moto.modelo,
      moto.cor,
      moto.placa,
      moto.chassi,
      moto.valorcompra,
      moto.dataemissao ? moto.dataemissao.substring(0, 10) : null,
      moto.valorvenda
    ];

    try {
      await pool.promise().query(query, values);
      console.log(`Chassi ${moto.chassi} inserido com sucesso.`);
    } catch (error) {
      console.error(`Erro ao inserir o Chassi ${moto.chassi}:`, error.message);
    }
  }
}


module.exports = fetchMkcaptacaoMotos;