// =============================
// ESTADO GLOBAL
// =============================

let grupoEditando = null;

let gruposCache = [];
let vendedoresCache = [];
let grupoSelecionado = null;
let vendedoresSelecionados = new Set();
let vendedoresJaVinculados = new Set();

// =============================
// INICIALIZAÇÃO GLOBAL
// =============================

document.addEventListener('DOMContentLoaded', () => {

    // STREAM
    const btnInserir = document.getElementById("btnInserir");
    if (btnInserir) {
        btnInserir.addEventListener("click", iniciarStreamApi);
    }

    // GRUPOS CRUD
    const btnSalvarGrupo = document.getElementById('btnSalvarGrupo');
    if (btnSalvarGrupo) {
        btnSalvarGrupo.addEventListener('click', salvarGrupo);
        carregarGrupos();
    }

    // VÍNCULOS
    if (document.getElementById('grupoSearch')) {

        carregarGruposLista();
        carregarVendedores();

        document.getElementById('grupoSearch')
            .addEventListener('input', filtrarGrupos);

        document.getElementById('vendedorSearch')
            .addEventListener('input', filtrarVendedores);

        document.getElementById('btnVincular')
            .addEventListener('click', vincularVendedor);
    }

    // RANKING CONTROLE
    if (document.getElementById('rankingGrupoSelect')) {

        carregarGruposRanking();
        atualizarLabelMesRanking();

        document.getElementById('rankingGrupoSelect')
            .addEventListener('change', carregarStatusRanking);

        document.getElementById('btnFecharRanking')
            .addEventListener('click', fecharRanking);

        document.getElementById('btnReabrirRanking')
            .addEventListener('click', reabrirRanking);
    }

    // MÉTRICAS
    if (document.getElementById('metricaTableBody')) {
        carregarMetricas();
    }

    // REGRAS DO RANKING
    if (document.getElementById('regraRankTipo')) {

        carregarTiposRanking();
        carregarMetricasSelectRegras();

        document.getElementById('regraRankTipo')
            ?.addEventListener('change', carregarRegras);

        document.getElementById('btnSalvarRegra')
            ?.addEventListener('click', salvarRegra);
    }

    // SNAPSHOT + ENGINE
    if (document.getElementById('btnGerarSnapshot')) {

        document.getElementById('btnGerarSnapshot')
            ?.addEventListener('click', gerarSnapshot);

        document.getElementById('btnCalcularRanking')
            ?.addEventListener('click', calcularRanking);
    }
});

// =============================
// STREAM API
// =============================

async function iniciarStreamApi() {

    const api = document.getElementById("selectApi").value;
    const dataInicial = document.getElementById("dataInicial").value;
    const dataFinal = document.getElementById("dataFinal").value;

    if (!api) {
        alert("Selecione a API");
        return;
    }

    const logArea = document.getElementById("logArea");
    logArea.innerText = "Iniciando...";

    const response = await fetch("/run-api-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: api, dataInicial, dataFinal }),
    });

    if (!response.ok) {
        alert("Erro ao iniciar stream");
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const texto = decoder.decode(value, { stream: true });

        texto.split("\n").forEach((linha) => {
            if (linha.startsWith("data: ")) {
                const msg = linha.replace("data: ", "").trim();
                logArea.innerText += "\n" + msg;
                logArea.scrollTop = logArea.scrollHeight;
            }
        });
    }

    console.log("Stream finalizada.");
}

// =============================
// GRUPOS
// =============================

async function carregarGrupos() {

    const response = await fetch('/api/dominio/grupos');
    const grupos = await response.json();

    const tbody = document.getElementById('grupoTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    grupos.forEach(grupo => {

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-800">${grupo.nome}</td>
            <td class="px-6 py-4 text-gray-600">${grupo.descricao || ''}</td>
            <td class="px-6 py-4 text-center">
                <button onclick="editarGrupo(${grupo.grupo_id})"
                    class="text-blue-600 hover:text-blue-800 font-semibold mr-4">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button onclick="excluirGrupo(${grupo.grupo_id})"
                    class="text-red-600 hover:text-red-800 font-semibold">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function salvarGrupo() {

    const nome = document.getElementById('grupoNome').value.trim();
    const descricao = document.getElementById('grupoDescricao').value.trim();

    if (!nome) {
        alert('Informe o nome do grupo');
        return;
    }

    if (grupoEditando) {

        const response = await fetch(`/api/dominio/grupos/${grupoEditando}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, descricao })
        });

        if (!response.ok) return tratarErroGrupo(response);

        grupoEditando = null;
        document.getElementById('btnSalvarGrupo').innerText = 'Salvar';

    } else {

        const response = await fetch('/api/dominio/grupos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, descricao })
        });

        if (!response.ok) return tratarErroGrupo(response);
    }

    document.getElementById('grupoNome').value = '';
    document.getElementById('grupoDescricao').value = '';

    carregarGrupos();
}

function tratarErroGrupo(response) {
    if (response.status === 404) {
        alert('Grupo não encontrado');
    } else if (response.status === 409) {
        alert('Já existe um grupo com esse nome');
    } else {
        alert('Erro ao salvar grupo');
    }
}

async function editarGrupo(id) {

    const response = await fetch(`/api/dominio/grupos/${id}`);
    const grupo = await response.json();

    document.getElementById('grupoNome').value = grupo.nome;
    document.getElementById('grupoDescricao').value = grupo.descricao || '';

    grupoEditando = id;
    document.getElementById('btnSalvarGrupo').innerText = 'Atualizar';
}

async function excluirGrupo(id) {

    if (!confirm('Deseja realmente excluir este grupo?')) return;

    await fetch(`/api/dominio/grupos/${id}`, {
        method: 'DELETE'
    });

    carregarGrupos();
}

// =============================
// VINCULAR VENDEDORES
// =============================

async function carregarGruposLista() {
    const res = await fetch('/api/dominio/grupos');
    gruposCache = await res.json();
    renderGrupos(gruposCache);
}

async function carregarVendedores() {
    const res = await fetch('/api/dominio/vendedores/ativos');
    vendedoresCache = await res.json();
    renderVendedores(vendedoresCache);
}

function filtrarGrupos() {
    const termo = document.getElementById('grupoSearch').value.toLowerCase();
    const filtrados = gruposCache.filter(g =>
        g.nome.toLowerCase().includes(termo)
    );
    renderGrupos(filtrados);
}

function filtrarVendedores() {
    const termo = document.getElementById('vendedorSearch').value.toLowerCase();
    const filtrados = vendedoresCache.filter(v =>
        v.nome.toLowerCase().includes(termo)
    );
    renderVendedores(filtrados);
}

function renderGrupos(lista) {

    const container = document.getElementById('grupoList');
    container.innerHTML = '';

    lista.forEach(g => {
        container.innerHTML += `
            <div onclick="selecionarGrupo(${g.grupo_id})"
                class="px-4 py-3 cursor-pointer transition hover:bg-blue-100
                ${grupoSelecionado === g.grupo_id ? 'bg-blue-200 font-semibold' : ''}">
                ${g.nome}
            </div>
        `;
    });
}

function renderVendedores(lista) {

    const container = document.getElementById('vendedorList');
    container.innerHTML = '';

    lista.forEach(v => {

        const jaVinculado = vendedoresJaVinculados.has(v.vendedor_id);
        const selecionado = vendedoresSelecionados.has(v.vendedor_id);

        container.innerHTML += `
            <div onclick="selecionarVendedor(${v.vendedor_id})"
                class="px-4 py-3 cursor-pointer transition flex justify-between items-center
                ${jaVinculado ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : ''}
                ${selecionado ? 'bg-green-200 font-semibold' : 'hover:bg-green-100'}">
                <span>${v.nome}</span>
                ${jaVinculado
                ? '<i class="fa-solid fa-check text-green-600"></i>'
                : selecionado
                    ? '<i class="fa-solid fa-square-check text-green-600"></i>'
                    : ''
            }
            </div>
        `;
    });
}

function selecionarGrupo(id) {
    grupoSelecionado = id;
    renderGrupos(gruposCache);
    carregarVinculados();
}

function selecionarVendedor(id) {

    if (vendedoresJaVinculados.has(id)) return;

    if (vendedoresSelecionados.has(id)) {
        vendedoresSelecionados.delete(id);
    } else {
        vendedoresSelecionados.add(id);
    }

    renderVendedores(vendedoresCache);
}

async function vincularVendedor() {

    if (!grupoSelecionado || vendedoresSelecionados.size === 0) {
        alert('Selecione grupo e pelo menos um vendedor');
        return;
    }

    for (const vendedor_id of vendedoresSelecionados) {
        await fetch('/api/grupos-vendedores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grupo_id: grupoSelecionado,
                vendedor_id
            })
        });
    }

    vendedoresSelecionados.clear();
    carregarVinculados();
}

async function carregarVinculados() {

    if (!grupoSelecionado) return;

    const res = await fetch(`/api/grupos-vendedores/${grupoSelecionado}`);
    const vinculados = await res.json();

    const tbody = document.getElementById('vinculadosTableBody');
    tbody.innerHTML = '';

    vendedoresJaVinculados.clear();

    vinculados.forEach(item => {

        vendedoresJaVinculados.add(item.vendedor_id);

        tbody.innerHTML += `
            <tr>
                <td class="px-6 py-4 font-medium text-gray-800">
                    ${item.vendedor_nome}
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="removerVinculo(${item.grupo_id}, ${item.vendedor_id})"
                        class="text-red-600 hover:text-red-800">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    renderVendedores(vendedoresCache);
}

async function removerVinculo(grupo_id, vendedor_id) {

    if (!confirm('Remover vínculo?')) return;

    await fetch(`/api/grupos-vendedores/${grupo_id}/${vendedor_id}`, {
        method: 'DELETE'
    });

    carregarVinculados();
}

// =============================
// CONTROLE RANKING
// =============================

function atualizarLabelMesRanking() {

    const mesInput = document.getElementById('mesAno')?.value;
    const label = document.getElementById('rankingMesLabel');

    if (!mesInput || !label) {
        if (label) label.textContent = '';
        return;
    }

    const [ano, mes] = mesInput.split('-');

    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril',
        'Maio', 'Junho', 'Julho', 'Agosto',
        'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    label.textContent = `${meses[parseInt(mes) - 1]} / ${ano}`;
}

async function carregarGruposRanking() {

    try {
        const res = await fetch('/api/dominio/grupos');
        const grupos = await res.json();

        const select = document.getElementById('rankingGrupoSelect');
        if (!select) return;

        select.innerHTML = `<option value="all" selected>Todos</option>`;

        grupos.forEach(g => {
            select.innerHTML += `
                <option value="${g.grupo_id}">
                    ${g.nome}
                </option>
            `;
        });

        carregarStatusRanking();

    } catch (err) {
        console.error('Erro ao carregar grupos do ranking', err);
    }
}

async function carregarStatusRanking() {

    try {

        const mes = document.getElementById('mesAno')?.value;
        const grupo_id = document.getElementById('rankingGrupoSelect')?.value;
        const statusEl = document.getElementById('rankingStatus');

        if (!mes || !grupo_id || !statusEl) return;

        const btnFechar = document.getElementById('btnFecharRanking');
        const btnReabrir = document.getElementById('btnReabrirRanking');

        if (grupo_id === 'all') {

            statusEl.textContent = 'Todos os Grupos Selecionados';
            statusEl.className = 'ml-2 font-semibold text-gray-600';

            if (btnFechar) btnFechar.disabled = false;
            if (btnReabrir) btnReabrir.disabled = false;

            return;
        }

        const res = await fetch(
            `/api/ranking/config?mes_referente=${mes}-01&grupo_id=${grupo_id}`
        );

        if (!res.ok) {
            statusEl.textContent = 'SEM CONFIG';
            return;
        }

        const data = await res.json();

        if (data.fechado) {

            statusEl.textContent = 'Fechado';
            statusEl.className = 'ml-2 font-semibold text-red-600';

            if (btnFechar) btnFechar.disabled = true;
            if (btnReabrir) btnReabrir.disabled = false;

        } else {

            statusEl.textContent = 'Aberto';
            statusEl.className = 'ml-2 font-semibold text-green-600';

            if (btnFechar) btnFechar.disabled = false;
            if (btnReabrir) btnReabrir.disabled = true;
        }

    } catch (err) {
        console.error('Erro ao carregar status do ranking', err);
    }
}

async function fecharRanking() {

    const mes = document.getElementById('mesAno')?.value;
    const grupo_id = document.getElementById('rankingGrupoSelect')?.value;

    if (!mes || !grupo_id) {
        alert('Selecione mês e grupo');
        return;
    }

    if (!confirm('Deseja realmente FECHAR?')) return;

    try {

        if (grupo_id === 'all') {

            const resGrupos = await fetch('/api/dominio/grupos');
            const grupos = await resGrupos.json();

            for (const g of grupos) {
                await fetch('/api/ranking/config/fechar', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mes_referente: `${mes}-01`,
                        grupo_id: g.grupo_id
                    })
                });
            }

            alert('Ranking fechado para TODOS os grupos.');
            carregarStatusRanking();
            return;
        }

        const res = await fetch('/api/ranking/config/fechar', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mes_referente: `${mes}-01`,
                grupo_id
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || 'Erro ao fechar ranking');
            return;
        }

        alert(data.message);
        carregarStatusRanking();

    } catch (err) {
        console.error('Erro ao fechar ranking', err);
    }
}

async function reabrirRanking() {

    const mes = document.getElementById('mesAno')?.value;
    const grupo_id = document.getElementById('rankingGrupoSelect')?.value;

    if (!mes || !grupo_id) {
        alert('Selecione mês e grupo');
        return;
    }

    if (!confirm('Deseja realmente REABRIR?')) return;

    try {

        if (grupo_id === 'all') {

            const resGrupos = await fetch('/api/dominio/grupos');
            const grupos = await resGrupos.json();

            for (const g of grupos) {
                await fetch('/api/ranking/config/reabrir', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        mes_referente: `${mes}-01`,
                        grupo_id: g.grupo_id
                    })
                });
            }

            alert('Ranking reaberto para TODOS os grupos.');
            carregarStatusRanking();
            return;
        }

        const res = await fetch('/api/ranking/config/reabrir', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mes_referente: `${mes}-01`,
                grupo_id
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || 'Erro ao reabrir ranking');
            return;
        }

        alert(data.message);
        carregarStatusRanking();

    } catch (err) {
        console.error('Erro ao reabrir ranking', err);
    }
}

// =============================
// MÉTRICAS
// =============================

let metricaEditando = null;

async function carregarMetricas() {

    const response = await fetch('/api/ranking/metricas');
    const metricas = await response.json();

    const tbody = document.getElementById('metricaTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    metricas.forEach(m => {

        const tr = document.createElement('tr');

        tr.innerHTML = `
            <td class="px-6 py-4 font-medium">${m.metrica}</td>
            <td class="px-6 py-4">${m.descricao || ''}</td>
        `;

        tbody.appendChild(tr);
    });
}

// =============================
// REGRAS DO RANKING
// =============================

let regraEditando = null;
let metricasCacheRegras = [];

async function carregarTiposRanking() {

    const res = await fetch('/api/ranking/tipos');
    const tipos = await res.json();

    const select = document.getElementById('regraRankTipo');
    if (!select) return;

    select.innerHTML = '<option value="">Selecione...</option>';

    tipos.forEach(t => {
        select.innerHTML += `
            <option value="${t.id}">
                ${t.nome}
            </option>
        `;
    });
}

async function carregarMetricasSelectRegras() {

    const res = await fetch('/api/ranking/metricas');
    metricasCacheRegras = await res.json();

    const selectMetrica = document.getElementById('regraMetrica');
    const selectMultiplica = document.getElementById('regraMultiplica');

    if (!selectMetrica || !selectMultiplica) return;

    selectMetrica.innerHTML = '<option value="">Selecione Métrica</option>';
    selectMultiplica.innerHTML = '<option value="">Nenhuma</option>';

    metricasCacheRegras.forEach(m => {

        selectMetrica.innerHTML += `
            <option value="${m.id}">${m.metrica}</option>
        `;

        selectMultiplica.innerHTML += `
            <option value="${m.id}">${m.metrica}</option>
        `;
    });
}

async function carregarRegras() {
    const rank_tipo_id = document.getElementById('regraRankTipo')?.value;
    if (!rank_tipo_id) return;

    const res = await fetch(`/api/ranking/regras/${rank_tipo_id}`);
    const regras = await res.json();

    const tbody = document.getElementById('regrasTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // 1) Agrupar por metrica_id
    const agrupadas = {};
    for (const r of regras) {
        if (!agrupadas[r.metrica_id]) agrupadas[r.metrica_id] = [];
        agrupadas[r.metrica_id].push(r);
    }

    // 2) Transformar em array de grupos e ordenar por "ordem" (menor ordem da métrica)
    const gruposOrdenados = Object.entries(agrupadas).map(([metrica_id, regrasDaMetrica]) => {
        const ordemGrupo = Math.min(...regrasDaMetrica.map(x => Number(x.ordem || 0) || 0));
        return { metrica_id: Number(metrica_id), ordem: ordemGrupo, regras: regrasDaMetrica };
    });

    gruposOrdenados.sort((a, b) => a.ordem - b.ordem);

    // 3) Render
    for (const grupo of gruposOrdenados) {
        const metrica = metricasCacheRegras.find(m => m.id == grupo.metrica_id);

        // Título da métrica (draggable)
        tbody.innerHTML += `
      <tr class="bg-gray-200 font-semibold metrica-drag" data-metrica="${grupo.metrica_id}">
        <td colspan="6" class="px-4 py-3 uppercase text-gray-700 cursor-move">
          <i class="fa-solid fa-grip-lines mr-2"></i>
          ${metrica?.metrica || ''}
        </td>
      </tr>
    `;

        // Regras da métrica (ordenar por min_valor dentro do grupo)
        grupo.regras.sort((a, b) => (Number(a.min_valor ?? 0) - Number(b.min_valor ?? 0)));

        for (const r of grupo.regras) {
            const multiplica = metricasCacheRegras.find(m => m.id == r.multiplica_por_metrica_id);

            tbody.innerHTML += `
        <tr class="bg-white">
          <td class="px-4 py-3"></td>
          <td class="px-4 py-3">${r.min_valor ?? ''}</td>
          <td class="px-4 py-3">${r.max_valor ?? ''}</td>
          <td class="px-4 py-3">${r.pontos}</td>
          <td class="px-4 py-3">${multiplica?.metrica || '-'}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="editarRegra(${r.id})" class="text-blue-600 mr-3">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="excluirRegra(${r.id})" class="text-red-600">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      `;
        }
    }

    ativarDragMetricas();
}

async function salvarRegra() {

    const rank_tipo_id = document.getElementById('regraRankTipo').value;
    const metrica_id = document.getElementById('regraMetrica').value;
    const min_valor = document.getElementById('regraMin').value || null;
    const max_valor = document.getElementById('regraMax').value || null;
    const pontos = document.getElementById('regraPontos').value || 0;
    const multiplica_por_metrica_id =
        document.getElementById('regraMultiplica').value || null;

    if (!rank_tipo_id || !metrica_id) {
        alert('Selecione tipo e métrica');
        return;
    }

    const body = {
        rank_tipo_id,
        metrica_id,
        min_valor,
        max_valor,
        pontos,
        multiplica_por_metrica_id
    };

    if (regraEditando) {

        await fetch(`/api/ranking/regras/${regraEditando}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        regraEditando = null;

    } else {

        await fetch('/api/ranking/regras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    }

    limparFormularioRegra();
    carregarRegras();
}

async function editarRegra(id) {

    const rank_tipo_id = document.getElementById('regraRankTipo').value;

    const res = await fetch(`/api/ranking/regras/${rank_tipo_id}`);
    const regras = await res.json();

    const regra = regras.find(r => r.id == id);
    if (!regra) return;

    document.getElementById('regraMetrica').value = regra.metrica_id;
    document.getElementById('regraMin').value = regra.min_valor ?? '';
    document.getElementById('regraMax').value = regra.max_valor ?? '';
    document.getElementById('regraPontos').value = regra.pontos;
    document.getElementById('regraMultiplica').value =
        regra.multiplica_por_metrica_id || '';

    regraEditando = id;
}

async function excluirRegra(id) {

    if (!confirm('Excluir regra?')) return;

    await fetch(`/api/ranking/regras/${id}`, {
        method: 'DELETE'
    });

    carregarRegras();
}

function limparFormularioRegra() {

    document.getElementById('regraMetrica').value = '';
    document.getElementById('regraMin').value = '';
    document.getElementById('regraMax').value = '';
    document.getElementById('regraPontos').value = '';
    document.getElementById('regraMultiplica').value = '';
}

function ativarDragMetricas() {

    const tbody = document.getElementById('regrasTableBody');

    new Sortable(tbody, {
        animation: 150,
        handle: '.metrica-drag',
        draggable: '.metrica-drag',

        onEnd: async function () {

            const metricas = document.querySelectorAll('.metrica-drag');

            const novaOrdem = [];

            metricas.forEach((linha, index) => {

                const metrica_id = linha.dataset.metrica;

                novaOrdem.push({
                    metrica_id: Number(metrica_id),
                    ordem: index + 1
                });

            });

            console.log("Nova ordem enviada:", novaOrdem);

            await fetch('/api/ranking/regras/ordem', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(novaOrdem)
            });

            // 🔥 recarrega tudo (igual F5 mas sem reload da página)
            await carregarRegras();

        }
    });
}

// =============================
// SNAPSHOT + ENGINE RANKING
// =============================

function log(msg) {

    const logArea = document.getElementById('logArea');
    if (!logArea) return;

    logArea.innerHTML += msg + "\n";
    logArea.scrollTop = logArea.scrollHeight;
}

async function gerarSnapshot() {

    const mes = document.getElementById('mesAno')?.value;

    if (!mes) {
        alert('Selecione o mês primeiro');
        return;
    }

    log("⏳ Gerando snapshot...");

    try {

        const res = await fetch('/api/ranking/snapshot/gerar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mes_referente: mes })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message);

        log("✅ Snapshot gerado com sucesso!");

    } catch (err) {

        log("❌ Erro: " + err.message);
    }
}

async function calcularRanking() {

    const grupo_id = document.getElementById('rankingGrupoSelect')?.value;
    const mes = document.getElementById('mesAno')?.value;

    if (!grupo_id || !mes) {
        alert('Selecione grupo e mês');
        return;
    }

    if (grupo_id === 'all') {
        alert('Selecione um grupo específico');
        return;
    }

    if (!confirm('Deseja recalcular o ranking deste grupo?'))
        return;

    try {

        const res = await fetch('/api/ranking/engine/calcular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grupo_id,
                mes_referente: `${mes}-01`
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message);
            return;
        }

        alert('Ranking recalculado com sucesso!');

    } catch (err) {

        console.error(err);
        alert('Erro ao calcular ranking');
    }
}

async function calcularRanking() {

    const grupo_id = document.getElementById('rankingGrupoSelect')?.value;
    const mes = document.getElementById('mesAno')?.value;

    if (!mes) {
        alert('Selecione o mês');
        return;
    }

    if (!confirm('Deseja recalcular o ranking?'))
        return;

    try {

        let url = '/api/ranking/engine/calcular';
        let body = {
            mes_referente: mes
        };

        // se for um grupo específico
        if (grupo_id && grupo_id !== 'all') {
            body.grupo_id = grupo_id;
        } else {
            // calcular todos
            url = '/api/ranking/engine/calcular-geral';
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message);
            return;
        }

        alert('Ranking recalculado com sucesso!');

    } catch (err) {

        console.error(err);
        alert('Erro ao calcular ranking');
    }
}