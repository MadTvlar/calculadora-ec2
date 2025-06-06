require('dotenv').config();

const pool = require('./services/db');

// Módulos opcionais (comente/descomente conforme necessário)
const atualizarRankings = require('./routes/rankingGeralMotos');
const fetchEstoqueMotores = require('./routes/estoqueMotores');
const fetchEstoqueMotos = require('./routes/estoqueMotos');
const fetchMkVendasMotos = require('./routes/mkVendasMotos');
const fetchMkContratosMotos = require('./routes/mkContratosMotos');
const fetchMkcaptacaoMotos = require('./routes/mkCaptacaoMotos');
const fetchrankingPontosMotos = require('./routes/rankingPontosMotos');


//fetchMkcaptacaoMotos(pool);
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de atualização
async function executarAtualizacao() {
  console.log('Executando os fetch...');

  try {

    await fetchEstoqueMotores(pool);
    await delay(2000);

    await fetchEstoqueMotos(pool);
    await delay(2000);

    await fetchMkVendasMotos(pool);
    await delay(2000);

    await fetchMkContratosMotos(pool);
    await delay(2000);

    await fetchMkcaptacaoMotos(pool);
    await delay(2000);


    await atualizarRankings(pool);
    await delay(2000);

    await fetchrankingPontosMotos(pool);
    await delay(2000);

    const agora = new Date();
    await pool.promise().query(
      'REPLACE INTO updates (id, atualizado_em) VALUES (1, ?)',
      [agora]
    );
    console.log(`\nAtualização registrada em: ${agora.toISOString()}`);
  } catch (err) {
    console.error('Erro na atualização:', err);
  }
}

// Execução inicial
executarAtualizacao();

console.log('Tarefas agendadas e execução inicial realizada.');
