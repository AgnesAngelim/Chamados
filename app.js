// CONFIGURAÇÃO DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBlbavbldOZuw3_lerPFzP0TDHK9K5Sqeg",
  authDomain: "chamados-7e9e0.firebaseapp.com",
  projectId: "chamados-7e9e0",
  storageBucket: "chamados-7e9e0.firebasestorage.app",
  messagingSenderId: "1018655787755",
  appId: "1:1018655787755:web:8835ed2dcc6460279b0cae"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ESTADO GLOBAL
let tipoAtual = '';
let atendenteAtual = '';
let setorAtual = '';
let demandaAtual = null;
let subAtual = null;
let scriptsCarregados = {};

const emails = {
  telecom: 'anacarolina.araujo@igreenenergy.com.br',
};

// TIPO
function selecionarTipo(tipo, btn) {
  tipoAtual = tipo;
  setorAtual = 'telecom';

  document.querySelectorAll('#passo-tipo .chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('passo-setor').classList.add('hidden');
  document.getElementById('passo-atendente').classList.add('hidden');
  document.getElementById('passo2').classList.add('hidden');
  document.getElementById('passo3').classList.add('hidden');
  document.getElementById('passo4').classList.add('hidden');
  document.getElementById('output-box').style.display = 'none';
  document.getElementById('btn-gerar').classList.add('hidden');

  // Atualiza label do botão conforme tipo
  const btnGerar = document.getElementById('btn-gerar');
  btnGerar.textContent = tipo === 'hub' ? 'Copiar script' : 'Gerar chamado';

  atendenteAtual = '';
  demandaAtual = null;
  subAtual = null;

  selecionarSetor('telecom', null);
}

// SELECIONAR SETOR
async function selecionarSetor(setor, btn) {
  setorAtual = setor;

  document.querySelectorAll('#passo-setor .chip').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  document.getElementById('passo-atendente').classList.add('hidden');
  document.getElementById('passo2').classList.add('hidden');
  document.getElementById('passo3').classList.add('hidden');
  document.getElementById('passo4').classList.add('hidden');
  document.getElementById('output-box').style.display = 'none';

  if (!scriptsCarregados[setor]) {
    const listaAt = document.getElementById('atendente-list');
    listaAt.innerHTML = '<span style="color:var(--text3); font-size:13px;">Carregando...</span>';
    document.getElementById('passo-atendente').classList.remove('hidden');

    const doc = await db.collection('scripts').doc(setor).get();
    if (doc.exists) {
      scriptsCarregados[setor] = doc.data();
    } else {
      listaAt.innerHTML = '<span style="color:#f87171; font-size:13px;">Scripts não configurados. Acesse o Painel do Analista.</span>';
      return;
    }
  }

  const dados = scriptsCarregados[setor];
  const listaAt = document.getElementById('atendente-list');
  listaAt.innerHTML = '';

  (dados.atendentes || []).forEach(nome => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = nome;
    b.onclick = () => {
      document.querySelectorAll('#atendente-list .chip').forEach(c => c.classList.remove('active'));
      b.classList.add('active');
      atendenteAtual = nome;
      mostrarDemandas();
    };
    listaAt.appendChild(b);
  });

  document.getElementById('passo-atendente').classList.remove('hidden');
}

// MOSTRAR DEMANDAS
function mostrarDemandas() {
  const lista = document.getElementById('demanda-list');
  lista.innerHTML = '';

  document.getElementById('passo3').classList.add('hidden');
  document.getElementById('passo4').classList.add('hidden');
  document.getElementById('output-box').style.display = 'none';

  const dados = scriptsCarregados[setorAtual];
  if (!dados) return;

  const demandas = (dados.demandas || []).filter(d => {
    if (tipoAtual === 'clickup') return d.tipo === 'clickup';
    if (tipoAtual === 'hub') return d.tipo === 'hub';
    return !d.tipo || d.tipo === 'ticket';
  });

  if (!demandas.length) {
    lista.innerHTML = '<span style="color:var(--text3); font-size:13px;">Nenhuma demanda cadastrada para este tipo. Configure no Editor de Scripts.</span>';
    document.getElementById('passo2').classList.remove('hidden');
    return;
  }

  demandas.forEach(d => {
    const b = document.createElement('button');
    b.className = 'demanda-item';
    b.innerHTML = `<span>${d.nome}</span><span class="demanda-arrow">›</span>`;
    b.onclick = () => selecionarDemanda(d, b);
    lista.appendChild(b);
  });

  document.getElementById('passo2').classList.remove('hidden');
}

// SELECIONAR DEMANDA
function selecionarDemanda(d, btn) {
  demandaAtual = d;

  document.querySelectorAll('.demanda-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('output-box').style.display = 'none';
  document.getElementById('passo4').classList.add('hidden');

  const lista = document.getElementById('sub-list');
  lista.innerHTML = '';

  (d.subs || []).forEach(s => {
    const b = document.createElement('button');
    b.className = 'sub-item';
    b.textContent = s.sub;
    b.onclick = () => selecionarSub(s, b);
    lista.appendChild(b);
  });

  document.getElementById('passo3').classList.remove('hidden');
}

// SELECIONAR SUB
function selecionarSub(s, btn) {
  subAtual = s;

  document.querySelectorAll('.sub-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.getElementById('titulo-box').textContent = demandaAtual.nome;
  document.getElementById('subtitulo-box').textContent = s.sub;

  // Campos inline [[campo]]
  const wrap = document.getElementById('modelo-wrap');
  wrap.innerHTML = '';
  const texto = s.texto || '';
  const partes = texto.split(/(\[\[[\w_]+\]\])/g);
  partes.forEach(parte => {
    if (/^\[\[[\w_]+\]\]$/.test(parte)) {
      const fieldName = parte.slice(2, -2);
      const input = document.createElement('input');
      input.className = 'inline-field';
      input.id = 'inline_' + fieldName;
      input.placeholder = fieldName.replace(/_/g, ' ');
      wrap.appendChild(input);
    } else {
      wrap.appendChild(document.createTextNode(parte));
    }
  });

  // Campos dinâmicos — HUB não mostra campos
  document.getElementById('campos-extras').innerHTML = '';
  const fieldsRow = document.querySelector('.fields-row');
  fieldsRow.innerHTML = '';

  if (tipoAtual !== 'hub') {
    const campos = s.campos || [
      { id: 'id-cliente', label: 'ID cliente', obrigatorio: true },
      { id: 'id-licenciado', label: 'ID licenciado', obrigatorio: true }
    ];

    campos.forEach(campo => {
      const div = document.createElement('div');
      div.className = 'field-group';
      const fieldId = 'campo_' + (campo.id || campo.label.replace(/\s+/g, '_').toLowerCase());
      div.innerHTML = `
        <label class="field-label">
          ${campo.label}
          ${campo.obrigatorio ? '' : '<span style="color:var(--text3);font-weight:400;"> (opcional)</span>'}
        </label>
        <input type="text" class="field-input campo-dinamico"
          id="${fieldId}"
          data-label="${campo.label}"
          data-obrigatorio="${campo.obrigatorio ? 'true' : 'false'}"
          placeholder="Ex: 123456" />`;
      fieldsRow.appendChild(div);
    });
  }

  document.getElementById('passo4').classList.remove('hidden');
  document.getElementById('btn-gerar').classList.remove('hidden');
}

// GERAR / COPIAR SCRIPT
function gerarTexto() {
  if (!subAtual) return;
  if (!atendenteAtual) { alert('Selecione o atendente'); return; }

  // HUB: copia direto sem validar campos
  if (tipoAtual === 'hub') {
    let modelo = subAtual.texto || '';
    document.querySelectorAll('.inline-field').forEach(input => {
      const fieldName = input.id.replace('inline_', '');
      modelo = modelo.replace(`[[${fieldName}]]`, input.value || `[${fieldName}]`);
    });

    const texto = modelo;

    // Copia automaticamente
    function onCopiado() {
      const btn = document.getElementById('btn-gerar');
      btn.textContent = 'Copiado!';
      setTimeout(() => { btn.textContent = 'Copiar script'; }, 2000);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(onCopiado);
    } else {
      const ta = document.createElement('textarea');
      ta.value = texto; ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(ta); ta.focus(); ta.select();
      try { document.execCommand('copy'); onCopiado(); } catch(e) {}
      document.body.removeChild(ta);
    }

    // Salva no Firebase como registro de uso
    db.collection('chamados').add({
      tipo: 'hub',
      setor: setorAtual,
      atendente: atendenteAtual,
      demanda: demandaAtual.nome,
      titulo: demandaAtual.nome,
      subtipo: subAtual.sub,
      texto: texto,
      data: new Date().toLocaleString('pt-BR'),
    }).catch(err => console.error('Erro ao salvar:', err));

    return;
  }

  // TICKET / CLICKUP: fluxo normal
  const camposDinamicos = document.querySelectorAll('.campo-dinamico');
  let camposValores = {};
  let valido = true;

  camposDinamicos.forEach(input => {
    const valor = input.value.trim();
    const obrig = input.dataset.obrigatorio === 'true';
    const label = input.dataset.label;
    if (obrig && !valor) {
      alert(`Preencha o campo "${label}"`);
      input.focus();
      valido = false;
      return;
    }
    camposValores[label] = valor;
  });

  if (!valido) return;

  let modelo = subAtual.texto || '';
  document.querySelectorAll('.inline-field').forEach(input => {
    const fieldName = input.id.replace('inline_', '');
    modelo = modelo.replace(`[[${fieldName}]]`, input.value || `[${fieldName}]`);
  });

  const idCliente = camposValores['ID cliente'] || '';
  const idLicenciado = camposValores['ID licenciado'] || '';

  let texto = `${demandaAtual.nome}${idCliente ? ' - ID cliente: ' + idCliente : ''}\n`;
  texto += `Atendente: ${atendenteAtual}\n`;
  texto += `Corrigir: ${subAtual.sub}\n`;
  texto += modelo;

  camposDinamicos.forEach(input => {
    const label = input.dataset.label;
    const valor = input.value.trim();
    if (label !== 'ID cliente' && label !== 'ID licenciado' && valor) {
      texto += `\n${label}: ${valor}`;
    }
  });

  if (idCliente)    texto += `\nID cliente: ${idCliente}`;
  if (idLicenciado) texto += `\nID licenciado: ${idLicenciado}`;
  if (emails[setorAtual]) texto += `\nEmail: ${emails[setorAtual]}`;

  document.getElementById('output-text').textContent = texto;

  db.collection('chamados').add({
    tipo: tipoAtual,
    setor: setorAtual,
    atendente: atendenteAtual,
    demanda: demandaAtual.nome,
    titulo: demandaAtual.nome,
    subtipo: subAtual.sub,
    texto: texto,
    data: new Date().toLocaleString('pt-BR'),
  }).catch(err => console.error('Erro ao salvar:', err));

  document.getElementById('output-box').style.display = 'block';
}

// COPIAR TEXTO (ticket/clickup)
function copiar() {
  const texto = document.getElementById('output-text').textContent;
  const btn = document.getElementById('btn-copy');

  function onCopiado() {
    btn.textContent = 'Copiado!';
    btn.style.borderColor = 'var(--accent)';
    btn.style.color = 'var(--accent)';
    setTimeout(() => {
      btn.textContent = 'Copiar texto';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(texto).then(onCopiado);
  } else {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try { document.execCommand('copy'); onCopiado(); } catch(e) {}
    document.body.removeChild(ta);
  }
}
