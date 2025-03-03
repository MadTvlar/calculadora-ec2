function verificarCamposCard1() {
  const filialSelecionada = document.getElementById('filialTipo').value.trim();
  const localizacaomoto = document.getElementById('locMoto').value.trim();
  const motosYamaha = document.getElementById('motos_yamaha').value;
  const formaPagamento = document.getElementById('forma_pagamento').value.trim();
  const cliente = document.getElementById('cliente').value;
  const cpfCnpj = document.getElementById('cpf').value;
  const cpfCnpjValido = validarDocumento(cpfCnpj);

  document.getElementById('forma_pagamento').addEventListener('change', function () {
    var formaPagamento = this.value;
    var campoParcelas = document.getElementById('campoParcelas');

    // Verifica se a opção selecionada é 'Cartão de Crédito'
    if (formaPagamento === 'cartao') {
      campoParcelas.style.display = 'block'; // Exibe o campo de parcelas
    } else {
      campoParcelas.style.display = 'none'; // Oculta o campo de parcelas
    }
  });

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

  if (localizacaomoto && filialSelecionada && motosYamaha && cliente && cpfCnpjValido && formaPagamento) {
    if (formaPagamento === "a_vista" || formaPagamento === "cartao") {
      document.getElementById('card2').classList.add('suspended');
      document.getElementById('card2').classList.remove('active');
      habilitarCamposCard2e3(false);
      habilitarCamposCard3(true);
      document.getElementById('entradaAlter').innerText = `VALOR DO BEM`;
      document.getElementById('card3').classList.add('active');
    } else if (formaPagamento === "financiado") {
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

document.getElementById('cpf').addEventListener('input', function () {
  formatarDocumento(this);
});

document.getElementById('locMoto').addEventListener('change', verificarCamposCard1);
document.getElementById('motos_yamaha').addEventListener('change', verificarCamposCard1);
document.getElementById('cliente').addEventListener('input', verificarCamposCard1);
document.getElementById('forma_pagamento').addEventListener('change', verificarCamposCard1);

document.getElementById('showCard4Button').addEventListener('click', function () {

  const camposCard = document.querySelectorAll('#card2 input:not([disabled]):not([type="select-one"]), #card3 input:not([disabled]):not([type="select-one"])');


  let precoNegociado = 0;
  let entradaBonificada = 0;
  let entradaReal = 0;
  let custoProduto = 0;
  let despesaFrete = 0;
  let retornoFrete = 0;
  let retornoEmplacamento = 0;
  let retornoAcessorio = 0;
  let retornoBrinde = 0;
  let despEmplacamento = 0;
  let margem_bruta = 0;
  let valor_op = 0;
  let resultadoBanco = 0;


  camposCard.forEach(campo => {
    const valor = parseFloat(campo.value.replace('R$', '').replace(',', '.') || 0);

    if (campo.id === 'preco_negociado') {
      precoNegociado = valor;
    } else if (campo.id === 'entrada_bonificada') {
      entradaBonificada = valor;
    } else if (campo.id === 'entrada_real') {
      entradaReal = valor;
    } else if (campo.id === 'retorno_frete') {
      retornoFrete = valor;
    } else if (campo.id === 'retorno_emplacamento') {
      retornoEmplacamento = valor;
    } else if (campo.id === 'retorno_acessorio') {
      retornoAcessorio = valor;
    } else if (campo.id === 'retorno_brinde') {
      retornoBrinde = valor;
    }
  });

  const valorVendaReal = precoNegociado - entradaBonificada;

  //document.getElementById('valor_venda_real').innerText = `Valor de Venda Real: ${'.'.repeat(81)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;


  document.getElementById('card4').style.display = 'block';

  const checkboxAcessorio = document.getElementById('enableAcessorio');

  if (checkboxAcessorio.checked) {
    const receitaAcessorio = retornoAcessorio;
    const custoAcessorio = retornoAcessorio * 0.7;
    document.getElementById('receita_acessorio').innerText = `Frete Receita:${'.'.repeat(82)} R$ ${receitaAcessorio.toFixed(2).replace('.', ',')}`;
    document.getElementById('custo_acessorio').innerText = `Acessórios Custo:${'.'.repeat(86)} R$ -${custoAcessorio.toFixed(2).replace('.', ',')}`;

  } else {
    retornoAcessorio = 0;
    document.getElementById('receita_acessorio').innerText = '';
    document.getElementById('custo_acessorio').innerText = '';
  }

  const checkboxBrinde = document.getElementById('enableBrinde');

  if (checkboxBrinde.checked) {
    const resultadoBrinde = retornoBrinde;
    resultBrinde = retornoBrinde;

    document.getElementById('resultado_brinde').innerText = `Brinde:${'.'.repeat(104)} R$ -${resultadoBrinde.toFixed(2).replace('.', ',')}`;
  } else {
    resultBrinde = 0;
    document.getElementById('resultado_brinde').innerText = '';
  }

  var filialSelecionada = document.getElementById('filialTipo').value;
  var filiaisManaus = ["Cachoeirinha", "Compensa", "Cidade Nova", "Max Teixeira", "Grande Circular"];
  var motoSelecionada = $('#motos_yamaha').val();

  if (motoSelecionada) {

    $.getJSON('/dados_moto/' + encodeURIComponent(motoSelecionada), function (data) {
      if (data.error) {
        alert(data.error);
      } else {
        document.getElementById('mensagemFilial').innerText = `${filialSelecionada}`;
        if (filiaisManaus.includes(filialSelecionada)) {
          $('#card4').show();
          $('#pps').text(`${'.'.repeat(80)} R$ ${data.manaus_pps.toFixed(2).replace('.', ',')}`);
          const checkboxFrete = document.getElementById('enableFrete');
          if (checkboxFrete.checked) {
            despesaFrete = 600;
          }

        } else {
          $('#pps').text(`${'.'.repeat(80)} R$ ${data.interior_pps.toFixed(2).replace('.', ',')}`);
          despesaFrete = 600;
        }

        const localizacaomoto = document.getElementById('locMoto').value.trim();
        if (localizacaomoto === "Capital") {
          $('#custo_produto').text(`${'.'.repeat(90)} R$ -${data.manaus_custo_produto.toFixed(2).replace('.', ',')}`);
          custoProduto = data.manaus_custo_produto;

        } else {
          $('#custo_produto').text(`${'.'.repeat(90)} R$ -${data.interior_custo_produto.toFixed(2).replace('.', ',')}`);
          custoProduto = data.interior_custo_produto;
        }

        const formaPagamento = document.getElementById('forma_pagamento').value.trim();
        document.getElementById('parcelas_taxa').innerText = '';
        document.getElementById('taxa_cartao').innerText = '';
        document.getElementById('resultado_banco').innerText = '';
        document.getElementById('custo_emplacamento').innerText = '';
        document.getElementById('receita_emplacamento').innerText = '';


















        if (formaPagamento === "financiado") {
          margem_bruta = valorVendaReal - custoProduto;
          valor_op = valorVendaReal

          document.getElementById('valor_venda_real').innerText = `Valor de Venda Real: ${'.'.repeat(81)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;

          const bancoRetorno = document.getElementById('banco_retorno').value.trim();
          const resultBanco = precoNegociado - entradaReal - entradaBonificada;

          resultadoBanco = resultBanco;

          if (bancoRetorno === "zero") {
            resultadoBanco = resultBanco * 0;
            document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

          } else if (bancoRetorno === "um") {
            resultadoBanco = resultBanco * 0.012;
            document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

          } else if (bancoRetorno === "dois") {
            resultadoBanco = resultBanco * 0.024;
            document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

          } else if (bancoRetorno === "tres") {
            resultadoBanco = resultBanco * 0.036;
            document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

          } else if (bancoRetorno === "quatro") {
            resultadoBanco = resultBanco * 0.048;
            document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;

          } else {
            resultadoBanco = 0;
            document.getElementById('resultado_banco').innerText = `Retorno do Banco: ${'.'.repeat(84)} R$ ${resultadoBanco.toFixed(2).replace('.', ',')}`;
          }

        } if (formaPagamento === "a_vista") {
          margem_bruta = entradaReal - custoProduto;
          const valorVendaReal = entradaReal;
          valor_op = entradaReal

          document.getElementById('valor_venda_real').innerText = `Valor de Venda Real: ${'.'.repeat(81)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;

        } if (formaPagamento === "cartao") {

          // Pega o valor selecionado no select de parcelas
          var nomeParcela = document.getElementById('parcelas').value;

          // Realiza a requisição para obter a taxa associada à parcela
          $.getJSON(`/obter_taxa/${encodeURIComponent(nomeParcela)}`, function (data) {

            const taxaCartao = entradaReal * data.taxa;
            const valorVendaReal = taxaCartao + entradaReal;


            margem_bruta = valorVendaReal - custoProduto;
            const margemBruta = margem_bruta;

            $.getJSON(`/obter_qtd/${encodeURIComponent(nomeParcela)}`, function (valor) {
              const parcelasTaxa = valorVendaReal / valor.qtd;

              document.getElementById('parcelas_taxa').innerText = `Parcelas ${valor.qtd}x: ${'.'.repeat(93)} R$ ${parcelasTaxa.toFixed(2).replace('.', ',')}`;

            });

            // Exibe a taxa com os pontos e o formato adequado
            document.getElementById('valor_venda_real').innerText = `Valor de Venda Real: ${'.'.repeat(81)} R$ ${valorVendaReal.toFixed(2).replace('.', ',')}`;

            document.getElementById('taxa_cartao').innerText = `Taxa do Cartão: ${'.'.repeat(90)} R$ -${taxaCartao.toFixed(2).replace('.', ',')}`;


            document.getElementById('margem_bruta').innerText = `${'.'.repeat(91)}  R$ ${margem_bruta.toFixed(2).replace('.', ',')}`;

            if (checkboxEmplacamento.checked) {
              despEmplacamento = (valorVendaReal * 0.025) + 140.75 + 290 + 227.08;
              document.getElementById('custo_emplacamento').innerText = `${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
              document.getElementById('receita_emplacamento').innerText = `${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;
            } else {
              despEmplacamento = 0;
              retornoEmplacamento = 0;
              document.getElementById('custo_emplacamento').innerText = `${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
              document.getElementById('receita_emplacamento').innerText = `${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;

            }

            const despOpeFinMkt = entradaReal * 0.06;
            document.getElementById('despesas_ope_fin_mkt').innerText = `${'.'.repeat(75)} R$ -${despOpeFinMkt.toFixed(2).replace('.', ',')}`;

            const totalDespesas = despOpeFinMkt + resultBrinde + despEmplacamento + despesaFrete + retornoAcessorio * 0.7 + taxaCartao;
            document.getElementById('resultado_despesas').innerText = `${'.'.repeat(84)} R$ -${totalDespesas.toFixed(2).replace('.', ',')}`;

            const totalReceitas = retornoAcessorio + resultadoBanco + retornoEmplacamento + retornoFrete;
            document.getElementById('resultado_receitas').innerText = `${'.'.repeat(86)} R$ ${totalReceitas.toFixed(2).replace('.', ',')}`;

            const margemLiquida = margemBruta - totalDespesas + totalReceitas;
            document.getElementById('resultado_liquido').innerText = `${'.'.repeat(88)} R$ ${margemLiquida.toFixed(2).replace('.', ',')}`;

            const comissao = margemLiquida * 0.085;
            document.getElementById('comissao').innerText = `${'.'.repeat(77)} R$ ${comissao.toFixed(2).replace('.', ',')}`

          })

        }


        const margemBruta = margem_bruta
        document.getElementById('margem_bruta').innerText = `${'.'.repeat(91)}  R$ ${margemBruta.toFixed(2).replace('.', ',')}`;
        $('#revisao').text(`${'.'.repeat(3)} R$ ${data.revisao.toFixed(2).replace('.', ',')}`);

        document.getElementById('custo_frete').innerText = `${'.'.repeat(96)} R$ -${despesaFrete.toFixed(2).replace('.', ',')}`;
        document.getElementById('receita_frete').innerText = `${'.'.repeat(93)} R$ ${retornoFrete.toFixed(2).replace('.', ',')}`;


        const checkboxEmplacamento = document.getElementById('enableEmplacamento');
        if (checkboxEmplacamento.checked && formaPagamento === "financiado") {
          despEmplacamento = (precoNegociado * 0.025) + 140.75 + 290 + 335.52;
          document.getElementById('custo_emplacamento').innerText = `${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
          document.getElementById('receita_emplacamento').innerText = `${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;

        } else if (checkboxEmplacamento.checked && formaPagamento === "a_vista") {
          despEmplacamento = (entradaReal * 0.025) + 140.75 + 290 + 227.08;
          document.getElementById('custo_emplacamento').innerText = `${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
          document.getElementById('receita_emplacamento').innerText = `${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;

        } else if (formaPagamento !== "cartao") {
          despEmplacamento = 0;
          retornoEmplacamento = 0;
          document.getElementById('custo_emplacamento').innerText = `${'.'.repeat(79)} R$ -${despEmplacamento.toFixed(2).replace('.', ',')}`;
          document.getElementById('receita_emplacamento').innerText = `${'.'.repeat(76)} R$ ${retornoEmplacamento.toFixed(2).replace('.', ',')}`;
        }


        if (formaPagamento !== "cartao") {
          resultRevisao = data.revisao

          const despOpeFinMkt = valor_op * 0.06;
          document.getElementById('despesas_ope_fin_mkt').innerText = `${'.'.repeat(75)} R$ -${despOpeFinMkt.toFixed(2).replace('.', ',')}`;

          const totalDespesas = despOpeFinMkt + resultBrinde + despEmplacamento + despesaFrete + retornoAcessorio * 0.7;
          document.getElementById('resultado_despesas').innerText = `${'.'.repeat(84)} R$ -${totalDespesas.toFixed(2).replace('.', ',')}`;

          const totalReceitas = retornoAcessorio + resultadoBanco + retornoEmplacamento + retornoFrete;
          document.getElementById('resultado_receitas').innerText = `${'.'.repeat(86)} R$ ${totalReceitas.toFixed(2).replace('.', ',')}`;

          const margemLiquida = margemBruta - totalDespesas + totalReceitas;
          document.getElementById('resultado_liquido').innerText = `${'.'.repeat(88)} R$ ${margemLiquida.toFixed(2).replace('.', ',')}`;

          const comissao = margemLiquida * 0.085;
          document.getElementById('comissao').innerText = `${'.'.repeat(77)} R$ ${comissao.toFixed(2).replace('.', ',')}`
        }
      }
    }).fail(function () {
      alert('Erro ao obter dados da moto');
    });
  } else {
    $('#card4').hide();
    $('#manaus_custo_produto').text('');
    $('#manaus_pps').text('');
    $('#interior_custo_produto').text('');
    $('#interior_pps').text('');
    $('#revisao').text('');
  }

});