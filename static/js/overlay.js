const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');

function abrirSidebar() {
  sidebar.classList.add('aberto');
}

function fecharSidebar() {
  sidebar.classList.remove('aberto');
}

overlay.addEventListener('click', fecharSidebar); // clicar fora fecha