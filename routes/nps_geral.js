// Essa rota faz o Upload do arquivo excel da pagina nps.ejs

const express = require('express');
const router = express.Router();
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const upload = require('../services/upload');
const connection = require('../services/db');

function parseDataPadraoBR(dataStr) {
  if (typeof dataStr === 'string') {
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      const [dia, mes, ano] = partes;
      return new Date(`${ano}-${mes}-${dia}`);
    }
  } else if (dataStr instanceof Date) {
    return dataStr;
  }
  return null;
}

router.post('/upload', upload.single('excelFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }

  try {
    const workbook = xlsx.readFile(req.file.path, {
      cellDates: true,
      codepage: 65001
    });

    const sheetName = 'Entrevista Realizada';
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(400).send('Planilha "Entrevista Realizada" não encontrada.');
    }

    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 8 });

    const header = data[0];
    const colMap = {
      'Data da Entrevista': 'data',
      'CNPJ': 'cnpj',
      'Chassi': 'chassi',
      'Nota Fiscal': 'doc_fiscal',
      'Nota Recomendação': 'nota'
    };

    const colIndexes = {};
    header.forEach((colName, idx) => {
      if (colMap[colName]) {
        colIndexes[colMap[colName]] = idx;
      }
    });

    const valores = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      const dataEntrevista = parseDataPadraoBR(row[colIndexes['data']]);
      const cnpj = row[colIndexes['cnpj']] || '';
      const chassi = row[colIndexes['chassi']] || '';
      const doc_fiscal = row[colIndexes['doc_fiscal']] || '';
      const nota = row[colIndexes['nota']] ?? null;

      if (dataEntrevista instanceof Date && !isNaN(dataEntrevista) && chassi && nota !== null) {
        let detratora = 0;
        let neutra = 0;
        let promotora = 0;

        if (nota >= 0 && nota <= 6) {
          detratora = 1;
        } else if (nota >= 7 && nota <= 8) {
          neutra = 1;
        } else if (nota >= 9 && nota <= 10) {
          promotora = 1;
        }

        valores.push([
          dataEntrevista,
          cnpj,
          chassi,
          doc_fiscal,
          nota,
          detratora,
          neutra,
          promotora
        ]);
      }
    }

    if (valores.length === 0) return res.status(400).send('Nenhum dado válido encontrado na planilha.');

    const insertSql = `
      INSERT IGNORE INTO tropa_azul.nps_geral (
        data, cnpj, chassi, doc_fiscal, nota, detratora, neutra, promotora
      ) VALUES ?
    `;

    await connection.query(insertSql, [valores]);

    const updateSql = `
      UPDATE tropa_azul.nps_geral AS n
      JOIN (
        SELECT
          vm.chassi,
          CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(vm.doc_fiscal, ' ', -1), '/', 1) AS UNSIGNED) AS doc_fiscal_num,
          vm.empresa,
          vm.id_microwork,
          vm.vendedor,
          vm.modelo
        FROM microwork.vendas_motos vm
      ) AS vm_extr
      ON n.chassi = vm_extr.chassi
      AND CAST(n.doc_fiscal AS UNSIGNED) = vm_extr.doc_fiscal_num
      SET
        n.empresa = vm_extr.empresa,
        n.id_microwork = vm_extr.id_microwork,
        n.vendedor = vm_extr.vendedor,
        n.modelo = vm_extr.modelo;
    `;

    await connection.query(updateSql);

    res.send(`Arquivo processado com sucesso. ${valores.length} registros processados (novos ignoraram duplicatas).`);
  } catch (err) {
    console.error('Erro ao processar Excel:', err);
    res.status(500).send('Erro ao processar o arquivo Excel.');
  }
});

module.exports = router;
