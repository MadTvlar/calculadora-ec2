// Essa rota faz o Upload do arquivo excel da pagina Mercado.ejs

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
      'CNPJ': 'cnpj',
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

    const dadosPorTabela = {};
    const empresasComCnpj = new Set(); // Para armazenar empresas únicas com CNPJ

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return;

      let valorData = row.getCell(colIndexes['data_emplacamento']).value;
      let data_emplacamento = null;

      if (valorData) {
        if (valorData instanceof Date) {
          data_emplacamento = valorData;
        } else if (typeof valorData === 'string') {
          const dataStr = valorData.slice(0, 10);
          const partes = dataStr.split('/');
          if (partes.length === 3) {
            data_emplacamento = new Date(`${partes[2]}-${partes[1]}-${partes[0]}`);
          } else if (!isNaN(Date.parse(dataStr))) {
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
        empresa: row.getCell(colIndexes['empresa']).value || null,
        cnpj: row.getCell(colIndexes['cnpj']).value || '',
        modelo: row.getCell(colIndexes['modelo']).value || '',
        ano: row.getCell(colIndexes['ano']).value || null,
        placa: row.getCell(colIndexes['placa']).value || '',
        uf: row.getCell(colIndexes['uf']).value || '',
        chassi: row.getCell(colIndexes['chassi']).value || ''
      };

      // Armazena empresa + cnpj para posterior inserção
      if (obj.empresa && obj.cnpj) {
        empresasComCnpj.add(JSON.stringify({ empresa: obj.empresa, cnpj: obj.cnpj }));
      }

      // Somente insere dados de mercado se forem válidos
      if (obj.chassi && obj.placa && obj.data_emplacamento instanceof Date && !isNaN(obj.data_emplacamento)) {
        const ano = obj.data_emplacamento.getFullYear();
        const mes = String(obj.data_emplacamento.getMonth() + 1).padStart(2, '0');
        const tabela = `share.mercado_${ano}_${mes}`;
        if (!dadosPorTabela[tabela]) dadosPorTabela[tabela] = [];
        dadosPorTabela[tabela].push(obj);
      }
    });

    let totalInseridos = 0;

    // Insere os dados nas tabelas de mercado
    for (const tabela in dadosPorTabela) {
      const dados = dadosPorTabela[tabela];
      if (dados.length > 0) {
        const sql = `INSERT IGNORE INTO ${tabela} (cnpj, data_emplacamento, municipio, fabricante, empresa, modelo, ano, placa, uf, chassi)
          VALUES ?`;
        const values = dados.map(d => [
          d.cnpj,
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

        const [result] = await connection.query(sql, [values]);
        totalInseridos += values.length;
      }
    }

    // Agora sim: Insere empresas com CNPJ na tabela tropa_azul ANTES de atualizar os dados no share
    if (empresasComCnpj.size > 0) {
      const valuesCnpj = Array.from(empresasComCnpj).map(str => {
        const item = JSON.parse(str);
        return [item.empresa, item.cnpj];
      });

      const sqlCnpj = `INSERT IGNORE INTO tropa_azul.cnpj_empresa (empresa, cnpj) VALUES ?`;
      await connection.query(sqlCnpj, [valuesCnpj]);
    }

    // Atualiza os campos empresa em branco nas tabelas share.mercado_YYYY_MM
    for (const tabela in dadosPorTabela) {
      const sqlUpdateEmpresa = `
        UPDATE ${tabela} AS s
        JOIN tropa_azul.cnpj_empresa AS t ON s.cnpj = t.cnpj
        SET s.empresa = t.empresa
        WHERE s.empresa IS NULL
      `;
      await connection.query(sqlUpdateEmpresa);
    }

    if (totalInseridos > 0) {
      res.redirect(`/mercado?success=1&inseridos=${totalInseridos}`);
    } else {
      res.redirect('/mercado?success=0&inseridos=0');
    }
  } catch (err) {
    console.error('Erro ao processar Excel:', err);
    res.status(500).send('Erro ao processar o arquivo Excel.');
  }
});

module.exports = router;
