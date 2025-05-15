const mysql = require('mysql2');

// Configure a conexão com o banco de dados
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'motors',
  password: 'Motors!@#3223',
  database: 'dados_vendas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
const createSimulacaoMotos = `
  CREATE TABLE IF NOT EXISTS simulacao_motos (
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
    valor_bem DECIMAL(10,2),
    valor_venda_real DECIMAL(10,2),
    custo_moto DECIMAL(10,2),
    margem_bruta DECIMAL(10,2),
    emplacamento_receita DECIMAL(10,2),
    frete_receita DECIMAL(10,2),
    acessorio DECIMAL(10,2),
    valor_retorno DECIMAL(10,2),
    emplcamento_custo DECIMAL(10,2),
    frete_custo DECIMAL(10,2),
    taxa_cartao DECIMAL(10,2),
    brinde DECIMAL(10,2),
    despesa_operacionais DECIMAL(10,2),
    total_despesas DECIMAL(10,2),
    total_receitas DECIMAL(10,2),
    margem_liquida DECIMAL(10,2),
    comissao DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

connection.query(createSimulacaoMotos, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela: ', err);
    return;
  }
  console.log('Tabela "vendas" criada ou já existe');
});

const createSimulacaoMotores = `
  CREATE TABLE IF NOT EXISTS simulacao_motores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_vendedor VARCHAR(50),
    nome_cliente VARCHAR(50),
    cpf_cnpj_cliente VARCHAR(20),
    motor_selecionado VARCHAR(100),
    chassi VARCHAR(20),
    forma_pagamento VARCHAR(20),
    filial_escolhida VARCHAR(20),
    banco_selecionado VARCHAR(10),
    retorno_selecionado VARCHAR(2),
    valor_bem DECIMAL(10,2),
    valor_venda_real DECIMAL(10,2),
    custo_motor DECIMAL(10,2),
    margem_bruta DECIMAL(10,2),
    acessorio DECIMAL(10,2),
    valor_retorno DECIMAL(10,2),
    icms DECIMAL(10,2),
    taxa_cartao DECIMAL(10,2),
    despesa_operacionais DECIMAL(10,2),
    total_despesas DECIMAL(10,2),
    total_receitas DECIMAL(10,2),
    margem_liquida DECIMAL(10,2),
    comissao DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

connection.query(createSimulacaoMotores, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela "simulacao_motores": ', err);
    return;
  }
  console.log('Tabela "simulacao_motores" criada ou já existe');
});

const createEstoqueMotores = `
  CREATE TABLE IF NOT EXISTS estoque_motores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patio VARCHAR(100),
    chassi VARCHAR(50) UNIQUE NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    cor VARCHAR(30),
    dias_estoque INT DEFAULT 0,
    icms_compra DECIMAL(10,2),
    situacao VARCHAR(30),
    custo_contabil DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;

connection.query(createEstoqueMotores, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela "estoque_motores": ', err);
    return;
  }
  console.log('Tabela "estoque_motores" criada ou já existe');
});

const creatEstoqueMotos = `
  CREATE TABLE IF NOT EXISTS estoque_motos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa VARCHAR(5),
    patio VARCHAR(60),
    chassi VARCHAR(20) UNIQUE NOT NULL,
    modelo VARCHAR(60) NOT NULL,
    cor VARCHAR(30),
    ano VARCHAR(9),
    dias_estoque INT DEFAULT 0,
    situacao VARCHAR(30),
    custo_contabil DECIMAL(10,2),
    situacao_reserva VARCHAR(10),
    data_reserva VARCHAR(10),
    destino_reserva VARCHAR(60),
    observacao_reserva VARCHAR(255),
    dias_reserva INT
  );
`;

connection.query(creatEstoqueMotos, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela "estoque_motos": ', err);
    return;
  }
  console.log('Tabela "estoque_motos" criada ou já existe');
})

const createMkVendasMotos = `
  CREATE TABLE IF NOT EXISTS mk_vendas_motos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    empresa VARCHAR(5),
    quantidade INT DEFAULT 0,
    data_venda VARCHAR(20),
    vendedor VARCHAR(80),
    modelo VARCHAR(100) NOT NULL,
    cor VARCHAR(30),
    chassi VARCHAR(50) UNIQUE NOT NULL,
    ano VARCHAR(9),
    custo_contabil DECIMAL(10,2),
    dias_estoque INT DEFAULT 0,
    pedido INT DEFAULT 0,
    tipo_venda VARCHAR(50),
    valor_venda DECIMAL(10,2),
    lucro_ope DECIMAL(10,2)
  );
`;

connection.query(createMkVendasMotos, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela "mk_vendas_motos": ', err);
    return;
  }
  console.log('Tabela "mk_vendas_motos" criada ou já existe');
});


const createUsuarios = `
  CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      grupo VARCHAR(5) NOT NULL,
      nome VARCHAR(100) NOT NULL,
      email VARCHAR(50) UNIQUE NOT NULL,
      senha VARCHAR(100) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `
connection.query(createUsuarios, (err) => {
  if (err) {
    console.error('Erro ao criar a tabela "usuarios": ', err);
    return;
  }
  console.log('Tabela "usuarios" criada ou já existe');
});

module.exports = connection;
