const axios = require('axios');
require('dotenv').config();

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

const dataInicial = `${year}-${month}-01 00:00:00`;
const dataFinal = `${year}-${month}-31 23:59:59`;

async function fetchMkContratosMotos(pool) {

  console.log('Iniciando a consulta API de Contratos Motos')

  const filtros = `Reposicao=True;
        PontoVenda=null;
        SituacaoContrato=null;
        Novo=True;
        NaoRecebidoPrimeiraParcela=True;
        PrimeiraParcelaRecebida=True;
        RecebidoCartaoAdm=True;
        Vendedor=null;
        Supervisor=null;
        Gerente=null;
        Modelo=null;
        Administradora=null;
        DataInicial=${dataInicial};
        DataFinal=${dataFinal};
        NaoRecebidoCartaoAdm=True;
        NaoRemessa=True;
        Remessa=True;
        NaoPagamentoAdministradora=True;
        PagamentoAdministradora=True;
        Municipio=null`;

  const response = await axios.post(process.env.API_URL_MICROWORK, {
    idrelatorioconfiguracao: 194,
    idrelatorioconsulta: 97,
    idrelatorioconfiguracaoleiaute: 194,
    idrelatoriousuarioleiaute: 1098,
    ididioma: 1,
    listaempresas: [3, 4, 5, 8, 9, 10, 11, 12, 13, 15],
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
    INSERT INTO contratos_motos (
    data_venda, quantidade, empresa, vendedor, administrador, proposta, contrato, cliente, ponto_venda, modelo, parcelas, valor_parcela, valor_credito)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
   ON DUPLICATE KEY UPDATE
          data_venda = VALUES(data_venda),
          quantidade = VALUES(quantidade),
          empresa = VALUES(empresa),
          vendedor = VALUES(vendedor),
          administrador = VALUES(administrador),
          proposta = VALUES(proposta),
          cliente = VALUES(cliente),
          ponto_venda = VALUES(ponto_venda),
          modelo = VALUES(modelo),
          parcelas = VALUES(parcelas),
          valor_parcela = VALUES(valor_parcela),
          valor_credito = VALUES(valor_credito)
`;

    const values = [
      moto.datavenda ? moto.datavenda.substring(0, 10) : null,
      moto.quantidade,
      moto.empresa,
      moto.vendedor,
      moto.administradorareduzida,
      moto.proposta,
      moto.contrato,
      moto.pessoa,
      moto.pontovenda,
      moto.modelo,
      moto.prazo,
      moto.valorprimeiraparcela,
      moto.valorcredito

    ];

    try {
      await pool.promise().query(query, values);
      console.log(`Contrato ${moto.contrato} inserido com sucesso.`);
    } catch (error) {
      console.error(`Erro ao inserir Contrato ${moto.contrato}:`, error.message);
    }
  }
}


module.exports = fetchMkContratosMotos;