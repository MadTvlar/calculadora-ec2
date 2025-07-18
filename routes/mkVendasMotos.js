const axios = require('axios');
require('dotenv').config();

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0');

const dataInicial = `${year}-${month}-01 00:00:00`;
const dataFinal = `${year}-${month}-${day} 23:59:59`;

async function fetchMkVendasMotos(pool) {

  console.log('Iniciando a consulta API de para a tabela microwork.vendas_motos')

  const filtros = `DesconsiderarEstornadoDevolvido=False;
        SemAutorizacaoExpedicao=True;
        ComAutorizacaoExpedicao=True;
        Modelodoveiculo=null;
        Tipodemovimento=2,25,26,22,11,9,17,10,21,32;
        Municipio=null;
        Consorcio=null;
        TipoVeiculo=4,3;
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

  const response = await axios.post(process.env.API_URL_MICROWORK, {
    idrelatorioconfiguracao: 248,
    idrelatorioconsulta: 50,
    idrelatorioconfiguracaoleiaute: 248,
    idrelatoriousuarioleiaute: 1143,
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

    const dataMovimentacaoFormatada = moto.datamovimentacao ? moto.datamovimentacao.substring(0, 10) : null;

    const [rows] = await pool.promise().query(
      'SELECT empresa FROM microwork.vendas_motos WHERE doc_fiscal = ?',
      [moto.docfiscal]
    );

    if (rows.length === 0 || rows[0].empresa !== moto.empresa) {
      const query = `
  INSERT INTO microwork.vendas_motos (
    empresa, quantidade, financiada, banco, id_microwork, vendedor, 
    cpf_cnpj, data_venda, pedido, doc_fiscal, modelo, cor, chassi, ano,
    dias_estoque, tipo_venda, custo_contabil, valor_venda,
    entrada_bonificada, valor_venda_real, valor_financiado,
    valor_retorno, retorno_porcent, despesa_emplac, despesa_ope,
    lucro_ope
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON DUPLICATE KEY UPDATE
          empresa = VALUES(empresa),
          quantidade = VALUES(quantidade),
          financiada = VALUES(financiada),
          banco = VALUES(banco),
          id_microwork = VALUES(id_microwork),
          vendedor = VALUES(vendedor),
          cpf_cnpj = VALUES(cpf_cnpj),
          data_venda = VALUES(data_venda),
          pedido = VALUES(pedido),
          modelo = VALUES(modelo),
          cor = VALUES(cor),
          chassi = VALUES(chassi),
          ano = VALUES(ano),
          dias_estoque = VALUES(dias_estoque),
          tipo_venda = VALUES(tipo_venda),
          custo_contabil = VALUES(custo_contabil),
          valor_venda = VALUES(valor_venda),
          entrada_bonificada = VALUES(entrada_bonificada),
          valor_venda_real = VALUES(valor_venda_real),
          valor_financiado = VALUES(valor_financiado),
          valor_retorno = VALUES(valor_retorno),
          retorno_porcent = VALUES(retorno_porcent),
          despesa_emplac = VALUES(despesa_emplac),
          despesa_ope = VALUES(despesa_ope),
          lucro_ope = VALUES(lucro_ope)
`;

      const values = [
        moto.empresa,
        moto.quantidade,
        moto.quantidadefinanciada,
        moto.financeira,
        moto.idpessoavendedor,
        moto.vendedor,
        moto.cpfoucnpjvendedor,
        moto.datamovimentacao ? moto.datamovimentacao.substring(0, 10) : null,
        moto.proposta,
        moto.docfiscal,
        moto.modelo,
        moto.cor,
        moto.chassi,
        moto.anofabrmod,
        moto.diasestoque,
        moto.tipovenda,
        moto.custocontabil,
        moto.valorvenda,
        moto.acessorios,
        moto.valorvenda - moto.acessorios,
        moto.valorfinanciamento,
        moto.valorbonus,
        moto.valorfinanciamento ? moto.valorbonus / moto.valorfinanciamento * 100 : null,
        moto.documentacao,
        (moto.valorvenda - moto.acessorios) * 0.06,
        moto.lucrooperacionalantescomissao
      ];

      try {
        await pool.promise().query(query, values);
        console.log(`Chassi ${moto.chassi} com data ${dataMovimentacaoFormatada} inserido com sucesso.`);
      } catch (error) {
        console.error(`Erro ao inserir chassi ${moto.chassi} com data ${dataMovimentacaoFormatada}:`, error.message);
      }
    }
  }
}

module.exports = fetchMkVendasMotos;