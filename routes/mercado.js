const express = require('express');
const router = express.Router();
const path = require('path');
const ExcelJS = require('exceljs');
const connection = require('../services/db');
const multer = require('multer');
const upload = multer({ dest: path.join(__dirname, '../uploads') });

// POST para upload e processamento do Excel
router.post('/upload', upload.single('excelFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo enviado.');
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet('Sheet1');
    if (!worksheet) {
      return res.status(400).send('Planilha "Sheet1" não encontrada.');
    }

    // Mapeamento das colunas do Excel para o banco
    const colMap = {
      'Emplacamento': 'data_emplacamento',
      'Município': 'municipio',
      'Fabricante': 'fabricante',
      'Razão Social': 'empresa',
      'Modelo': 'modelo',
      'Ano Fabricação': 'ano',
      'Placa': 'placa',
      'Estado': 'uf',
      'Chassi': 'chassi'
    };

    // Pega o índice das colunas usando a segunda linha
    const headerRow = worksheet.getRow(2);
    const colIndexes = {};
    headerRow.eachCell((cell, colNumber) => {
      if (colMap[cell.value]) {
        colIndexes[colMap[cell.value]] = colNumber;
      }
    });

    // Validação básica
    const requiredCols = Object.values(colMap);
    for (const col of requiredCols) {
      if (!colIndexes[col]) {
        return res.status(400).send(`Coluna obrigatória não encontrada: ${col}`);
      }
    }

    // Monta os dados para inserir, agrupando por tabela
    const dadosPorTabela = {};

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return; // pula header e subheader
      let valorData = row.getCell(colIndexes['data_emplacamento']).value;
      let data_emplacamento = null;
      if (valorData) {
        if (valorData instanceof Date) {
          data_emplacamento = valorData;
        } else if (typeof valorData === 'string') {
          // Pega só os 10 primeiros caracteres
          const dataStr = valorData.slice(0, 10);
          // Tenta converter do formato dd/mm/yyyy ou yyyy-mm-dd
          const partes = dataStr.split('/');
          if (partes.length === 3) {
            // dd/mm/yyyy
            data_emplacamento = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          } else if (!isNaN(Date.parse(dataStr))) {
            // yyyy-mm-dd ou outro formato reconhecido
            data_emplacamento = new Date(dataStr);
          }
        } else if (typeof valorData === 'object' && valorData.text) {
          const dataStr = valorData.text.slice(0, 10);
          const partes = dataStr.split('/');
          if (partes.length === 3) {
            data_emplacamento = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          }
        }
      }
      const obj = {
        data_emplacamento,
        municipio: row.getCell(colIndexes['municipio']).value || '',
        fabricante: row.getCell(colIndexes['fabricante']).value || '',
        empresa: row.getCell(colIndexes['empresa']).value || '',
        modelo: row.getCell(colIndexes['modelo']).value || '',
        ano: row.getCell(colIndexes['ano']).value || null,
        placa: row.getCell(colIndexes['placa']).value || '',
        uf: row.getCell(colIndexes['uf']).value || '',
        chassi: row.getCell(colIndexes['chassi']).value || ''
      };
      // Só insere se tiver chassi, placa e data válida
      if (obj.chassi && obj.placa && obj.data_emplacamento instanceof Date && !isNaN(obj.data_emplacamento)) {
        const ano = obj.data_emplacamento.getFullYear();
        const mes = String(obj.data_emplacamento.getMonth() + 1).padStart(2, '0');
        const tabela = `share.mercado_${ano}_${mes}`;
        if (!dadosPorTabela[tabela]) dadosPorTabela[tabela] = [];
        dadosPorTabela[tabela].push(obj);
      }
    });

    // Insere no banco, tabela por tabela
    for (const tabela in dadosPorTabela) {
      const dados = dadosPorTabela[tabela];
      if (dados.length > 0) {
        console.log(`Dados a serem inseridos em ${tabela}:`);
        dados.forEach((d, i) => {
          console.log(`#${i + 1}:`, {
            ...d,
            data_emplacamento: (d.data_emplacamento instanceof Date && !isNaN(d.data_emplacamento))
              ? d.data_emplacamento.toISOString().slice(0, 10)
              : d.data_emplacamento
          });
        });
        const sql = `INSERT IGNORE INTO ${tabela} (data_emplacamento, municipio, fabricante, empresa, modelo, ano, placa, uf, chassi)
          VALUES ?`;
        const values = dados.map(d => [
          d.data_emplacamento,
          d.municipio,
          d.fabricante,
          d.empresa,
          d.modelo,
          d.ano,
          d.placa,
          d.uf,
          d.chassi
        ]);
        await connection.promise().query(sql, [values]);
        console.log(`Total inseridos (sem duplicatas) em ${tabela}: ${values.length}`);
      } else {
        console.log(`Nenhum dado válido para inserir em ${tabela}.`);
      }
    }

    res.redirect('/mercado');
  } catch (err) {
    console.error('Erro ao processar Excel:', err);
    res.status(500).send('Erro ao processar o arquivo Excel.');
  }
});

module.exports = router;
