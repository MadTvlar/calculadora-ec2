const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const connection = require('../services/db');

const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('excelFile'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send('Nenhum arquivo enviado.');

  const workbook = xlsx.readFile(file.path);
  const sheet = workbook.Sheets['NOTA NPS INDIVIDUAL'];
  if (!sheet) return res.status(400).send('Planilha "NOTA NPS INDIVIDUAL" não encontrada.');

  const data = xlsx.utils.sheet_to_json(sheet);

  const limparNome = (nome) => {
    if (!nome) return '';
    return nome
      .replace(/^[\W\d_]+/, '')       // Remove caracteres estranhos do início
      .replace(/[\W\d_]+$/, '')       // Remove caracteres estranhos do fim
      .replace(/\d+/g, '')            // Remove números no meio
      .replace(/\s{2,}/g, ' ')        // Reduz múltiplos espaços
      .trim();                       // Remove espaços nas bordas
  };




  const valores = data.map(row => [
    row['ID'],
    limparNome(row['VENDEDORES']),
    row['PROMOTORAS'],
    row['NEUTRAS'],
    row['DETRATORAS'],
    row['NOTA OFICIAL']
  ]);

  // RESET antes de inserir
  connection.query('DELETE FROM nps', err => {
    if (err) {
      console.error('Erro ao apagar dados da tabela nps:', err);
      return res.status(500).send('Erro ao apagar dados.');
    }

    const insertQuery = `
      INSERT INTO nps (id_microwork, vendedores, promotoras, neutras, detratoras, nota_oficial)
      VALUES ?
    `;

    connection.query(insertQuery, [valores], (err) => {
      if (err) {
        console.error('Erro ao inserir dados:', err);
        return res.status(500).send('Erro ao inserir dados.');
      }

      res.send('Dados resetados e inseridos com sucesso!');
    });
  });
});

module.exports = router;
