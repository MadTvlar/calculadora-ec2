const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = 8080;

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'motors',
  password: process.env.DB_PASSWORD || 'Motors!@#3223',
  database: process.env.DB_NAME || 'dados_vendas'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar no MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado ao banco MySQL!');
});

app.get('/', (req, res) => {
  connection.query('SELECT NOW() AS agora', (err, results) => {
    if (err) {
      return res.status(500).send('Erro na consulta ao banco.');
    }
    res.send(`Calculadora funcionando! Hora do banco: ${results[0].agora}`);
  });
});

app.listen(port, () => {
  console.log(`🚀 App rodando em http://localhost:${port}`);
});

