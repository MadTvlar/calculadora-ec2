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
    nome_vendedor VARCHAR(255) NOT NULL,
    nome_cliente VARCHAR(255) NOT NULL,
    cpf_cnpj_cliente VARCHAR(20) NOT NULL,
    moto_selecionada VARCHAR(255) NOT NULL,
    filial_escolhida VARCHAR(255) NOT NULL,
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
