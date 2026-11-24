/* BUILD: NORDAPP v0.1.0 · 2026-11-23 · Fase 1 setup */

(function(){
'use strict';

console.log("NORDAPP v0.2.3 · Inter sans + contraste + botão descarga · 2026-11-24");

// ── SUPABASE (mesma BD da app atual) ──────────────────────────────────
var SB_URL = "https://cmtbmpzklorhmgkwvcfa.supabase.co";
var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtdGJtcHprbG9yaG1na3d2Y2ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjAxMjEsImV4cCI6MjA5MjYzNjEyMX0.K0dLwCoof_61Hfn2BnQndaeilMtiaIeX32-l3ZgO3kk";
var H = {
  "Content-Type":"application/json",
  "apikey": SB_KEY,
  "Authorization":"Bearer "+SB_KEY,
  "Prefer":"return=representation"
};

// ── ROLES E PERMISSÕES ────────────────────────────────────────────────
// Mapeia 'rol' do app atual para o novo sistema de roles.
// Compatibilidade: a tabela usuarios da app atual tem rol diferente, mapeamos aqui.
var ROLE_MAP = {
  "master": "master",
  "administrativa": "administracao",
  "comercial": "reservas",
  "checkin": "reservas",
  "auditor": "auditor",
  "propietario": "auditor",
  "housekeeping": "reservas"
};

var ROLE_LABELS = {
  "master": "👑 Master",
  "administracao": "💼 Administração",
  "reservas": "📅 Reservas",
  "auditor": "🔍 Auditor"
};

// ── TIPOS DE FORNECEDOR ───────────────────────────────────────────────
// 12 tipos de fornecedor seguindo padrão contábil brasileiro (NBC/CPC)
var FORNECEDOR_TIPOS = [
  { id: 'empregado',          label: 'Pessoal / Funcionário',              emoji: '👤' },
  { id: 'prestador_pj',       label: 'Prestador de serviço PJ',            emoji: '🔧' },
  { id: 'bens_consumo',       label: 'Fornecedor de bens / produtos',      emoji: '📦' },
  { id: 'utilidade',          label: 'Concessionária / Utilidade pública', emoji: '💡' },
  { id: 'financeira',         label: 'Instituição financeira',             emoji: '🏦' },
  { id: 'governo',            label: 'Governo / Fisco',                    emoji: '🏛' },
  { id: 'canal_venda',        label: 'Canal de distribuição (OTA)',        emoji: '🌐' },
  { id: 'agente_comercial',   label: 'Agente comercial / Parceiro',        emoji: '🤝' },
  { id: 'condominio',         label: 'Condomínio / Associação',            emoji: '🏢' },
  { id: 'parte_relacionada',  label: 'Parte relacionada (sócios)',         emoji: '👑' },
  { id: 'credor_financeiro',  label: 'Credor financeiro (empréstimo)',     emoji: '💳' },
  { id: 'outros',             label: 'Outros',                             emoji: '•'  }
];
function tipoLabel(tipoId){
  var t = FORNECEDOR_TIPOS.find(function(x){return x.id === tipoId;});
  return t ? (t.emoji + ' ' + t.label) : null;
}
// Sugere tipo baseado na categoria legacy do app antigo
function sugerirTipoDeCategoria(cat, nome){
  // Nome tem prioridade sobre categoria quando é claro
  var n = (nome || '').toLowerCase();
  if(n.indexOf('bradesco') >= 0 || n.indexOf('itau') >= 0 || n.indexOf('inter') >= 0 || n.indexOf('santander') >= 0 ||
     n.indexOf('caixa econ') >= 0 || n.indexOf('stone') >= 0 || n.indexOf('stripe') >= 0 || n.indexOf('mercado pago') >= 0 ||
     n.indexOf('booking pagamentos') >= 0 || n.indexOf('pagseguro') >= 0) return 'financeira';
  if(n === 'matias' || n === 'lao' || n === 'eze' || n === 'ezequiel') return 'parte_relacionada';
  // Empréstimos específicos (credor financeiro, distinto do banco normal)
  if(n.indexOf('empréstimo') >= 0 || n.indexOf('emprestimo') >= 0 || n.indexOf('financiamento') >= 0) return 'credor_financeiro';

  if(!cat) return 'outros';
  var c = cat.toLowerCase();

  // Financeiras primeiro (antes de comiss genérico)
  if(c.indexOf('cartao') >= 0 || c.indexOf('banca') >= 0 || c.indexOf('cartão') >= 0) return 'financeira';
  if(c.indexOf('comissoes booking') >= 0 || c.indexOf('comisoes booking') >= 0) return 'canal_venda';
  if(c.indexOf('emprestimo') >= 0 || c.indexOf('empréstimo') >= 0 || c.indexOf('parcela emprestimo') >= 0) return 'credor_financeiro';

  if(c.indexOf('salar') >= 0 || c.indexOf('fgts') >= 0 || c.indexOf('inss') >= 0 || c.indexOf('vale') >= 0) return 'empregado';
  if(c.indexOf('conta') >= 0 || c.indexOf('honorar') >= 0 || c.indexOf('advo') >= 0) return 'prestador_pj';
  if(c.indexOf('energia') >= 0 || c.indexOf('gas') >= 0 || c.indexOf('agua') >= 0 || c.indexOf('internet') >= 0 || c.indexOf('telefo') >= 0 || c.indexOf('hosting') >= 0 || c.indexOf('sistema') >= 0) return 'utilidade';
  if(c.indexOf('consorcio') >= 0 || c.indexOf('condomin') >= 0) return 'condominio';
  if(c.indexOf('produto') >= 0 || c.indexOf('material') >= 0 || c.indexOf('suprim') >= 0 || c.indexOf('bens') >= 0 || c.indexOf('substitui') >= 0 || c.indexOf('fardamento') >= 0 || c.indexOf('frete') >= 0) return 'bens_consumo';
  if(c.indexOf('simples') >= 0 || c.indexOf('impost') >= 0 || c.indexOf('iptu') >= 0 || c.indexOf('receita federal') >= 0 || c.indexOf('parcelamento') >= 0 || c.indexOf('taxa') >= 0) return 'governo';
  if(c.indexOf('booking') >= 0 || c.indexOf('airbnb') >= 0) return 'canal_venda';
  if(c.indexOf('agente') >= 0 || c.indexOf('comiss') >= 0) return 'agente_comercial';
  if(c.indexOf('manuten') >= 0 || c.indexOf('reparo') >= 0 || c.indexOf('lavander') >= 0 || c.indexOf('cafe') >= 0 || c.indexOf('limpeza') >= 0) return 'prestador_pj';
  if(c.indexOf('lanche') >= 0 || c.indexOf('publicidade') >= 0 || c.indexOf('propaganda') >= 0 || c.indexOf('devoluc') >= 0) return 'outros';
  return 'outros';
}


// ── ACCESS por área ───────────────────────────────────────────────────
function getAccess(role){
  // Retorna quais tiles aparecem no Painel principal para cada role.
  var access = { vendas:false, despesas:false, reportes:false, admin:false };
  switch(role){
    case "master":
      access = { vendas:true, despesas:true, reportes:true, admin:true };
      break;
    case "administracao":
      access = { vendas:true, despesas:true, reportes:true, admin:true };
      break;
    case "reservas":
      access = { vendas:true, despesas:true, reportes:true, admin:false };
      break;
    case "auditor":
      access = { vendas:true, despesas:true, reportes:true, admin:false };
      break;
  }
  return access;
}

// ── STATE ─────────────────────────────────────────────────────────────
var currentUser = null;
var currentRole = null;

// ── API HELPER ────────────────────────────────────────────────────────
window._lastApiError = null;
async function api(path, method, body){
  method = method || "GET";
  var opts = { method: method, headers: H };
  if(body) opts.body = JSON.stringify(body);
  try {
    var r = await fetch(SB_URL + "/rest/v1/" + path, opts);
    if(!r.ok){
      var txt = await r.text();
      window._lastApiError = "[" + r.status + "] " + path + " :: " + (txt.slice(0,200) || "(vazio)");
      console.error("API error:", window._lastApiError);
      return null;
    }
    if(method === "DELETE" || r.status === 204) return true;
    return await r.json();
  } catch(e){
    window._lastApiError = "Rede/timeout :: " + (e && e.message || e);
    console.error("API exception:", window._lastApiError);
    return null;
  }
}

async function sha256(msg){
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
}

// ── UI helpers ────────────────────────────────────────────────────────
function showToast(msg){
  var t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  var dur = msg && msg.length > 60 ? 6000 : 2500;
  setTimeout(function(){ t.classList.remove("show"); }, dur);
}

function showView(id){
  document.querySelectorAll(".view").forEach(function(v){ v.classList.remove("active"); });
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

// ── LOGIN ─────────────────────────────────────────────────────────────
async function doLogin(){
  var user = document.getElementById("loginUser").value.trim().toLowerCase();
  var pass = document.getElementById("loginPass").value;
  var errEl = document.getElementById("loginErr");
  errEl.style.display = "none";
  if(!user || !pass){
    errEl.textContent = "Preencha usuário e senha";
    errEl.style.display = "block";
    return;
  }
  var hash = await sha256(pass);
  var res = await api("usuarios?usuario=eq." + encodeURIComponent(user) + "&senha_hash=eq." + hash + "&ativo=eq.true&select=id,nome,usuario,rol");
  if(!res || !res.length){
    errEl.textContent = "Usuário ou senha incorretos";
    errEl.style.display = "block";
    return;
  }
  currentUser = res[0];
  currentRole = ROLE_MAP[currentUser.rol] || "reservas";
  sessionStorage.setItem("nordapp_user", JSON.stringify(currentUser));
  sessionStorage.setItem("nordapp_role", currentRole);
  goToPainel();
}

function doLogout(){
  sessionStorage.removeItem("nordapp_user");
  sessionStorage.removeItem("nordapp_role");
  currentUser = null;
  currentRole = null;
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  showView("viewLogin");
}

// ── PAINEL ────────────────────────────────────────────────────────────
function getGreeting(hour){
  if(hour < 6) return { text: "Boa madrugada", emoji: "🌙" };
  if(hour < 12) return { text: "Bom dia", emoji: "☀" };
  if(hour < 18) return { text: "Boa tarde", emoji: "🌤" };
  return { text: "Boa noite", emoji: "🌙" };
}

function getInitials(nome){
  if(!nome) return "?";
  var parts = String(nome).trim().split(/\s+/);
  if(parts.length === 1) return parts[0].slice(0,2).toUpperCase();
  return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
}

function formatDatePtBR(d){
  var days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  var months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  var hh = String(d.getHours()).padStart(2,"0");
  var mm = String(d.getMinutes()).padStart(2,"0");
  return days[d.getDay()] + ", " + d.getDate() + " " + months[d.getMonth()] + " · " + hh + ":" + mm;
}

function updatePainelHeader(){
  var now = new Date();
  // Datetime compacto
  document.getElementById("painelDate").textContent = formatDatePtBR(now);
  // Greeting según hora
  var g = getGreeting(now.getHours());
  var firstName = currentUser ? String(currentUser.nome).split(/\s+/)[0] : "";
  document.getElementById("greetingText").textContent = g.text + (firstName ? ", " + firstName : "");
  document.getElementById("greetingEmoji").textContent = g.emoji;
  // User pill
  if(currentUser){
    document.getElementById("userPillAvatar").textContent = getInitials(currentUser.nome);
    document.getElementById("userPillName").textContent = currentUser.nome;
    document.getElementById("userPillRole").textContent = (ROLE_LABELS[currentRole] || currentRole).replace(/^[^\s]+\s/, "");
  }
  // Build stamp
  document.getElementById("buildStamp").textContent = "NORDAPP v0.2.3 · build 2026-11-24";
}

function renderPainelGrid(){
  var access = getAccess(currentRole);
  var tiles = [];
  if(access.vendas){
    tiles.push({ id:"hubVendas", icon:"📅", title:"Vendas", sub:"Reservas, hóspedes" });
  }
  if(access.despesas){
    tiles.push({ id:"hubDespesas", icon:"💸", title:"Despesas", sub:"Compras, pagos, sócios" });
  }
  if(access.reportes){
    tiles.push({ id:"hubReportes", icon:"📊", title:"Reportes", sub:"Resultados, análise" });
  }
  if(access.admin){
    tiles.push({ id:"hubAdmin", icon:"⚙", title:"Admin", sub:"Usuários, config" });
  }
  var h = tiles.map(function(t){
    return '<div class="painel-tile" data-target="'+t.id+'">' +
             '<div class="painel-tile-icon">'+t.icon+'</div>' +
             '<div class="painel-tile-title">'+t.title+'</div>' +
             '<div class="painel-tile-sub">'+t.sub+'</div>' +
           '</div>';
  }).join("");
  document.getElementById("painelGrid").innerHTML = h;
  document.querySelectorAll("#painelGrid .painel-tile").forEach(function(el){
    el.addEventListener("click", function(){ goToHub(el.dataset.target); });
  });
}

function goToPainel(){
  updatePainelHeader();
  renderPainelGrid();
  showView("viewPainel");
}

// ── HUBS (nivel 2) ────────────────────────────────────────────────────
var HUB_CONFIG = {
  hubVendas: {
    view: "viewHubVendas",
    tiles: [
      { id:"reservas", icon:"📋", title:"Reservas", sub:"Lista do mês" },
      { id:"disponibilidade", icon:"📅", title:"Disponibilidade", sub:"Calendário" },
      { id:"hospedes", icon:"👥", title:"Hóspedes", sub:"CRM e histórico" },
      { id:"receita_antecipada", icon:"⏳", title:"Receita Antecipada", sub:"Anticipos stays futuras" },
      { id:"comunicacoes", icon:"💬", title:"Comunicações", sub:"Templates e envios" }
    ]
  },
  hubDespesas: {
    view: "viewHubDespesas",
    tiles: [
      { id:"comprobantes", icon:"🧾", title:"Comprobantes", sub:"Carregar e consultar" },
      { id:"pagos", icon:"💳", title:"Pagos", sub:"Bandeja e conciliação" },
      { id:"fornecedores", icon:"🏢", title:"Fornecedores", sub:"CRUD e estado de conta" },
      { id:"pessoal", icon:"👤", title:"Pessoal", sub:"Empregados e salários" },
      { id:"socios", icon:"🤝", title:"Sócios", sub:"Retiros e nivelação", onlyRoles:["master","administracao","auditor"] }
    ]
  },
  hubReportes: {
    view: "viewHubReportes",
    tiles: [
      { id:"painel_resultados", icon:"📊", title:"Painel de Resultados", sub:"DRE accrual", onlyRoles:["master","administracao","auditor"] },
      { id:"caixa", icon:"🏦", title:"Caixa", sub:"Saldos e fluxo", onlyRoles:["master","administracao","auditor"] },
      { id:"ingresos", icon:"📈", title:"Ingresos", sub:"Vendas e ocupação" },
      { id:"egresos", icon:"📉", title:"Egresos", sub:"Análise de gastos", onlyRoles:["master","administracao","auditor"] },
      { id:"simples_nacional", icon:"🧾", title:"Simples Nacional", sub:"Base DAS", onlyRoles:["master","administracao","auditor"] },
      { id:"comissoes", icon:"💼", title:"Comissões", sub:"Por canal / agente" }
    ]
  },
  hubAdmin: {
    view: "viewHubAdmin",
    tiles: [
      { id:"usuarios", icon:"👥", title:"Usuários", sub:"CRUD", onlyRoles:["master"] },
      { id:"permissoes", icon:"🔐", title:"Permissões", sub:"Por role", onlyRoles:["master"] },
      { id:"configuracoes", icon:"⚙", title:"Configurações", sub:"Regime SN, taxas, dados LG" },
      { id:"templates", icon:"💬", title:"Templates", sub:"WhatsApp / Email" },
      { id:"calculadora", icon:"🧮", title:"Calculadora", sub:"Câmbio BNA" },
      { id:"consorcio", icon:"🏢", title:"Consórcio", sub:"Em breve" }
    ]
  }
};

function renderHub(hubId){
  var cfg = HUB_CONFIG[hubId];
  if(!cfg) return;
  var tiles = cfg.tiles.filter(function(t){
    if(!t.onlyRoles) return true;
    return t.onlyRoles.indexOf(currentRole) >= 0;
  });
  var h = tiles.map(function(t){
    return '<div class="painel-tile" data-module="'+t.id+'" data-parent="'+hubId+'">' +
             '<div class="painel-tile-icon">'+t.icon+'</div>' +
             '<div class="painel-tile-title">'+t.title+'</div>' +
             '<div class="painel-tile-sub">'+t.sub+'</div>' +
           '</div>';
  }).join("");
  var gridId = hubId + "Grid";
  document.getElementById(gridId).innerHTML = h;
  document.querySelectorAll("#" + gridId + " .painel-tile").forEach(function(el){
    el.addEventListener("click", function(){
      goToModule(el.dataset.module, el.dataset.parent, el.querySelector(".painel-tile-title").textContent);
    });
  });
}

function goToHub(hubId){
  renderHub(hubId);
  showView(HUB_CONFIG[hubId].view);
}

function goToModule(moduleId, parentHubId, title){
  // Módulos já implementados
  if(moduleId === "fornecedores"){ goToFornecedores(); return; }
  // Fase 1: demais módulos mostram placeholder "em construção"
  document.getElementById("emConstrucaoTitle").textContent = title;
  document.getElementById("emConstrucaoBack").dataset.parent = parentHubId || "painel";
  showView("viewEmConstrucao");
}

// ── NAVEGAÇÃO GENÉRICA ────────────────────────────────────────────────
function handleNav(target){
  if(target === "painel") goToPainel();
  else if(HUB_CONFIG[target]) goToHub(target);
  else goToPainel();
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO FORNECEDORES
// ═════════════════════════════════════════════════════════════════════
var _allFornecedores = [];
var _editingFornecedorId = null;

function canEditFornecedores(){
  return currentRole === 'master' || currentRole === 'administracao';
}

async function loadFornecedores(){
  var el = document.getElementById("forneList");
  el.innerHTML = '<div class="loading">Carregando...</div>';
  var data = await api("fornecedores?select=*&order=nome.asc");
  if(!data){
    el.innerHTML = '<div class="empty"><div class="empty-icon">⚠</div>Erro ao carregar. Verifique conexão.</div>';
    return;
  }
  _allFornecedores = data;
  renderFornecedoresList();
  document.getElementById("forneSubtitle").textContent = data.length + " fornecedor" + (data.length !== 1 ? "es" : "") + " cadastrado" + (data.length !== 1 ? "s" : "");
}

function renderFornecedoresList(){
  var search = (document.getElementById("forneSearch").value || "").toLowerCase().trim();
  var tipoFilter = document.getElementById("forneTipoFilter").value;
  var orderBy = document.getElementById("forneOrderBy").value;

  var list = _allFornecedores.slice();

  // Filtros
  if(search){
    list = list.filter(function(f){
      return (f.nome || "").toLowerCase().indexOf(search) >= 0
          || (f.cnpj_cpf || "").toLowerCase().indexOf(search) >= 0
          || (f.email || "").toLowerCase().indexOf(search) >= 0
          || (f.categoria || "").toLowerCase().indexOf(search) >= 0;
    });
  }
  if(tipoFilter){
    list = list.filter(function(f){ return (f.tipo || sugerirTipoDeCategoria(f.categoria, f.nome)) === tipoFilter; });
  }

  // Detectar duplicados por nome (case insensitive, trim)
  var nomeCount = {};
  _allFornecedores.forEach(function(f){
    var key = (f.nome || "").toLowerCase().trim();
    nomeCount[key] = (nomeCount[key] || 0) + 1;
  });

  // Ordenar
  if(orderBy === 'tipo'){
    list.sort(function(a,b){
      var ta = (a.tipo || sugerirTipoDeCategoria(a.categoria));
      var tb = (b.tipo || sugerirTipoDeCategoria(b.categoria));
      if(ta !== tb) return ta.localeCompare(tb);
      return (a.nome || "").localeCompare(b.nome || "");
    });
  } else if(orderBy === 'recentes'){
    list.sort(function(a,b){ return (b.id || 0) - (a.id || 0); });
  } else {
    list.sort(function(a,b){ return (a.nome || "").localeCompare(b.nome || ""); });
  }

  var el = document.getElementById("forneList");
  if(list.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-icon">📭</div>Nenhum fornecedor encontrado</div>';
    return;
  }

  var html = list.map(function(f){
    var tipoAtual = f.tipo || sugerirTipoDeCategoria(f.categoria, f.nome);
    var tipoLbl = tipoLabel(tipoAtual);
    var tipoClass = f.tipo ? "" : " no-tipo";
    var tipoSuffix = f.tipo ? "" : " ·sug";
    var meta = [];
    if(f.email) meta.push('<span>✉ ' + escapeHtml(f.email) + '</span>');
    if(f.telefone) meta.push('<span>☎ ' + escapeHtml(f.telefone) + '</span>');
    if(f.cnpj_cpf) meta.push('<span>🧾 ' + escapeHtml(f.cnpj_cpf) + '</span>');
    if(!f.tipo && f.categoria) meta.push('<span style="opacity:0.7">cat. legacy: ' + escapeHtml(f.categoria) + '</span>');

    var dupKey = (f.nome || "").toLowerCase().trim();
    var dupBadge = nomeCount[dupKey] > 1
      ? '<div class="fornecedor-dup-badge">⚠ ' + nomeCount[dupKey] + ' registros</div>'
      : '';

    return '<div class="fornecedor-item" data-id="' + f.id + '">' +
             dupBadge +
             '<div class="fornecedor-item-head">' +
               '<div class="fornecedor-item-nome">' + escapeHtml(f.nome || "(sem nome)") + '</div>' +
               (tipoLbl ? '<div class="fornecedor-item-tipo' + tipoClass + '">' + tipoLbl + tipoSuffix + '</div>' : '') +
             '</div>' +
             (meta.length ? '<div class="fornecedor-item-meta">' + meta.join("") + '</div>' : '') +
           '</div>';
  }).join("");

  el.innerHTML = html;
  el.querySelectorAll('.fornecedor-item').forEach(function(item){
    item.addEventListener('click', function(){
      openFornecedorModal(parseInt(item.dataset.id, 10));
    });
  });
}

function populateTipoSelects(){
  // Fill both filter and modal selects
  var opts = FORNECEDOR_TIPOS.map(function(t){ return '<option value="' + t.id + '">' + t.emoji + ' ' + t.label + '</option>'; }).join("");
  document.getElementById("forneTipoFilter").innerHTML = '<option value="">Todos os tipos</option>' + opts;
  document.getElementById("ffTipo").innerHTML = '<option value="">Selecionar...</option>' + opts;
}

function openFornecedorModal(id){
  var f = id ? _allFornecedores.find(function(x){return x.id === id;}) : null;
  _editingFornecedorId = id || null;
  document.getElementById("forneModalTitle").textContent = f ? ('✎ ' + (f.nome || 'Fornecedor')) : 'Novo fornecedor';

  var tipoSugerido = f ? (f.tipo || sugerirTipoDeCategoria(f.categoria, f.nome)) : '';
  document.getElementById("ffNome").value = f ? (f.nome || "") : "";
  document.getElementById("ffTipo").value = tipoSugerido;
  document.getElementById("ffCnpj").value = f ? (f.cnpj_cpf || "") : "";
  document.getElementById("ffEmail").value = f ? (f.email || "") : "";
  document.getElementById("ffTelefone").value = f ? (f.telefone || "") : "";
  document.getElementById("ffBanco").value = f ? (f.banco_pagto || "") : "";
  document.getElementById("ffPix").value = f ? (f.chave_pix || "") : "";
  document.getElementById("ffComentarios").value = f ? (f.comentarios || "") : "";

  // Mostrar info legacy si existe
  var legacyEl = document.getElementById("forneLegacyInfo");
  if(f && f.categoria){
    legacyEl.innerHTML = '<b>Categoria legacy do app antigo:</b> ' + escapeHtml(f.categoria) +
                        (f.tipo ? '' : '<br><i>Sugerido: ' + tipoLabel(tipoSugerido) + '</i>');
    legacyEl.style.display = 'block';
  } else {
    legacyEl.style.display = 'none';
  }

  // Botões
  var delBtn = document.getElementById("btnDeleteFornecedor");
  delBtn.style.display = (f && canEditFornecedores()) ? 'block' : 'none';
  var saveBtn = document.getElementById("btnSaveFornecedor");
  saveBtn.style.display = canEditFornecedores() ? 'block' : 'none';
  // Deshabilitar inputs se somente lectura
  var canEdit = canEditFornecedores();
  ['ffNome','ffTipo','ffCnpj','ffEmail','ffTelefone','ffBanco','ffPix','ffComentarios'].forEach(function(fid){
    document.getElementById(fid).disabled = !canEdit;
  });

  document.getElementById("modalFornecedor").classList.add("open");
}

function closeFornecedorModal(){
  document.getElementById("modalFornecedor").classList.remove("open");
  _editingFornecedorId = null;
}

async function saveFornecedor(){
  var nome = document.getElementById("ffNome").value.trim();
  var tipo = document.getElementById("ffTipo").value;
  if(!nome){ showToast("Nome é obrigatório"); return; }
  if(!tipo){ showToast("Tipo é obrigatório"); return; }

  var body = {
    nome: nome,
    tipo: tipo,
    cnpj_cpf: document.getElementById("ffCnpj").value.trim() || null,
    email: document.getElementById("ffEmail").value.trim() || null,
    telefone: document.getElementById("ffTelefone").value.trim() || null,
    banco_pagto: document.getElementById("ffBanco").value.trim() || null,
    chave_pix: document.getElementById("ffPix").value.trim() || null,
    comentarios: document.getElementById("ffComentarios").value.trim() || null,
    ativo: true
  };

  var saveBtn = document.getElementById("btnSaveFornecedor");
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  var res;
  if(_editingFornecedorId){
    res = await api("fornecedores?id=eq." + _editingFornecedorId, "PATCH", body);
  } else {
    // ao criar novo, agregar categoria compatible con app vieja
    body.categoria = (tipo.charAt(0).toUpperCase() + tipo.slice(1));
    res = await api("fornecedores", "POST", body);
  }

  saveBtn.disabled = false;
  saveBtn.textContent = "Salvar";

  if(!res){
    showToast("Erro: " + (window._lastApiError || "falha ao salvar"));
    return;
  }
  closeFornecedorModal();
  showToast(_editingFornecedorId ? "Fornecedor atualizado" : "Fornecedor criado");
  await loadFornecedores();
}

async function deleteFornecedor(){
  if(!_editingFornecedorId) return;
  var f = _allFornecedores.find(function(x){return x.id === _editingFornecedorId;});
  if(!f) return;
  if(!confirm('Apagar fornecedor "' + f.nome + '"?\n\nEsta ação não pode ser desfeita.')) return;
  var res = await api("fornecedores?id=eq." + _editingFornecedorId, "DELETE");
  if(res === null){
    showToast("Erro: " + (window._lastApiError || "falha ao apagar"));
    return;
  }
  closeFornecedorModal();
  showToast("Fornecedor removido");
  await loadFornecedores();
}

function goToFornecedores(){
  populateTipoSelects();
  loadFornecedores();
  showView("viewFornecedores");
}

async function exportFornecedoresExcel(){
  if(typeof XLSX === 'undefined'){
    showToast("Biblioteca XLSX ainda carregando. Tente novamente em 2s.");
    return;
  }
  if(!_allFornecedores.length){
    showToast("Lista vazia. Carregue os fornecedores primeiro.");
    return;
  }
  var data = _allFornecedores.map(function(f){
    var sugerido = sugerirTipoDeCategoria(f.categoria, f.nome);
    var t = FORNECEDOR_TIPOS.find(function(x){return x.id === sugerido;});
    return {
      id: f.id,
      nome: f.nome || "",
      categoria_legacy: f.categoria || "",
      tipo_sugerido: sugerido + (t ? " · " + t.label : ""),
      tipo_definitivo: f.tipo || "",
      cnpj_cpf: f.cnpj_cpf || "",
      email: f.email || "",
      telefone: f.telefone || "",
      banco_pagto: f.banco_pagto || "",
      chave_pix: f.chave_pix || "",
      comentarios: f.comentarios || "",
      ativo: (f.ativo === false ? "NAO" : "SIM")
    };
  });

  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{wch:5},{wch:30},{wch:30},{wch:32},{wch:20},{wch:22},{wch:30},{wch:18},{wch:14},{wch:26},{wch:50},{wch:6}];
  XLSX.utils.book_append_sheet(wb, ws, "Fornecedores");

  // Sheet 2: instruções
  var instr = [["COMO PREENCHER ESTA PLANILHA"],[""],
    ["1. Preencha a coluna 'tipo_definitivo' com UMA das opções abaixo:"],[""]];
  FORNECEDOR_TIPOS.forEach(function(t){
    instr.push(["   " + t.id + "  →  " + t.emoji + " " + t.label]);
  });
  instr.push([""],
    ["2. A coluna 'tipo_sugerido' tem uma sugestão automática baseada na categoria legacy."],
    ["   Pode copiar o id (ex: 'empregado') para 'tipo_definitivo' se concordar."],[""],
    ["3. Fornecedores duplicados (mesmo nome): mantenha apenas UMA linha."],
    ["   Exclua as linhas extras ou marque ativo=NAO."],[""],
    ["4. Pode preencher: email, telefone, cnpj_cpf, banco_pagto, chave_pix, comentarios."],[""],
    ["5. Ativo: SIM para ativos, NAO para dados antigos que não usamos mais."],[""],
    ["6. Após preencher, envie este arquivo para o Matias para importação."],[""],
    ["Total atual: " + data.length + " fornecedores"]);
  var wsInstr = XLSX.utils.aoa_to_sheet(instr);
  wsInstr['!cols'] = [{wch: 90}];
  XLSX.utils.book_append_sheet(wb, wsInstr, "Instruções");

  var stamp = new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, "nordapp_fornecedores_" + stamp + ".xlsx");
  showToast("Excel gerado: " + data.length + " fornecedores");
}

function escapeHtml(s){
  if(s == null) return "";
  return String(s).replace(/[&<>"']/g, function(c){
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

// ── INIT ──────────────────────────────────────────────────────────────
function init(){
  // Listeners básicos
  document.getElementById("btnLogin").addEventListener("click", doLogin);
  document.getElementById("loginUser").addEventListener("keydown", function(e){ if(e.key === "Enter") doLogin(); });
  document.getElementById("loginPass").addEventListener("keydown", function(e){ if(e.key === "Enter") doLogin(); });
  document.getElementById("btnLogout").addEventListener("click", doLogout);

  // Botões "voltar" (data-nav)
  document.querySelectorAll("[data-nav]").forEach(function(b){
    b.addEventListener("click", function(){ handleNav(b.dataset.nav); });
  });

  // Botão back do placeholder em construção
  document.getElementById("emConstrucaoBack").addEventListener("click", function(){
    var parent = this.dataset.parent || "painel";
    if(parent === "painel") goToPainel();
    else goToHub(parent);
  });

  // ─── Módulo Fornecedores ───
  var btnExportF = document.getElementById("btnExportFornecedores");
  if(btnExportF) btnExportF.addEventListener("click", exportFornecedoresExcel);

  var btnNovoF = document.getElementById("btnNovoFornecedor");
  if(btnNovoF) btnNovoF.addEventListener("click", function(){
    if(!canEditFornecedores()){ showToast("Você não tem permissão"); return; }
    openFornecedorModal(null);
  });
  var btnCloseF = document.getElementById("btnCloseFornecedor");
  if(btnCloseF) btnCloseF.addEventListener("click", closeFornecedorModal);
  var btnSaveF = document.getElementById("btnSaveFornecedor");
  if(btnSaveF) btnSaveF.addEventListener("click", saveFornecedor);
  var btnDelF = document.getElementById("btnDeleteFornecedor");
  if(btnDelF) btnDelF.addEventListener("click", deleteFornecedor);
  var forneSearch = document.getElementById("forneSearch");
  if(forneSearch) forneSearch.addEventListener("input", renderFornecedoresList);
  var forneTipoF = document.getElementById("forneTipoFilter");
  if(forneTipoF) forneTipoF.addEventListener("change", renderFornecedoresList);
  var forneOrder = document.getElementById("forneOrderBy");
  if(forneOrder) forneOrder.addEventListener("change", renderFornecedoresList);
  // Clickar fuera do modal cierra
  var mf = document.getElementById("modalFornecedor");
  if(mf) mf.addEventListener("click", function(e){
    if(e.target === mf) closeFornecedorModal();
  });

  // Session restore
  var savedUser = sessionStorage.getItem("nordapp_user");
  var savedRole = sessionStorage.getItem("nordapp_role");
  if(savedUser && savedRole){
    try {
      currentUser = JSON.parse(savedUser);
      currentRole = savedRole;
      goToPainel();
    } catch(e){
      sessionStorage.removeItem("nordapp_user");
      sessionStorage.removeItem("nordapp_role");
    }
  }

  // Atualiza relógio no painel a cada minuto
  setInterval(function(){
    if(document.getElementById("viewPainel").classList.contains("active")){
      updatePainelHeader();
    }
  }, 30000);
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

})();
