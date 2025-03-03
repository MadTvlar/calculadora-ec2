const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 8080;

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

app.get('/', async (req, res) => {
    const result = await pool.query('SELECT NOW()');
    res.send(`Calculadora funcionando! Hora do Banco: ${result.rows[0].now}`);
});

app.listen(port, () => {
    console.log(`App rodando em http://localhost:${port}`);
});
