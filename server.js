require('dotenv').config(); // carrega as variáveis do .env

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const util = require('util');
const connection = require('./services/db');
const query = util.promisify(connection.query).bind(connection);
const bcrypt = require('bcrypt');


require('./scheduler');
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
  secret: 'segredo',
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'templates'));



const usuarios = require('./services/user');
const taxas = require('./services/taxa');
const emplacamento = require('./services/emplacamento');


function obterValorMesAtual() {
  const dataAtual = new Date();
  const nomeMes = dataAtual.toLocaleString('pt-BR', { month: 'long' }).toLowerCase();
  return emplacamento[nomeMes] || 0;
}

const formasPagamentos = [
  "À Vista", "Financiado", "Cartão de Crédito"
];

const bancos = [
  "Yamaha", "Pan", "Santander", "Bradesco"
];

const bancoRetorno = [
  "R0", "R1", "R2", "R3", "R4"
];

const filiais = [
  "Cachoeirinha", "Compensa", "Cidade Nova", "Grande Circular",
  "Max Teixeira", "Humaitá", "Itacoatiara", "Iranduba",
  "Manacapuru", "Coari", "Tefé"
];

const filiaisNautica = [
  "Centro", "Marina"
];

const icms_venda = {
  "Para Dentro do Estado": 0.2,
  "Para Fora do Estado": 0.12,
  "Base Reduzida": 0.07,
}


app.get('/', (req, res) => {
  const errors = req.flash('error');
  res.render('home', { errors });
});


app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  console.log('Login recebido:', login);
  console.log('Senha recebida:', password);

  try {
    // Usa a interface de promises corretamente
    const [rows] = await connection.promise().query('SELECT * FROM usuarios WHERE email = ?', [login]);

    if (rows.length === 0) {
      req.flash('error', 'Login ou senha inválidos');
      return res.redirect('/');
    }

    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(password, usuario.senha);

    if (!senhaCorreta) {
      req.flash('error', 'Login ou senha inválidos');
      return res.redirect('/');
    }

    res.cookie('usuario_logado', usuario.nome);
    res.cookie('grupo_logado', usuario.grupo);
    res.redirect('/segmentos');
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).send('Erro no login');
  }
});


app.get('/segmentos', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;

  console.log('Todos os cookies:', req.cookies);


  if (!usuarioLogado) {
    return res.redirect('/');
  }

  res.render('segmentos', {
    usuario: usuarioLogado,
    grupo: grupoLogado
  });

});

app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await query('SELECT nome, email, grupo FROM usuarios ORDER BY grupo');

    res.render('usuarios', {
      usuarios,
      usuario: req.cookies.usuario_logado
    });
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).send('Erro ao buscar usuários');
  }
});

app.post('/usuarios/adicionar', async (req, res) => {
  const { grupo, nome, email, senha } = req.body;
  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10); // 10 é o número de salt rounds
    const sql = 'INSERT INTO usuarios (grupo, nome, email, senha) VALUES (?, ?, ?, ?)';
    await connection.execute(sql, [grupo, nome, email, senhaCriptografada]);
    res.redirect('/usuarios');
  } catch (err) {
    console.error('Erro ao adicionar usuário:', err);
    res.status(500).send('Erro ao adicionar usuário');
  }
});







app.post('/usuarios/atualizar-senha', async (req, res) => {
  const { email, novaSenha } = req.body;

  try {
    const senhaCriptografada = await bcrypt.hash(novaSenha, 10); // mesma segurança da criação
    const sql = 'UPDATE usuarios SET senha = ? WHERE email = ?';
    await connection.promise().query(sql, [senhaCriptografada, email]);

    res.redirect('/usuarios');
  } catch (err) {
    console.error('Erro ao atualizar senha:', err);
    res.status(500).send('Erro ao atualizar senha');
  }
});


app.post('/usuarios/excluir', async (req, res) => {
  const { email } = req.body;
  try {
    await connection.promise().query('DELETE FROM usuarios WHERE email = ?', [email]);
    res.redirect('/usuarios');
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).send('Erro interno');
  }
});

app.get('/rankmotos', async (req, res) => {
  try {
    console.log('Buscando ranking...');

    const usuarioLogado = req.cookies.usuario_logado;
    if (!usuarioLogado) {
      console.log('Usuário não logado, redirecionando...');
      return res.redirect('/');
    }

    const [manaus] = await connection.promise().query(`
      SELECT vendedor, SUM(quantidade) AS total_vendas
      FROM mk_vendas_motos
      WHERE empresa IN ('COM', 'CAC', 'CID', 'GRA')
      GROUP BY vendedor
      ORDER BY total_vendas DESC
      LIMIT 5
    `);
    console.log('Dados de Manaus:', manaus);

    const [interior] = await connection.promise().query(`
      SELECT vendedor, SUM(quantidade) AS total_vendas
      FROM mk_vendas_motos
      WHERE empresa NOT IN ('COM', 'CAC', 'CID', 'GRA')
      GROUP BY vendedor
      ORDER BY total_vendas DESC
      LIMIT 5
    `);
    console.log('Dados do Interior:', interior);

    const [geral] = await connection.promise().query(`
      SELECT vendedor, SUM(quantidade) AS total_vendas
      FROM mk_vendas_motos
      GROUP BY vendedor
      ORDER BY total_vendas DESC
      LIMIT 5
    `);
    console.log('Dados gerais:', geral);

    // Formatação dos nomes
    function formatarNome(nome) {
      const nomeLimpo = nome.replace(/[^\p{L}\s]/gu, '').trim();

      const partes = nomeLimpo.split(' ');
      const primeiroNome = partes[0];
      const sobrenome = partes[partes.length - 1];

      const nomeFormatado = (primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()) + ' ' +
        (sobrenome.charAt(0).toUpperCase() + sobrenome.slice(1).toLowerCase());

      return nomeFormatado;
    }

    const rankingManaus = manaus.map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const rankingInterior = interior.map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const rankingGeral = geral.map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    console.log('Ranking Manaus formatado:', rankingManaus);
    console.log('Ranking Interior formatado:', rankingInterior);
    console.log('Ranking Geral formatado:', rankingGeral);

    const dataAtual = new Date();
    const mesAtual = dataAtual.toLocaleString('pt-BR', { month: 'long' }).toLowerCase();

    res.render('rankvendasmotos', {
      usuario: usuarioLogado,
      rankingManaus,
      rankingInterior,
      rankingGeral,
      mesAtual
    });
  } catch (err) {
    console.error('Erro no servidor:', err);
    res.status(500).send("Erro ao gerar ranking.");
  }
});



app.get('/motos', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  if (!usuarioLogado) {
    return res.redirect('/');
  }

  const valorMesAtual = obterValorMesAtual();

  res.render('motos', {
    usuario: usuarioLogado,
    formasPagamentos,
    bancos,
    filiais,
    bancoRetorno,
    taxas,
    valorMesAtual
  });
});

app.get('/nautica', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  if (!usuarioLogado) {
    return res.redirect('/');
  }

  res.render('nautica', {
    usuario: usuarioLogado,
    formasPagamentos,
    bancos,
    filiaisNautica,
    bancoRetorno,
    taxas,
    icms_venda

  });
});

app.get('/dados_moto/:nome_moto', (req, res) => {
  const nomeMoto = decodeURIComponent(req.params.nome_moto);
  if (motos[nomeMoto]) {
    res.json(motos[nomeMoto]);
  } else {
    res.status(404).json({ error: 'Moto não encontrada' });
  }
});

app.get('/dados_motor/:nome_motor', (req, res) => {
  const nomeMotor = decodeURIComponent(req.params.nome_motor);
  if (motores[nomeMotor]) {
    res.json(motores[nomeMotor]);
  } else {
    res.status(404).json({ error: 'Motor não encontrada' });
  }
});

app.get('/obter_taxa/:nome_parcela', (req, res) => {
  const nomeParcela = decodeURIComponent(req.params.nome_parcela);
  if (taxas[nomeParcela]) {
    res.json({
      nomeParcela,
      valor: taxas[nomeParcela].valor,
      parcela: taxas[nomeParcela].parcela // Garante que parcela está incluída na resposta
    });
  } else {
    res.status(404).json({ error: 'Parcela não encontrada' });
  }
});

// Rota para receber os dados do formulário e inserir no banco
app.post('/venda_moto', (req, res) => {
  const {
    nome_vendedor, nome_cliente, cpf_cnpj_cliente, moto_selecionada, origiem_moto, forma_pagamento,
    filial_escolhida, banco_selecionado, retorno_selecionado, valor_bem, valor_venda_real, custo_moto,
    margem_bruta, emplacamento_receita, frete_receita, acessorio, valor_retorno, emplcamento_custo,
    frete_custo, taxa_cartao, brinde, despesa_operacionais, total_despesas, total_receitas,
    margem_liquida, comissao
  } = req.body;

  // Verifique se todos os campos necessários estão preenchidos
  if (!nome_vendedor || !nome_cliente || !cpf_cnpj_cliente || !moto_selecionada) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  // Query para inserir os dados na tabela "vendas"
  const query = `
    INSERT INTO simulacao_motos (
      nome_vendedor, nome_cliente, cpf_cnpj_cliente, moto_selecionada, origiem_moto, forma_pagamento, 
      filial_escolhida, banco_selecionado, retorno_selecionado, valor_bem, valor_venda_real, custo_moto, 
      margem_bruta, emplacamento_receita, frete_receita, acessorio, valor_retorno, emplcamento_custo, 
      frete_custo, taxa_cartao, brinde, despesa_operacionais, total_despesas, total_receitas, 
      margem_liquida, comissao
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nome_vendedor, nome_cliente, cpf_cnpj_cliente, moto_selecionada, origiem_moto, forma_pagamento,
    filial_escolhida, banco_selecionado, retorno_selecionado, valor_bem, valor_venda_real, custo_moto,
    margem_bruta, emplacamento_receita, frete_receita, acessorio, valor_retorno, emplcamento_custo,
    frete_custo, taxa_cartao, brinde, despesa_operacionais, total_despesas, total_receitas,
    margem_liquida, comissao
  ];

  connection.query(query, values, (err) => {
    if (err) {
      console.error('Erro ao inserir dados: ', err);
      return res.status(500).send('Erro ao registrar a venda');
    }
    res.send('Venda registrada com sucesso!');
  });
});

app.get('/api/motos/modelos-motos-disponiveis', async (req, res) => {
  try {
    const [rows] = await connection.promise().query(`
      SELECT DISTINCT modelo FROM estoque_motos
      WHERE situacao IN ('loja', 'em demonstração', 'trânsito') AND modelo IS NOT NULL
      ORDER BY modelo ASC
    `);

    const modelos = rows.map(row => row.modelo);
    console.log('Modelos disponíveis:', modelos);  // Verificando o que está sendo retornado

    res.json(modelos);
  } catch (err) {
    console.error('Erro ao buscar modelos disponíveis:', err);
    res.status(500).json({ error: 'Erro ao buscar modelos' });
  }
});


app.get('/api/motos/chassis-por-modelo', async (req, res) => {
  const modeloSelecionado = req.query.modelo;

  if (!modeloSelecionado) {
    return res.status(400).json({ error: 'Modelo não fornecido' });
  }

  try {
    const [rows] = await connection.promise().query(
      `SELECT DISTINCT chassi, cor, patio, ano, dias_estoque FROM estoque_motos 
      WHERE situacao IN ('loja', 'em demonstração', 'trânsito') AND modelo LIKE ?`,
      [`%${modeloSelecionado.trim()}%`]
    );

    console.log("Chassis retornados:", rows);  // Verificando os chassis retornados

    res.json(rows);  // Envia os dados completos para o front-end
  } catch (err) {
    console.error('Erro ao buscar chassis:', err);
    res.status(500).json({ error: 'Erro ao buscar chassis' });
  }
});

app.get('/api/motos/detalhes-chassi', async (req, res) => {
  const chassi = req.query.chassi;

  if (!chassi) {
    return res.status(400).json({ error: 'Chassi não fornecido' });
  }

  try {
    const [rows] = await connection.promise().query(
      `SELECT custo_contabil, chassi 
       FROM estoque_motos 
       WHERE chassi = ? LIMIT 1`,
      [chassi]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Chassi não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar detalhes do chassi:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes do chassi' });
  }
});

















app.post('/venda_motor', (req, res) => {
  const {
    nome_vendedor, nome_cliente, cpf_cnpj_cliente, motor_selecionado, chassi, forma_pagamento,
    filial_escolhida, banco_selecionado, retorno_selecionado, valor_bem, valor_venda_real, custo_motor,
    margem_bruta, acessorio, valor_retorno, icms, taxa_cartao, despesa_operacionais, total_despesas,
    total_receitas, margem_liquida, comissao
  } = req.body;

  if (!nome_vendedor || !nome_cliente || !cpf_cnpj_cliente || !motor_selecionado) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  const query = `
    INSERT INTO simulacao_motores (
      nome_vendedor, nome_cliente, cpf_cnpj_cliente, motor_selecionado, chassi,
      forma_pagamento, filial_escolhida, banco_selecionado, retorno_selecionado,
      valor_bem, valor_venda_real, custo_motor, margem_bruta, acessorio, valor_retorno,
      icms, taxa_cartao, despesa_operacionais, total_despesas, total_receitas,
      margem_liquida, comissao
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    nome_vendedor, nome_cliente, cpf_cnpj_cliente, motor_selecionado, chassi,
    forma_pagamento, filial_escolhida, banco_selecionado, retorno_selecionado,
    valor_bem, valor_venda_real, custo_motor, margem_bruta, acessorio, valor_retorno,
    icms, taxa_cartao, despesa_operacionais, total_despesas, total_receitas,
    margem_liquida, comissao
  ];

  connection.query(query, values, (err, result) => {
    if (err) {
      console.error('Erro ao salvar venda:', err);
      return res.status(500).send('Erro ao salvar venda.');
    }

    res.send('Venda salva com sucesso!');
  });
});



app.get('/api/nautica/modelos-motores-disponiveis', async (req, res) => {
  try {
    const [rows] = await connection.promise().query(`
      SELECT DISTINCT modelo FROM estoque_motores
      WHERE situacao IN ('loja', 'em demonstração', 'trânsito') AND modelo IS NOT NULL
      ORDER BY modelo ASC
    `);

    const modelos = rows.map(row => row.modelo);
    console.log('Modelos disponíveis:', modelos);  // Verificando o que está sendo retornado

    res.json(modelos);
  } catch (err) {
    console.error('Erro ao buscar modelos disponíveis:', err);
    res.status(500).json({ error: 'Erro ao buscar modelos' });
  }
});

app.get('/api/nautica/chassis-por-modelo', async (req, res) => {
  const modeloSelecionado = req.query.modelo;

  if (!modeloSelecionado) {
    return res.status(400).json({ error: 'Modelo não fornecido' });
  }

  const termo = modeloSelecionado.includes('MOD')
    ? modeloSelecionado.split('MOD')[1].trim()
    : modeloSelecionado.trim();

  try {
    const [rows] = await connection.promise().query(
      `SELECT DISTINCT chassi, cor, patio, dias_estoque FROM estoque_motores 
      WHERE situacao IN ('loja', 'em demonstração', 'trânsito') AND modelo LIKE ?`,
      [`%${termo}%`]
    );

    console.log("Chassis retornados:", rows);  // Verificando os chassis retornados

    res.json(rows);  // Envia os dados completos para o front-end
  } catch (err) {
    console.error('Erro ao buscar chassis:', err);
    res.status(500).json({ error: 'Erro ao buscar chassis' });
  }
});

app.get('/api/nautica/detalhes-chassi', async (req, res) => {
  const chassi = req.query.chassi;

  if (!chassi) {
    return res.status(400).json({ error: 'Chassi não fornecido' });
  }

  try {
    const [rows] = await connection.promise().query(
      `SELECT custo_contabil, icms_compra, chassi 
       FROM estoque_motores 
       WHERE chassi = ? LIMIT 1`,
      [chassi]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Chassi não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar detalhes do chassi:', err);
    res.status(500).json({ error: 'Erro ao buscar detalhes do chassi' });
  }
});







app.get('/logout', (req, res) => {
  res.clearCookie('usuario_logado').redirect('/');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

