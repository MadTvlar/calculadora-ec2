const cron = require('node-cron');
const mysql = require('mysql2');
const atualizarRankings = require('./routes/atualizarRankings');

// Módulos opcionais (comente/descomente conforme necessário)
const fetchEstoqueMotores = require('./routes/estoqueMotores');
const fetchEstoqueMotos = require('./routes/estoqueMotos');
const fetchMkVendasMotos = require('./routes/mkVendasMotos');
const fetchMkContratosMotos = require('./routes/mkContratosMotos');
const fetchMkcaptacaoMotos = require('./routes/mkCaptacaoMotos');
const fetchrankingMotos = require('./routes/rankingMotos');


require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'motors',
  password: process.env.DB_PASSWORD || 'Motors!@#3223',
  database: process.env.DB_NAME || 'dados_vendas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função principal de atualização
async function executarAtualizacao() {
  console.log('Executando atualização programada...');

  try {
    // Descomente as linhas abaixo conforme necessidade
    //await fetchEstoqueMotores(pool);
    //await fetchEstoqueMotos(pool);
    //await fetchMkVendasMotos(pool);
    //await fetchMkContratosMotos(pool);
    //await fetchMkcaptacaoMotos(pool);

    await atualizarRankings(pool);
    await fetchrankingMotos(pool);

    const agora = new Date();
    await pool.promise().query(
      'REPLACE INTO updates (id, atualizado_em) VALUES (1, ?)',
      [agora]
    );
    console.log(`Atualização registrada em: ${agora.toISOString()}`);
  } catch (err) {
    console.error('Erro na atualização:', err);
  }
}

// Agendar tarefas para horários específicos
cron.schedule('0 8 * * *', executarAtualizacao);   // 08:00
cron.schedule('0 12 * * *', executarAtualizacao);  // 12:00
cron.schedule('0 16 * * *', executarAtualizacao);  // 16:00

// Execução inicial
executarAtualizacao();

console.log('Tarefas agendadas e execução inicial realizada.');
