/* BUILD: NORDAPP v0.1.0 · 2026-11-23 · Fase 1 setup */

(function(){
'use strict';

console.log("NORDAPP v0.4.0 · Módulo Pagos (Bandeja + Realizados + Conta) · 2026-11-24");

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
  { id: 'empregado',          label: 'Funcionário',       emoji: '👤' },
  { id: 'prestador_pj',       label: 'Prestador PJ',      emoji: '🔧' },
  { id: 'bens_consumo',       label: 'Bens / Produtos',   emoji: '📦' },
  { id: 'utilidade',          label: 'Concessionária',    emoji: '💡' },
  { id: 'financeira',         label: 'Financeira',        emoji: '🏦' },
  { id: 'governo',            label: 'Governo',           emoji: '🏛' },
  { id: 'canal_venda',        label: 'Canal (OTA)',       emoji: '🌐' },
  { id: 'agente_comercial',   label: 'Agente',            emoji: '🤝' },
  { id: 'condominio',         label: 'Condomínio',        emoji: '🏢' },
  { id: 'parte_relacionada',  label: 'Sócios',            emoji: '👑' },
  { id: 'credor_financeiro',  label: 'Empréstimo',        emoji: '💳' },
  { id: 'outros',             label: 'Outros',            emoji: '•'  }
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
  document.getElementById("buildStamp").textContent = "NORDAPP v0.4.0 · build 2026-11-24";
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
      { id:"categorias", icon:"🗂", title:"Categorias", sub:"Gastos (DRE)" },
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
  if(moduleId === "comprobantes"){ goToComprobantes(); return; }
  if(moduleId === "categorias"){ goToCategorias(); return; }
  if(moduleId === "pagos"){ goToPagos(); return; }
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
// ═════════════════════════════════════════════════════════════════════
// MÓDULO COMPROBANTES
// ═════════════════════════════════════════════════════════════════════
var _allComps = [];
var _allCategorias = [];
var _editingCompId = null;
var _pagComp = null; // comprobante alvo do modal de pagamento

var CENTRO_LABEL = {
  geral: "Geral",
  lofts: "Lofts",
  casa_nordestina: "Casa Nordestina",
  consorcio: "Consórcio"
};
var GRUPO_LABEL = {
  receita: "Receita",
  custo_operacional: "Custo operacional",
  despesa_admin: "Despesa administrativa",
  despesa_financeira: "Despesa financeira",
  tributos: "Tributos",
  nao_operacional: "Não operacional"
};
var MEIO_LABEL = {
  banco_inter: "Banco Inter · LG",
  banco_bradesco: "Bradesco",
  banco_itau: "Itaú",
  cartao_corp: "Cartão corp.",
  pix: "Pix",
  dinheiro: "Dinheiro",
  cripto: "Cripto",
  outro: "Outro"
};
var ESTADO_LABEL = {
  pendente: "Pendente",
  pago_parcial: "Parcial",
  pago: "Pago",
  anulado: "Anulado"
};

function canEditComps(){
  return currentRole === 'master' || currentRole === 'administracao' || currentRole === 'reservas';
}
function canAnularComps(){
  return currentRole === 'master' || currentRole === 'administracao';
}

function fmtBRL(v){
  var n = Number(v) || 0;
  return n.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
}
function fmtDate(iso){
  if(!iso) return "—";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString('pt-BR', { day:'2-digit', month:'short', year:'2-digit' });
}

async function loadCategorias(){
  var data = await api("categorias_dre?select=*&ativo=eq.true&order=ordem.asc");
  _allCategorias = data || [];
  return _allCategorias;
}

async function loadComprobantes(){
  var el = document.getElementById("compList");
  el.innerHTML = '<div class="loading">Carregando...</div>';
  // Join com fornecedor + categoria
  var q = "comprobantes?select=*,fornecedores(nome,tipo),categorias_dre(nome,grupo)&order=data_competencia.desc&limit=500";
  var data = await api(q);
  if(!data){
    el.innerHTML = '<div class="empty"><div class="empty-icon">⚠</div>Erro ao carregar.</div>';
    return;
  }
  _allComps = data;
  renderCompKpis();
  renderCompList();
  document.getElementById("compSubtitle").textContent = data.length + " comprobante" + (data.length !== 1 ? "s" : "");
}

// Helper período: devolve {dataIni, dataFim} a partir do filtro atual
function getFilterPeriodo(){
  var ini = document.getElementById("compDataIni").value || null;
  var fim = document.getElementById("compDataFim").value || null;
  return { ini: ini, fim: fim };
}

function compsFiltrados(opts){
  opts = opts || {};
  var search = (document.getElementById("compSearch").value || "").toLowerCase().trim();
  var estF = document.getElementById("compEstadoFilter").value;
  var ccF  = document.getElementById("compCentroFilter").value;
  var catF = document.getElementById("compCategoriaFilter").value;
  var per  = getFilterPeriodo();

  var list = _allComps.slice();
  if(per.ini) list = list.filter(function(c){ return (c.data_competencia || "") >= per.ini; });
  if(per.fim) list = list.filter(function(c){ return (c.data_competencia || "") <= per.fim; });
  if(estF) list = list.filter(function(c){ return c.estado === estF; });
  if(ccF)  list = list.filter(function(c){ return c.centro_custo === ccF; });
  if(catF) list = list.filter(function(c){ return String(c.categoria_dre_id) === catF; });
  if(search){
    list = list.filter(function(c){
      var forn = c.fornecedores ? (c.fornecedores.nome || "") : "";
      return (c.descricao || "").toLowerCase().indexOf(search) >= 0
          || forn.toLowerCase().indexOf(search) >= 0;
    });
  }
  return list;
}

function renderCompKpis(){
  // KPIs em cima consideram só o período (não os outros filtros)
  var per = getFilterPeriodo();
  var pendentes = 0, pagos = 0, qtdPend = 0;
  _allComps.forEach(function(c){
    if(c.estado === 'anulado') return;
    if(per.ini && (c.data_competencia || "") < per.ini) return;
    if(per.fim && (c.data_competencia || "") > per.fim) return;
    var tot = Number(c.valor_total) || 0;
    var pg = Number(c.valor_pago) || 0;
    pendentes += (tot - pg);
    pagos += pg;
    if(c.estado === 'pendente' || c.estado === 'pago_parcial') qtdPend++;
  });
  document.getElementById("compKpis").innerHTML =
    '<div class="kpi-card"><div class="kpi-label">A pagar</div><div class="kpi-value pendente">' + fmtBRL(pendentes) + '</div></div>' +
    '<div class="kpi-card"><div class="kpi-label">Pago</div><div class="kpi-value pago">' + fmtBRL(pagos) + '</div></div>' +
    '<div class="kpi-card"><div class="kpi-label">Pendentes</div><div class="kpi-value">' + qtdPend + '</div></div>';
}

function renderCompList(){
  var ord  = document.getElementById("compOrderBy").value;
  var list = compsFiltrados();

  if(ord === "competencia_asc") list.sort(function(a,b){ return (a.data_competencia||"").localeCompare(b.data_competencia||""); });
  else if(ord === "valor_desc") list.sort(function(a,b){ return Number(b.valor_total) - Number(a.valor_total); });
  else if(ord === "vencimento_asc") list.sort(function(a,b){
    var av = a.data_vencimento || "9999-12-31";
    var bv = b.data_vencimento || "9999-12-31";
    return av.localeCompare(bv);
  });
  else list.sort(function(a,b){ return (b.data_competencia||"").localeCompare(a.data_competencia||""); });

  // Atualiza subtitle e KPIs com período
  renderCompKpis();
  document.getElementById("compSubtitle").textContent = list.length + " comprobante" + (list.length !== 1 ? "s" : "") + " no período";

  var el = document.getElementById("compList");
  if(list.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-icon">🧾</div>Nenhum comprobante no período.</div>';
    return;
  }

  var canEdit = canEditComps();
  el.innerHTML = list.map(function(c){
    var forn = c.fornecedores ? c.fornecedores.nome : "—";
    var cat  = c.categorias_dre ? c.categorias_dre.nome : "Sem categoria";
    var valorTotal = Number(c.valor_total) || 0;
    var valorPago  = Number(c.valor_pago) || 0;
    var saldo = valorTotal - valorPago;
    var estado = c.estado || 'pendente';

    // Layout AZUCAPP-style vertical
    var lines = '';
    lines += '<div class="comp-item-line">Mês ref. <b>'+fmtMesRef(c.data_competencia)+'</b></div>';
    if(c.data_vencimento){
      lines += '<div class="comp-item-line">Vence <b>'+fmtDate(c.data_vencimento)+'</b></div>';
    }
    if(c.data_pagamento && estado === 'pago'){
      lines += '<div class="comp-item-line">Pago em <b>'+fmtDate(c.data_pagamento)+'</b></div>';
    }
    lines += '<div class="comp-item-line valor">'+fmtBRL(valorTotal)+'</div>';
    if(estado === 'pago_parcial'){
      lines += '<div class="comp-item-line saldo">Saldo: '+fmtBRL(saldo)+'</div>';
    }

    var actionsHtml = '';
    if(canEdit && estado !== 'anulado'){
      actionsHtml = '<div class="comp-item-actions">';
      if(estado !== 'pago'){
        actionsHtml += '<button class="primary" data-pag="'+c.id+'">💵 Pagamento</button>';
      }
      if(c.anexo_url){
        actionsHtml += '<button data-anexo="'+c.anexo_url+'" title="Ver anexo">📎</button>';
      }
      actionsHtml += '<button data-edit="'+c.id+'" title="Editar">✎</button>';
      actionsHtml += '</div>';
    } else if(c.anexo_url){
      actionsHtml = '<div class="comp-item-actions"><button data-anexo="'+c.anexo_url+'">📎 Ver anexo</button></div>';
    }

    return '<div class="comp-item estado-'+estado+'">' +
             '<div class="comp-estado-topright">' +
               '<span class="chip-estado '+estado+'">'+(ESTADO_LABEL[estado]||estado)+'</span>' +
             '</div>' +
             '<div class="comp-item-title">'+escapeHtml(forn)+'</div>' +
             '<div class="comp-item-sub">'+escapeHtml(c.descricao||"—")+'</div>' +
             '<div class="comp-item-lines">'+lines+'</div>' +
             '<div class="comp-item-chips">' +
               '<span class="chip-centro">'+(CENTRO_LABEL[c.centro_custo]||c.centro_custo)+'</span>' +
               '<span class="chip-categoria">'+escapeHtml(cat)+'</span>' +
             '</div>' +
             actionsHtml +
           '</div>';
  }).join("");

  // Listeners inline
  el.querySelectorAll("[data-pag]").forEach(function(b){
    b.addEventListener("click", function(e){ e.stopPropagation(); openPagamentoModal(b.dataset.pag); });
  });
  el.querySelectorAll("[data-edit]").forEach(function(b){
    b.addEventListener("click", function(e){ e.stopPropagation(); openCompModal(b.dataset.edit); });
  });
  el.querySelectorAll("[data-anexo]").forEach(function(b){
    b.addEventListener("click", function(e){ e.stopPropagation(); window.open(b.dataset.anexo, "_blank"); });
  });
  el.querySelectorAll(".comp-item").forEach(function(item, i){
    item.addEventListener("click", function(){
      if(canEdit) openCompModal(list[i].id);
    });
  });
}

// ── Período presets ──
function aplicarPeriodoPreset(preset){
  var hoje = new Date();
  var y = hoje.getFullYear();
  var m = hoje.getMonth();
  var iniEl = document.getElementById("compDataIni");
  var fimEl = document.getElementById("compDataFim");
  function iso(d){ return d.toISOString().slice(0,10); }
  if(preset === "mes_atual"){
    iniEl.value = iso(new Date(y, m, 1));
    fimEl.value = iso(new Date(y, m + 1, 0));
  } else if(preset === "mes_anterior"){
    iniEl.value = iso(new Date(y, m - 1, 1));
    fimEl.value = iso(new Date(y, m, 0));
  } else if(preset === "ano_atual"){
    iniEl.value = iso(new Date(y, 0, 1));
    fimEl.value = iso(new Date(y, 11, 31));
  } else {
    iniEl.value = "";
    fimEl.value = "";
  }
  document.querySelectorAll(".chip-btn[data-periodo]").forEach(function(b){
    b.classList.toggle("active", b.dataset.periodo === preset);
  });
  renderCompList();
}

function fmtMesRef(iso){
  if(!iso) return "—";
  var d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString('pt-BR', { month:'short', year:'numeric' });
}

function populateCategoriaSelects(){
  var opts = _allCategorias.map(function(c){
    return '<option value="'+c.id+'">'+escapeHtml(c.nome)+'</option>';
  }).join("");

  // Filtro
  var sel = document.getElementById("compCategoriaFilter");
  sel.innerHTML = '<option value="">Todas categorias</option>' + opts;

  // Modal form
  var selForm = document.getElementById("cfCategoria");
  selForm.innerHTML = '<option value="">Selecionar...</option>' + opts + '<option value="__nova__" style="font-style:italic">+ Criar nova categoria</option>';
}

function populateFornecedorSelect(){
  var opts = _allFornecedores.slice().sort(function(a,b){
    return (a.nome||"").localeCompare(b.nome||"");
  }).map(function(f){
    return '<option value="'+f.id+'">'+escapeHtml(f.nome)+'</option>';
  }).join("");
  document.getElementById("cfFornecedor").innerHTML = '<option value="">Selecionar fornecedor...</option>' + opts;
}

function openCompModal(id){
  _editingCompId = id || null;
  var comp = null;
  if(id){ comp = _allComps.find(function(c){ return String(c.id) === String(id); }); }

  document.getElementById("compModalTitle").textContent = comp ? "Editar comprobante" : "Novo comprobante";
  document.getElementById("cfDescricao").value = comp ? (comp.descricao || "") : "";
  document.getElementById("cfFornecedor").value = comp ? (comp.fornecedor_id || "") : "";
  document.getElementById("cfCategoria").value = comp ? (comp.categoria_dre_id || "") : "";
  document.getElementById("cfCentroCusto").value = comp ? (comp.centro_custo || "geral") : "geral";
  document.getElementById("cfCompetencia").value = comp ? (comp.data_competencia || "") : new Date().toISOString().slice(0,10);
  document.getElementById("cfVencimento").value = comp ? (comp.data_vencimento || "") : "";
  document.getElementById("cfValor").value = comp ? (comp.valor_total || "") : "";
  document.getElementById("cfMeio").value = comp ? (comp.meio_pagamento || "") : "";
  document.getElementById("cfObs").value = comp ? (comp.observacoes || "") : "";
  document.getElementById("cfAnexo").value = "";
  var hint = document.getElementById("cfAnexoHint");
  if(comp && comp.anexo_url){
    hint.innerHTML = 'Já existe anexo: <a href="'+comp.anexo_url+'" target="_blank" style="color:var(--ocean);text-decoration:underline">'+escapeHtml(comp.anexo_nome||"ver")+'</a> · substituir?';
  } else {
    hint.textContent = "Opcional · até 10MB";
  }

  var btnAnular = document.getElementById("btnAnularComp");
  btnAnular.style.display = (comp && canAnularComps() && comp.estado !== 'anulado') ? "block" : "none";

  document.getElementById("modalComp").classList.add("open");
}

function closeCompModal(){
  document.getElementById("modalComp").classList.remove("open");
  _editingCompId = null;
}

async function uploadAnexo(file){
  if(!file) return { url: null, nome: null };
  var ext = file.name.split('.').pop().toLowerCase();
  var ts = Date.now();
  var safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  var path = "anexo_" + ts + "_" + safe;
  var url = SB_URL + "/storage/v1/object/comprobantes-anexos/" + encodeURIComponent(path);
  var r = await fetch(url, {
    method: "POST",
    headers: { "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "x-upsert": "true" },
    body: file
  });
  if(!r.ok){
    console.error("Upload anexo falhou", r.status, await r.text());
    showToast("Falha ao subir anexo");
    return { url: null, nome: file.name };
  }
  var publicUrl = SB_URL + "/storage/v1/object/public/comprobantes-anexos/" + encodeURIComponent(path);
  return { url: publicUrl, nome: file.name };
}

async function saveComp(){
  if(!canEditComps()){ showToast("Sem permissão"); return; }

  var descricao = document.getElementById("cfDescricao").value.trim();
  var fornId    = document.getElementById("cfFornecedor").value;
  var catId     = document.getElementById("cfCategoria").value;
  var centro    = document.getElementById("cfCentroCusto").value;
  var compet    = document.getElementById("cfCompetencia").value;
  var venc      = document.getElementById("cfVencimento").value;
  var valor     = parseFloat(document.getElementById("cfValor").value);
  var meio      = document.getElementById("cfMeio").value;
  var obs       = document.getElementById("cfObs").value.trim();
  var fileInput = document.getElementById("cfAnexo");
  var file      = fileInput.files[0];

  if(!descricao){ showToast("Descrição é obrigatória"); return; }
  if(!fornId){ showToast("Selecione fornecedor"); return; }
  if(!catId || catId === "__nova__"){ showToast("Selecione categoria DRE"); return; }
  if(!compet){ showToast("Data de competência obrigatória"); return; }
  if(!valor || valor <= 0){ showToast("Valor inválido"); return; }
  if(file && file.size > 10 * 1024 * 1024){ showToast("Anexo >10MB"); return; }

  var anexo = { url: null, nome: null };
  if(file){
    showToast("Subindo anexo...");
    anexo = await uploadAnexo(file);
  }

  var payload = {
    descricao: descricao,
    fornecedor_id: Number(fornId),
    categoria_dre_id: Number(catId),
    centro_custo: centro,
    data_competencia: compet,
    data_vencimento: venc || null,
    valor_total: valor,
    meio_pagamento: meio || null,
    observacoes: obs || null,
    updated_at: new Date().toISOString()
  };
  if(anexo.url){
    payload.anexo_url = anexo.url;
    payload.anexo_nome = anexo.nome;
  }
  if(!_editingCompId){
    payload.created_by = currentUser.username || currentUser.email || "system";
  }

  var path = _editingCompId ? "comprobantes?id=eq." + _editingCompId : "comprobantes";
  var method = _editingCompId ? "PATCH" : "POST";
  var r = await api(path, method, payload);
  if(!r){ showToast("Erro ao salvar"); return; }
  showToast(_editingCompId ? "Atualizado ✓" : "Comprobante criado ✓");
  closeCompModal();
  await loadComprobantes();
}

async function anularComp(){
  if(!canAnularComps()){ showToast("Sem permissão"); return; }
  if(!_editingCompId) return;
  var motivo = prompt("Motivo da anulação:");
  if(motivo === null) return;
  var payload = {
    estado: 'anulado',
    anulado_at: new Date().toISOString(),
    anulado_por: currentUser.username || "system",
    anulado_motivo: motivo || "—"
  };
  var r = await api("comprobantes?id=eq." + _editingCompId, "PATCH", payload);
  if(!r){ showToast("Erro"); return; }
  showToast("Comprobante anulado");
  closeCompModal();
  await loadComprobantes();
}

// ── Modal pagamento ──
function openPagamentoModal(compId){
  _pagComp = _allComps.find(function(c){ return String(c.id) === String(compId); });
  if(!_pagComp) return;
  var saldo = Number(_pagComp.valor_total) - Number(_pagComp.valor_pago || 0);
  document.getElementById("pagInfo").innerHTML =
    '<strong>'+escapeHtml(_pagComp.descricao)+'</strong><br>' +
    'Total: '+fmtBRL(_pagComp.valor_total)+' · Pago: '+fmtBRL(_pagComp.valor_pago||0)+'<br>' +
    'Saldo: <strong>'+fmtBRL(saldo)+'</strong>';
  document.getElementById("pfValor").value = saldo.toFixed(2);
  document.getElementById("pfValor").max = saldo;
  document.getElementById("pfData").value = new Date().toISOString().slice(0,10);
  document.getElementById("pfMeio").value = _pagComp.meio_pagamento || "";
  document.getElementById("pfObs").value = "";
  document.getElementById("modalPag").classList.add("open");
}
function closePagamentoModal(){
  document.getElementById("modalPag").classList.remove("open");
  _pagComp = null;
}

async function savePagamento(){
  if(!canEditComps()){ showToast("Sem permissão"); return; }
  if(!_pagComp) return;
  var valor = parseFloat(document.getElementById("pfValor").value);
  var data = document.getElementById("pfData").value;
  var meio = document.getElementById("pfMeio").value;
  var obs  = document.getElementById("pfObs").value.trim();

  var saldo = Number(_pagComp.valor_total) - Number(_pagComp.valor_pago || 0);
  if(!valor || valor <= 0){ showToast("Valor inválido"); return; }
  if(valor > saldo + 0.01){ showToast("Valor excede saldo"); return; }
  if(!data){ showToast("Data obrigatória"); return; }

  // 1. inserir pagamento (histórico)
  var pay = {
    comprobante_id: _pagComp.id,
    valor: valor,
    data_pagamento: data,
    meio_pagamento: meio || null,
    observacoes: obs || null,
    created_by: currentUser.username || "system"
  };
  var r1 = await api("pagamentos", "POST", pay);
  if(!r1){ showToast("Erro ao registrar"); return; }

  // 2. atualizar comprobante
  var novoPago = Number(_pagComp.valor_pago || 0) + valor;
  var tot = Number(_pagComp.valor_total);
  var novoEstado = (novoPago + 0.01 >= tot) ? 'pago' : 'pago_parcial';
  var patch = {
    valor_pago: novoPago,
    estado: novoEstado,
    updated_at: new Date().toISOString()
  };
  if(novoEstado === 'pago') patch.data_pagamento = data;
  if(meio && !_pagComp.meio_pagamento) patch.meio_pagamento = meio;

  var r2 = await api("comprobantes?id=eq." + _pagComp.id, "PATCH", patch);
  if(!r2){ showToast("Pago registrado mas estado não atualizou"); }
  else { showToast(novoEstado === 'pago' ? "Pago ✓" : "Pagamento parcial registrado ✓"); }
  closePagamentoModal();
  await loadComprobantes();
  // Se estamos na view de Pagos, refrescar também pagamentos
  if(document.getElementById("viewPagos").classList.contains("active")){
    await loadPagamentos();
    populateBandejaFornSelect();
    populateRealFornSelect();
    renderPagAtivo();
  }
}

// ── Modal nova categoria DRE ──
function openCatModal(){
  document.getElementById("catNome").value = "";
  document.getElementById("catGrupo").value = "custo_operacional";
  document.getElementById("modalCat").classList.add("open");
}
function closeCatModal(){
  document.getElementById("modalCat").classList.remove("open");
}
async function saveCategoria(){
  var nome = document.getElementById("catNome").value.trim();
  var grupo = document.getElementById("catGrupo").value;
  if(!nome){ showToast("Nome obrigatório"); return; }
  var payload = { nome: nome, grupo: grupo, ordem: 1000, created_by: currentUser.username || "system" };
  var r = await api("categorias_dre", "POST", payload);
  if(!r){ showToast("Erro (nome duplicado?)"); return; }
  showToast("Categoria criada ✓");
  await loadCategorias();
  populateCategoriaSelects();
  // Pré-selecionar a nova
  var created = Array.isArray(r) ? r[0] : r;
  if(created && created.id){
    document.getElementById("cfCategoria").value = created.id;
  }
  closeCatModal();
}

async function goToComprobantes(){
  showView("viewComprobantes");
  // Garantir que temos fornecedores e categorias em cache
  if(_allFornecedores.length === 0) await loadFornecedores();
  if(_allCategorias.length === 0)  await loadCategorias();
  populateFornecedorSelect();
  populateCategoriaSelects();
  // Default: mês atual
  if(!document.getElementById("compDataIni").value){
    aplicarPeriodoPreset("mes_atual");
  }
  await loadComprobantes();
}

// ── Export Excel de comprobantes (respeita filtros atuais) ──
function exportCompsExcel(){
  if(typeof XLSX === 'undefined'){ showToast("XLSX não carregou"); return; }
  var list = compsFiltrados();
  if(list.length === 0){ showToast("Sem dados para exportar"); return; }

  var rows = list.map(function(c){
    var forn = c.fornecedores ? c.fornecedores.nome : "—";
    var cat  = c.categorias_dre ? c.categorias_dre.nome : "Sem categoria";
    return {
      "Mês ref.":       c.data_competencia || "",
      "Vencimento":     c.data_vencimento || "",
      "Pagamento":      c.data_pagamento || "",
      "Fornecedor":     forn,
      "Descrição":      c.descricao || "",
      "Categoria":      cat,
      "Centro de custo": CENTRO_LABEL[c.centro_custo] || c.centro_custo || "",
      "Valor total":    Number(c.valor_total) || 0,
      "Valor pago":     Number(c.valor_pago) || 0,
      "Saldo":          Number(c.valor_total||0) - Number(c.valor_pago||0),
      "Estado":         ESTADO_LABEL[c.estado] || c.estado || "",
      "Meio pagamento": MEIO_LABEL[c.meio_pagamento] || c.meio_pagamento || "",
      "Observações":    c.observacoes || ""
    };
  });

  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(rows);
  // Larguras
  ws['!cols'] = [
    {wch:12},{wch:12},{wch:12},{wch:28},{wch:36},{wch:28},{wch:16},
    {wch:12},{wch:12},{wch:12},{wch:12},{wch:14},{wch:30}
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Comprobantes");

  var hoje = new Date().toISOString().slice(0,10);
  var per = getFilterPeriodo();
  var tag = per.ini && per.fim ? (per.ini + "_a_" + per.fim) : hoje;
  XLSX.writeFile(wb, "NORDAPP_Comprobantes_" + tag + ".xlsx");
  showToast("Excel baixado ✓");
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO CATEGORIAS (Admin)
// ═════════════════════════════════════════════════════════════════════
var _editingCatId = null;
var OUTROS_CAT_ID = null; // cache

function canEditCats(){
  return currentRole === 'master' || currentRole === 'administracao';
}

async function loadCategoriasAll(){
  // Reusa loadCategorias para cache; faz count por categoria
  await loadCategorias();
  // Identifica "Outros"
  var outros = _allCategorias.find(function(c){ return (c.nome || "").toLowerCase() === "outros"; });
  OUTROS_CAT_ID = outros ? outros.id : null;
  // Count comps por categoria
  var countMap = {};
  _allComps.forEach(function(c){
    var k = c.categoria_dre_id;
    if(!k) return;
    countMap[k] = (countMap[k] || 0) + 1;
  });
  renderCategoriasList(countMap);
}

function renderCategoriasList(countMap){
  countMap = countMap || {};
  var el = document.getElementById("catList");
  if(_allCategorias.length === 0){
    el.innerHTML = '<div class="empty">Sem categorias.</div>';
    return;
  }
  // Agrupa por grupo
  var grupos = {};
  _allCategorias.forEach(function(c){
    var g = c.grupo || "outros";
    if(!grupos[g]) grupos[g] = [];
    grupos[g].push(c);
  });
  var ordem = ["receita","custo_operacional","despesa_admin","despesa_financeira","tributos","nao_operacional"];
  var html = "";
  ordem.forEach(function(g){
    if(!grupos[g]) return;
    html += '<div class="cat-group-header">'+(GRUPO_LABEL[g]||g)+'</div>';
    grupos[g].forEach(function(c){
      var cnt = countMap[c.id] || 0;
      html += '<div class="cat-item" data-id="'+c.id+'">' +
                '<div class="cat-item-nome">'+escapeHtml(c.nome)+'</div>' +
                '<div class="cat-item-count">'+cnt+' comp.</div>' +
              '</div>';
    });
  });
  el.innerHTML = html;
  el.querySelectorAll(".cat-item").forEach(function(it){
    it.addEventListener("click", function(){ openCatModal(it.dataset.id); });
  });
  document.getElementById("catSubtitle").textContent = _allCategorias.length + " categorias ativas";
}

function openCatModal(id){
  _editingCatId = id ? Number(id) : null;
  var cat = null;
  if(id){ cat = _allCategorias.find(function(c){ return String(c.id) === String(id); }); }
  document.getElementById("catModalTitle").textContent = cat ? "Editar categoria" : "Nova categoria";
  document.getElementById("catNome").value  = cat ? (cat.nome || "") : "";
  document.getElementById("catGrupo").value = cat ? (cat.grupo || "custo_operacional") : "custo_operacional";
  var btnDel = document.getElementById("btnDeleteCat");
  // Não deixa apagar "Outros" nem se não é master/admin
  var isOutros = cat && (cat.nome || "").toLowerCase() === "outros";
  btnDel.style.display = (cat && canEditCats() && !isOutros) ? "block" : "none";
  document.getElementById("modalCat").classList.add("open");
}
function closeCatModal(){
  document.getElementById("modalCat").classList.remove("open");
  _editingCatId = null;
}

async function saveCategoria(){
  if(!canEditCats()){ showToast("Sem permissão"); return; }
  var nome = document.getElementById("catNome").value.trim();
  var grupo = document.getElementById("catGrupo").value;
  if(!nome){ showToast("Nome obrigatório"); return; }
  var payload = { nome: nome, grupo: grupo };
  var r;
  if(_editingCatId){
    payload.updated_at = new Date().toISOString();
    r = await api("categorias_dre?id=eq." + _editingCatId, "PATCH", payload);
  } else {
    payload.ordem = 1000;
    payload.created_by = currentUser.username || "system";
    r = await api("categorias_dre", "POST", payload);
  }
  if(!r){ showToast("Erro (nome duplicado?)"); return; }
  showToast(_editingCatId ? "Atualizada ✓" : "Categoria criada ✓");
  var created = Array.isArray(r) ? r[0] : r;
  // Se foi criada do modal de comprobante, pré-selecionar
  if(!_editingCatId && created && created.id && document.getElementById("cfCategoria").offsetParent !== null){
    await loadCategorias();
    populateCategoriaSelects();
    document.getElementById("cfCategoria").value = created.id;
  } else {
    await loadCategorias();
    populateCategoriaSelects();
    // Se estamos na view de categorias, re-render
    if(document.getElementById("viewCategorias").classList.contains("active")){
      await loadCategoriasAll();
    }
  }
  closeCatModal();
}

async function deleteCategoria(){
  if(!canEditCats()){ showToast("Sem permissão"); return; }
  if(!_editingCatId) return;
  if(!OUTROS_CAT_ID){
    // Localiza "Outros"
    var outros = _allCategorias.find(function(c){ return (c.nome || "").toLowerCase() === "outros"; });
    if(outros) OUTROS_CAT_ID = outros.id;
  }
  if(!OUTROS_CAT_ID){ showToast("Categoria 'Outros' não existe · crie uma primeiro"); return; }
  if(_editingCatId === OUTROS_CAT_ID){ showToast("Não é possível apagar 'Outros'"); return; }
  if(!confirm("Apagar esta categoria? Os comprobantes passarão para 'Outros'.")) return;

  // 1) Reatribuir comprobantes
  var r1 = await api("comprobantes?categoria_dre_id=eq." + _editingCatId, "PATCH", { categoria_dre_id: OUTROS_CAT_ID });
  if(r1 === null){ showToast("Erro ao reatribuir comprobantes"); return; }
  // 2) Apagar categoria (soft delete via ativo=false seria melhor, mas user pediu apagar)
  var r2 = await api("categorias_dre?id=eq." + _editingCatId, "DELETE");
  if(!r2){
    // Fallback: marcar como inativa
    await api("categorias_dre?id=eq." + _editingCatId, "PATCH", { ativo: false });
  }
  showToast("Categoria apagada ✓");
  closeCatModal();
  await loadCategorias();
  populateCategoriaSelects();
  await loadCategoriasAll();
  // Recarrega comps para refletir
  if(_allComps.length) await loadComprobantes();
}

async function goToCategorias(){
  showView("viewCategorias");
  if(_allComps.length === 0) await loadComprobantes();
  await loadCategoriasAll();
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO PAGOS · Bandeja + Realizados + Estado de conta
// ═════════════════════════════════════════════════════════════════════
var _allPagamentos = [];
var _activePagTab = "bandeja";

function getPagPeriodo(){
  return {
    ini: document.getElementById("pagDataIni").value || null,
    fim: document.getElementById("pagDataFim").value || null
  };
}

function aplicarPagPeriodoPreset(preset){
  var hoje = new Date();
  var y = hoje.getFullYear(), m = hoje.getMonth();
  function iso(d){ return d.toISOString().slice(0,10); }
  var ini = "", fim = "";
  if(preset === "mes_atual"){ ini = iso(new Date(y,m,1)); fim = iso(new Date(y,m+1,0)); }
  else if(preset === "mes_anterior"){ ini = iso(new Date(y,m-1,1)); fim = iso(new Date(y,m,0)); }
  else if(preset === "ano_atual"){ ini = iso(new Date(y,0,1)); fim = iso(new Date(y,11,31)); }
  document.getElementById("pagDataIni").value = ini;
  document.getElementById("pagDataFim").value = fim;
  document.querySelectorAll(".chip-btn[data-pag-periodo]").forEach(function(b){
    b.classList.toggle("active", b.dataset.pagPeriodo === preset);
  });
  renderPagAtivo();
}

function switchPagTab(tab){
  _activePagTab = tab;
  document.querySelectorAll(".tab-btn").forEach(function(b){
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-pane").forEach(function(p){
    p.classList.toggle("active", p.id === "tab" + tab.charAt(0).toUpperCase() + tab.slice(1));
  });
  renderPagAtivo();
}

function renderPagAtivo(){
  if(_activePagTab === "bandeja") renderBandeja();
  else if(_activePagTab === "realizados") renderRealizados();
  else if(_activePagTab === "conta") renderEstadoConta();
}

// ── Bandeja ──
function diasAteVencimento(iso){
  if(!iso) return null;
  var hoje = new Date(); hoje.setHours(0,0,0,0);
  var venc = new Date(iso + "T00:00:00");
  return Math.floor((venc - hoje) / 86400000);
}
function badgeVencimento(iso){
  var d = diasAteVencimento(iso);
  if(d === null) return '<span class="badge-venc ok">sem vto</span>';
  if(d < 0)  return '<span class="badge-venc vencido">vencido '+Math.abs(d)+'d</span>';
  if(d === 0) return '<span class="badge-venc hoje">vence hoje</span>';
  if(d <= 7) return '<span class="badge-venc semana">em '+d+'d</span>';
  return '<span class="badge-venc ok">em '+d+'d</span>';
}

function renderBandeja(){
  var per = getPagPeriodo();
  var centro = document.getElementById("bandejaCentroFilter").value;
  var forn = document.getElementById("bandejaFornFilter").value;

  // Pendentes e parciais apenas
  var list = _allComps.filter(function(c){
    if(c.estado !== 'pendente' && c.estado !== 'pago_parcial') return false;
    if(per.ini && (c.data_competencia || "") < per.ini) return false;
    if(per.fim && (c.data_competencia || "") > per.fim) return false;
    if(centro && c.centro_custo !== centro) return false;
    if(forn && String(c.fornecedor_id) !== forn) return false;
    return true;
  });

  // Ordem por vencimento ASC (sem vto no final)
  list.sort(function(a,b){
    var av = a.data_vencimento || "9999-12-31";
    var bv = b.data_vencimento || "9999-12-31";
    return av.localeCompare(bv);
  });

  // KPIs
  var total = 0, vencidos = 0, semana = 0;
  list.forEach(function(c){
    var saldo = Number(c.valor_total) - Number(c.valor_pago || 0);
    total += saldo;
    var d = diasAteVencimento(c.data_vencimento);
    if(d !== null && d < 0) vencidos += saldo;
    else if(d !== null && d <= 7) semana += saldo;
  });
  document.getElementById("bandejaKpis").innerHTML =
    '<div class="kpi-card"><div class="kpi-label">A pagar</div><div class="kpi-value pendente">'+fmtBRL(total)+'</div></div>' +
    '<div class="kpi-card"><div class="kpi-label">Vencidos</div><div class="kpi-value" style="color:#e89a9a">'+fmtBRL(vencidos)+'</div></div>' +
    '<div class="kpi-card"><div class="kpi-label">Esta semana</div><div class="kpi-value" style="color:#f0d890">'+fmtBRL(semana)+'</div></div>';

  var el = document.getElementById("bandejaList");
  if(list.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-icon">✓</div>Nada pendente.</div>';
    return;
  }

  var canEdit = canEditComps();
  el.innerHTML = list.map(function(c){
    var forn = c.fornecedores ? c.fornecedores.nome : "—";
    var cat  = c.categorias_dre ? c.categorias_dre.nome : "Sem categoria";
    var saldo = Number(c.valor_total) - Number(c.valor_pago || 0);
    var estado = c.estado;

    var lines = '';
    lines += '<div class="comp-item-line">Vence <b>'+fmtDate(c.data_vencimento)+'</b> '+badgeVencimento(c.data_vencimento)+'</div>';
    lines += '<div class="comp-item-line">Mês ref. <b>'+fmtMesRef(c.data_competencia)+'</b></div>';
    lines += '<div class="comp-item-line valor">'+fmtBRL(saldo)+'</div>';
    if(estado === 'pago_parcial'){
      lines += '<div class="comp-item-line" style="font-size:11px;opacity:0.6">já pago '+fmtBRL(c.valor_pago)+' de '+fmtBRL(c.valor_total)+'</div>';
    }

    var actionsHtml = '';
    if(canEdit){
      actionsHtml = '<div class="comp-item-actions">';
      actionsHtml += '<button class="primary" data-pag="'+c.id+'">💵 Pagar '+fmtBRL(saldo)+'</button>';
      actionsHtml += '<button data-edit="'+c.id+'" title="Editar">✎</button>';
      if(c.anexo_url) actionsHtml += '<button data-anexo="'+c.anexo_url+'" title="Anexo">📎</button>';
      actionsHtml += '</div>';
    }

    return '<div class="comp-item estado-'+estado+'">' +
             '<div class="comp-estado-topright"><span class="chip-estado '+estado+'">'+(ESTADO_LABEL[estado]||estado)+'</span></div>' +
             '<div class="comp-item-title">'+escapeHtml(forn)+'</div>' +
             '<div class="comp-item-sub">'+escapeHtml(c.descricao||"—")+'</div>' +
             '<div class="comp-item-lines">'+lines+'</div>' +
             '<div class="comp-item-chips">' +
               '<span class="chip-centro">'+(CENTRO_LABEL[c.centro_custo]||c.centro_custo)+'</span>' +
               '<span class="chip-categoria">'+escapeHtml(cat)+'</span>' +
             '</div>' +
             actionsHtml +
           '</div>';
  }).join("");

  el.querySelectorAll("[data-pag]").forEach(function(b){
    b.addEventListener("click", function(e){ e.stopPropagation(); openPagamentoModal(b.dataset.pag); });
  });
  el.querySelectorAll("[data-edit]").forEach(function(b){
    b.addEventListener("click", function(e){ e.stopPropagation(); openCompModal(b.dataset.edit); });
  });
  el.querySelectorAll("[data-anexo]").forEach(function(b){
    b.addEventListener("click", function(e){ e.stopPropagation(); window.open(b.dataset.anexo, "_blank"); });
  });

  document.getElementById("pagosSubtitle").textContent = list.length + " pendente" + (list.length !== 1 ? "s" : "");
}

// ── Realizados ──
async function loadPagamentos(){
  var q = "pagamentos?select=*,comprobantes(descricao,fornecedor_id,fornecedores(nome))&order=data_pagamento.desc&limit=1000";
  var data = await api(q);
  _allPagamentos = data || [];
  return _allPagamentos;
}

function pagamentosFiltrados(){
  var per = getPagPeriodo();
  var meio = document.getElementById("realMeioFilter").value;
  var forn = document.getElementById("realFornFilter").value;
  return _allPagamentos.filter(function(p){
    if(per.ini && (p.data_pagamento || "") < per.ini) return false;
    if(per.fim && (p.data_pagamento || "") > per.fim) return false;
    if(meio && p.meio_pagamento !== meio) return false;
    if(forn){
      var fId = p.comprobantes ? p.comprobantes.fornecedor_id : null;
      if(String(fId) !== forn) return false;
    }
    return true;
  });
}

function renderRealizados(){
  var list = pagamentosFiltrados();
  var total = 0;
  var meiosMap = {};
  list.forEach(function(p){
    total += Number(p.valor) || 0;
    var m = p.meio_pagamento || "outro";
    meiosMap[m] = (meiosMap[m] || 0) + 1;
  });
  var meioTop = "—";
  var topCount = 0;
  Object.keys(meiosMap).forEach(function(k){ if(meiosMap[k] > topCount){ topCount = meiosMap[k]; meioTop = MEIO_LABEL[k] || k; } });

  document.getElementById("realizadosKpis").innerHTML =
    '<div class="kpi-card"><div class="kpi-label">Total pago</div><div class="kpi-value pago">'+fmtBRL(total)+'</div></div>' +
    '<div class="kpi-card"><div class="kpi-label">Nº pagos</div><div class="kpi-value">'+list.length+'</div></div>' +
    '<div class="kpi-card"><div class="kpi-label">Meio top</div><div class="kpi-value" style="font-size:12px">'+meioTop+'</div></div>';

  var el = document.getElementById("realizadosList");
  if(list.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-icon">💵</div>Sem pagos no período.</div>';
    return;
  }
  el.innerHTML = list.map(function(p){
    var forn = (p.comprobantes && p.comprobantes.fornecedores) ? p.comprobantes.fornecedores.nome : "—";
    var desc = p.comprobantes ? p.comprobantes.descricao : "";
    var meio = MEIO_LABEL[p.meio_pagamento] || p.meio_pagamento || "—";
    return '<div class="pag-item" data-comp="'+(p.comprobante_id||"")+'">' +
             '<div class="pag-item-head">' +
               '<div class="pag-item-forne">'+escapeHtml(forn)+'</div>' +
               '<div class="pag-item-valor">'+fmtBRL(p.valor)+'</div>' +
             '</div>' +
             (desc ? '<div class="pag-item-desc">'+escapeHtml(desc)+'</div>' : '') +
             '<div class="pag-item-meta">' +
               '<span>'+fmtDate(p.data_pagamento)+'</span>' +
               '<span class="chip-meio">'+meio+'</span>' +
             '</div>' +
           '</div>';
  }).join("");

  el.querySelectorAll("[data-comp]").forEach(function(it){
    it.addEventListener("click", function(){
      var cid = it.dataset.comp;
      if(cid) openCompModal(cid);
    });
  });
}

function renderEstadoConta(){
  var list = pagamentosFiltrados();
  if(list.length === 0){
    document.getElementById("contaList").innerHTML = '<div class="empty"><div class="empty-icon">🏦</div>Sem movimentos no período.</div>';
    return;
  }
  var map = {};
  list.forEach(function(p){
    var m = p.meio_pagamento || "outro";
    if(!map[m]) map[m] = { total: 0, count: 0 };
    map[m].total += Number(p.valor) || 0;
    map[m].count++;
  });
  var rows = Object.keys(map).map(function(k){
    return { meio: k, label: MEIO_LABEL[k] || k, total: map[k].total, count: map[k].count };
  }).sort(function(a,b){ return b.total - a.total; });

  document.getElementById("contaList").innerHTML = rows.map(function(r){
    return '<div class="conta-card">' +
             '<div>' +
               '<div class="conta-card-meio">'+r.label+'</div>' +
               '<div class="conta-card-count">'+r.count+' movimento'+(r.count !== 1 ? "s" : "")+'</div>' +
             '</div>' +
             '<div class="conta-card-valor">'+fmtBRL(r.total)+'</div>' +
           '</div>';
  }).join("");
}

function exportPagamentosExcel(){
  if(typeof XLSX === 'undefined'){ showToast("XLSX não carregou"); return; }
  var list = pagamentosFiltrados();
  if(list.length === 0){ showToast("Sem dados"); return; }
  var rows = list.map(function(p){
    var forn = (p.comprobantes && p.comprobantes.fornecedores) ? p.comprobantes.fornecedores.nome : "—";
    var desc = p.comprobantes ? p.comprobantes.descricao : "";
    return {
      "Data pagamento": p.data_pagamento || "",
      "Fornecedor":     forn,
      "Descrição":      desc,
      "Valor":          Number(p.valor) || 0,
      "Meio":           MEIO_LABEL[p.meio_pagamento] || p.meio_pagamento || "",
      "Banco ref":      p.banco_ref || "",
      "Observações":    p.observacoes || "",
      "Registrado por": p.created_by || ""
    };
  });
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:14},{wch:28},{wch:36},{wch:12},{wch:16},{wch:14},{wch:30},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
  var per = getPagPeriodo();
  var tag = (per.ini && per.fim) ? (per.ini + "_a_" + per.fim) : new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, "NORDAPP_Pagamentos_" + tag + ".xlsx");
  showToast("Excel baixado ✓");
}

function populateBandejaFornSelect(){
  // Ordena alfabético e usa só os que aparecem em comps pendentes
  var seen = {};
  _allComps.forEach(function(c){
    if(c.estado === 'pendente' || c.estado === 'pago_parcial'){
      if(c.fornecedores) seen[c.fornecedor_id] = c.fornecedores.nome;
    }
  });
  var opts = Object.keys(seen).sort(function(a,b){ return (seen[a]||"").localeCompare(seen[b]||""); })
    .map(function(id){ return '<option value="'+id+'">'+escapeHtml(seen[id])+'</option>'; }).join("");
  document.getElementById("bandejaFornFilter").innerHTML = '<option value="">Todos fornecedores</option>' + opts;
}

function populateRealFornSelect(){
  // Fornecedores que aparecem em pagamentos
  var seen = {};
  _allPagamentos.forEach(function(p){
    if(p.comprobantes && p.comprobantes.fornecedores){
      seen[p.comprobantes.fornecedor_id] = p.comprobantes.fornecedores.nome;
    }
  });
  var opts = Object.keys(seen).sort(function(a,b){ return (seen[a]||"").localeCompare(seen[b]||""); })
    .map(function(id){ return '<option value="'+id+'">'+escapeHtml(seen[id])+'</option>'; }).join("");
  document.getElementById("realFornFilter").innerHTML = '<option value="">Todos fornecedores</option>' + opts;
}

async function goToPagos(){
  showView("viewPagos");
  // Garantir dados em cache
  if(_allComps.length === 0) await loadComprobantes();
  await loadPagamentos();
  populateBandejaFornSelect();
  populateRealFornSelect();
  // Default: mês atual
  if(!document.getElementById("pagDataIni").value){
    aplicarPagPeriodoPreset("mes_atual");
  } else {
    renderPagAtivo();
  }
}

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

  // ─── Módulo Comprobantes ───
  var btnNovoC = document.getElementById("btnNovoComp");
  if(btnNovoC) btnNovoC.addEventListener("click", function(){
    if(!canEditComps()){ showToast("Sem permissão"); return; }
    openCompModal(null);
  });
  var btnCloseC = document.getElementById("btnCloseComp");
  if(btnCloseC) btnCloseC.addEventListener("click", closeCompModal);
  var btnSaveC = document.getElementById("btnSaveComp");
  if(btnSaveC) btnSaveC.addEventListener("click", saveComp);
  var btnAnularC = document.getElementById("btnAnularComp");
  if(btnAnularC) btnAnularC.addEventListener("click", anularComp);
  ["compSearch","compEstadoFilter","compCentroFilter","compCategoriaFilter","compOrderBy","compDataIni","compDataFim"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("input", renderCompList);
    if(el) el.addEventListener("change", renderCompList);
  });
  // Clear preset chip ao mudar manualmente as datas
  ["compDataIni","compDataFim"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", function(){
      document.querySelectorAll(".chip-btn[data-periodo]").forEach(function(b){ b.classList.remove("active"); });
    });
  });
  // Período presets
  document.querySelectorAll(".chip-btn[data-periodo]").forEach(function(b){
    b.addEventListener("click", function(){ aplicarPeriodoPreset(b.dataset.periodo); });
  });
  // Export Excel
  var btnExpC = document.getElementById("btnExportComps");
  if(btnExpC) btnExpC.addEventListener("click", exportCompsExcel);
  var mc = document.getElementById("modalComp");
  if(mc) mc.addEventListener("click", function(e){ if(e.target === mc) closeCompModal(); });

  // Nova categoria ao vuelo
  var cfCat = document.getElementById("cfCategoria");
  if(cfCat) cfCat.addEventListener("change", function(){
    if(cfCat.value === "__nova__"){ cfCat.value = ""; openCatModal(); }
  });
  var btnCloseCat = document.getElementById("btnCloseCat");
  if(btnCloseCat) btnCloseCat.addEventListener("click", closeCatModal);
  var btnSaveCat = document.getElementById("btnSaveCat");
  if(btnSaveCat) btnSaveCat.addEventListener("click", saveCategoria);
  var btnDelCat = document.getElementById("btnDeleteCat");
  if(btnDelCat) btnDelCat.addEventListener("click", deleteCategoria);
  var mcat = document.getElementById("modalCat");
  if(mcat) mcat.addEventListener("click", function(e){ if(e.target === mcat) closeCatModal(); });

  // Nova categoria desde a view Categorias
  var btnNovaC = document.getElementById("btnNovaCat");
  if(btnNovaC) btnNovaC.addEventListener("click", function(){
    if(!canEditCats()){ showToast("Sem permissão"); return; }
    openCatModal(null);
  });

  // ─── Módulo Pagos ───
  document.querySelectorAll(".tab-btn[data-tab]").forEach(function(b){
    b.addEventListener("click", function(){ switchPagTab(b.dataset.tab); });
  });
  document.querySelectorAll(".chip-btn[data-pag-periodo]").forEach(function(b){
    b.addEventListener("click", function(){ aplicarPagPeriodoPreset(b.dataset.pagPeriodo); });
  });
  ["pagDataIni","pagDataFim","bandejaCentroFilter","bandejaFornFilter","realMeioFilter","realFornFilter"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", renderPagAtivo);
  });
  ["pagDataIni","pagDataFim"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", function(){
      document.querySelectorAll(".chip-btn[data-pag-periodo]").forEach(function(b){ b.classList.remove("active"); });
    });
  });
  var btnExpP = document.getElementById("btnExportPagamentos");
  if(btnExpP) btnExpP.addEventListener("click", exportPagamentosExcel);

  // Modal pagamento
  var btnClosePag = document.getElementById("btnClosePag");
  if(btnClosePag) btnClosePag.addEventListener("click", closePagamentoModal);
  var btnSavePag = document.getElementById("btnSavePag");
  if(btnSavePag) btnSavePag.addEventListener("click", savePagamento);
  var mp = document.getElementById("modalPag");
  if(mp) mp.addEventListener("click", function(e){ if(e.target === mp) closePagamentoModal(); });

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
