require('dotenv').config();

const pool = require('./services/db');


// Módulos opcionais (comente/descomente conforme necessário)
const fetchRankingGeralMotos = require('./routes/rankingGeralMotos');
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

    
    const consulta = 'SELECT mesReferente FROM settings WHERE id = 1;'

    const [rows] = await pool.query(consulta);  // pega só os resultados
    const mesReferente = rows[0].mesReferente;  // pega a string da primeira linha

    //data para rodar schedule 
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0');

    const dataInicial = `${year}-${month}-01 00:00:00`;
    const dataFinal = `${year}-${month}-${day} 23:59:59`;

    

  


  try {
    const delayMs = 1000;

    await fetchEstoqueMotores(pool);
    await delay(delayMs);

    await fetchEstoqueMotos(pool);
    await delay(delayMs);

    await fetchMkVendasMotos(pool, dataInicial, dataFinal);
    await delay(delayMs);

    await fetchMKVendasSeminovas(pool, dataInicial, dataFinal);
    await delay(delayMs);

    await fetchMkContratosMotos(pool, dataInicial, dataFinal);
    await delay(delayMs);

    await fetchMkcaptacaoMotos(pool, dataInicial, dataFinal);
    await delay(delayMs);

    await atualizarNPS(pool, mesReferente);
    await delay(delayMs);

    await fetchAltervision(pool, dataInicial, dataFinal);
    await delay(delayMs);

    await fetchRankingGeralMotos(pool, mesReferente);
    await delay(delayMs);

    await fetchrankingPontosMotos(pool, mesReferente);
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
