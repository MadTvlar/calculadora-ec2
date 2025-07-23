require('dotenv').config();
const axios = require('axios');
const connection = require('../services/db');

const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, '0');

const dataInicial = `${year}-${month}-01`;
const dataFinal = `${year}-${month}-${day}`;

const url = `https://bergasls.painelalter.com/api/v2/count?dateBegin=${dataInicial}&dateEnd=${dataFinal}&eventType=11&groupBy=day`;

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
  }
}

module.exports = fetchAltervision;
