require('dotenv').config();
const axios = require('axios');
const connection = require('../services/db');

const url = `https://bergasls.painelalter.com/api/v2/count?dateBegin=2025-06-01&dateEnd=2025-07-17&eventType=11&groupBy=day`;

async function fetchAltervision() {
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
        await connection.promise().query(
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
  } finally {
    connection.end();
  }
}


module.exports = fetchAltervision;
