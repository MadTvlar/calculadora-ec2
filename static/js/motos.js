function verificarCamposCard1() {
  const filialSelecionada = document.getElementById('filialTipo').value.trim();
  const motosYamaha = document.getElementById('motos_yamaha').value;
  const formaPagamento = document.getElementById('forma_pagamento').value.trim();
  const cliente = document.getElementById('cliente').value;
  const cpfCnpj = document.getElementById('cpf').value;
  const cpfCnpjValido = validarDocumento(cpfCnpj);

  document.getElementById('forma_pagamento').addEventListener('change', function () {
    var formaPagamento = this.value;
    var campoParcelas = document.getElementById('campoParcelas');

    // Verifica se a opção selecionada é 'Cartão de Crédito'
    if (formaPagamento === 'Cartão de Crédito') {
      campoParcelas.style.display = 'block'; // Exibe o campo de parcelas
    } else {
      campoParcelas.style.display = 'none'; // Oculta o campo de parcelas
    }
  });

  var filiaisManaus = ["Cachoeirinha", "Compensa", "Cidade Nova", "Max Teixeira", "Grande Circular"];
  var freteManaus = document.getElementById('freteManaus');
  if (filiaisManaus.includes(filialSelecionada)) {
    freteManaus.style.display = "block";

  } else {
    freteManaus.style.display = "none";
  }

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

  if (filialSelecionada && motosYamaha && cliente && cpfCnpjValido && formaPagamento) {
    if (formaPagamento === "À Vista" || formaPagamento === "Cartão de Crédito") {
      document.getElementById('card2').classList.add('suspended');
      document.getElementById('card2').classList.remove('active');
      habilitarCamposCard2e3(false);
      habilitarCamposCard3(true);
      document.getElementById('entradaAlter').innerText = `VALOR DO BEM`;
      document.getElementById('card3').classList.add('active');
    } else if (formaPagamento === "Financiado") {
      habilitarCamposCard2e3(true);
      document.getElementById('entradaAlter').innerText = `ENTRADA REAL`;
    }

  } else {
    habilitarCamposCard2e3(false);
    document.getElementById('card2').classList.add('suspended');
    document.getElementById('card2').classList.remove('active');
    document.getElementById('card3').classList.add('suspended');
    document.getElementById('card3').classList.remove('active');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const motoSelect = document.getElementById('motos_yamaha');
  const chassiSelect = document.getElementById('chassi_moto');
  const labelChassi = document.querySelector('label[for="chassi_moto"]'); // Pega o label do chassi

  try {
    const res = await fetch('/api/motos/modelos-motos-disponiveis');
    const modelos = [...new Set(await res.json())]; // remove duplicatas direto

    motoSelect.innerHTML = '<option value="">Selecione</option>';

    modelos.forEach(modelo => {
      motoSelect.insertAdjacentHTML('beforeend',
        `<option value="${modelo}">${modelo}</option>`);
    });

  } catch (err) {
    console.error('Erro ao carregar modelos:', err);
  }


  motoSelect.addEventListener('change', async () => {
    const modeloSelecionado = motoSelect.value;
    chassiSelect.innerHTML = '<option value="">Carregando...</option>';

    try {
      const res = await fetch(`/api/motos/chassis-por-modelo?modelo=${encodeURIComponent(modeloSelecionado)}`);
      const chassis = await res.json();

      chassiSelect.innerHTML = '<option value="">Selecione</option>';

      // Atualiza o label com a quantidade de chassis
      labelChassi.textContent = `CHASSI (${chassis.length})`;

      chassis.forEach(chassi => {
        const option = document.createElement('option');

        // Define o status da reserva com emoji
        const reservaStatus = chassi.status_reserva === 'RESERVADO' ? '🔒 RESERVADO' : '✔️ DISPONÍVEL';

        // Combinando chassi, cor, pátio, ano, dias_estoque e status_reserva
        const textoExibido = `${chassi.patio || 'N/A'} - ${chassi.chassi || 'N/A'} - ${chassi.cor || 'N/A'} - 
        ${chassi.ano || 'N/A'} - ${chassi.dias_estoque || 'N/A'} dias - ${reservaStatus}`;

        option.value = chassi.chassi; // valor do chassi
        option.textContent = textoExibido; // texto exibido no select
        chassiSelect.appendChild(option);
      });
    } catch (err) {
      console.error('Erro ao carregar chassis:', err);
      chassiSelect.innerHTML = '<option value="">Erro ao carregar</option>';
      labelChassi.textContent = 'CHASSI (0)';
    }
  });
});

document.getElementById('entradaAlter').innerText = `ENTRADA REAL`;


document.getElementById('filialTipo').addEventListener('change', verificarCamposCard1);

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

function formatarDocumento(campo) {
  let documento = campo.value.replace(/[^\d]/g, '');

  // Identifica se é CPF ou CNPJ com base no número de caracteres
  if (documento.length <= 11) { // CPF
    if (documento.length <= 3) {
      campo.value = documento;
    } else if (documento.length <= 6) {
      campo.value = documento.substring(0, 3) + '.' + documento.substring(3);
    } else if (documento.length <= 9) {
      campo.value = documento.substring(0, 3) + '.' + documento.substring(3, 6) + '.' + documento.substring(6);
    } else {
      campo.value = documento.substring(0, 3) + '.' + documento.substring(3, 6) + '.' + documento.substring(6, 9) + '-' + documento.substring(9, 11);
    }
  } else if (documento.length === 14) { // CNPJ
    if (documento.length <= 2) {
      campo.value = documento;
    } else if (documento.length <= 5) {
      campo.value = documento.substring(0, 2) + '.' + documento.substring(2);
    } else if (documento.length <= 8) {
      campo.value = documento.substring(0, 2) + '.' + documento.substring(2, 5) + '.' + documento.substring(5);
    } else if (documento.length <= 12) {
      campo.value = documento.substring(0, 2) + '.' + documento.substring(2, 5) + '.' + documento.substring(5, 8) + '/' + documento.substring(8);
    } else {
      campo.value = documento.substring(0, 2) + '.' + documento.substring(2, 5) + '.' + documento.substring(5, 8) + '/' + documento.substring(8, 12) + '-' + documento.substring(12, 14);
    }
  }
}

function validarDocumento(documento) {
  documento = documento.replace(/[^\d]+/g, '');

  if (documento.length === 11) { // CPF
    return validarCPF(documento);
  } else if (documento.length === 14) { // CNPJ
    return validarCNPJ(documento);
  } else {
    return false;
  }
}

function validarCPF(cpf) {

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let soma = 0;
  let resto;

  for (let i = 0; i < 9; i++) {

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

  for (let i = 0; i < 10; i++) {

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

function validarCNPJ(cnpj) {
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  return true;
}

document.getElementById("user-button").addEventListener("click", function () {
  document.getElementById("user-dropdown").classList.toggle("show");
});

window.onclick = function (event) {
  if (!event.target.matches('#user-button')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (var i = 0; i < dropdowns.length; i++) {
      if (dropdowns[i].classList.contains('show')) {
        dropdowns[i].classList.remove('show');
      }
    }
  }
};

document.getElementById('save-pdf').addEventListener('click', function (event) {
  event.preventDefault();

  // Esconde o menu
  const menu = document.getElementById('menu'); // ajusta o id se for diferente
  if (menu) {
    menu.style.display = 'none';
  }

  // Aguarda um pouquinho e depois chama o print
  setTimeout(function () {
    window.print();

    // Depois do print, mostra o menu de volta
    if (menu) {
      menu.style.display = 'block';
    }
  }, 200); // 200ms de atraso para dar tempo de esconder o menu
});


document.getElementById('cpf').addEventListener('input', function () {
  formatarDocumento(this);
});

document.getElementById('motos_yamaha').addEventListener('change', verificarCamposCard1);
document.getElementById('cliente').addEventListener('input', verificarCamposCard1);
document.getElementById('forma_pagamento').addEventListener('change', verificarCamposCard1);

document.getElementById('showCard4Button').addEventListener('click', async function () {

  const camposCard = document.querySelectorAll('#card2 input:not([disabled]):not([type="select-one"]), #card3 input:not([disabled]):not([type="select-one"])');


  let precoNegociado = 0;
  let entradaBonificada = 0;
  let entradaReal = 0;
  let custoProduto = 0;
  let despesaFrete = 0;
  let receitaFrete = 0;
  let retornoEmplacamento = 0;
  let retornoAcessorio = 0;
  let retornoBrinde = 0;
  let despEmplacamento = 0;
  let margem_bruta = 0;
  let valor_op = 0;
  let resultadoBanco = 0;
  let comissao = 0;
  let valorMesAtual = parseFloat(document.getElementById('dados_emplacamento').dataset.valor);

  camposCard.forEach(campo => {
    const valor = parseFloat(campo.value.replace('R$', '').replace('.', '').replace(',', '.') || 0);

    if (campo.id === 'preco_negociado') {
      precoNegociado = valor;
    } else if (campo.id === 'entrada_bonificada') {
      entradaBonificada = valor;
    } else if (campo.id === 'entrada_real') {
      entradaReal = valor;
    } else if (campo.id === 'frete_receita') {
      receitaFrete = valor;
    } else if (campo.id === 'frete_despesa') {
      despesaFrete = valor;
    } else if (campo.id === 'retorno_emplacamento') {
      retornoEmplacamento = valor;
    } else if (campo.id === 'retorno_acessorio') {
      retornoAcessorio = valor;
    } else if (campo.id === 'retorno_brinde') {
      retornoBrinde = valor;
    };
  });

  const valorVendaReal = precoNegociado - entradaBonificada;

  document.getElementById('card4').style.display = 'block';

  if (retornoAcessorio > 0) {
    const receitaAcessorio = retornoAcessorio;
    const custoAcessorio = retornoAcessorio * 0.7;
    document.getElementById('receita_acessorio').innerText = `Acessórios Receita:${'.'.repeat(83)} R$ ${receitaAcessorio.toFixed(2).replace('.', ',')}`;
    document.getElementById('custo_acessorio').innerText = `Acessórios Custo:${'.'.repeat(86)} R$ -${custoAcessorio.toFixed(2).replace('.', ',')}`;

  } else {
    retornoAcessorio = 0;
    document.getElementById('receita_acessorio').innerText = '';
    document.getElementById('custo_acessorio').innerText = '';
  }

  if (retornoBrinde > 0) {
    const resultadoBrinde = retornoBrinde;
    resultBrinde = retornoBrinde;

    document.getElementById('resultado_brinde').innerText = `Brinde:${'.'.repeat(105)} R$ -${resultadoBrinde.toFixed(2).replace('.', ',')}`;
  } else {
    resultBrinde = 0;
    document.getElementById('resultado_brinde').innerText = '';
  }

  const chassiSelect = document.getElementById('chassi_moto');
  const chassiSelecionado = chassiSelect.value;

  if (!chassiSelecionado) {
    alert('Selecione um chassi primeiro.');
    return;
  }

  try {
    const res = await fetch(`/api/motos/detalhes-chassi?chassi=${encodeURIComponent(chassiSelecionado)}`);
    const dados = await res.json();

    if (dados.error) {
      alert('Erro: ' + dados.error);
      return;
    }

    custoProduto = Number(dados.custo_contabil);
    chassiProduto = dados.chassi;

  } catch (err) {
    console.error('Erro ao buscar detalhes do chassi:', err);
  }

  var filialSelecionada = document.getElementById('filialTipo').value;
  var filiaisManaus = ["Cachoeirinha", "Compensa", "Cidade Nova", "Max Teixeira", "Grande Circular"];
  var motoSelecionada = $('#motos_yamaha').val();

  if (motoSelecionada) {

    document.getElementById('mensagemFilial').innerText = `${chassiProduto}`;
    document.getElementById('custo_produto').innerHTML = `Custo da Moto: ${'.'.repeat(90)} R$ ${custoProduto.toFixed(2).replace('.', ',')}`;

    if (filiaisManaus.includes(filialSelecionada)) {
      $('#card4').show();

    } else {
      despesaFrete = 600;
    }

    const formaPagamento = document.getElementById('forma_pagamento').value.trim();

    document.getElementById('parcelas_taxa').innerText = '';
    document.getElementById('taxa_cartao').innerText = '';
    document.getElementById('resultado_banco').innerText = '';
    document.getElementById('custo_emplacamento').innerText = '';
    document.getElementById('receita_emplacamento').innerText = '';

    if (formaPagamento === "Financiado") {
      margem_bruta = valorVendaReal - custoProduto;
      valor_op = valorVendaReal

      const valor_bem = precoNegociado;

      document.getElementById('valor_bem').innerText = `Valor do Bem: ${'.'.repeat(92)} R$ ${valor_bem.toFixed(2).replace('.', ',')}`;

      document.getElementById('valor_venda_real').innerText = `Valor de Venda Real: ${'.'.repeat(81)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;

      const bancoRetorno = document.getElementById('banco_retorno').value.trim();
      const resultBanco = precoNegociado - entradaReal - entradaBonificada;

      resultadoBanco = resultBanco;

      if (bancoRetorno === "R0") {
        resultadoBanco = resultBanco * 0;
        document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

      } else if (bancoRetorno === "R1") {
        resultadoBanco = resultBanco * 0.012;
        document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

      } else if (bancoRetorno === "R2") {
        resultadoBanco = resultBanco * 0.024;
        document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

      } else if (bancoRetorno === "R3") {
        resultadoBanco = resultBanco * 0.036;
        document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

      } else if (bancoRetorno === "R4") {
        resultadoBanco = resultBanco * 0.048;
        document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

      } else {
        resultadoBanco = 0;
        document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;
      }


    } if (formaPagamento === "À Vista") {
      margem_bruta = entradaReal - custoProduto;
      const valorVendaReal = entradaReal;
      valor_op = entradaReal

      const valor_bem = entradaReal;

      document.getElementById('valor_bem').innerText = `Valor do Bem: ${'.'.repeat(92)} R$ ${valor_bem.toFixed(2).replace('.', ',')}`;

      document.getElementById('valor_venda_real').innerText = `Valor de Venda Real: ${'.'.repeat(81)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;

    } if (formaPagamento === "Cartão de Crédito") {

      // Pega o valor selecionado no select de parcelas
      var nomeParcela = $('#parcelas').val();

      // Realiza a requisição para obter a taxa associada à parcela
      $.getJSON('/obter_taxa/' + encodeURIComponent(nomeParcela), function (data) {

        // Garantir que os valores de entrada são numéricos

        // Calcular os valores corretamente
        var taxaCartao = entradaReal * data.valor;
        var valorVendaReal = taxaCartao + entradaReal;
        var parcelaCartao = valorVendaReal / data.parcela;
        var margem_bruta = valorVendaReal - custoProduto;

        // Atualiza os valores no HTML

        $('#parcelas_taxa').text(`Parcelas de ${data.parcela}x: ${'.'.repeat(88)} R$ ${parcelaCartao.toFixed(2).replace('.', ',')} `);

        const valor_bem = entradaReal;

        document.getElementById('valor_bem').innerText = `Valor do Bem: ${'.'.repeat(92)} R$ ${valor_bem.toFixed(2).replace('.', ',')}`;

        document.getElementById('valor_venda_real').innerText =
          `Valor de Venda Real: ${'.'.repeat(81)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;

        document.getElementById('taxa_cartao').innerText =
          `Taxa do Cartão: ${'.'.repeat(90)} R$ -${taxaCartao.toFixed(2).replace('.', ',')}`;

        document.getElementById('margem_bruta').innerText =
          `Margem Bruta: ${'.'.repeat(91)} R$ ${margem_bruta.toFixed(2).replace('.', ',')}`;

        if (checkboxEmplacamento.checked) {
          despEmplacamento = (valorVendaReal * valorMesAtual) + 140.75 + 290 + 227.08;
          document.getElementById('custo_emplacamento').innerText =
            `Emplacamento Custo: ${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;

          document.getElementById('receita_emplacamento').innerText =
            `Emplacamento Receita: ${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;
        } else {
          despEmplacamento = 0;
          retornoEmplacamento = 0;
          document.getElementById('custo_emplacamento').innerText =
            `Emplacamento Custo: ${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;

          document.getElementById('receita_emplacamento').innerText =
            `Emplacamento Receita: ${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;
        }

        var despOpeFinMkt = entradaReal * 0.06;
        document.getElementById('despesas_ope_fin_mkt').innerText =
          `Despesas Operacionais: ${'.'.repeat(75)} R$ -${despOpeFinMkt.toFixed(2).replace('.', ',')}`;

        var totalDespesas = despOpeFinMkt + resultBrinde + despEmplacamento + despesaFrete + retornoAcessorio * 0.7 + taxaCartao;
        document.getElementById('resultado_despesas').innerText =
          `Total de Despesas: ${'.'.repeat(84)} R$ -${totalDespesas.toFixed(2).replace('.', ',')}`;

        var totalReceitas = retornoAcessorio + resultadoBanco + retornoEmplacamento + receitaFrete;
        document.getElementById('resultado_receitas').innerText =
          `Total de Receitas: ${'.'.repeat(86)} R$ ${totalReceitas.toFixed(2).replace('.', ',')}`;

        var margemLiquida = margem_bruta - totalDespesas + totalReceitas;
        document.getElementById('resultado_liquido').innerText =
          `Margem Líquida: ${'.'.repeat(88)} R$ ${margemLiquida.toFixed(2).replace('.', ',')}`;


        const margemPercentual = margemLiquida / entradaReal * 100;
        document.getElementById('resultado_porcentual').innerText = `LLO: ${'.'.repeat(109)} ${margemPercentual.toFixed(2).replace('.', ',')}%`;

        console.log('valor margem percentual', margemPercentual);

        var comissao = margemLiquida * 0.085;
        if (comissao < 0) {
          comissao = 0
          document.getElementById('comissao').innerText = `Comissão Aproximada: ${'.'.repeat(77)} R$ ${comissao.toFixed(2).replace('.', ',')}`

        } else {
          document.getElementById('comissao').innerText = `Comissão Aproximada: ${'.'.repeat(77)} R$ ${comissao.toFixed(2).replace('.', ',')}`

        }
      });
    }

    const margemBruta = margem_bruta
    document.getElementById('margem_bruta').innerText = `Margem Bruta: ${'.'.repeat(91)}  R$ ${margemBruta.toFixed(2).replace('.', ',')}`;

    document.getElementById('custo_frete').innerText = `Frete Custo: ${'.'.repeat(96)} R$ -${despesaFrete.toFixed(2).replace('.', ',')}`;
    document.getElementById('receita_frete').innerText = `Frete Receita: ${'.'.repeat(93)} R$ ${receitaFrete.toFixed(2).replace('.', ',')}`;


    const checkboxEmplacamento = document.getElementById('enableEmplacamento');
    if (checkboxEmplacamento.checked && formaPagamento === "Financiado") {
      despEmplacamento = (precoNegociado * valorMesAtual) + 140.75 + 290 + 335.52;
      document.getElementById('custo_emplacamento').innerText = `Emplacamento Custo: ${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
      document.getElementById('receita_emplacamento').innerText = `Emplacamento Receita: ${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;

    } else if (checkboxEmplacamento.checked && formaPagamento === "À Vista") {
      despEmplacamento = (entradaReal * valorMesAtual) + 140.75 + 290 + 227.08;
      document.getElementById('custo_emplacamento').innerText = `Emplacamento Custo: ${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
      document.getElementById('receita_emplacamento').innerText = `Emplacamento Receita: ${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;

    } else if (formaPagamento !== "Cartão de Crédito") {
      despEmplacamento = 0;

      document.getElementById('custo_emplacamento').innerText = `Emplacamento Custo: ${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
      document.getElementById('receita_emplacamento').innerText = `Emplacamento Receita: ${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;
    }


    if (formaPagamento !== "Cartão de Crédito") {

      const despOpeFinMkt = valor_op * 0.06;
      document.getElementById('despesas_ope_fin_mkt').innerText = `Despesas Operacionais: ${'.'.repeat(75)} R$ -${despOpeFinMkt.toFixed(2).replace('.', ',')}`;

      const totalDespesas = despOpeFinMkt + resultBrinde + despEmplacamento + despesaFrete + retornoAcessorio * 0.7;
      document.getElementById('resultado_despesas').innerText = `Total de Despesas: ${'.'.repeat(84)} R$ -${totalDespesas.toFixed(2).replace('.', ',')}`;

      const totalReceitas = retornoAcessorio + resultadoBanco + retornoEmplacamento + receitaFrete;
      document.getElementById('resultado_receitas').innerText = `Total de Receitas: ${'.'.repeat(86)} R$ ${totalReceitas.toFixed(2).replace('.', ',')}`;

      const margemLiquida = margemBruta - totalDespesas + totalReceitas;
      document.getElementById('resultado_liquido').innerText = `Margem Líquida: ${'.'.repeat(88)} R$ ${margemLiquida.toFixed(2).replace('.', ',')}`;

      if (formaPagamento != 'Financiado') {

        const margemPercentual = margemLiquida / entradaReal * 100;
        document.getElementById('resultado_porcentual').innerText = `LLO: ${'.'.repeat(109)} ${margemPercentual.toFixed(2).replace('.', ',')}%`;

        console.log('valor margem percentual', margemPercentual);
      } else {

        const margemPercentual = margemLiquida / valorVendaReal * 100;
        document.getElementById('resultado_porcentual').innerText = `LLO: ${'.'.repeat(109)} ${margemPercentual.toFixed(2).replace('.', ',')}%`;

        console.log('valor margem percentual', margemPercentual);
      }

      comissao = margemLiquida * 0.085;
      if (comissao < 0) {
        comissao = 0
        document.getElementById('comissao').innerText = `Comissão Aproximada: ${'.'.repeat(77)} R$ ${comissao.toFixed(2).replace('.', ',')}`

      } else {
        document.getElementById('comissao').innerText = `Comissão Aproximada: ${'.'.repeat(77)} R$ ${comissao.toFixed(2).replace('.', ',')}`

      }
    }

    setTimeout(() => {
      enviarFormulario();
    }, 50);

  }

});


function converterDecimal(valor) {
  if (!valor) return 0;
  // Remove tudo que não for número ou vírgula
  valor = valor.replace(/[^0-9,]/g, '');
  // Substitui a vírgula por ponto para converter
  return parseFloat(valor.replace(',', '.')) || 0;
}

function enviarFormulario() {
  const vendedor = document.getElementById('user-button').innerText;
  const cliente = document.getElementById('cliente').value;
  const cpf = document.getElementById('cpf').value;
  const moto = document.getElementById('motos_yamaha').value;
  const filialTipo = document.getElementById('filialTipo').value;
  const formaPagamento = document.getElementById('forma_pagamento').value.trim();
  const bancoSelecionado = document.getElementById('forma_banco').value;
  const retornoSelecionado = document.getElementById('banco_retorno').value;

  // Verifica se todos os campos obrigatórios estão preenchidos
  if (!vendedor || !cliente || !cpf || !moto || !filialTipo || !formaPagamento) {
    alert('Todos os campos devem ser preenchidos!');
    return;
  }

  // Pega e converte todos os DECIMAL (xx,xx -> xx.xx)
  const valor_bem = converterDecimal(document.getElementById('valor_bem').innerText);
  const valor_venda_real = converterDecimal(document.getElementById('valor_venda_real').innerText);
  const custo_moto = converterDecimal(document.getElementById('custo_produto').innerText);
  const margem_bruta = converterDecimal(document.getElementById('margem_bruta').innerText);
  const emplacamento_receita = converterDecimal(document.getElementById('receita_emplacamento').innerText);
  const frete_receita = converterDecimal(document.getElementById('receita_frete').innerText);
  const acessorio = converterDecimal(document.getElementById('receita_acessorio').innerText);
  const valor_retorno = converterDecimal(document.getElementById('resultado_banco').innerText);
  const emplcamento_custo = converterDecimal(document.getElementById('custo_emplacamento').innerText);
  const frete_custo = converterDecimal(document.getElementById('custo_frete').innerText);
  const taxa_cartao = converterDecimal(document.getElementById('taxa_cartao').innerText);
  const brinde = converterDecimal(document.getElementById('resultado_brinde').innerText);
  const despesa_operacionais = converterDecimal(document.getElementById('despesas_ope_fin_mkt').innerText);
  const total_despesas = converterDecimal(document.getElementById('resultado_despesas').innerText);
  const total_receitas = converterDecimal(document.getElementById('resultado_receitas').innerText);
  const margem_liquida = converterDecimal(document.getElementById('resultado_liquido').innerText);
  const comissao = converterDecimal(document.getElementById('comissao').innerText);

  // Enviar os dados usando fetch
  fetch('/venda_moto', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nome_vendedor: vendedor,
      nome_cliente: cliente,
      cpf_cnpj_cliente: cpf,
      moto_selecionada: moto,
      forma_pagamento: formaPagamento,
      filial_escolhida: filialTipo,
      banco_selecionado: bancoSelecionado,
      retorno_selecionado: retornoSelecionado,
      valor_bem,
      valor_venda_real,
      custo_moto,
      margem_bruta,
      emplacamento_receita,
      frete_receita,
      acessorio,
      valor_retorno,
      emplcamento_custo,
      frete_custo,
      taxa_cartao,
      brinde,
      despesa_operacionais,
      total_despesas,
      total_receitas,
      margem_liquida,
      comissao
    })
  })
    .then(response => response.text())
    .then(data => {
      alert(data); // Exibe a mensagem de sucesso ou erro
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Houve um erro ao registrar a venda');
    });
}


