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

    

    const representante = new Set([
  'HUDSON SANTOS DE LIMA',
  'KEDMA NASCIMENTO MORAES',
  'JANDERSON MOCAMBIQUE DE SOUZA',
  'C J T SIMAO TRANSPORTE POR NAVEGACAO FLUVIAL LTDA',
  'LUCIDALVA GARCIA DE SOUZA',
  'MATHEUS SILVA DE SOUZA',
  'A C DE ALMEIDA',
  'K. S. S. CARDOSO',
  'L. C. M. DOS SANTOS',
  'M A P ANGELIN CORPORATE LTDA',
  'ODUÉNAVI DE MELO RIBEIRO PEREIRA',
  'MOTO AMIL EIRELLI-ME',
  'KLAUSBERG DA SILVA LIMA',
  'LUCIANO LINQUEO LESSE DOS SANTOS',
  'JACKSON IURY ROCHA DA SILVA',
  'JULIANA DA COSTA BEZERRA',
  'SHIRLENE PINHO DE SOUZA',
  'FRANSUILDO DOS SANTOS SILVA',
  'LUCIANO LINQUEO LESSE DOS SANTOS',
  'EDNALDO PEREIRA DO VALE',
  'LEONIDAS AUGUSTO PINEDO NETO',
  'DROGARIA CENTRAL  COMERCIO VAREJISTA DE MEDICAMENTOS LTDA',
  'NAYARA SERRAO DA SILVA',
  'ANA BEATRIZ CONCEICAO PEREIRA',
  'ANTONIA CLEANE DA SILVA FERREIRA',
  'DENISE HOLANDA LOURENÇO',
  'FRANCISCO VANDICKSON ALVES DE SOUZA',
  'JHON WESLLEY ARAUJO DA SILVA',
  'JIMMY ALBERT MAGALHAES GUIMARAES',
  'KAMILA JENNIFER LIMA BARROSO',
  'LUIZ LUCAS MATOS DE ALMEIDA',
  'RAFAEL FERREIRA DA SILVA',
  'RUAN FERNANDES DE LIMA',
  'SHAYANNE CUNHA DA SILVA',
  'GLEBER DE SOUZA MORAES JÚNIOR',
  'FERNANDO PEREIRA DA SILVA',
]);


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

    await fetchRankingGeralMotos(pool, representante, mesReferente);
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
