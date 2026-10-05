let chamados = [];
let filtroSetor    = 'todos';
let filtroAtendente = null;
let filtroData     = 'todos';
let ordemAtual     = 'data_desc';
let modalChamadoId = null;
let periodoDash    = 'mes';
let grafAtendente  = null;
let grafDemanda    = null;
let setorDash = 'todos';
let grafLinha = null;


// ─── Relógio ──────────────────────────────────────────────────────────────────
function iniciarRelogio() {
  function atualizar() {
    const el = document.getElementById('relogio');
    if (el) el.textContent = new Date().toLocaleString('pt-BR');
  }
  atualizar();
  setInterval(atualizar, 1000);
}

// ─── Tema ─────────────────────────────────────────────────────────────────────
function alternarTema() {
  const html = document.documentElement;
  const btn  = document.getElementById('btn-tema');
  const temaAtual = html.getAttribute('data-tema');
  if (temaAtual === 'escuro') {
    html.setAttribute('data-tema', 'claro');
    btn.textContent = '🌑';
    document.documentElement.style.setProperty('--bg', '#f8fafc');
    document.documentElement.style.setProperty('--surface', '#ffffff');
    document.documentElement.style.setProperty('--surface2', '#f1f5f9');
    document.documentElement.style.setProperty('--border', '#e2e8f0');
    document.documentElement.style.setProperty('--border2', '#cbd5e1');
    document.documentElement.style.setProperty('--text', '#0f172a');
    document.documentElement.style.setProperty('--text2', '#334155');
    document.documentElement.style.setProperty('--text3', '#64748b');
    document.body.style.background = '#f8fafc';
    document.body.style.color = '#0f172a';
  } else {
    html.setAttribute('data-tema', 'escuro');
    btn.textContent = '🌙';
    document.documentElement.style.setProperty('--bg', '#020617');
    document.documentElement.style.setProperty('--surface', '#1E293B');
    document.documentElement.style.setProperty('--surface2', '#334155');
    document.documentElement.style.setProperty('--border', '#334155');
    document.documentElement.style.setProperty('--border2', '#475569');
    document.documentElement.style.setProperty('--text', '#FFFFFF');
    document.documentElement.style.setProperty('--text2', '#CBD5E1');
    document.documentElement.style.setProperty('--text3', '#94A3B8');
    document.body.style.background = '#020617';
    document.body.style.color = '#FFFFFF';
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
function entrar() {
  const senha = document.getElementById('input-senha').value;
  if (senha === '1212') {
    document.getElementById('tela-login').classList.add('hidden');
    document.getElementById('tela-painel').classList.remove('hidden');
    iniciarRelogio();
    iniciarPainel();
  } else {
    document.getElementById('erro-senha').classList.remove('hidden');
    document.getElementById('input-senha').value = '';
    document.getElementById('input-senha').focus();
  }
}

function sair() { location.reload(); }

// ─── Abas ─────────────────────────────────────────────────────────────────────
function trocarAba(aba) {
  document.getElementById('tela-chamados').classList.toggle('hidden', aba !== 'chamados');
  document.getElementById('tela-dashboard').classList.toggle('hidden', aba !== 'dashboard');
  document.getElementById('aba-chamados').classList.toggle('active', aba === 'chamados');
  document.getElementById('aba-dashboard').classList.toggle('active', aba === 'dashboard');
  if (aba === 'dashboard') renderizarDashboard();
}

// ─── Firebase ─────────────────────────────────────────────────────────────────
function iniciarPainel() {
  db.collection('chamados')
    .orderBy('data', 'desc')
    .onSnapshot(snapshot => {
      chamados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      atualizarStats();
      renderizarAtendentes();
      renderizarChamados();
    });
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function atualizarStats() {
  const hoje  = new Date();
  const dHoje = hoje.toLocaleDateString('pt-BR');
  const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const parsarData = str => {
    if (!str) return null;
    const [date, time] = str.split(', ');
    const [d, m, y] = date.split('/');
    return new Date(`${y}-${m}-${d}T${time || '00:00:00'}`);
  };
  document.getElementById('stat-total').textContent  = chamados.length;
  document.getElementById('stat-hoje').textContent   = chamados.filter(c => c.data && c.data.startsWith(dHoje)).length;
  document.getElementById('stat-semana').textContent = chamados.filter(c => { const d = parsarData(c.data); return d && d >= inicioSemana; }).length;
  document.getElementById('stat-mes').textContent    = chamados.filter(c => { const d = parsarData(c.data); return d && d >= inicioMes; }).length;
}

// ─── Tempo relativo ───────────────────────────────────────────────────────────
function tempoRelativo(str) {
  if (!str) return '';
  const [date, time] = str.split(', ');
  const [d, m, y] = date.split('/');
  const data = new Date(`${y}-${m}-${d}T${time || '00:00:00'}`);
  const diff = Math.floor((new Date() - data) / 1000);
  if (diff < 60)     return 'agora mesmo';
  if (diff < 3600)   return `há ${Math.floor(diff/60)} min`;
  if (diff < 86400)  return `há ${Math.floor(diff/3600)} h`;
  if (diff < 604800) return `há ${Math.floor(diff/86400)} dia${Math.floor(diff/86400) > 1 ? 's' : ''}`;
  return str;
}

// ─── Colaboradores ────────────────────────────────────────────────────────────
function renderizarAtendentes() {
  const lista = document.getElementById('lista-colaboradores');
  if (!lista) return;
  lista.innerHTML = '';
  const base = filtroSetor === 'todos' ? chamados : chamados.filter(c => c.setor === filtroSetor);
  const nomesUnicos = [...new Set(base.map(c => c.atendente))];
  nomesUnicos.forEach(nome => {
    const quantidade = base.filter(c => c.atendente === nome).length;
    const btn = document.createElement('button');
    btn.className = filtroAtendente === nome ? 'chip active' : 'chip';
    btn.textContent = `${nome} (${quantidade})`;
    btn.onclick = () => {
      filtroAtendente = filtroAtendente === nome ? null : nome;
      renderizarChamados();
      renderizarAtendentes();
    };
    lista.appendChild(btn);
  });
}

// ─── Filtros ──────────────────────────────────────────────────────────────────
function filtrar(setor, btn) {
  filtroSetor = setor;
  filtroAtendente = null;
  document.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const wrap = document.getElementById('colaboradores-wrap');
  wrap.style.display = setor === 'todos' ? 'none' : 'block';
  renderizarAtendentes();
  renderizarChamados();
}

function filtrarData(periodo, btn) {
  filtroData = periodo;
  document.querySelectorAll('.chip-data').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderizarChamados();
}

function ordenar(valor) {
  ordemAtual = valor;
  renderizarChamados();
}

// ─── Renderizar chamados ──────────────────────────────────────────────────────
function renderizarChamados() {
  const lista    = document.getElementById('lista-chamados');
  const vazio    = document.getElementById('vazio');
  const contador = document.getElementById('contador');
  if (!lista) return;

  const hoje = new Date();
  const dHoje = hoje.toLocaleDateString('pt-BR');
  const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const parsarData = str => {
    if (!str) return null;
    const [date, time] = str.split(', ');
    const [d, m, y] = date.split('/');
    return new Date(`${y}-${m}-${d}T${time || '00:00:00'}`);
  };

  const busca = (document.getElementById('busca-input')?.value || '').toLowerCase().trim();
  let filtrados = [...chamados];

  if (filtroSetor !== 'todos') filtrados = filtrados.filter(c => c.setor === filtroSetor);
  if (filtroAtendente)         filtrados = filtrados.filter(c => c.atendente === filtroAtendente);
  if (filtroData === 'hoje')   filtrados = filtrados.filter(c => c.data && c.data.startsWith(dHoje));
  if (filtroData === 'semana') filtrados = filtrados.filter(c => { const d = parsarData(c.data); return d && d >= inicioSemana; });
  if (filtroData === 'mes')    filtrados = filtrados.filter(c => { const d = parsarData(c.data); return d && d >= inicioMes; });
  if (busca) filtrados = filtrados.filter(c =>
    (c.atendente || '').toLowerCase().includes(busca) ||
    (c.demanda   || '').toLowerCase().includes(busca) ||
    (c.texto     || '').toLowerCase().includes(busca)
  );

  filtrados.sort((a, b) => {
    if (ordemAtual === 'data_desc') return (parsarData(b.data) || 0) - (parsarData(a.data) || 0);
    if (ordemAtual === 'data_asc')  return (parsarData(a.data) || 0) - (parsarData(b.data) || 0);
    if (ordemAtual === 'atendente') return (a.atendente || '').localeCompare(b.atendente || '');
    if (ordemAtual === 'setor')     return (a.setor || '').localeCompare(b.setor || '');
    return 0;
  });

  lista.innerHTML = '';
  contador.textContent = `${filtrados.length} chamado${filtrados.length !== 1 ? 's' : ''} encontrado${filtrados.length !== 1 ? 's' : ''}`;

  if (filtrados.length === 0) { vazio.classList.remove('hidden'); return; }
  vazio.classList.add('hidden');

  filtrados.forEach(chamado => {
    const card = document.createElement('div');
    card.className = 'chamado-card';
    const nomeSetor = { telecom: 'Telecom' }[chamado.setor] || chamado.setor;
    const idCliente = extrairId(chamado.texto);
    const obsHtml = chamado.observacao
      ? `<div class="chamado-obs"><div class="chamado-obs-label">Observação</div>${esc(chamado.observacao)}</div>`
      : '';
    card.innerHTML = `
      <div class="chamado-top" onclick="toggleCard('${chamado.id}')" style="cursor:pointer; margin-bottom:0;">
        <div class="chamado-info">
          <div class="chamado-titulo">
            ${esc(chamado.atendente)} — ${esc(chamado.demanda)}
            ${idCliente ? `<span class="badge-id">ID ${esc(idCliente)}</span>` : ''}
          </div>
          <div class="chamado-meta">
            <span class="badge-setor badge-${chamado.setor}">${nomeSetor}</span>
            <span title="${esc(chamado.data || '')}">${tempoRelativo(chamado.data)}</span>
          </div>
        </div>
        <span class="card-seta" id="seta-${chamado.id}">▸</span>
      </div>
      <div class="chamado-corpo hidden" id="corpo-${chamado.id}">
        <div class="chamado-texto" style="margin-top:12px;">${esc(chamado.texto)}</div>
        ${obsHtml}
        <div class="chamado-actions" style="margin-top:8px;">
         <button class="btn-copiar-chamado" id="btn-copiar-${chamado.id}" onclick="copiarChamado('${chamado.id}')">Copiar texto</button>
          <button class="btn-excluir" onclick="excluir('${chamado.id}')">Excluir</button>
        </div>
      </div>
    `;
    lista.appendChild(card);
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function filtrarDash(periodo, btn) {
  periodoDash = periodo;
  document.querySelectorAll('#tela-dashboard .chip-data').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderizarDashboard();
}

function filtrarSetorDash(setor, btn) {
  setorDash = setor;
  document.querySelectorAll('#filtro-setor-dash .chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
    document.getElementById('filtro-periodo-dash').style.display = 'flex';
  renderizarDashboard();
}

function getChamadosFiltradosDash() {
  const hoje = new Date();
  const inicioSemana = new Date(hoje); inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const parsarData = str => {
    if (!str) return null;
    const [date, time] = str.split(', ');
    const [d, m, y] = date.split('/');
    return new Date(`${y}-${m}-${d}T${time || '00:00:00'}`);
  };
  let resultado = chamados;
  if (periodoDash === 'semana') resultado = resultado.filter(c => { const d = parsarData(c.data); return d && d >= inicioSemana; });
  if (periodoDash === 'mes')    resultado = resultado.filter(c => { const d = parsarData(c.data); return d && d >= inicioMes; });
  if (setorDash !== 'todos')    resultado = resultado.filter(c => c.setor === setorDash);
  return resultado;
}

function renderizarDashboard() {
  const dados = getChamadosFiltradosDash();

  // ── Gráfico de barras: chamados por atendente ──
  const contagemAtendente = {};
  dados.forEach(c => { contagemAtendente[c.atendente || 'N/A'] = (contagemAtendente[c.atendente || 'N/A'] || 0) + 1; });
  const cores = ['#06B6D4','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1','#84CC16','#34D399'];
  const labelsAt = Object.keys(contagemAtendente).sort((a, b) => contagemAtendente[b] - contagemAtendente[a]);
  const valuesAt = labelsAt.map(l => contagemAtendente[l]);

  if (grafAtendente) grafAtendente.destroy();
  grafAtendente = new Chart(document.getElementById('grafico-atendente'), {
    type: 'bar',
    data: {
      labels: labelsAt,
      datasets: [{
        label: 'Chamados',
        data: valuesAt,
       backgroundColor: labelsAt.map((_, i) => cores[i % cores.length]),
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#94A3B8', stepSize: 1 }, grid: { color: '#1e293b' }, beginAtZero: true }
      }
    }
  });

  // ── Gráfico demandas mais abertas ──
  const contagemDemanda = {};
  dados.forEach(c => { contagemDemanda[c.demanda || 'N/A'] = (contagemDemanda[c.demanda || 'N/A'] || 0) + 1; });
  const labelsDem = Object.keys(contagemDemanda).sort((a, b) => contagemDemanda[b] - contagemDemanda[a]).slice(0, 8);
  const valuesDem = labelsDem.map(l => contagemDemanda[l]);

  if (grafDemanda) grafDemanda.destroy();
  grafDemanda = new Chart(document.getElementById('grafico-demanda'), {
    type: 'doughnut',
    data: {
      labels: labelsDem,
      datasets: [{
        data: valuesDem,
        backgroundColor: cores,
        borderWidth: 2,
        borderColor: '#020617'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94A3B8', font: { size: 11 }, padding: 12 }
        }
      }
    }
  });

  // ── Ranking ──
  const ranking = document.getElementById('ranking-lista');
  ranking.innerHTML = '';
  const sorted = Object.entries(contagemAtendente).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  sorted.forEach(([nome, qtd], i) => {
    const pct = Math.round((qtd / max) * 100);
    ranking.innerHTML += `
      <div class="ranking-item">
        <div class="ranking-pos">${i + 1}</div>
        <div class="ranking-info">
          <div class="ranking-nome">${esc(nome)}</div>
          <div class="ranking-bar-wrap">
            <div class="ranking-bar" style="width:${pct}%"></div>
          </div>
        </div>
        <div class="ranking-qtd">${qtd}</div>
      </div>
    `;
  });

// ── Gráfico de linha: chamados por dia por colaborador ──
  const diasMap = {};
   dados.forEach(c => {
    if (!c.data) return;
    let dia;
    if (typeof c.data === 'string') {
      dia = c.data.split(', ')[0];
    } else if (c.data.toDate) {
      dia = c.data.toDate().toLocaleDateString('pt-BR');
    } else {
      return;
    }
    const atendente = c.atendente || 'N/A';
    if (!diasMap[dia]) diasMap[dia] = {};
    diasMap[dia][atendente] = (diasMap[dia][atendente] || 0) + 1;
  });

  const diasOrdenados = Object.keys(diasMap).sort((a, b) => {
    const [da, ma, ya] = a.split('/'); const [db, mb, yb] = b.split('/');
    return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
  });

  const atendentesLinha = [...new Set(dados.map(c => c.atendente || 'N/A'))];

  const datasetsLinha = atendentesLinha.map((nome, i) => ({
    label: nome,
    data: diasOrdenados.map(dia => diasMap[dia]?.[nome] || 0),
    borderColor: cores[i % cores.length],
    backgroundColor: cores[i % cores.length] + '22',
    borderWidth: 2,
    pointRadius: 4,
    tension: 0.3,
    fill: false
  }));

  if (grafLinha) grafLinha.destroy();
  grafLinha = new Chart(document.getElementById('grafico-linha'), {
    type: 'line',
    data: { labels: diasOrdenados, datasets: datasetsLinha },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94A3B8', font: { size: 11 }, padding: 12 }
        }
      },
      scales: {
        x: { ticks: { color: '#94A3B8' }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#94A3B8', stepSize: 1 }, grid: { color: '#1e293b' }, beginAtZero: true }
      }
    }
  });
}
// ─── Toggle card ──────────────────────────────────────────────────────────────
function toggleCard(id) {
  const corpo = document.getElementById('corpo-' + id);
  const seta  = document.getElementById('seta-' + id);
  const aberto = !corpo.classList.contains('hidden');
  corpo.classList.toggle('hidden', aberto);
  seta.textContent = aberto ? '▸' : '▾';
}

// ─── Copiar ───────────────────────────────────────────────────────────────────
function copiarChamado(id) {
  const chamado = chamados.find(c => c.id === id);
  if (!chamado) return;

  const btn = document.getElementById('btn-copiar-' + id);

  function onCopiado() {
    if (btn) {
      btn.textContent = 'Copiado!';
      btn.style.borderColor = 'var(--accent)';
      btn.style.color = 'var(--accent)';
      setTimeout(() => {
        btn.textContent = 'Copiar texto';
        btn.style.borderColor = '';
        btn.style.color = '';
      }, 2000);
    }
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(chamado.texto).then(onCopiado);
  } else {
    const ta = document.createElement('textarea');
    ta.value = chamado.texto;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); onCopiado(); } catch(e) {}
    document.body.removeChild(ta);
  }
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function abrirModal(id) {
  modalChamadoId = id;
  const chamado = chamados.find(c => c.id === id);
  document.getElementById('modal-texto').value = chamado?.observacao || '';
  document.getElementById('modal-obs').classList.remove('hidden');
  setTimeout(() => document.getElementById('modal-texto').focus(), 50);
}

function fecharModal() {
  document.getElementById('modal-obs').classList.add('hidden');
  modalChamadoId = null;
}

function salvarObservacao() {
  const obs = document.getElementById('modal-texto').value.trim();
  db.collection('chamados').doc(modalChamadoId).update({ observacao: obs })
    .catch(err => console.error('Erro ao salvar obs:', err));
  fecharModal();
}

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal-obs');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) fecharModal(); });
});

// ─── Excluir ──────────────────────────────────────────────────────────────────
function excluir(id) {
  if (!confirm('Excluir este chamado?')) return;
  db.collection('chamados').doc(id).delete()
    .catch(err => console.error('Erro ao excluir:', err));
}

function confirmarLimpar() {
  if (!confirm('Deseja excluir TODOS os chamados? Esta ação não pode ser desfeita.')) return;
  db.collection('chamados').get().then(snap => {
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }).catch(err => console.error('Erro ao limpar:', err));
}

// ─── Exportar CSV ─────────────────────────────────────────────────────────────
function exportarCSV() {
  if (chamados.length === 0) { alert('Nenhum chamado para exportar.'); return; }
  const cabecalho = ['Data', 'Setor', 'Atendente', 'Demanda', 'Subtipo', 'ID Cliente', 'Observação'];
  const linhas = chamados.map(c => [
    c.data || '', c.setor || '', c.atendente || '', c.demanda || '',
    c.subtipo || '', extrairId(c.texto) || '', c.observacao || ''
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'));
  const csv = [cabecalho.join(';'), ...linhas].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `chamados_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Utilitários ──────────────────────────────────────────────────────────────
function extrairId(texto) {
  if (!texto) return null;
  const match = texto.match(/ID cliente[:\s]+(\d+)/i);
  return match ? match[1] : null;
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
