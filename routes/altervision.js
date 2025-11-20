// Essa rota é para requisição de API da altervision

require('dotenv').config();
const axios = require('axios');


async function fetchAltervision(pool, dataInicial, dataFinal) {
  const url = `https://bergasls.painelalter.com/api/v2/count?dateBegin=${dataInicial}&dateEnd=${dataFinal}&eventType=11&groupBy=day`;

  try {
    const response = await axios.get(url, {
      auth: {
        username: process.env.ALTERVISION_USER,
        password: process.env.ALTERVISION_PASS
      }
    });

    const data = response.data;

    for (const [dataStr, empresas] of Object.entries(data)) {
      for (const [empresa, quantidade] of Object.entries(empresas)) {
        await pool.query(
          `INSERT INTO altervision.altervision (data, empresa, quantidade)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantidade = VALUES(quantidade)`,
          [dataStr, empresa, quantidade]
        );
        console.log(`Salvo: ${dataStr} - ${empresa} - ${quantidade}`);
      }
    }

    console.log('Processo concluído.');
  } catch (error) {
    console.error('Erro ao buscar ou inserir dados:', error);
  }
}

module.exports = fetchAltervision;
