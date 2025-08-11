function toggleMenu() {
  const menu = document.getElementById('dropdownMenu');
  const toggle = document.querySelector('.menu-toggle');

  menu.classList.toggle('active');
  toggle.classList.toggle('active');
}

// Fecha o menu ao clicar fora
document.addEventListener('click', function (event) {
  const menu = document.getElementById('dropdownMenu');
  const toggle = document.querySelector('.menu-toggle');

  if (!toggle.contains(event.target) && !menu.contains(event.target)) {
    menu.classList.remove('active');
    toggle.classList.remove('active');
  }
});

// Alterna a classe do footer com base no tamanho da página
function ajustarFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;

  // Altura total da página, incluindo o conteúdo principal
  const alturaConteudo = document.documentElement.scrollHeight;
  const alturaJanela = window.innerHeight;

  if (alturaConteudo > alturaJanela) {
    footer.classList.remove('footer-fixed');
    footer.classList.add('footer-relative');
  } else {
    footer.classList.remove('footer-relative');
    footer.classList.add('footer-fixed');
  }
}

window.addEventListener('load', ajustarFooter);
window.addEventListener('resize', ajustarFooter);