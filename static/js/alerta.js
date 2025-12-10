
  window.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modalAviso");
    const btnFechar = document.getElementById("modalFechar");

    // Exibir o modal automaticamente ao abrir a página
    modal.classList.add("active");

    // Botão para fechar
    btnFechar.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  });

  