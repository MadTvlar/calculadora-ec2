const mysql = require('mysql2');

// Configure a conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'localhost',   // ou o IP do seu servidor
  user: 'motors',
  password: 'Motors!@#3223',
  database: 'dados_vendas'
});

// Conectar ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ', err);
    return;
  }
  console.log('Conectado ao banco de dados "dados_vendas"!');
});

// Criar a tabela 'vendas' caso não exista
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS vendas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_vendedor VARCHAR(50),
    nome_cliente VARCHAR(50),
    cpf_cnpj_cliente VARCHAR(20),
    moto_selecionada VARCHAR(50),
    origiem_moto VARCHAR(10),
    forma_pagamento VARCHAR(20),
    filial_escolhida VARCHAR(20),
    banco_selecionado VARCHAR(10),
    retorno_selecionado VARCHAR(2),
    valor_bem DECIMAL(7,2),
    valor_venda_real DECIMAL(7,2),
    custo_moto DECIMAL(7,2),
    margem_bruta DECIMAL(7,2),
    emplacamento_receita DECIMAL(7,2),
    frete_receita DECIMAL(7,2),
    acessorio DECIMAL(7,2),
    valor_retorno DECIMAL(7,2),
    emplcamento_custo DECIMAL(7,2),
    frete_custo DECIMAL(7,2),
    taxa_cartao DECIMAL(7,2),
    brinde DECIMAL(7,2),
    despesa_operacionais DECIMAL(7,2),
    total_despesas DECIMAL(7,2),
    total_receitas DECIMAL(7,2),
    margem_liquida DECIMAL(7,2),
    comissao DECIMAL(7,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

connection.query(createTableQuery, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela: ', err);
    return;
  }
  console.log('Tabela "vendas" criada ou já existe');
});

module.exports = connection;
