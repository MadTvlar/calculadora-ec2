const axios = require('axios');
require('dotenv').config();

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

const dataInicial = `${year}-${month}-01 00:00:00`;
const dataFinal = `${year}-${month}-31 23:59:59`;

async function fetchMkVendasMotos(pool) {

  console.log('Iniciando a consulta API de Vendas Motos')

  const filtros = `DesconsiderarEstornadoDevolvido=False;
        SemAutorizacaoExpedicao=True;
        ComAutorizacaoExpedicao=True;
        Modelodoveiculo=null;
        Tipodemovimento=2,25,26,22,11,9,17,10,21,32;
        Municipio=null;
        Consorcio=null;
        TipoVeiculo=null;
        Pontodevendadovendedor=null;
        FinanceiraLeasing=null;
        Origemdavenda=null;
        Vendedor=null;
        MovimentosCancelados=False;
        Cor=null;
        FinanceiraCalculo=null;
        EquipeCRM=null;
        Pessoa=null;
        Estadodoveiculo=1;
        Periododamovimentacaoinicial=${dataInicial};
        TipoPessoa=null;
        Tipodevenda=null;
        Periododamovimentacaofinal=${dataFinal};
        ComExpedicao=True;
        SemExpedicao=True`;

  const response = await axios.post('https://microworkcloud.com.br/api/integracao/terceiro', {
    idrelatorioconfiguracao: 248,
    idrelatorioconsulta: 50,
    idrelatorioconfiguracaoleiaute: 248,
    idrelatoriousuarioleiaute: 1097,
    ididioma: 1,
    listaempresas: [3, 4, 5, 8, 9, 10, 11, 12, 13],
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

    const dataVendaFormatada = moto.datavenda ? moto.datavenda.substring(0, 10) : null;

    const [rows] = await pool.promise().query(
      'SELECT quantidade FROM mk_vendas_motos WHERE doc_fiscal = ?',
      [moto.docfiscal]
    );

    if (rows.length === 0 || rows[0].quantidade !== moto.quantidade) {
      const query = `
  INSERT INTO mk_vendas_motos (
    empresa, quantidade, data_venda, id_microwork, doc_fiscal, vendedor, modelo,
    cor, chassi, ano, custo_contabil, dias_estoque, pedido,
    tipo_venda, valor_venda, entrada_bonificada, valor_venda_real, despesa_ope, valor_financiado,
    valor_retorno, retorno_porcent, lucro_ope, financiada
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE
          empresa = VALUES(empresa),
          quantidade = VALUES(quantidade),
          data_venda = VALUES(data_venda),
          id_microwork = VALUES(id_microwork),
          vendedor = VALUES(vendedor),
          modelo = VALUES(modelo),
          cor = VALUES(cor),
          chassi = VALUES(chassi),
          ano = VALUES(ano),
          custo_contabil = VALUES(custo_contabil),
          dias_estoque = VALUES(dias_estoque),
          pedido = VALUES(pedido),
          tipo_venda = VALUES(tipo_venda),
          valor_venda = VALUES(valor_venda),
          entrada_bonificada = VALUES(entrada_bonificada),
          valor_venda_real = VALUES(valor_venda_real),
          despesa_ope = VALUES(despesa_ope),
          valor_financiado = VALUES(valor_financiado),
          valor_retorno = VALUES(valor_retorno),
          retorno_porcent = VALUES(retorno_porcent),
          lucro_ope = VALUES(lucro_ope)
`;

      const values = [
        moto.empresa,
        moto.quantidade,
        moto.datavenda ? moto.datavenda.substring(0, 10) : null,
        moto.idpessoavendedor,
        moto.docfiscal,
        moto.vendedor,
        moto.modelo,
        moto.cor,
        moto.chassi,
        moto.anofabrmod,
        moto.custocontabil,
        moto.diasestoque,
        moto.proposta,
        moto.tipovenda,
        moto.valorvenda,
        moto.acessorios,
        moto.valorvenda - moto.acessorios,
        (moto.valorvenda - moto.acessorios) * 0.06,
        moto.valorfinanciamento,
        moto.valorbonus,
        moto.valorfinanciamento ? moto.valorbonus / moto.valorfinanciamento * 100 : null,
        moto.lucrooperacionalantescomissao,
        moto.quantidadefinanciada
      ];

      try {
        await pool.promise().query(query, values);
        console.log(`Chassi ${moto.chassi} com data ${dataVendaFormatada} inserido com sucesso.`);
      } catch (error) {
        console.error(`Erro ao inserir chassi ${moto.chassi} com data ${dataVendaFormatada}:`, error.message);
      }
    }
  }
}

module.exports = fetchMkVendasMotos;