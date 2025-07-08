const mysql = require('mysql2');

// Configure o pool de conexões com o banco de dados
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Conectar ao banco de dados
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados: ', err);
    return;
  }
  console.log('Conectado ao banco de dados "tropa_azul"!');

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

  connection.query(createSimulacaoMotos);



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

  connection.query(createSimulacaoMotores);



  const createEstoqueMotores = `
    CREATE TABLE IF NOT EXISTS microwork.estoque_motores (
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

  connection.query(createEstoqueMotores);



  const creatEstoqueMotos = `
    CREATE TABLE IF NOT EXISTS microwork.estoque_motos (
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

  connection.query(creatEstoqueMotos);



  const createMkVendasMotos = `
  CREATE TABLE IF NOT EXISTS microwork.vendas_motos (
    empresa VARCHAR(5),
    quantidade INT DEFAULT 0,
    financiada INT,
    banco VARCHAR(20),
    id_microwork INT,
    vendedor VARCHAR(100),
    cpf_cnpj VARCHAR(20),
    data_venda DATE,
    pedido INT,
    doc_fiscal VARCHAR(20),
    modelo VARCHAR(100),
    cor VARCHAR(30),
    chassi VARCHAR(20) NOT NULL,
    ano VARCHAR(9),
    dias_estoque INT,
    tipo_venda VARCHAR(50),
    custo_contabil DECIMAL(10,2),
    valor_venda DECIMAL(10,2),
    entrada_bonificada DECIMAL(10,2),
    valor_venda_real DECIMAL(10,2),
    valor_financiado DECIMAL(10,2),
    valor_retorno DECIMAL(10,2),
    retorno_porcent DECIMAL(4,2),
    despesa_emplac DECIMAL(10,2),
    despesa_ope DECIMAL(10,2),
    lucro_ope DECIMAL(10,2),
    UNIQUE KEY unique_doc_empresa (doc_fiscal, empresa)
  );
`;


  connection.query(createMkVendasMotos);


  const createMkVendasSeminovas = `
  CREATE TABLE IF NOT EXISTS microwork.vendas_seminovas (
    empresa VARCHAR(5),
    quantidade INT DEFAULT 0,
    financiada INT,
    banco VARCHAR(20),
    id_microwork INT,
    vendedor VARCHAR(100),
    cpf_cnpj VARCHAR(20),
    data_venda DATE,
    pedido INT,
    doc_fiscal VARCHAR(20),
    modelo VARCHAR(100),
    cor VARCHAR(30),
    chassi VARCHAR(20) NOT NULL,
    ano VARCHAR(9),
    dias_estoque INT,
    tipo_venda VARCHAR(50),
    custo_contabil DECIMAL(10,2),
    valor_venda DECIMAL(10,2),
    entrada_bonificada DECIMAL(10,2),
    valor_venda_real DECIMAL(10,2),
    valor_financiado DECIMAL(10,2),
    valor_retorno DECIMAL(10,2),
    retorno_porcent DECIMAL(4,2),
    icms_venda DECIMAL(6,2),
    despesa_emplac DECIMAL(10,2),
    despesa_ope DECIMAL(10,2),
    lucro_ope DECIMAL(10,2),
    UNIQUE KEY unique_doc_empresa (doc_fiscal, empresa)
  );
`;


  connection.query(createMkVendasSeminovas);



  const createUsuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        grupo VARCHAR(5) NOT NULL,
        id_microwork INT,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(50) UNIQUE NOT NULL,
        senha VARCHAR(100) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
  connection.query(createUsuarios);



  const createUpdate = `
    CREATE TABLE IF NOT EXISTS updates (
    id INT PRIMARY KEY,
    atualizado_em DATETIME
  );
    `
  connection.query(createUpdate);



  const createContratosMotos = `
    CREATE TABLE IF NOT EXISTS microwork.contratos_motos (
      data_venda DATE,
      quantidade INT,
      empresa VARCHAR(5),
      id_microwork INT,
      vendedor VARCHAR(255),
      administrador VARCHAR(20),
      proposta VARCHAR(50),
      contrato VARCHAR(50) UNIQUE,
      cliente VARCHAR(255),
      ponto_venda VARCHAR(60),
      modelo VARCHAR(100),
      parcelas INT,
      valor_parcela DECIMAL(10,2),
      valor_credito DECIMAL(10,2)
    );
  `;

  connection.query(createContratosMotos);



  const createcaptacaoMotos = `
    CREATE TABLE IF NOT EXISTS microwork.captacao_motos (
      empresa VARCHAR(5),
      quantidade INT,
      n_avaliacao INT,
      data_conclusao DATETIME,
      situacao VARCHAR(20),
      id_microwork INT,
      vendedor VARCHAR(255),
      avaliador VARCHAR(255),
      tipo VARCHAR(20),
      pessoa VARCHAR(50),
      modelo VARCHAR(100),
      cor VARCHAR(30),
      placa VARCHAR(10),
      chassi VARCHAR(20),
      valor_compra DECIMAL(10,2),
      data_emissao DATETIME,
      valor_venda DECIMAL(10,2)
    );
  `;

  connection.query(createcaptacaoMotos);



  const createRankingGeral = `
    CREATE TABLE IF NOT EXISTS ranking_geral (
      tipo VARCHAR(20),
      filial VARCHAR(5),
      id_microwork INT,
      vendedor VARCHAR(255),
      valor DECIMAL(10,2),
      posicao INT,
      referente_mes VARCHAR(7),          
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  connection.query(createRankingGeral);



  const createNPSGeral = `
    CREATE TABLE IF NOT EXISTS nps (
      id_microwork INT,
      vendedores VARCHAR(255),
      promotoras INT,
      neutras INT,
      detratoras INT,
      nota_oficial DECIMAL(6,2),          
      atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  connection.query(createNPSGeral);



  const createRankingPontos = `
  CREATE TABLE IF NOT EXISTS ranking_pontos (
    filial VARCHAR(5),
    id_microwork INT NULL,
    vendedor VARCHAR(255) NULL,
    pontos INT NULL,
    vendas INT NULL,
    llo DECIMAL(5,2) NULL,
    captacao INT NULL,
    contrato INT NULL,
    retorno INT NULL,
    NPS INT NULL,
    referente_mes VARCHAR(7),
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;

  connection.query(createRankingPontos, (err, results) => {
    if (err) {
      console.error('Erro ao criar a tabela ranking_pontos:', err);
    } else {
      // Como é CREATE TABLE IF NOT EXISTS, se a tabela já existir, não cria de novo e não retorna erro
      console.log('Tabela ranking_pontos criada ou já existe.');
    }
  });


  connection.release();
});

// Exportar o pool de conexões
module.exports = pool;
