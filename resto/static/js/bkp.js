function verificarCamposCard1() {
  const filialSelecionada = document.getElementById('filialTipo').value.trim();
  console.log('Filial selecionada:', filialSelecionada);
  const motosYamaha = document.getElementById('motos_yamaha').value;
  const formaPagamento = document.getElementById('forma_pagameto').value.trim();
  const cliente = document.getElementById('cliente').value;
  const cpf = document.getElementById('cpf').value;
  const cpfValido = validarCPF(cpf);

  // Se a filial for escolhida, ativamos o Card 1
  if (filialSelecionada) {
    document.getElementById('card1').classList.remove('suspended');
    document.getElementById('card1').classList.add('active');
  } else {
    document.getElementById('card1').classList.add('suspended');
    document.getElementById('card1').classList.remove('active');
    document.getElementById('card2').classList.add('suspended');
    document.getElementById('card2').classList.remove('active');
    document.getElementById('card3').classList.add('suspended');
    document.getElementById('card3').classList.remove('active');
  }

  // Verificação dos campos
  if (filialSelecionada && motosYamaha && cliente && cpfValido && formaPagamento) {
    if (formaPagamento === "a_vista") {
      document.getElementById('card2').classList.add('suspended');
      document.getElementById('card2').classList.remove('active');
      habilitarCamposCard2e3(false);
      habilitarCamposCard3(true);
      document.getElementById('card3').classList.add('active');
    } else if (formaPagamento === "financiado") {
      habilitarCamposCard2e3(true);
    }

  } else {
    habilitarCamposCard2e3(false);
    document.getElementById('card2').classList.add('suspended');
    document.getElementById('card2').classList.remove('active');
    document.getElementById('card3').classList.add('suspended');
    document.getElementById('card3').classList.remove('active');
  }
}

// Atualização de eventos para verificar a escolha da filial
document.getElementById('filialTipo').addEventListener('change', verificarCamposCard1);

// Inicialização do Card 1, Card 2 e Card 3 com o estilo suspenso
document.getElementById('card1').classList.add('suspended');
document.getElementById('card2').classList.add('suspended');
document.getElementById('card3').classList.add('suspended');

function habilitarCamposCard2e3(habilitar) {
  const camposCard2 = document.querySelectorAll('#card2 input, #card2 select');
  const camposCard3 = document.querySelectorAll('#card3 input, #card3 select');
  const card2 = document.getElementById('card2');
  const card3 = document.getElementById('card3');

  if (habilitar) {
    document.getElementById('card3').classList.add('active');
    document.getElementById('card2').classList.add('active');
    card2.style.transform = "translateY(0)";
    card3.style.transform = "translateY(0)";
  } else {
    card2.classList.add('disabled');
    card3.classList.add('disabled');
    card2.style.transform = "translateY(40px)";
    card3.style.transform = "translateY(40px)";
  }

  camposCard2.forEach(campo => campo.disabled = !habilitar);
  camposCard3.forEach(campo => campo.disabled = !habilitar);
}

function habilitarCamposCard3(habilitar) {
  const camposCard3 = document.querySelectorAll('#card3 input, #card3 select');
  const card3 = document.getElementById('card3');

  if (habilitar) {
    card3.style.transform = "translateY(0)";
    camposCard3.forEach(campo => campo.disabled = false);
  } else {
    card3.style.transform = "translateY(40px)";
    camposCard3.forEach(campo => campo.disabled = true);
  }
}

function formatarCPF(campo) {
  let cpf = campo.value.replace(/[^\d]/g, '');

  if (cpf.length <= 3) {
    campo.value = cpf;
  } else if (cpf.length <= 6) {
    campo.value = cpf.substring(0, 3) + '.' + cpf.substring(3);
  } else if (cpf.length <= 9) {
    campo.value = cpf.substring(0, 3) + '.' + cpf.substring(3, 6) + '.' + cpf.substring(6);
  } else {
    campo.value = cpf.substring(0, 3) + '.' + cpf.substring(3, 6) + '.' + cpf.substring(6, 9) + '-' + cpf.substring(9, 11);
  }
}

function validarCPF(cpf) {
  cpf = cpf.replace(/[^\d]+/g, '');

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  var soma = 0;
  var resto;

  for (var i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpf.charAt(9))) {
    return false;
  }

  soma = 0;

  for (var i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpf.charAt(10))) {
    return false;
  }

  return true;
}

function verificarCPF() {
  const cpf = document.getElementById('cpf').value;
  validarCPF(cpf);
}

document.getElementById('motos_yamaha').addEventListener('change', verificarCamposCard1);
document.getElementById('cliente').addEventListener('input', verificarCamposCard1);
document.getElementById('cpf').addEventListener('input', formatarCPF);
document.getElementById('cpf').addEventListener('blur', function () {
  verificarCPF();
  verificarCamposCard1();
});
document.getElementById('forma_pagameto').addEventListener('change', verificarCamposCard1);

document.getElementById('showCard4Button').addEventListener('click', function () {
  // Pega os campos dos cards 2 e 3, excluindo os selects
  const camposCard = document.querySelectorAll('#card2 input:not([disabled]):not([type="select-one"]), #card3 input:not([disabled]):not([type="select-one"])');

  // Inicializa variáveis para armazenar os valores
  let precoNegociado = 0;
  let entradaBonificada = 0;
  let entradaReal = 0;
  let custoProduto = 0;
  let despesaFrete = 0;
  let retornoFrete = 0;



  // Itera sobre os campos e soma os valores
  camposCard.forEach(campo => {
    const valor = parseFloat(campo.value.replace('R$', '').replace(',', '.') || 0);

    // Identifica os campos para calcular o valor de venda real e simulação
    if (campo.id === 'preco_negociado') {
      precoNegociado = valor;
    } else if (campo.id === 'entrada_bonificada') {
      entradaBonificada = valor;
    } else if (campo.id === 'valor_entrada') {
      entradaReal = valor;
    } else if (campo.id === 'retorno_frete') {
      retornoFrete = valor;
    }
  });

  // Cálculos de "Valor de venda real" e "Simulação"
  const valorVendaReal = precoNegociado - entradaBonificada;
  const simulacao = precoNegociado - entradaBonificada - entradaReal;

  // Exibe o "Valor de venda real"
  document.getElementById('valor_venda_real').innerText = `Valor de venda real: ${'.'.repeat(80)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;

  // Exibe a "Simulação"
  document.getElementById('simulacao').innerText = `Simulação: ......................................................................................... R$ ${simulacao.toFixed(2).replace('.', ',')}`;

  // Exibe o card4
  document.getElementById('card4').style.display = 'block';  // Garante que o card4 será exibido

  // Agora, vamos colocar os outros eventos dentro do clique do botão:

  // Função para verificar se a filial está em Manaus
  var filialSelecionada = document.getElementById('filialTipo').value;
  var filiaisManaus = ["Cachoeirinha", "compensa", "cd_nova", "max_teixeira"];

  var motoSelecionada = $('#motos_yamaha').val(); // Pega o valor do select

  if (motoSelecionada) {
    // Faz a requisição para a rota Flask passando o nome da moto
    $.getJSON('/dados_moto/' + encodeURIComponent(motoSelecionada), function (data) {
      if (data.error) {
        alert(data.error);
      } else {
        // Verifica se a filial selecionada é de Manaus ou do Interior
        if (filiaisManaus.includes(filialSelecionada)) {
          // Exibe a mensagem e os dados de Manaus
          document.getElementById('mensagemFilial').innerText = `A filial ${filialSelecionada} está em Manaus.`;
          $('#card4').show(); // Exibe o card com os dados de Manaus
          $('#custo_produto').text(`${'.'.repeat(80)} R$ ${data.manaus_custo_produto.toFixed(2).replace('.', ',')}`);
          $('#pps').text(`${'.'.repeat(80)} R$ ${data.manaus_pps.toFixed(2).replace('.', ',')}`);
          custoProduto = data.manaus_custo_produto;

        } else {
          // Exibe a mensagem e os dados do Interior
          document.getElementById('mensagemFilial').innerText = `A filial ${filialSelecionada} não está em Manaus.`;
          $('#card4').show(); // Exibe o card com os dados do Interior
          $('#custo_produto').text(`${'.'.repeat(80)} R$ ${data.interior_custo_produto.toFixed(2).replace('.', ',')}`);
          $('#pps').text(`${'.'.repeat(80)} R$ ${data.interior_pps.toFixed(2).replace('.', ',')}`);

          custoProduto = data.manaus_custo_produto;
          despesaFrete = 600;


        }
        const resultadoFrete = retornoFrete - despesaFrete
        const margemBruta = valorVendaReal - custoProduto
        document.getElementById('margem_bruta').innerText = `Margem Bruta: ${'.'.repeat(80)}  R$ ${margemBruta.toFixed(2).replace('.', ',')}`;
        $('#revisao').text(`${'.'.repeat(80)} ${data.revisao.toFixed(2).replace('.', ',')}`);
        document.getElementById('resultado_frete').innerText = `Frete: ${'.'.repeat(80)} R$ ${resultadoFrete.toFixed(2).replace('.', ',')}`;
      }
    }).fail(function () {
      alert('Erro ao obter dados da moto');
    });
  } else {
    // Se não houver moto selecionada, esconde o card e limpa os dados
    $('#card4').hide();
    $('#manaus_custo_produto').text('');
    $('#manaus_pps').text('');
    $('#interior_custo_produto').text('');
    $('#interior_pps').text('');
    $('#revisao').text('');
  }
});
