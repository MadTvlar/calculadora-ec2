// CONFIGURAÇÕES INICIAIS
require('dotenv').config();

//PACOTES EXTERNOS
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const util = require('util');
const bcrypt = require('bcrypt');


// SERVIÇOS INTERNOS
const connection = require('./services/db');
const taxas = require('./services/taxa');
const emplacamento = require('./services/emplacamento');
const app = express();
const PORT = 8080;
//require('./scheduler');

// MIDDLEWARES
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

const rotaNPS = require('./routes/nps');
app.use('/nps', rotaNPS);

// CONFIGURAÇÃO AUXILIAres
const query = util.promisify(connection.query).bind(connection);

// FUNÇÃO PARA SE OBTER O VALOR DO EMPLACAMENTO NO MÊS QUE ESTAMOS
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

// CHAMADO PARA A TELA DE LOGIN 
app.get('/', (req, res) => {
  const errors = req.flash('error');
  res.render('home', { errors });
});

// CHAMADO PARA TELA DE SEGMENTOS, APÓS O LOGIN
app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  if (login === 'admin' && password === 'admin!@#') {
    res.cookie('usuario_logado', 'Administrador');
    res.cookie('grupo_logado', 'admin');
    res.cookie('id_logado', '70057');
    return res.redirect('/segmentos');
  }

  try {
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
    res.cookie('id_logado', usuario.id_microwork);
    res.redirect('/segmentos');
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).send('Erro no login');
  }
});

// CHAMADO PARA SEGMENTOS ASSIM QUE O USUARIO CLICAR NA LOGO
app.get('/segmentos', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;

  console.log(req.cookies)


  if (!usuarioLogado) {
    return res.redirect('/');
  }

  res.render('segmentos', {
    usuario: usuarioLogado,
    grupo: grupoLogado
  });
});

// CHAMADO PARA SEGMENTOS ASSIM QUE O USUARIO CLICAR NA LOGO
app.get('/apresentacao', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;

  console.log(req.cookies)


  if (!usuarioLogado) {
    return res.redirect('/');
  }

  res.render('apresentacao', {
    usuario: usuarioLogado,
    grupo: grupoLogado
  });
});

// CHAMADO PARA PAGINA DE CADASTRO DE USUARIOS (APENAS PARA ADMIN)
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await query('SELECT nome, id_microwork, email, grupo FROM usuarios ORDER BY grupo');

    res.render('usuarios', {
      usuarios,
      usuario: req.cookies.usuario_logado
    });
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).send('Erro ao buscar usuários');
  }
});

// CHAMADO PARA AS MOTOS RESERVADAS
app.get('/reservasmotos', async (req, res) => {
  try {
    const [rows] = await connection.promise().query(`
      SELECT patio, modelo, chassi, data_reserva, destino_reserva, observacao_reserva, dias_reserva
      FROM microwork.estoque_motos
      WHERE situacao_reserva = 'Ativa'
      ORDER BY data_reserva DESC
    `);

    // Função para formatar nomes
    function formatarNome(nome) {
      if (!nome) return '';

      // Remove qualquer coisa antes do primeiro nome real (que começa com letra)
      const nomeSemNumeros = nome.replace(/^[^A-Za-zÀ-ÿ]+/, '');

      // Remove caracteres especiais, mantendo letras e espaços
      const nomeLimpo = nomeSemNumeros.replace(/[^A-Za-zÀ-ÿ\s]/g, '').trim();

      // Divide o nome e seleciona o primeiro e o último
      const partes = nomeLimpo.split(/\s+/);
      const primeiroNome = partes[0] || '';
      const ultimoNome = partes[partes.length - 1] || '';

      return (
        primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
      ) + ' ' + (
          ultimoNome.charAt(0).toUpperCase() + ultimoNome.slice(1).toLowerCase()
        );
    }



    const motos = rows.map(moto => ({
      ...moto,
      data_reserva_formatada: moto.data_reserva
        ? new Date(moto.data_reserva).toLocaleDateString('pt-BR')
        : '-',
      destino_reserva: formatarNome(moto.destino_reserva)
    }));


    res.render('reservasmotos', {
      usuario: req.cookies.usuario_logado,
      motos
    });
  } catch (err) {
    console.error('Erro ao buscar reservas de motos:', err);
    res.status(500).render('erro', { mensagem: 'Erro ao buscar reservas de motos' });
  }
});


// CHAMADO PARA O BOTÃO DE ADICIONAR USUÁRIO
app.post('/usuarios/adicionar', async (req, res) => {
  console.log(req.body);

  const { grupo, nome, id_microwork, email, senha } = req.body;
  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10); // 10 é o número de salt rounds
    const sql = 'INSERT INTO usuarios (grupo, nome, id_microwork, email, senha) VALUES (?, ?, ?, ?, ?)';
    await connection.execute(sql, [grupo, nome, id_microwork, email, senhaCriptografada]);
    res.redirect('/usuarios');
  } catch (err) {
    console.error('Erro ao adicionar usuário:', err);
    res.status(500).send('Erro ao adicionar usuário');
  }
});

// CHAMADO PARA ATUALIZAR SENHA DE USUARIO
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

// CHAMADO PARA EXCLUIR USUARIOS
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

// CHAMADO PARA MOSTRAR AS VENDAS FATURADAS DO USUARIO
app.get('/minhasvendas', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;
  const idLogado = req.cookies.id_logado;

  const queryVendas = `
    SELECT *
    FROM microwork.vendas_motos
    WHERE id_microwork = ?
    ORDER BY data_venda DESC
  `;

  const queryPontos = `
    SELECT pontos
    FROM ranking_pontos
    WHERE id_microwork = ?
  `;

  // Executa as duas consultas em paralelo
  Promise.all([
    new Promise((resolve, reject) => {
      connection.query(queryVendas, [idLogado], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    }),
    new Promise((resolve, reject) => {
      connection.query(queryPontos, [idLogado], (err, results) => {
        if (err) return reject(err);
        resolve(results[0] ? results[0].pontos : 0); // Se não tiver resultado, retorna 0
      });
    })
  ])
    .then(([vendas, pontos]) => {
      res.render('minhasvendas', {
        usuario: usuarioLogado,
        grupo: grupoLogado,
        id: idLogado,
        vendas: vendas,
        pontos: pontos
      });
    })
    .catch(err => {
      console.error('Erro ao buscar dados:', err);
      res.status(500).send('Erro ao buscar dados');
    });
});

// CHAMADO PARA O MEU RANK DE MOTOS POR PONTO
app.get('/rankmotos', async (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;

  try {
    const [rankingGeral] = await connection.promise().query(`
      SELECT 
        filial,
        vendedor,
        pontos AS val_pontos,
        vendas AS val_vendas,
        llo AS val_lucro,
        captacao AS val_captacao,
        contrato AS val_contratos,
        retorno AS val_retorno,
        nps AS nota_oficial
      FROM ranking_pontos
      ORDER BY pontos DESC
    `);

    // Aqui tratamos o nome
    rankingGeral.forEach(item => {
      const nomes = item.vendedor.split(' ');
      if (nomes.length > 1) {
        item.vendedor = `${nomes[0]} ${nomes[nomes.length - 1]}`;
      }
    });

    const [ultimaAtualizacaoRows] = await connection.promise().query(`
      SELECT MAX(atualizado_em) AS ultimaAtualizacao FROM ranking_pontos
    `);

    const ultimaAtualizacao = ultimaAtualizacaoRows[0].ultimaAtualizacao || new Date();

    const meses = [
      'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];
    const mesAtual = meses[new Date().getMonth()];
    const anoAtual = new Date().getFullYear();

    res.render('rankvendasmotos', {
      usuario: usuarioLogado,
      rankingGeral,
      ultimaAtualizacao,
      mesAtual,
      anoAtual
    });

  } catch (error) {
    console.error("Erro ao buscar ranking de motos:", error);
    res.status(500).send("Erro ao carregar o ranking.");
  }
});

// CHAMADO PARA CADA KPI NA PAGINA REUMO MêS
app.get('/resumomotos', async (req, res) => {
  try {
    const usuarioLogado = req.cookies.usuario_logado;
    const idLogado = req.cookies.id_logado;

    if (!usuarioLogado) {
      console.log('Usuário não logado, redirecionando...');
      return res.redirect('/');
    }

    // IDs dos representantes a serem excluídos
    const representante = new Set([
      7808,  // 53.562.394 HUDSON SANTOS DE LIMA
      63703, // 53.338.753 KEDMA NASCIMENTO MORAES
      55641, // JANDERSON MOCAMBIQUE DE SOUZA
      69987, // 47.551.394 JULIANA DA COSTA BEZERRA 
      64650, // 53.017.883 LUCIDALVA GARCIA DE SOUZA
      78357, // 53.376.541 MATHEUS SILVA DE SOUZA
      65986, // A C DE ALMEIDA
      67901, // C J T SIMAO TRANSPORTE POR NAVEGACAO FLUVIAL LTDA
      49623, // K. S. S. CARDOSO
      78848, // L. C. M. DOS SANTOS
      68098, // M A P ANGELIN CORPORATE LTDA
      55705, // ODUÉNAVI DE MELO RIBEIRO PEREIRA
      22062, // MOTO AMIL EIRELLI-ME
      78420, // 60.618.200 SHIRLENE PINHO DE SOUZA
      46429, // FRANSUILDO DOS SANTOS SILVA
      63736, // LUCIANO LINQUEO LESSE DOS SANTOS
      78300, // 51.223.800 EDNALDO PEREIRA DO VALE
    ]);

    // Coleta os nomes dos representantes para filtro por nome
    const [vendedoresBloqueadosRows] = await connection.promise().query(`
      SELECT DISTINCT vendedor FROM microwork.vendas_motos
      WHERE id_microwork IN (${[...representante].join(',')})
    `);
    const vendedoresBloqueados = new Set(
      vendedoresBloqueadosRows.map(v => v.vendedor.trim().toLowerCase())
    );

    // Funções de filtro
    const filterReprePorID = lista => lista.filter(v => !representante.has(v.id_microwork));
    const filterReprePorNome = lista => lista.filter(v => !vendedoresBloqueados.has(v.vendedor.trim().toLowerCase()));

    const formatarNome = nome => {
      const nomeLimpo = nome.replace(/[^\p{L}\s]/gu, '').trim();
      const partes = nomeLimpo.split(' ');
      const primeiroNome = partes[0];
      const sobrenome = partes[partes.length - 1];
      return (
        primeiroNome.charAt(0).toUpperCase() + primeiroNome.slice(1).toLowerCase()
      ) + ' ' + (
          sobrenome.charAt(0).toUpperCase() + sobrenome.slice(1).toLowerCase()
        );
    };

    // Coleta dos dados
    const [rankVolume] = await connection.promise().query(`
      SELECT id_microwork, vendedor, SUM(quantidade) AS total_vendas
      FROM microwork.vendas_motos
      GROUP BY id_microwork, vendedor
      ORDER BY total_vendas DESC;
    `);

    const [rankLLO] = await connection.promise().query(`
      SELECT 
      vendedor,
      ROUND(SUM(lucro_ope) / SUM(valor_venda_real) * 100, 2) AS percentual_lucro
      FROM microwork.vendas_motos
      GROUP BY vendedor
      ORDER BY percentual_lucro DESC;
`);


    const [rankCaptacao] = await connection.promise().query(`
      SELECT 
      TRIM(vendedor) AS vendedor,
      COUNT(*) AS totalCaptado
      FROM microwork.captacao_motos
      GROUP BY vendedor
      ORDER BY totalCaptado DESC;
    `);

    const [rankContrato] = await connection.promise().query(`
      SELECT 
      TRIM(vendedor) AS vendedor,
      COUNT(*) AS totalContratos
      FROM microwork.contratos_motos
      GROUP BY vendedor
      ORDER BY totalContratos DESC;
    `);

    const [rankRetorno] = await connection.promise().query(`
      SELECT 
      TRIM(vendedor) AS vendedor,
      SUM(CASE 
      WHEN quantidade = -1 THEN -1
      ELSE 1
      END) AS quantidadeRetorno
      FROM microwork.vendas_motos
      WHERE retorno_porcent >= 2
      GROUP BY vendedor
      ORDER BY quantidadeRetorno DESC;
`);


    const [rankNPS] = await connection.promise().query(`
      SELECT 
      TRIM(vendedores) AS vendedor,
      nota_oficial
      FROM nps
      ORDER BY nota_oficial DESC;
`);


    const [atualizacaoResult] = await connection.promise().query(`
      SELECT atualizado_em FROM updates WHERE id = 1
    `);

    const ultimaAtualizacao = atualizacaoResult.length ? atualizacaoResult[0].atualizado_em : null;

    // Aplica filtros e formata os nomes
    const rankingVolume = filterReprePorID(rankVolume).map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const rankingLLO = filterReprePorNome(rankLLO).map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const rankingCaptacao = filterReprePorNome(rankCaptacao).map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const rankingContratos = filterReprePorNome(rankContrato).map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const rankingRetornos = filterReprePorNome(rankRetorno).map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const rankingNPS = filterReprePorNome(rankNPS).map(v => {
      v.vendedor = formatarNome(v.vendedor);
      return v;
    });

    const dataAtual = new Date();
    const mesAtual = dataAtual.toLocaleString('pt-BR', { month: 'long' }).toLowerCase();

    const [dadosUsuario] = await connection.promise().query(`
      SELECT 
        SUM(quantidade) AS volume,
        SUM(lucro_ope) AS totalOpe,
        SUM(valor_venda_real) AS totalVendaReal
      FROM microwork.vendas_motos
      WHERE id_microwork = ?
    `, [idLogado]);

    const [retornos] = await connection.promise().query(`
      SELECT retorno_porcent 
      FROM microwork.vendas_motos 
      WHERE id_microwork = ?
    `, [idLogado]);

    const listaRetornos = retornos.map(r => r.retorno_porcent);

    const dadosGrafico = dadosUsuario.length ? {
      ...dadosUsuario[0],
      listaRetornos,
      quantidadeRetorno: listaRetornos.filter(v => v !== null && parseFloat(v) >= 2).length
    } : {
      volume: 0,
      totalOpe: 0,
      totalVendaReal: 0,
      listaRetornos: [],
      quantidadeRetorno: 0
    };

    const [contagemcaptacao] = await connection.promise().query(`
      SELECT COUNT(*) AS totalCaptado
      FROM microwork.captacao_motos
      WHERE CAST(SUBSTRING_INDEX(TRIM(vendedor), ' ', 1) AS UNSIGNED) = ?
    `, [idLogado]);

    const totalCaptado = contagemcaptacao[0]?.totalCaptado || 0;

    const [vendedorResult] = await connection.promise().query(`
      SELECT vendedor
      FROM microwork.vendas_motos
      WHERE id_microwork = ?
      LIMIT 1
    `, [idLogado]);

    const nomeVendedor = vendedorResult.length ? vendedorResult[0].vendedor.trim() : null;

    let totalContratos = 0;
    if (nomeVendedor) {
      const [contagemContratos] = await connection.promise().query(`
        SELECT COUNT(*) AS totalContratos
        FROM microwork.contratos_motos
        WHERE vendedor = ?
      `, [nomeVendedor]);

      totalContratos = contagemContratos[0]?.totalContratos || 0;
    }

    res.render('resumomotos', {
      usuario: usuarioLogado,
      rankingVolume,
      rankingLLO,
      rankingCaptacao,
      rankingContratos,
      rankingRetornos,
      rankingNPS,
      mesAtual,
      ultimaAtualizacao,
      dadosGrafico,
      totalCaptado,
      totalContratos
    });

  } catch (err) {
    console.error('Erro no servidor:', err);
    res.status(500).send("Erro ao gerar ranking.");
  }
});

// PAGINA ONDE FAZ O UPLOAD DAS INFORMAÇÕES DE NPS -> GABRIEL
app.get('/nps', async (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;

  if (!usuarioLogado) {
    return res.redirect('/');
  }

  try {
    const [dadosNPS] = await connection.promise().query('SELECT * FROM nps');

    res.render('nps', {
      usuario: usuarioLogado,
      grupo: grupoLogado,
      npsData: dadosNPS
    });

  } catch (error) {
    console.error('Erro ao buscar dados NPS:', error);
    res.status(500).send('Erro interno ao buscar dados do NPS.');
  }
});

// CHAMADO PARA A PAGINA DE CALCULO DE MOTOS
app.get('/motos', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;
  if (!usuarioLogado) {
    return res.redirect('/');
  }

  const valorMesAtual = obterValorMesAtual();

  res.render('motos', {
    usuario: usuarioLogado,
    grupo: grupoLogado,
    formasPagamentos,
    bancos,
    filiais,
    bancoRetorno,
    taxas,
    valorMesAtual
  });
});

// CHAMADO PARA A PAGINA DE CALCULO NAUTICO
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

// CHAMADO PARA O CALCULO DE TAXAS DE CARTÃO DE CRÉDITO
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

// CHAMADO PARA SALVAR O BANCO DE DADOS A SIMULAÇÃO DA VENDA DE MOTOS
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

// CHAMADO PARA VISUALIZAR OS MODELOS DISPONÍVEIS
app.get('/api/motos/modelos-motos-disponiveis', async (req, res) => {
  try {
    const [rows] = await connection.promise().query(`
    SELECT DISTINCT modelo FROM microwork.estoque_motos
    ORDER BY modelo ASC`);

    const modelos = rows.map(row => row.modelo);

    res.json(modelos);
  } catch (err) {
    console.error('Erro ao buscar modelos disponíveis:', err);
    res.status(500).json({ error: 'Erro ao buscar modelos' });
  }
});

// CHAMADO PARA VISUALIZAR AS MOTOS DOS MODELOS DISPONIVEIS
app.get('/api/motos/chassis-por-modelo', async (req, res) => {
  const modeloSelecionado = req.query.modelo;

  if (!modeloSelecionado) {
    return res.status(400).json({ error: 'Modelo não fornecido' });
  }

  try {
    const [rows] = await connection.promise().query(
      `SELECT DISTINCT chassi, cor, patio, ano, dias_estoque FROM microwork.estoque_motos 
      WHERE situacao_reserva IS NULL AND modelo LIKE ?`,
      [`%${modeloSelecionado.trim()}%`]
    );

    res.json(rows);  // Envia os dados completos para o front-end
  } catch (err) {
    console.error('Erro ao buscar chassis:', err);
    res.status(500).json({ error: 'Erro ao buscar chassis' });
  }
});

// CHAMADO PARA ADICIONAR NO CALCULO O CUSTO CONTABIL E O CHASSI
app.get('/api/motos/detalhes-chassi', async (req, res) => {
  const chassi = req.query.chassi;

  if (!chassi) {
    return res.status(400).json({ error: 'Chassi não fornecido' });
  }

  try {
    const [rows] = await connection.promise().query(
      `SELECT custo_contabil, chassi 
       FROM microwork.estoque_motos 
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

// CHAMADO PARA SALVAR O BANCO DE DADOS A SIMULAÇÃO DA VENDA DE MOTORES
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

// CHAMADO PARA VISUALIZAR OS MODELOS DISPONÍVEIS
app.get('/api/nautica/modelos-motores-disponiveis', async (req, res) => {
  try {
    const [rows] = await connection.promise().query(`
      SELECT DISTINCT modelo FROM microwork.estoque_motores
      WHERE situacao IN ('loja', 'em demonstração', 'trânsito') AND modelo IS NOT NULL
      ORDER BY modelo ASC
    `);

    const modelos = rows.map(row => row.modelo);

    res.json(modelos);
  } catch (err) {
    console.error('Erro ao buscar modelos disponíveis:', err);
    res.status(500).json({ error: 'Erro ao buscar modelos' });
  }
});

// CHAMADO PARA VISUALIZAR OS MOTORES DOS MODELOS DISPONIVEIS
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
      `SELECT DISTINCT chassi, cor, patio, dias_estoque FROM microwork.estoque_motores 
      WHERE situacao IN ('loja', 'em demonstração', 'trânsito') AND modelo LIKE ?`,
      [`%${termo}%`]
    );

    res.json(rows);  // Envia os dados completos para o front-end
  } catch (err) {
    console.error('Erro ao buscar chassis:', err);
    res.status(500).json({ error: 'Erro ao buscar chassis' });
  }
});

// CHAMADO PARA ADICIONAR NO CALCULO O CUSTO CONTABIL, ICMS E O CHASSI
app.get('/api/nautica/detalhes-chassi', async (req, res) => {
  const chassi = req.query.chassi;

  if (!chassi) {
    return res.status(400).json({ error: 'Chassi não fornecido' });
  }

  try {
    const [rows] = await connection.promise().query(
      `SELECT custo_contabil, icms_compra, chassi 
       FROM microwork.estoque_motores 
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

// LOGOUT
app.get('/logout', (req, res) => {
  res.clearCookie('usuario_logado').redirect('/');
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

