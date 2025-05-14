const cron = require('node-cron');
const mysql = require('mysql2');
const fetchEstoqueMotores = require('./routes/estoqueMotores');
const fetchEstoqueMotos = require('./routes/estoqueMotos');
const fetchMkVendasMotos = require('./routes/mkVendasMotos');

require('dotenv').config();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'motors',
  password: 'Motors!@#3223',
  database: 'dados_vendas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Executa imediatamente
//fetchEstoqueMotores(pool);
fetchEstoqueMotos(pool);
//fetchMkVendasMotos(pool)

// Agenda para rodar às 12:27h da manhã todos os dias
cron.schedule('27 12 * * *', () => {
  console.log('Executando tarefa agendada...');
  fetchEstoqueMotores(pool);
  fetchEstoqueMotos(pool);
  fetchMkVendasMotos(pool);
});


console.log('Tarefa agendada!');

