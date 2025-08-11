// Essa rota faz requisição de API do microwork, do relatório de captação.

const axios = require('axios');
require('dotenv').config();

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0');

const dataInicial = `${year}-${month}-01 00:00:00`;
const dataFinal = `${year}-${month}-${day} 23:59:59`;

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
    idrelatoriousuarioleiaute: 1150,
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
  INSERT IGNORE INTO microwork.captacao_motos (
    empresa, quantidade, n_avaliacao, data_conclusao, situacao,
    id_microwork, vendedor, avaliador, tipo, pessoa, modelo, cor,
    placa, chassi, valor_compra, data_emissao, valor_venda
  )
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
`;


    const values = [
      moto.empresa,
      moto.quantidade,
      moto.numeroavaliacao,
      moto.dataconclusao ? moto.dataconclusao.substring(0, 10) : null,
      moto.situacao,
      moto.vendedorcompleto.match(/^\d+/)?.[0] || null,
      moto.vendedorcompleto.match(/- (.*?) \(/)?.[1]?.trim() || null,
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
      await pool.query(query, values);
      console.log(`Chassi ${moto.chassi} inserido com sucesso.`);
    } catch (error) {
      console.error(`Erro ao inserir o Chassi ${moto.chassi}:`, error.message);
    }
  }
}


module.exports = fetchMkcaptacaoMotos;