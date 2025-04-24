const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const connection = require('./db');


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



const motos = require('./dados/dados_motos');
const motores = require('./dados/dados_motores');
const usuarios = require('./dados/user');
const taxas = require('./dados/taxa');
const emplacamento = require('./dados/emplacamento');


function obterValorMesAtual() {
  const dataAtual = new Date();
  const nomeMes = dataAtual.toLocaleString('pt-BR', { month: 'long' }).toLowerCase();
  return emplacamento[nomeMes] || 0;
}


const formasPagamentos = [
  "À Vista",
  "Financiado",
  "Cartão de Crédito"
];

const bancos = [
  "Yamaha",
  "Pan",
  "Santander",
  "Bradesco"
];

const bancoRetorno = [
  "R0",
  "R1",
  "R2",
  "R3",
  "R4"
];

const filiais = [
  "Cachoeirinha", "Compensa", "Cidade Nova", "Grande Circular",
  "Max Teixeira", "Humaitá", "Itacoatiara", "Iranduba",
  "Manacapuru", "Coari", "Tefé"
];

const filiaisNautica = [
  "Centro", "Marina"
];

const origemMoto = ["Capital", "Interior"
];



app.get('/', (req, res) => {
  const errors = req.flash('error');
  res.render('home', { errors });
});


app.post('/login', (req, res) => {
  const { login, password } = req.body;

  if (!usuarios[login] || usuarios[login] !== password) {
    req.flash('error', 'Login ou senha inválidos');
    return res.redirect('/');
  }

  res.cookie('usuario_logado', login);
  res.redirect('/segmentos');
});


app.get('/segmentos', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;

  if (!usuarioLogado) {
    return res.redirect('/');
  }

  const usuarioFormatado = usuarioLogado.replace('_', ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return res.render('segmentos', { usuario: usuarioFormatado });
});


app.get('/motos', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  if (!usuarioLogado) {
    return res.redirect('/');
  }

  const usuarioFormatado = usuarioLogado.replace('_', ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const valorMesAtual = obterValorMesAtual();

  res.render('motos', {
    usuario: usuarioFormatado,
    motos,
    formasPagamentos,
    bancos,
    filiais,
    bancoRetorno,
    origemMoto,
    taxas,
    valorMesAtual
  });
});

app.get('/nautica', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  if (!usuarioLogado) {
    return res.redirect('/');
  }

  const usuarioFormatado = usuarioLogado.replace('_', ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  res.render('nautica', {
    usuario: usuarioFormatado,
    motores,
    formasPagamentos,
    bancos,
    filiaisNautica,
    bancoRetorno,
    origemMoto,
    taxas
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
    INSERT INTO vendas_motos (
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
    INSERT INTO vendas_motores (
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








app.get('/logout', (req, res) => {
  res.clearCookie('usuario_logado').redirect('/');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

