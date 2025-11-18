// Função para mostrar mensagem de sucesso
function showSuccessMessage() {
    const toast = document.getElementById("toastSuccess");
    toast.classList.add("show");

    // Remove a classe após 3 segundos
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2000);
  }

  // Adiciona evento ao botão Inserir
  document
    .getElementById("btnInserir")
    .addEventListener("click", function (e) {
      e.preventDefault();
      showSuccessMessage();
    });