const axios = require('axios');
require('dotenv').config();

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');

const dataInicial = `${year}-${month}-01 00:00`;
const dataFinal = `${year}-${month}-31 00:00`;

async function fetchMkVendasMotos(pool) {
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
        FinanceiraCalculo=null;
        Origemdavenda=null;
        Vendedor=null;
        MovimentosCancelados=False;
        Cor=null;
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
    idrelatoriousuarioleiaute: 1073,
    ididioma: 1,
    listaempresas: [3, 4, 5, 8, 9, 10, 11, 12, 13, 14],
    filtros: filtros
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.API_TOKEN_MICROWORK}`
    }
  });

  const dados = response.data;

  for (const moto of dados) {
    const [rows] = await pool.promise().query(
      'SELECT quantidade FROM mk_vendas_motos WHERE chassi = ?',
      [moto.chassi]
    );

    if (rows.length === 0 || rows[0].quantidade !== moto.quantidade) {
      const query = `
        INSERT INTO mk_vendas_motos (
          empresa, quantidade, data_venda, vendedor, modelo, cor, chassi,
          ano, custo_contabil, dias_estoque, pedido, tipo_venda,
          valor_venda, lucro_ope) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
          empresa = VALUES(empresa),
          quantidade = VALUES(quantidade),
          data_venda = VALUES(data_venda),
          vendedor = VALUES(vendedor),
          modelo = VALUES(modelo),
          cor = VALUES(cor),
          ano = VALUES(ano),
          custo_contabil = VALUES(custo_contabil),
          dias_estoque = VALUES(dias_estoque),
          pedido = VALUES(pedido),
          tipo_venda = VALUES(tipo_venda),
          valor_venda = VALUES(valor_venda),
          lucro_ope = VALUES(lucro_ope)
      `;

      const values = [
        moto.empresa,
        moto.quantidade,
        moto.datavenda,
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
        moto.lucrooperacionalantescomissao
      ];

      await pool.promise().query(query, values);
      console.log(`Chassi ${moto.chassi} inserido ou atualizado com sucesso.`);
    }
  }
}

module.exports = fetchMkVendasMotos;
