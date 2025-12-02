//Essa rota faz requisição de API do microwork, do relatório de contratos.

const axios = require('axios');
require('dotenv').config();

async function fetchMkContratosMotos(pool, dataInicial, dataFinal, sendLog) {

  sendLog('Iniciando a consulta API de Contratos Motos')

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
    idrelatoriousuarioleiaute: 1146,
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
  INSERT INTO microwork.contratos_motos (
    data_venda, quantidade, empresa, id_microwork, vendedor, administrador,
    proposta, contrato, cliente, ponto_venda, modelo, parcelas, valor_parcela, valor_credito
  )
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ON DUPLICATE KEY UPDATE
    data_venda = VALUES(data_venda),
    quantidade = VALUES(quantidade),
    id_microwork = VALUES(id_microwork),
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
      moto.idpessoavendedor,
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
      await pool.query(query, values);
      sendLog(`Contrato ${moto.contrato}, se não existir, inserido com sucesso.`);
    } catch (error) {
      sendLog(`Erro ao inserir Contrato ${moto.contrato}:`, error.message);
    }
  }
}


module.exports = fetchMkContratosMotos;