require('dotenv').config();

const pool = require('./services/db');

// Módulos opcionais (comente/descomente conforme necessário)
const atualizarRankings = require('./routes/rankingGeralMotos');
const fetchEstoqueMotores = require('./routes/estoqueMotores');
const fetchEstoqueMotos = require('./routes/estoqueMotos');
const fetchMkVendasMotos = require('./routes/mkVendasMotos');
const fetchMKVendasSeminovas = require('./routes/mkVendasSimonovas');
const fetchMkContratosMotos = require('./routes/mkContratosMotos');
const fetchMkcaptacaoMotos = require('./routes/mkCaptacaoMotos');
const fetchrankingPontosMotos = require('./routes/rankingPontosMotos');
const fetchAltervision = require('./routes/altervision');
const atualizarNPS = require('./routes/nps');



function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Função principal de atualização
async function executarAtualizacao() {
  console.log('Executando os fetch...');

  try {
    const delayMs = 1000;

    await fetchEstoqueMotores(pool);
    await delay(delayMs);

    await fetchEstoqueMotos(pool);
    await delay(delayMs);

    /*
    await fetchMkVendasMotos(pool);
    await delay(delayMs);

    await fetchMKVendasSeminovas(pool);
    await delay(delayMs);

    await fetchMkContratosMotos(pool);
    await delay(delayMs);

    await fetchMkcaptacaoMotos(pool);
    await delay(delayMs);
    */
    await atualizarNPS(pool);
    await delay(delayMs);

    await fetchAltervision(pool);
    await delay(delayMs);

    await atualizarRankings(pool);
    await delay(delayMs);

    await fetchrankingPontosMotos(pool);
    await delay(delayMs);

    const agora = new Date();
    await pool.query(
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

console.log('Iniciando as tarefas!');
