
document.getElementById("btnInserir").addEventListener("click", async () => {
  const api = document.getElementById("selectApi").value;
  const dataInicial = document.getElementById("dataInicial").value;
  const dataFinal = document.getElementById("dataFinal").value;

  if (!api) return alert("Selecione uma API!");

    document.getElementById("logArea").innerText = "Iniciando...";

    const evtSource = new EventSource(`/run-api-stream?name=${api}`);

    evtSource.onmessage = function(event) {
        const logArea = document.getElementById("logArea");
        logArea.innerText += "\n" + event.data;
        logArea.scrollTop = logArea.scrollHeight;

        if (event.data === "FINALIZADO") {
            evtSource.close();
        }}

  if (!api || !dataInicial || !dataFinal) {
    alert("Selecione a API e as datas!");
    return;
  }

  const response = await fetch("/run-api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: api,
      dataInicial,
      dataFinal
    })
  });

  const result = await response.json();

  if (result.ok) {
    console.log("API executada com sucesso:", result.resultado);
    document.getElementById("toastSuccess").classList.add("show");
    setTimeout(() => {
      document.getElementById("toastSuccess").classList.remove("show");
    }, 3000);
  } else {
    alert("Erro ao executar API");
  }
});
