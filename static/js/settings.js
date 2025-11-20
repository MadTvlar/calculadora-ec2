const selectApi = document.getElementById("selectApi");
const aplicar = document.getElementById("btnInserir");

aplicar.addEventListener("click", async () => {
    const key = selectApi.value;

    if (!key) return;

    console.log("Executando:", key);

    const response = await fetch('/run-api', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: key })
    });

    const data = await response.json();
    console.log("Resultado:", data);
});
