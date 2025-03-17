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
const usuarios = require('./dados/user');
const taxas = require('./dados/taxa');

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

const origemMoto = ["Capital", "Interior"];



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



app.get('/painel', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  if (!usuarioLogado) {
    return res.redirect('/');
  }

  const usuarioFormatado = usuarioLogado.replace('_', ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  res.render('painel', {
    usuario: usuarioFormatado,
    motos,
    formasPagamentos,
    bancos,
    filiais,
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
app.post('/venda', (req, res) => {
  const { vendedor, cliente, cpf, moto, filialTipo } = req.body;

  // Verifique se todos os campos necessários estão preenchidos
  if (!vendedor || !cliente || !cpf || !moto || !filialTipo) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  // Query para inserir os dados na tabela "vendas"
  const query = `
    INSERT INTO vendas (nome_vendedor, nome_cliente, cpf_cnpj_cliente, moto_selecionada, filial_escolhida)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(query, [vendedor, cliente, cpf, moto, filialTipo], (err, results) => {
    if (err) {
      console.error('Erro ao inserir dados: ', err);
      return res.status(500).send('Erro ao registrar a venda');
    }
    res.send('Venda registrada com sucesso!');
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