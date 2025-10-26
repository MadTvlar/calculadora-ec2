const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Criação de tabelas usando async/await
// (async () => {
//   try {
//     const connection = await pool.getConnection();
//     console.log('Conectado ao banco de dados "tropa_azul"!');

//     // Criar a tabela 'vendas' caso não exista
//     const createSimulacaoMotos = `
//     CREATE TABLE IF NOT EXISTS simulacao_motos (
//       id int NOT NULL AUTO_INCREMENT,
//       empresa varchar(5) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       nome_vendedor varchar(50) DEFAULT NULL,
//       nome_cliente varchar(50) DEFAULT NULL,
//       cpf_cnpj_cliente varchar(20) DEFAULT NULL,
//       moto_selecionada varchar(50) DEFAULT NULL,
//       forma_pagamento varchar(20) DEFAULT NULL,
//       banco_selecionado varchar(10) DEFAULT NULL,
//       retorno_selecionado varchar(2) DEFAULT NULL,
//       valor_bem decimal(10,2) DEFAULT NULL,
//       valor_venda_real decimal(10,2) DEFAULT NULL,
//       custo_moto decimal(10,2) DEFAULT NULL,
//       margem_bruta decimal(10,2) DEFAULT NULL,
//       emplacamento_receita decimal(10,2) DEFAULT NULL,
//       frete_receita decimal(10,2) DEFAULT NULL,
//       acessorio decimal(10,2) DEFAULT NULL,
//       valor_retorno decimal(10,2) DEFAULT NULL,
//       emplacamento_custo decimal(10,2) DEFAULT NULL,
//       frete_custo decimal(10,2) DEFAULT NULL,
//       taxa_cartao decimal(10,2) DEFAULT NULL,
//       brinde decimal(10,2) DEFAULT NULL,
//       despesa_operacionais decimal(10,2) DEFAULT NULL,
//       total_despesas decimal(10,2) DEFAULT NULL,
//       total_receitas decimal(10,2) DEFAULT NULL,
//       margem_liquida decimal(10,2) DEFAULT NULL,
//       comissao decimal(10,2) DEFAULT NULL,
//       criado_em timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//       PRIMARY KEY (id)
//     );
//   `;

//     connection.query(createSimulacaoMotos);


//     const createSimulacaoMotores = `
//     CREATE TABLE IF NOT EXISTS simulacao_motores (
//       id int NOT NULL AUTO_INCREMENT,
//       nome_vendedor varchar(50) DEFAULT NULL,
//       nome_cliente varchar(50) DEFAULT NULL,
//       cpf_cnpj_cliente varchar(20) DEFAULT NULL,
//       motor_selecionado varchar(100) DEFAULT NULL,
//       chassi varchar(20) DEFAULT NULL,
//       forma_pagamento varchar(20) DEFAULT NULL,
//       filial_escolhida varchar(20) DEFAULT NULL,
//       banco_selecionado varchar(10) DEFAULT NULL,
//       retorno_selecionado varchar(2) DEFAULT NULL,
//       valor_bem decimal(10,2) DEFAULT NULL,
//       valor_venda_real decimal(10,2) DEFAULT NULL,
//       custo_motor decimal(10,2) DEFAULT NULL,
//       margem_bruta decimal(10,2) DEFAULT NULL,
//       acessorio decimal(10,2) DEFAULT NULL,
//       valor_retorno decimal(10,2) DEFAULT NULL,
//       icms decimal(10,2) DEFAULT NULL,
//       taxa_cartao decimal(10,2) DEFAULT NULL,
//       despesa_operacionais decimal(10,2) DEFAULT NULL,
//       total_despesas decimal(10,2) DEFAULT NULL,
//       total_receitas decimal(10,2) DEFAULT NULL,
//       margem_liquida decimal(10,2) DEFAULT NULL,
//       comissao decimal(10,2) DEFAULT NULL,
//       criado_em timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//       PRIMARY KEY (id)
//     );
//   `;

//     connection.query(createSimulacaoMotores);


//     const createEstoqueMotores = `
//     CREATE TABLE IF NOT EXISTS microwork.estoque_motores (
//       id int NOT NULL AUTO_INCREMENT,
//         patio varchar(100) DEFAULT NULL,
//         chassi varchar(50) NOT NULL,
//         modelo varchar(100) NOT NULL,
//         cor varchar(30) DEFAULT NULL,
//         dias_estoque int DEFAULT '0',
//         icms_compra decimal(10,2) DEFAULT NULL,
//         situacao varchar(30) DEFAULT NULL,
//         custo_contabil decimal(10,2) DEFAULT NULL,
//         criado_em timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//         atualizado_em timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//         PRIMARY KEY (id),
//         UNIQUE KEY chassi (chassi)
//       );
//     `;

//     connection.query(createEstoqueMotores);


//     const creatEstoqueMotos = `
//     CREATE TABLE IF NOT EXISTS microwork.estoque_motos (
//       id int NOT NULL AUTO_INCREMENT,
//       empresa varchar(5) DEFAULT NULL,
//       patio varchar(60) DEFAULT NULL,
//       chassi varchar(20) NOT NULL,
//       modelo varchar(60) NOT NULL,
//       cor varchar(30) DEFAULT NULL,
//       ano varchar(9) DEFAULT NULL,
//       dias_estoque int DEFAULT '0',
//       situacao varchar(30) DEFAULT NULL,
//       custo_contabil decimal(10,2) DEFAULT NULL,
//       situacao_reserva varchar(10) DEFAULT NULL,
//       data_reserva varchar(10) DEFAULT NULL,
//       destino_reserva varchar(60) DEFAULT NULL,
//       observacao_reserva varchar(255) DEFAULT NULL,
//       dias_reserva int DEFAULT NULL,
//       PRIMARY KEY (id),
//       UNIQUE KEY chassi (chassi)
//     );
//   `;

//     connection.query(creatEstoqueMotos);


//     const createMkVendasMotos = `
//     CREATE TABLE IF NOT EXISTS microwork.vendas_motos (
//       empresa varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
//       municipio varchar(30) DEFAULT NULL,
//       quantidade int DEFAULT '0',
//       financiada int DEFAULT NULL,
//       banco varchar(20) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       vendedor varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
//       cpf_cnpj varchar(20) DEFAULT NULL,
//       data_venda date DEFAULT NULL,
//       pedido int DEFAULT NULL,
//       doc_fiscal varchar(20) DEFAULT NULL,
//       modelo varchar(100) DEFAULT NULL,
//       cor varchar(30) DEFAULT NULL,
//       chassi varchar(20) NOT NULL,
//       ano varchar(9) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
//       cliente varchar(100) DEFAULT NULL,
//       telefone_cliente varchar(20) DEFAULT NULL,
//       dias_estoque int DEFAULT NULL,
//       tipo_venda varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
//       custo_contabil decimal(10,2) DEFAULT NULL,
//       valor_venda decimal(10,2) DEFAULT NULL,
//       entrada_bonificada decimal(10,2) DEFAULT NULL,
//       valor_venda_real decimal(10,2) DEFAULT NULL,
//       receita_despesa decimal(10,2) DEFAULT NULL,
//       valor_financiado decimal(10,2) DEFAULT NULL,
//       valor_retorno decimal(10,2) DEFAULT NULL,
//       retorno_porcent decimal(4,2) DEFAULT NULL,
//       despesa_emplac decimal(10,2) DEFAULT NULL,
//       despesa_ope decimal(10,2) DEFAULT NULL,
//       lucro_ope decimal(10,2) DEFAULT NULL,
//       UNIQUE KEY unique_doc_empresa (doc_fiscal,empresa)
//     );
//   `;

//     connection.query(createMkVendasMotos);


//     const createMkVendasSeminovas = `
//     CREATE TABLE IF NOT EXISTS microwork.vendas_seminovas (
//       empresa varchar(5) DEFAULT NULL,
//       quantidade int DEFAULT '0',
//       financiada int DEFAULT NULL,
//       banco varchar(20) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       vendedor varchar(100) DEFAULT NULL,
//       cpf_cnpj varchar(20) DEFAULT NULL,
//       data_venda date DEFAULT NULL,
//       pedido int DEFAULT NULL,
//       doc_fiscal varchar(20) DEFAULT NULL,
//       modelo varchar(100) DEFAULT NULL,
//       cor varchar(30) DEFAULT NULL,
//       chassi varchar(20) NOT NULL,
//       ano varchar(9) DEFAULT NULL,
//       dias_estoque int DEFAULT NULL,
//       tipo_venda varchar(50) DEFAULT NULL,
//       custo_contabil decimal(10,2) DEFAULT NULL,
//       valor_venda decimal(10,2) DEFAULT NULL,
//       entrada_bonificada decimal(10,2) DEFAULT NULL,
//       valor_venda_real decimal(10,2) DEFAULT NULL,
//       receita_despesa decimal(10,2) DEFAULT NULL,
//       valor_financiado decimal(10,2) DEFAULT NULL,
//       valor_retorno decimal(10,2) DEFAULT NULL,
//       retorno_porcent decimal(4,2) DEFAULT NULL,
//       icms_venda decimal(5,2) DEFAULT NULL,
//       pis decimal(5,2) DEFAULT NULL,
//       cofins decimal(5,2) DEFAULT NULL,
//       despesa_emplac decimal(10,2) DEFAULT NULL,
//       despesa_ope decimal(10,2) DEFAULT NULL,
//       lucro_ope decimal(10,2) DEFAULT NULL,
//       UNIQUE KEY unique_doc_empresa (doc_fiscal,empresa)
//     );
//   `;

//     connection.query(createMkVendasSeminovas);


//     const createUsuarios = `
//     CREATE TABLE IF NOT EXISTS usuarios (
//       id int NOT NULL AUTO_INCREMENT,
//       grupo varchar(5) NOT NULL,
//       empresa varchar(5) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       nome varchar(100) NOT NULL,
//       email varchar(50) NOT NULL,
//       senha varchar(100) NOT NULL,
//       criado_em timestamp NULL DEFAULT CURRENT_TIMESTAMP,
//       PRIMARY KEY (id),
//       UNIQUE KEY email (email)
//     );
//   `;

//     connection.query(createUsuarios);


//     const createUpdate = `
//     CREATE TABLE IF NOT EXISTS updates (
//       id int NOT NULL,
//       tualizado_em datetime DEFAULT NULL,
//       PRIMARY KEY (id)
//     );
//    `;

//     connection.query(createUpdate);


//     const createBlockCpfCnpj = `
//     CREATE TABLE IF NOT EXISTS updates (
//       id int NOT NULL AUTO_INCREMENT,
//       empresa varchar(5) DEFAULT NULL,
//       nome varchar(100) DEFAULT NULL,
//       cpf_cnpj varchar(20) DEFAULT NULL,
//       PRIMARY KEY (id),
//       UNIQUE KEY cpf_cnpj (cpf_cnpj)
//     );
//   `;

//     connection.query(createBlockCpfCnpj);


//     const createCnpjEmpresa = `
//     CREATE TABLE IF NOT EXISTS cnpj_empresa (
//       id int NOT NULL AUTO_INCREMENT,
//       empresa varchar(60),
//       cnpj varchar(20),
//       PRIMARY KEY (id),
//       UNIQUE KEY cnpj (cnpj)
//       );
//     `;

//     connection.query(createCnpjEmpresa);


//     const createContratosMotos = `
//     CREATE TABLE IF NOT EXISTS microwork.contratos_motos (
//       data_venda date DEFAULT NULL,
//       quantidade int DEFAULT NULL,
//       empresa varchar(5) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       vendedor varchar(255) DEFAULT NULL,
//       administrador varchar(20) DEFAULT NULL,
//       proposta varchar(50) DEFAULT NULL,
//       contrato varchar(50) DEFAULT NULL,
//       cliente varchar(255) DEFAULT NULL,
//       ponto_venda varchar(60) DEFAULT NULL,
//       modelo varchar(100) DEFAULT NULL,
//       parcelas int DEFAULT NULL,
//       valor_parcela decimal(10,2) DEFAULT NULL,
//       valor_credito decimal(10,2) DEFAULT NULL,
//       UNIQUE KEY unq_empresa_contrato (empresa,contrato)
//     );
//   `;

//     connection.query(createContratosMotos);


//     const createcaptacaoMotos = `
//     CREATE TABLE IF NOT EXISTS microwork.captacao_motos (
//       empresa varchar(5) NOT NULL,
//       quantidade int DEFAULT NULL,
//       n_avaliacao int NOT NULL,
//       data_conclusao date DEFAULT NULL,
//       situacao varchar(20) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       vendedor varchar(255) DEFAULT NULL,
//       avaliador varchar(255) DEFAULT NULL,
//       tipo varchar(20) DEFAULT NULL,
//       pessoa varchar(50) DEFAULT NULL,
//       modelo varchar(100) DEFAULT NULL,
//       cor varchar(30) DEFAULT NULL,
//       placa varchar(10) DEFAULT NULL,
//       chassi varchar(20) DEFAULT NULL,
//       valor_compra decimal(10,2) DEFAULT NULL,
//       data_emissao datetime DEFAULT NULL,
//       valor_venda decimal(10,2) DEFAULT NULL,
//       UNIQUE KEY unq_empresa_avaliacao (empresa,n_avaliacao)
//     );
//   `;

//     connection.query(createcaptacaoMotos);


//     const createRankingGeral = `
//     CREATE TABLE IF NOT EXISTS ranking_geral (
//       tipo varchar(20) DEFAULT NULL,
//       filial varchar(5) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       vendedor varchar(255) DEFAULT NULL,
//       valor decimal(10,2) DEFAULT NULL,
//       posicao int DEFAULT NULL,
//       referente_mes varchar(7) DEFAULT NULL,
//       atualizado_em datetime DEFAULT CURRENT_TIMESTAMP
//     );
//   `;

//     connection.query(createRankingGeral);


//     const createAlterVision = `
//     CREATE TABLE IF NOT EXISTS altervision.altervision (
//     data date DEFAULT NULL,
//     empresa varchar(30) DEFAULT NULL,
//     quantidade int DEFAULT NULL,
//     UNIQUE KEY uni_empresa_data (empresa,data)
//     );
//   `;

//     connection.query(createAlterVision);


//     const createNPS = `
//     CREATE TABLE IF NOT EXISTS nps (
//       id_microwork int DEFAULT NULL,
//       vendedores varchar(255) DEFAULT NULL,
//       promotoras int DEFAULT NULL,
//       neutras int DEFAULT NULL,
//       detratoras int DEFAULT NULL,
//       nota_oficial decimal(6,2) DEFAULT NULL,
//       atualizado_em datetime DEFAULT CURRENT_TIMESTAMP
//     );
//   `;

//     connection.query(createNPS);


//     const createNPSGeral = `
//     CREATE TABLE IF NOT EXISTS nps_geral (
//       empresa varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
//       data date DEFAULT NULL,
//       cnpj varchar(20) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       vendedor varchar(100) DEFAULT NULL,
//       modelo varchar(100) DEFAULT NULL,
//       chassi varchar(20) DEFAULT NULL,
//       doc_fiscal int DEFAULT NULL,
//       detratora int DEFAULT NULL,
//       neutra int DEFAULT NULL,
//       promotora int DEFAULT NULL,
//       nota int DEFAULT NULL,
//       UNIQUE KEY unq_chassi_doc (chassi,doc_fiscal)
//     );
//   `;

//     connection.query(createNPSGeral);


//     const createRankingPontos = `
//     CREATE TABLE IF NOT EXISTS ranking_pontos (
//       filial varchar(5) DEFAULT NULL,
//       id_microwork int DEFAULT NULL,
//       vendedor varchar(255) DEFAULT NULL,
//       pontos int DEFAULT NULL,
//       vendas int DEFAULT NULL,
//       llo decimal(5,2) DEFAULT NULL,
//       captacao int DEFAULT NULL,
//       contrato int DEFAULT NULL,
//       retorno int DEFAULT NULL,
//       NPS int DEFAULT NULL,
//       referente_mes varchar(7) DEFAULT NULL,
//       atualizado_em datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
//     );
//   `;


//     connection.query(createRankingPontos);

//     connection.release();
//     console.log('Tabelas verificadas/criadas com sucesso.');
//   } catch (error) {
//     console.error('Erro ao conectar ou criar tabelas:', error);
//   }
// })();

module.exports = pool;
