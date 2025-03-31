const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'motors',
  password: 'Motors!@#3223',
  database: 'dados_vendas'
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Erro ao conectar ao MySQL:', err);
    return;
  }
  console.log('✅ Conectado ao MySQL!');

  // Lista de tabelas que queremos garantir
  const tabelas = {
    vendas: `
      CREATE TABLE vendas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome_vendedor VARCHAR(50),
        nome_cliente VARCHAR(50),
        cpf_cnpj_cliente VARCHAR(20),
        moto_selecionada VARCHAR(50),
        origiem_moto VARCHAR(10),
        forma_pagamento VARCHAR(20),
        filial_escolhida VARCHAR(20),
        banco_selecionado VARCHAR(10),
        retorno_selecionado VARCHAR(2),
        valor_bem DECIMAL(7,2),
        valor_venda_real DECIMAL(7,2),
        custo_moto DECIMAL(7,2),
        margem_bruta DECIMAL(7,2),
        emplacamento_receita DECIMAL(7,2),
        frete_receita DECIMAL(7,2),
        acessorio DECIMAL(7,2),
        valor_retorno DECIMAL(7,2),
        emplcamento_custo DECIMAL(7,2),
        frete_custo DECIMAL(7,2),
        taxa_cartao DECIMAL(7,2),
        brinde DECIMAL(7,2),
        despesa_operacionais DECIMAL(7,2),
        total_despesas DECIMAL(7,2),
        total_receitas DECIMAL(7,2),
        margem_liquida DECIMAL(7,2),
        comissao DECIMAL(7,2),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    logs: fs.readFileSync(path.join(__dirname, 'database', 'init.sql'), 'utf-8')
  };

  const verificarOuCriarTabela = (nome, query) => {
    connection.query(
      `SHOW TABLES LIKE '${nome}'`,
      (err, results) => {
        if (err) {
          console.error(`❌ Erro ao verificar tabela "${nome}":`, err);
          return;
        }

        if (results.length > 0) {
          console.log(`🔁 Tabela "${nome}" já existe.`);
        } else {
          connection.query(query, (err) => {
            if (err) {
              console.error(`❌ Erro ao criar tabela "${nome}":`, err);
            } else {
              console.log(`✅ Tabela "${nome}" criada com sucesso.`);
            }
          });
        }
      }
    );
  };

  // Verificar e criar todas as tabelas
  for (const [nome, query] of Object.entries(tabelas)) {
    verificarOuCriarTabela(nome, query);
  }

  // Fechar conexão após um pequeno tempo pra todas as queries finalizarem
  setTimeout(() => connection.end(), 2000);
});

