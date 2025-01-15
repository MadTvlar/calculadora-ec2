function verificarCamposCard1() {
  const filialSelecionada = document.getElementById('vendedorTipo').value.trim();
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
  }

  // Verificação dos campos
  if (filialSelecionada && motosYamaha && cliente && cpfValido && formaPagamento) {
    if (formaPagamento === "a_vista") {
      habilitarCamposCard2e3(false);
      habilitarCamposCard3(true);
      document.getElementById('card3').classList.add('active');
    } else if (formaPagamento === "financiado") {
      habilitarCamposCard2e3(true);
    } else {
      habilitarCamposCard2e3(false);
    }
  } else {
    habilitarCamposCard2e3(false);
  }
}


// Atualização de eventos para verificar a escolha da filial
document.getElementById('vendedorTipo').addEventListener('change', verificarCamposCard1);

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
  // Pega os campos dos cards 2 e 3
  const camposCard2 = document.querySelectorAll('#card2 input:not([disabled]), #card2 select:not([disabled])');
  const camposCard3 = document.querySelectorAll('#card3 input:not([disabled]), #card3 select:not([disabled])');

  // Calcula a soma apenas dos campos habilitados
  let soma = 0;

  camposCard2.forEach(campo => {
    const valor = parseFloat(campo.value.replace('R$', '').replace(',', '.') || 0);
    soma += valor;
  });

  camposCard3.forEach(campo => {
    const valor = parseFloat(campo.value.replace('R$', '').replace(',', '.') || 0);
    soma += valor;
  });

  // Exibe o total no card4
  document.getElementById('resumo-texto').innerText = `Total: R$ ${soma.toFixed(2).replace('.', ',')}`;

  // Mostra o card4
  document.getElementById('card4').style.display = 'flex';
});
