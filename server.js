// CONFIGURAÇÕES INICIAIS
require('dotenv').config();

//PACOTES EXTERNOS
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const bcrypt = require('bcrypt');
const ExcelJS = require('exceljs');


// SERVIÇOS INTERNOS
const connection = require('./services/db');
const taxas = require('./services/taxa');
const emplacamento = require('./services/emplacamento');
const app = express();
const PORT = 8080;

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

const rotaNPS = require('./routes/nps_geral');
app.use('/nps', rotaNPS);
const rotaMercado = require('./routes/mercado');
app.use('/', rotaMercado);

// CONFIGURAÇÃO DE GERAL DE VENDAS RANK - RESUMO E MINHAS VENDAS
const referenteMes = '2025-09';

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
  "Yamaha", "Pan", "Santander", "Bradesco", "C6 Bank", "Banco BV"
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

// LOGOUT
app.get('/logout', (req, res) => {
  res.clearCookie('usuario_logado').redirect('/');
});

// CHAMADO PARA TELA DE SEGMENTOS, APÓS O LOGIN
app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const [rows] = await connection.query('SELECT * FROM usuarios WHERE email = ?', [login]);

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
    res.cookie('empresa_logado', usuario.empresa);
    res.redirect('/segmentos');
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).send('ERRO DE CONEXÃO AO BANCO - ACIONE O SUPORTE IMEDIATAMENTE');
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

// CHAMADO PARA PAGINA DE CADASTRO DE USUARIOS (APENAS PARA ADMIN)
app.get('/usuarios', async (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;

  if (!usuarioLogado || grupoLogado != 'admin') {
    return res.redirect('/');
  }

  try {
    const [usuarios] = await connection.query('SELECT nome, id_microwork, email, grupo FROM usuarios ORDER BY grupo');

    res.render('usuarios', {
      usuarios,
      usuario: usuarioLogado
    });
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).send('Erro ao buscar usuários');
  }
});

// CHAMADO PARA AS MOTOS RESERVADAS
app.get('/reservasmotos', async (req, res) => {
  try {
    const [rows] = await connection.query(`
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

// CHAMADO PARA JOGAR PARA PAGINA DE MERCADO
app.get('/mercado', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;
  let { success, inseridos } = req.query;

  if (!usuarioLogado) {
    return res.redirect('/');
  }

  // Só define se realmente vieram na query
  success = (typeof success !== 'undefined' && success !== '') ? success : undefined;
  inseridos = (typeof inseridos !== 'undefined' && inseridos !== '') ? inseridos : undefined;

  res.render('mercado', {
    success,
    inseridos,
    usuario: usuarioLogado,
    grupo: grupoLogado,

  });
});

// CHAMADO PARA O BOTÃO DE ADICIONAR USUÁRIO
app.post('/usuarios/adicionar', async (req, res) => {
  console.log(req.body);

  const { grupo, empresa, nome, id_microwork, email, senha } = req.body;
  try {
    const senhaCriptografada = await bcrypt.hash(senha, 10); // 10 é o número de salt rounds
    const sql = 'INSERT INTO usuarios (grupo,empresa, nome, id_microwork, email, senha) VALUES (?, ?, ?, ?, ?, ?)';
    await connection.execute(sql, [grupo, empresa, nome, id_microwork, email, senhaCriptografada]);
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
    await connection.query(sql, [senhaCriptografada, email]);

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
    await connection.query('DELETE FROM usuarios WHERE email = ?', [email]);
    res.redirect('/usuarios');
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).send('Erro interno');
  }
});

// CHAMADO PARA MOSTRAR AS VENDAS FATURADAS DO USUARIO
app.get('/minhasvendas', async (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;
  const idLogado = req.cookies.id_logado;

  if (!usuarioLogado || !idLogado) {
    return res.redirect('/');
  }

  const queryVendas = `
    SELECT * FROM (
      SELECT 
        id_microwork,
        valor_venda_real,
        lucro_ope,
        data_venda,
        quantidade,
        modelo,
        chassi,
        cor
      FROM microwork.vendas_motos
      WHERE id_microwork = ?
        AND DATE_FORMAT(data_venda, '%Y-%m') = ?

      UNION ALL

      SELECT 
        id_microwork,
        valor_venda_real,
        lucro_ope,
        data_venda,
        quantidade,
        modelo,
        chassi,
        cor
      FROM microwork.vendas_seminovas
      WHERE id_microwork = ?
        AND DATE_FORMAT(data_venda, '%Y-%m') = ?
    ) AS vendas_unificadas
    ORDER BY data_venda DESC
  `;

  const queryPontos = `
    SELECT pontos
    FROM ranking_pontos
    WHERE id_microwork = ?
  `;

  try {
    const [vendas] = await connection.query(queryVendas, [
      idLogado, referenteMes, idLogado, referenteMes
    ]);

    const [pontosResult] = await connection.query(queryPontos, [idLogado]);
    const pontos = pontosResult.length > 0 ? pontosResult[0].pontos : 0;

    res.render('minhasvendas', {
      usuario: usuarioLogado,
      grupo: grupoLogado,
      id: idLogado,
      vendas,
      pontos
    });
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    res.status(500).send('Erro ao buscar dados');
  }
});

// CHAMADO PARA O RANK DE MOTOS - rota de BONUS QUE APARECE NO FRONT
app.get('/rankmotos', async (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;

  if (!usuarioLogado) {
    return res.redirect('/');
  }

  try {
    // 1. Consulta as vendas de 29, 30 e 31 de julho nas duas tabelas
    // const [bonusVendas] = await connection.query(`
    //   SELECT id_microwork, COUNT(*) AS qtd_bonus
    //   FROM (
    //     SELECT id_microwork, data_venda
    //     FROM microwork.vendas_motos
    //     WHERE DAY(data_venda) IN (29, 30, 31) AND MONTH(data_venda) = 7 AND YEAR(data_venda) = 2025
    //     UNION ALL
    //     SELECT id_microwork, data_venda
    //     FROM microwork.vendas_seminovas
    //     WHERE DAY(data_venda) IN (29, 30, 31) AND MONTH(data_venda) = 7 AND YEAR(data_venda) = 2025
    //   ) AS todas_vendas
    //   GROUP BY id_microwork
    // `);

    // 2. Consulta o ranking original
    const [rankingGeral] = await connection.query(`
      SELECT 
        id_microwork,
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
      ORDER BY pontos DESC, vendas DESC, llo DESC
    `);

    // 3. Aplica os bônus de +50 pontos por venda especial MUDAR O VALOR DA CAMPANHA BONUS
    // const bonusMap = new Map();
    // bonusVendas.forEach(row => {
    //   bonusMap.set(row.id_microwork, row.qtd_bonus * 50);
    // });

    // ➕ AQUI ENTRA A PARTE QUE ADICIONA OS BÔNUS AO RANKING:
    rankingGeral.forEach(item => {
      // const bonus = bonusMap.get(item.id_microwork) || 0;
      // item.pontos_extras = bonus; // novo campo com os bônus


      // Formata o nome do vendedor
      const nomes = item.vendedor.split(' ');
      if (nomes.length > 1) {
        item.vendedor = `${nomes[0]} ${nomes[nomes.length - 1]}`;
      }
    });


    const [ultimaAtualizacaoRows] = await connection.query(`
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
      78080,  // 53.562.394 HUDSON SANTOS DE LIMA
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
    const [vendedoresBloqueadosRows] = await connection.query(`
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
    const [rankVolume] = await connection.query(`
      SELECT 
        id_microwork, 
        vendedor, 
        SUM(quantidade) AS total_vendas
      FROM (
        SELECT id_microwork, vendedor, quantidade, data_venda 
        FROM microwork.vendas_motos
        WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?

        UNION ALL

        SELECT id_microwork, vendedor, quantidade, data_venda 
        FROM microwork.vendas_seminovas
        WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
      ) AS todas_vendas
      GROUP BY id_microwork, vendedor
      ORDER BY total_vendas DESC
    `, [referenteMes, referenteMes]);


    const [rankLLO] = await connection.query(`
      SELECT 
        vendedor,
        ROUND(SUM(lucro_ope) / SUM(valor_venda_real) * 100, 2) AS percentual_lucro
      FROM (
        SELECT vendedor, lucro_ope, valor_venda_real
        FROM microwork.vendas_motos
        WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?

        UNION ALL

        SELECT vendedor, lucro_ope, valor_venda_real
        FROM microwork.vendas_seminovas
        WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
      ) AS todas_vendas
      GROUP BY vendedor
      ORDER BY percentual_lucro DESC;
    `, [referenteMes, referenteMes]);


    const [rankCaptacao] = await connection.query(`
      SELECT 
        TRIM(vendedor) AS vendedor,
        COUNT(*) AS totalCaptado
      FROM microwork.captacao_motos
      WHERE DATE_FORMAT(data_conclusao, '%Y-%m') = ?
      GROUP BY vendedor
      ORDER BY totalCaptado DESC;
    `, [referenteMes]);


    const [rankContrato] = await connection.query(`
      SELECT 
        TRIM(vendedor) AS vendedor,
        COUNT(*) AS totalContratos
      FROM microwork.contratos_motos
      WHERE DATE_FORMAT(data_venda, '%Y-%m') = ?
      GROUP BY vendedor
      ORDER BY totalContratos DESC;
    `, [referenteMes]);

    const [rankRetorno] = await connection.query(`
      SELECT 
        TRIM(vendedor) AS vendedor,
        SUM(
          CASE 
            WHEN quantidade = -1 THEN -1
            ELSE 1
          END
        ) AS quantidadeRetorno
      FROM (
        SELECT vendedor, quantidade, retorno_porcent
        FROM microwork.vendas_motos
        WHERE retorno_porcent >= 2
          AND DATE_FORMAT(data_venda, '%Y-%m') = ?

        UNION ALL

        SELECT vendedor, quantidade, retorno_porcent
        FROM microwork.vendas_seminovas
        WHERE retorno_porcent >= 2
          AND DATE_FORMAT(data_venda, '%Y-%m') = ?
      ) AS todas_vendas
      GROUP BY vendedor
      ORDER BY quantidadeRetorno DESC;
    `, [referenteMes, referenteMes]);




    const [rankNPS] = await connection.query(`
      SELECT 
      TRIM(vendedores) AS vendedor,
      nota_oficial
      FROM nps
      ORDER BY nota_oficial DESC;
    `);


    const [atualizacaoResult] = await connection.query(`
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

    const [dadosUsuario] = await connection.query(`
      SELECT 
        SUM(quantidade) AS volume,
        SUM(lucro_ope) AS totalOpe,
        SUM(valor_venda_real) AS totalVendaReal
      FROM microwork.vendas_motos
      WHERE id_microwork = ?
        AND DATE_FORMAT(data_venda, '%Y-%m') = ?
    `, [idLogado, referenteMes]);


    const [retornos] = await connection.query(`
      SELECT retorno_porcent 
      FROM microwork.vendas_motos 
      WHERE id_microwork = ?
        AND DATE_FORMAT(data_venda, '%Y-%m') = ?
    `, [idLogado, referenteMes]);

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

    const [contagemcaptacao] = await connection.query(`
      SELECT COUNT(*) AS totalCaptado
      FROM microwork.captacao_motos
      WHERE CAST(SUBSTRING_INDEX(TRIM(vendedor), ' ', 1) AS UNSIGNED) = ?
    `, [idLogado]);

    const totalCaptado = contagemcaptacao[0]?.totalCaptado || 0;

    const [vendedorResult] = await connection.query(`
      SELECT vendedor
      FROM microwork.vendas_motos
      WHERE id_microwork = ?
      LIMIT 1
    `, [idLogado]);

    const nomeVendedor = vendedorResult.length ? vendedorResult[0].vendedor.trim() : null;

    let totalContratos = 0;
    if (nomeVendedor) {
      const [contagemContratos] = await connection.query(`
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
    const [dadosNPS] = await connection.query('SELECT * FROM nps_geral');

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

// CHAMADO PARA SEGMENTOS ASSIM QUE O USUARIO CLICAR NA LOGO
app.get('/rh', async (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;
  const idLogado = req.cookies.id_logado;

  const queryVendas = `
    SELECT 
      vm.*,
      vm.empresa,
      rp.vendedor AS nome_vendedor,
      CASE 
        WHEN vm.quantidade = 1 AND vm.lucro_ope * 0.085 < 0 THEN 0
        WHEN vm.quantidade = 0 AND vm.lucro_ope * 0.085 > 0 THEN 0
        WHEN vm.quantidade = -1 AND vm.lucro_ope * 0.085 > 0 THEN 0
        ELSE vm.lucro_ope * 0.085
      END AS comissao,
      CASE 
        WHEN vm.quantidade = 1 THEN 'Vendido'
        WHEN vm.quantidade = 0 OR vm.quantidade = -1 THEN 'Devolvida'
      END AS status
    FROM (
      SELECT empresa, id_microwork, modelo, chassi, vendedor, valor_venda, lucro_ope, quantidade, data_venda
      FROM microwork.vendas_motos
      WHERE YEAR(data_venda) = YEAR(CURDATE()) AND MONTH(data_venda) = MONTH(CURDATE())
      UNION ALL
      SELECT empresa, id_microwork, modelo, chassi, vendedor, lucro_ope, valor_venda, quantidade, data_venda
      FROM microwork.vendas_seminovas
      WHERE YEAR(data_venda) = YEAR(CURDATE()) AND MONTH(data_venda) = MONTH(CURDATE())
    ) vm
    LEFT JOIN ranking_pontos rp ON vm.id_microwork = rp.id_microwork
    ORDER BY vm.empresa ASC, rp.vendedor ASC, vm.data_venda DESC
  `;

  const queryPontos = `
    SELECT id_microwork, pontos, vendas, llo, captacao, contrato, retorno, NPS
    FROM ranking_pontos
  `;

  try {
    const [[vendas], [pontos]] = await Promise.all([
      connection.query(queryVendas),
      connection.query(queryPontos)
    ]);

    res.render('rh', {
      usuario: usuarioLogado,
      grupo: grupoLogado,
      id: idLogado,
      vendas,
      pontos
    });
  } catch (err) {
    console.error('Erro ao buscar dados:', err);
    res.status(500).send('Erro ao buscar dados');
  }
});

// CHAMADO PARA A PAGINA DE CALCULO DE MOTOS
app.get('/motos', (req, res) => {
  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;
  const idLogado = req.cookies.id_logado;
  const empresaLogado = req.cookies.empresa_logado;

  if (!usuarioLogado) {
    return res.redirect('/');
  }

  const valorMesAtual = obterValorMesAtual();

  res.render('motos', {
    usuario: usuarioLogado,
    grupo: grupoLogado,
    id: idLogado,
    empresa: empresaLogado,
    formasPagamentos,
    bancos,
    filiais,
    bancoRetorno,
    taxas,
    valorMesAtual
  });
});

// CHAMADO PARA O DIAPASSOR
app.get('/diapassor', async (req, res) => {

  const usuarioLogado = req.cookies.usuario_logado;
  const grupoLogado = req.cookies.grupo_logado;

  if (!usuarioLogado) {
    return res.redirect('/');
  }

  try {


    const [rows] = await connection.execute(`
  SELECT 
    s.empresa,
    s.nome_vendedor,
    s.id_microwork,
    COUNT(DISTINCT s.cpf_cnpj_cliente) AS total_simulacoes,
    COALESCE(v.total_vendas, 0) AS total_vendas,
    ROUND(
      COALESCE(v.total_vendas, 0) / COUNT(DISTINCT s.cpf_cnpj_cliente) * 100, 2
    ) AS percentual_exito
  FROM tropa_azul.simulacao_motos s
  LEFT JOIN (
    SELECT id_microwork, SUM(quantidade) AS total_vendas
    FROM microwork.vendas_motos
    WHERE data_venda BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND LAST_DAY(NOW())
    GROUP BY id_microwork
  ) v ON s.id_microwork = v.id_microwork
  WHERE s.criado_em BETWEEN DATE_FORMAT(NOW(), '%Y-%m-01') AND LAST_DAY(NOW())
  GROUP BY s.empresa, s.nome_vendedor, s.id_microwork, v.total_vendas
  ORDER BY percentual_exito DESC;
`);

    // Agrupar por empresa
    const empresasMap = {};
    rows.forEach(row => {
      if (!empresasMap[row.empresa]) {
        empresasMap[row.empresa] = [];
      }
      empresasMap[row.empresa].push({
        nome_vendedor: row.nome_vendedor,
        total_simulacoes: row.total_simulacoes,
        total_vendas: row.total_vendas,
        percentual_exito: row.percentual_exito
      });
    });

    const empresas = Object.keys(empresasMap).map(nome => ({
      nome,
      vendedores: empresasMap[nome]
    }));

    // Renderiza a view
    res.render('diapassor', {
      usuario: usuarioLogado,
      grupo: grupoLogado,
      empresas
    });

  } catch (error) {
    console.error('Erro ao buscar simulações:', error);
    res.status(500).send('Erro ao buscar dados de simulação.');
  }
});

// CHAMADO PARA VERIFICAR SE O CPF OU CNPJ CONSTA NOBANCO DE DADOS DE BLOCK
app.get('/verificar-cpf', async (req, res) => {
  const cpf = req.query.cpf;

  if (!cpf) {
    return res.status(400).json({ erro: 'CPF/CNPJ não informado' });
  }

  try {
    const [rows] = await connection.query(
      'SELECT 1 FROM tropa_azul.block_cpf_cnpj WHERE cpf_cnpj = ? LIMIT 1',
      [cpf]
    );

    if (rows.length > 0) {
      return res.json({ bloqueado: true });
    } else {
      return res.json({ bloqueado: false });
    }
  } catch (err) {
    console.error('Erro ao consultar CPF:', err);
    res.status(500).json({ erro: 'Erro no servidor' });
  }
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
app.post('/venda_moto', async (req, res) => {
  const {
    empresa, id_microwork, nome_vendedor, nome_cliente, cpf_cnpj_cliente, moto_selecionada, forma_pagamento,
    banco_selecionado, retorno_selecionado, valor_bem, valor_venda_real, custo_moto,
    margem_bruta, emplacamento_receita, frete_receita, acessorio, valor_retorno, emplacamento_custo,
    frete_custo, taxa_cartao, brinde, despesa_operacionais, total_despesas, total_receitas,
    margem_liquida, comissao
  } = req.body;

  if (!nome_vendedor || !nome_cliente || !cpf_cnpj_cliente || !moto_selecionada) {
    return res.status(400).send('Todos os campos são obrigatórios');
  }

  const query = `
    INSERT INTO simulacao_motos (
      empresa, id_microwork, nome_vendedor, nome_cliente, cpf_cnpj_cliente, moto_selecionada, forma_pagamento, 
      banco_selecionado, retorno_selecionado, valor_bem, valor_venda_real, custo_moto, 
      margem_bruta, emplacamento_receita, frete_receita, acessorio, valor_retorno, emplacamento_custo, 
      frete_custo, taxa_cartao, brinde, despesa_operacionais, total_despesas, total_receitas, 
      margem_liquida, comissao
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    empresa, id_microwork, nome_vendedor, nome_cliente, cpf_cnpj_cliente, moto_selecionada, forma_pagamento,
    banco_selecionado, retorno_selecionado, valor_bem, valor_venda_real, custo_moto,
    margem_bruta, emplacamento_receita, frete_receita, acessorio, valor_retorno, emplacamento_custo,
    frete_custo, taxa_cartao, brinde, despesa_operacionais, total_despesas, total_receitas,
    margem_liquida, comissao
  ];

  try {
    await connection.query(query, values);
    res.send('Simulação Realizada com Sucesso!');
  } catch (err) {
    console.error('Erro ao inserir dados:', err);
    res.status(500).send('Erro ao registrar a venda');
  }
});

// CHAMADO PARA VISUALIZAR OS MODELOS DISPONÍVEIS
app.get('/api/motos/modelos-motos-disponiveis', async (req, res) => {
  try {
    const [rows] = await connection.query(`
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
    const [rows] = await connection.query(
      `SELECT DISTINCT 
          chassi, 
          cor, 
          patio, 
          ano, 
          dias_estoque,
          CASE 
            WHEN situacao_reserva = 'Ativa' THEN 'RESERVADO'
            ELSE ''
          END AS status_reserva
       FROM microwork.estoque_motos 
       WHERE modelo LIKE ?
       ORDER BY patio DESC`,
      [`%${modeloSelecionado.trim()}%`]
    );

    res.json(rows);  // Envia os dados com status_reserva para o front-end
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
    const [rows] = await connection.query(
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
    const [rows] = await connection.query(`
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
    const [rows] = await connection.query(
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
    const [rows] = await connection.query(
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

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/download-excel', async (req, res) => {

  function formatarReal(valor) {
    if (valor === null || valor === undefined) return '';
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const [ano, mes] = referenteMes.split('-').map(Number);

  const queryVendas = `
      SELECT 
        vm.*,
        vm.empresa,
        rp.vendedor AS nome_vendedor,
        CASE 
          WHEN vm.quantidade = 1 AND vm.lucro_ope * 0.085 < 0 THEN 0
          WHEN vm.quantidade = 0 AND vm.lucro_ope * 0.085 > 0 THEN 0
          WHEN vm.quantidade = -1 AND vm.lucro_ope * 0.085 > 0 THEN 0
          ELSE vm.lucro_ope * 0.085
        END AS comissao,
        CASE 
          WHEN vm.quantidade = 1 THEN 'Vendido'
          WHEN vm.quantidade = 0 OR vm.quantidade = -1 THEN 'Devolvida'
        END AS status
      FROM (
        SELECT 
          empresa, id_microwork, vendedor, cpf_cnpj, modelo, chassi, valor_venda, lucro_ope, quantidade, data_venda
        FROM microwork.vendas_motos
        WHERE YEAR(data_venda) = ${ano} AND MONTH(data_venda) = ${mes}

        UNION ALL

        SELECT 
          empresa, id_microwork, vendedor, cpf_cnpj, modelo, chassi, valor_venda, lucro_ope, quantidade, data_venda
        FROM microwork.vendas_seminovas
        WHERE YEAR(data_venda) = ${ano} AND MONTH(data_venda) = ${mes}
      ) vm
      LEFT JOIN ranking_pontos rp ON vm.id_microwork = rp.id_microwork
      ORDER BY vm.empresa ASC, rp.vendedor ASC, vm.data_venda DESC
    `;




  const queryPontos = `
    SELECT id_microwork, pontos, vendas, llo, captacao, contrato, retorno, NPS
    FROM ranking_pontos
  `;

  try {
    const [vendas] = await connection.query(queryVendas);
    const [pontos] = await connection.query(queryPontos);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Vendas');

    worksheet.columns = [
      { header: 'Filial', key: 'empresa', width: 5 },
      { header: 'ID', key: 'id_microwork', width: 7 },
      { header: 'Vendedor', key: 'nome_vendedor', width: 47 },
      { header: 'cpf_cnpj', key: 'cpf_cnpj', width: 18 },
      { header: 'Status', key: 'status', width: 9 },
      { header: 'Modelo', key: 'modelo', width: 30 },
      { header: 'Chassi', key: 'chassi', width: 20 },
      { header: 'Data da Venda', key: 'data_venda', width: 15 },
      { header: 'Valor', key: 'valor_venda', width: 12 },
      { header: 'Lucro Op.', key: 'lucro_ope', width: 12 },
      { header: 'Comissão', key: 'comissao', width: 12 },
      { header: 'Pontos', key: 'pontos', width: 8 },
      { header: 'Vendas', key: 'vendas', width: 8 },
      { header: 'LLO', key: 'llo', width: 8 },
      { header: 'Captação', key: 'captacao', width: 9 },
      { header: 'Contrato', key: 'contrato', width: 9 },
      { header: 'Retorno', key: 'retorno', width: 8 },
      { header: 'NPS', key: 'NPS', width: 5 },
      { header: '', key: 'L', width: 68 }, // Coluna L
      { header: '', key: 'M', width: 15 }, // Coluna M
      { header: '', key: 'N', width: 22 }, // Coluna N
      { header: '', key: 'O', width: 22 }  // Coluna O
    ];

    const pontosPorId = {};
    pontos.forEach(p => pontosPorId[p.id_microwork] = p);

    // Agrupar vendas por vendedor
    let vendasPorVendedor = {};
    vendas.forEach(venda => {
      if ((venda.nome_vendedor || 'NÃO IDENTIFICADO') === 'NÃO IDENTIFICADO') return;
      if (!vendasPorVendedor[venda.nome_vendedor]) vendasPorVendedor[venda.nome_vendedor] = [];
      vendasPorVendedor[venda.nome_vendedor].push(venda);
    });

    Object.keys(vendasPorVendedor).forEach(nome_vendedor => {
      const vendasVendedor = vendasPorVendedor[nome_vendedor];
      let somaComissao = 0;
      vendasVendedor.forEach(venda => {
        somaComissao += Number(venda.comissao) || 0;
        const pontoInfo = pontosPorId[venda.id_microwork] || {};
        worksheet.addRow({
          empresa: venda.empresa || 'NÃO IDENTIFICADA',
          id_microwork: venda.id_microwork,
          nome_vendedor: venda.nome_vendedor,
          cpf_cnpj: venda.cpf_cnpj,
          status: venda.status,
          modelo: venda.modelo,
          chassi: venda.chassi,
          data_venda: venda.data_venda ? new Date(venda.data_venda).toLocaleDateString() : '',
          valor_venda: formatarReal(venda.valor_venda),
          lucro_ope: formatarReal(venda.lucro_ope),
          comissao: formatarReal(venda.comissao),
          pontos: pontoInfo.pontos || 0,
          vendas: pontoInfo.vendas || 0,
          llo: pontoInfo.llo || 0,
          captacao: pontoInfo.captacao || 0,
          contrato: pontoInfo.contrato || 0,
          retorno: pontoInfo.retorno || 0,
          NPS: pontoInfo.NPS || 0
        });
      });
      // Linha de totalizador a partir da coluna L
      const pontoInfoTotal = pontosPorId[vendasVendedor[0].id_microwork] || {};
      worksheet.addRow({
        empresa: '',
        id_microwork: '',
        nome_vendedor: '',
        cpf_cnpj: '',
        status: '',
        modelo: '',
        chassi: '',
        data_venda: '',
        valor_venda: '',
        lucro_ope: '',
        comissao: '',
        pontos: '',
        vendas: '',
        llo: '',
        captacao: '',
        contrato: '',
        retorno: '',
        NPS: '',
        L: 'TOTAL DO VENDEDOR: ' + nome_vendedor,
        M: 'PONTOS: ' + (pontoInfoTotal.pontos || 0),
        N: 'COMISSÃO: ' + formatarReal(somaComissao),
        O: 'TOTAL: ' + formatarReal(somaComissao + (pontoInfoTotal.pontos || 0))
      });
      // Linha em branco para separar
      worksheet.addRow({});
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="vendas.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Erro ao gerar Excel:', err);
    res.status(500).send('Erro ao gerar Excel');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

