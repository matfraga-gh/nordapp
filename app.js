/* BUILD: NORDAPP v0.1.0 · 2026-11-23 · Fase 1 setup */

(function(){
'use strict';

console.log("NORDAPP v0.9.0 · Conciliação bancária comprobantes · 2026-11-24");

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
  document.getElementById("buildStamp").textContent = "NORDAPP v0.9.0 · build 2026-11-24";
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
      { id:"pagos", icon:"💳", title:"Pagos", sub:"Bandeja e estado de conta" },
      { id:"conciliacao", icon:"🔗", title:"Conciliação", sub:"Extratos bancários" },
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
      { id:"retiros_socios", icon:"💼", title:"Retiros Sócios", sub:"Distribuições", onlyRoles:["master","administracao","auditor"] },
      { id:"simples_nacional", icon:"🧾", title:"Simples Nacional", sub:"Base DAS", onlyRoles:["master","administracao","auditor"] },
      { id:"comissoes", icon:"💰", title:"Comissões", sub:"Por canal / agente" }
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
  if(moduleId === "painel_resultados"){ goToDRE(); return; }
  if(moduleId === "ingresos"){ goToIngresos(); return; }
  if(moduleId === "caixa"){ goToCaixa(); return; }
  if(moduleId === "egresos"){ goToEgresos(); return; }
  if(moduleId === "retiros_socios"){ goToRetiros(); return; }
  if(moduleId === "conciliacao"){ goToConciliacao(); return; }
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
  var q = "comprobantes?select=*,fornecedores(nome,tipo),categorias_dre(nome,grupo)&order=data_competencia.desc&limit=10000";
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

    // Layout compacto: valor + datas em linha única
    var valorHtml = (estado === 'pago_parcial')
      ? fmtBRL(saldo) + ' <span style="font-size:11px;opacity:0.6;font-weight:400">/ ' + fmtBRL(valorTotal) + '</span>'
      : fmtBRL(valorTotal);

    var dateInfo = [];
    if(c.data_competencia) dateInfo.push('ref ' + fmtMesRef(c.data_competencia));
    if(estado === 'pago' && c.data_pagamento){
      dateInfo.push('pago ' + fmtDate(c.data_pagamento));
    } else if(c.data_vencimento){
      dateInfo.push('vence ' + fmtDate(c.data_vencimento));
    }

    var lines = '<div class="comp-item-line valor">'+valorHtml+'</div>' +
                '<div class="comp-item-line">'+dateInfo.join(' · ')+'</div>';

    // Actions: só mostra se tem ação relevante (pagamento pendente ou anexo)
    var actionsHtml = '';
    var needsAction = canEdit && estado !== 'anulado' && estado !== 'pago';
    if(needsAction){
      actionsHtml = '<div class="comp-item-actions">';
      actionsHtml += '<button class="primary" data-pag="'+c.id+'">💵 Pagar</button>';
      if(c.anexo_url) actionsHtml += '<button data-anexo="'+c.anexo_url+'" title="Anexo">📎</button>';
      actionsHtml += '</div>';
    } else if(c.anexo_url){
      actionsHtml = '<div class="comp-item-actions"><button data-anexo="'+c.anexo_url+'" title="Anexo">📎</button></div>';
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

// ─── Modal Despesa rápida ───
function openRapidaModal(){
  if(!canEditComps()){ showToast("Sem permissão"); return; }
  // Popular selects
  var fOpts = _allFornecedores.slice().sort(function(a,b){ return (a.nome||"").localeCompare(b.nome||""); })
    .map(function(f){ return '<option value="'+f.id+'">'+escapeHtml(f.nome)+'</option>'; }).join("");
  document.getElementById("rfFornecedor").innerHTML = '<option value="">Selecionar...</option>' + fOpts;
  var cOpts = _allCategorias.map(function(c){ return '<option value="'+c.id+'">'+escapeHtml(c.nome)+'</option>'; }).join("");
  document.getElementById("rfCategoria").innerHTML = '<option value="">Selecionar...</option>' + cOpts;

  document.getElementById("rfDescricao").value = "";
  document.getElementById("rfValor").value = "";
  document.getElementById("rfData").value = new Date().toISOString().slice(0,10);
  document.getElementById("rfCentroCusto").value = "geral";
  document.getElementById("rfMeio").value = "dinheiro";
  document.getElementById("rfFornecedor").value = "";
  document.getElementById("rfCategoria").value = "";

  document.getElementById("modalRapida").classList.add("open");
}
function closeRapidaModal(){
  document.getElementById("modalRapida").classList.remove("open");
}

async function saveRapida(){
  if(!canEditComps()){ showToast("Sem permissão"); return; }
  var fornId = document.getElementById("rfFornecedor").value;
  var desc   = document.getElementById("rfDescricao").value.trim();
  var valor  = parseFloat(document.getElementById("rfValor").value);
  var data   = document.getElementById("rfData").value;
  var catId  = document.getElementById("rfCategoria").value;
  var centro = document.getElementById("rfCentroCusto").value;
  var meio   = document.getElementById("rfMeio").value;

  if(!fornId){ showToast("Selecione fornecedor"); return; }
  if(!desc){ showToast("Descrição obrigatória"); return; }
  if(!valor || valor <= 0){ showToast("Valor inválido"); return; }
  if(!data){ showToast("Data obrigatória"); return; }
  if(!catId){ showToast("Selecione categoria"); return; }
  if(!meio){ showToast("Selecione meio"); return; }

  var now = new Date().toISOString();
  // 1) Criar comprobante já pago
  var compPayload = {
    descricao: desc,
    fornecedor_id: Number(fornId),
    categoria_dre_id: Number(catId),
    centro_custo: centro,
    data_competencia: data,
    data_pagamento: data,
    valor_total: valor,
    valor_pago: valor,
    estado: 'pago',
    meio_pagamento: meio,
    observacoes: '[Despesa rápida]',
    created_by: currentUser.username || "system",
    updated_at: now
  };
  var created = await api("comprobantes", "POST", compPayload);
  if(!created){ showToast("Erro ao criar comprobante"); return; }
  var compRow = Array.isArray(created) ? created[0] : created;

  // 2) Registrar pagamento no histórico
  if(compRow && compRow.id){
    await api("pagamentos", "POST", {
      comprobante_id: compRow.id,
      valor: valor,
      data_pagamento: data,
      meio_pagamento: meio,
      observacoes: '[Despesa rápida]',
      created_by: currentUser.username || "system"
    });
  }

  showToast("Despesa registrada ✓");
  closeRapidaModal();
  // Refresh ativo
  await loadComprobantes();
  if(document.getElementById("viewPagos").classList.contains("active")){
    await loadPagamentos();
    populateBandejaFornSelect();
    populateRealFornSelect();
    renderPagAtivo();
  }
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO PAINEL DE RESULTADOS (DRE)
// ═════════════════════════════════════════════════════════════════════
var _dreMes = null; // {y, m}  m é 0-indexed
var _dreReservasCache = null;
var _dreReservasSchema = null; // {campoData, campoValor, campoStatus}

function dreFirstDay(y, m){ return new Date(y, m, 1).toISOString().slice(0,10); }
function dreLastDay(y, m){ return new Date(y, m+1, 0).toISOString().slice(0,10); }
function dreMesLabel(y, m){
  var s = new Date(y, m, 1).toLocaleDateString('pt-BR', { month:'long', year:'numeric' });
  // Capitalizar só o mês, deixar " de " em minúscula
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dreGoMes(delta){
  var y = _dreMes.y, m = _dreMes.m + delta;
  while(m < 0){ y--; m += 12; }
  while(m > 11){ y++; m -= 12; }
  _dreMes = { y: y, m: m };
  renderDRE();
}

// Schema reservas hardcodado (confirmado 2026-11-24)
// Mês de competência = mês do checkin
async function loadReservasDRE(){
  var data = await api("reservas?select=id,checkin,checkout,apto,canal,total,adic_valor,svc_cozinheira,svc_early_checkin,svc_late_checkout,svc_outros_valor,devolucao,status&limit=5000");
  return { ok: !!data, rows: data || [] };
}

function reservaReceitaPrincipal(r){
  return Number(r.total) || 0;
}
function reservaReceitaAdicional(r){
  return (Number(r.adic_valor)||0)
       + (Number(r.svc_cozinheira)||0)
       + (Number(r.svc_early_checkin)||0)
       + (Number(r.svc_late_checkout)||0)
       + (Number(r.svc_outros_valor)||0);
}
function reservaDevolucao(r){
  return Number(r.devolucao) || 0;
}

function filtrarReservasNoMes(rows, y, m){
  var ini = dreFirstDay(y, m);
  var fim = dreLastDay(y, m);
  return rows.filter(function(r){
    if(!r.checkin) return false;
    var ds = String(r.checkin).slice(0, 10);
    if(ds < ini || ds > fim) return false;
    var st = String(r.status || "").toLowerCase();
    if(st === 'cancelada' || st === 'cancelado' || st === 'canceled' || st === 'cancel') return false;
    return true;
  });
}

// Agrupa despesas do mês (data_competencia) por categoria e grupo
function agruparDespesasMes(y, m, incluirConsorcio){
  var ini = dreFirstDay(y, m);
  var fim = dreLastDay(y, m);
  var list = _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(!c.data_competencia) return false;
    if(c.data_competencia < ini || c.data_competencia > fim) return false;
    if(!incluirConsorcio && c.centro_custo === 'consorcio') return false;
    return true;
  });

  // Map: grupo -> categoria_nome -> soma
  var grupos = {};
  list.forEach(function(c){
    var catNome = c.categorias_dre ? c.categorias_dre.nome : "Sem categoria";
    var grupo = c.categorias_dre ? c.categorias_dre.grupo : "nao_operacional";
    if(!grupos[grupo]) grupos[grupo] = {};
    if(!grupos[grupo][catNome]) grupos[grupo][catNome] = 0;
    grupos[grupo][catNome] += Number(c.valor_total) || 0;
  });
  return grupos;
}

// Formato compacto brl (sin R$ repetitivo, visible en tabla)
function fmtMoney(v){
  var n = Number(v) || 0;
  var abs = Math.abs(n);
  var str = abs.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (n < 0 ? '−' : '') + str;
}
function fmtPct(v, base){
  if(!base || base === 0) return '—';
  var p = (v / base) * 100;
  return p.toFixed(1) + '%';
}

// Renderiza uma seção com header colorido + linhas + opcional subitems
function dreRenderSec(cfg, dados, base, subitemsMap){
  // dados: { "nome categoria": valor, ... }
  // subitemsMap (opcional): { "nome categoria": [{label, valor}, ...] }
  if(!dados || Object.keys(dados).length === 0) return "";
  var total = 0;
  Object.keys(dados).forEach(function(k){ total += dados[k]; });
  var sinal = cfg.sinal || '−';
  var html = '<div class="dre-sec-head '+cfg.cls+'">' +
               '<div class="sh-label">'+sinal+' '+cfg.titulo+'</div>' +
               '<div class="sh-valor">'+fmtMoney(total)+'</div>' +
               '<div class="sh-pct">'+fmtPct(total, base)+'</div>' +
             '</div>';
  Object.keys(dados).sort(function(a,b){ return dados[b] - dados[a]; }).forEach(function(k){
    // k pode ter sufixo (comprobante) ou (não-hosp.) — extrair nome base
    var kBase = k.replace(/\s*\(comprobante\)$/, '').replace(/\s*\(não-hosp\.\)$/, '');
    html += '<div class="dre-row" data-cat="'+escapeHtml(kBase)+'">' +
              '<div class="r-label">'+escapeHtml(k)+'</div>' +
              '<div class="r-valor">'+fmtMoney(dados[k])+'</div>' +
              '<div class="r-pct">'+fmtPct(dados[k], base)+'</div>' +
            '</div>';
    if(subitemsMap && subitemsMap[k]){
      subitemsMap[k].forEach(function(s){
        html += '<div class="dre-row sub">' +
                  '<div class="r-label">'+escapeHtml(s.label)+'</div>' +
                  '<div class="r-valor">'+fmtMoney(s.valor)+'</div>' +
                  '<div class="r-pct">'+fmtPct(s.valor, base)+'</div>' +
                '</div>';
      });
    }
  });
  return html;
}

function dreTotalRow(cls, label, valor, baseMargem, cssExtra, valorAnt){
  var varHtml = "";
  if(valorAnt !== undefined && valorAnt !== null){
    varHtml = ' ' + dreVarBadge(valor, valorAnt);
  }
  return '<div class="dre-total-row '+cls+(cssExtra?' '+cssExtra:'')+'">' +
           '<div class="t-label">'+label+varHtml+'</div>' +
           '<div class="t-valor">'+fmtMoney(valor)+'</div>' +
           '<div class="t-pct">'+fmtPct(valor, baseMargem)+'</div>' +
         '</div>';
}

function dreVarBadge(atual, ant){
  if(!ant || ant === 0){
    if(!atual) return '<span class="dre-var flat">—</span>';
    return '<span class="dre-var up">novo</span>';
  }
  var pct = ((atual - ant) / Math.abs(ant)) * 100;
  var cls = Math.abs(pct) < 0.5 ? 'flat' : (pct >= 0 ? 'up' : 'down');
  var sign = pct > 0 ? '+' : '';
  return '<span class="dre-var '+cls+'">'+sign+pct.toFixed(0)+'%</span>';
}

async function renderDRE(){
  if(!_dreMes){
    var hoje = new Date();
    _dreMes = { y: hoje.getFullYear(), m: hoje.getMonth() };
  }
  var incluirConsorcio = document.getElementById("dreIncluirConsorcio").checked;
  document.getElementById("dreMesAtual").textContent = dreMesLabel(_dreMes.y, _dreMes.m);
  document.getElementById("dreSubtitle").textContent = incluirConsorcio ? "Consolidado + Consórcio · Competência" : "Nordestina (sem Consórcio) · Competência";

  var el = document.getElementById("dreBody");
  el.innerHTML = '<div class="loading">Carregando...</div>';

  // Despesas (já em cache)
  if(_allComps.length === 0) await loadComprobantes();
  if(_allCategorias.length === 0) await loadCategorias();

  // Reservas
  var reservasResult = await loadReservasDRE();

  var y = _dreMes.y, m = _dreMes.m;
  var grupos = agruparDespesasMes(y, m, incluirConsorcio);

  // Receitas de reservas (mês de competência = mês do checkin)
  var receitasHospedagem = 0;
  var receitasAdicionais = 0;
  var devolucoes = 0;
  var receitasCanalBreakdown = {};
  var warningHtml = "";

  if(!reservasResult.ok){
    warningHtml = '<div class="dre-warning">⚠ Não consegui ler a tabela <b>reservas</b>. Verificar RLS / permissões.</div>';
  } else {
    var rsvMes = filtrarReservasNoMes(reservasResult.rows, y, m);
    rsvMes.forEach(function(r){
      var vp = reservaReceitaPrincipal(r);
      var va = reservaReceitaAdicional(r);
      var vd = reservaDevolucao(r);
      receitasHospedagem += vp;
      receitasAdicionais += va;
      devolucoes += vd;
      var c = (r.canal || "Direta").trim() || "Direta";
      receitasCanalBreakdown[c] = (receitasCanalBreakdown[c] || 0) + vp;
    });
  }
  var receitaReservas = receitasHospedagem + receitasAdicionais - devolucoes;

  // Sumar por grupo
  function somarGrupo(g){ var s = 0; if(grupos[g]) Object.keys(grupos[g]).forEach(function(k){ s += grupos[g][k]; }); return s; }

  var custoOp   = somarGrupo('custo_operacional');
  var despAdm   = somarGrupo('despesa_admin');
  var tributos  = somarGrupo('tributos');
  var despFin   = somarGrupo('despesa_financeira');
  var naoOp     = somarGrupo('nao_operacional');
  var receitasExtra = somarGrupo('receita'); // caso tenham classificado receitas em comprobantes

  var receitasTotal = receitaReservas + receitasExtra;
  var resultadoOp   = receitasTotal - custoOp;
  var ebitda        = resultadoOp - despAdm - tributos;
  var resultadoLiq  = ebitda - despFin - naoOp;

  // Base para % = receita total
  var base = receitasTotal;

  var html = warningHtml;

  // Tabela principal
  html += '<div class="dre-table">';
  html += '<div class="dre-colheader"><div>Conta</div><div>R$</div><div>%</div></div>';

  // RECEITAS
  if(receitasTotal > 0){
    var receitaDados = {};
    var receitaSubs = {};
    if(receitasHospedagem > 0){
      receitaDados["Hospedagem"] = receitasHospedagem;
      var subs = [];
      Object.keys(receitasCanalBreakdown).sort(function(a,b){ return receitasCanalBreakdown[b]-receitasCanalBreakdown[a]; }).forEach(function(c){
        subs.push({ label: c, valor: receitasCanalBreakdown[c] });
      });
      receitaSubs["Hospedagem"] = subs;
    }
    if(receitasAdicionais > 0) receitaDados["Serviços adicionais"] = receitasAdicionais;
    if(devolucoes > 0)         receitaDados["(−) Devoluções"] = -devolucoes;
    if(grupos.receita){
      Object.keys(grupos.receita).forEach(function(k){
        receitaDados[k + " (comprobante)"] = grupos.receita[k];
      });
    }
    html += dreRenderSec({ cls:'sec-receita', titulo:'Receitas', sinal:'+' }, receitaDados, base, receitaSubs);
  } else if(reservasResult.ok){
    html += '<div class="dre-warning">Nenhuma receita em '+dreMesLabel(y,m)+'. Confira se há reservas com check-in neste mês (status ≠ cancelada).</div>';
  }

  // Comparativo com mês anterior (opcional)
  var comparar = document.getElementById("dreComparar").checked;
  var totAnt = null;
  if(comparar){
    var ym = _dreMes.y, mm = _dreMes.m - 1;
    if(mm < 0){ mm = 11; ym--; }
    var gruposAnt = agruparDespesasMes(ym, mm, incluirConsorcio);
    function sgAnt(g){ var s = 0; if(gruposAnt[g]) Object.keys(gruposAnt[g]).forEach(function(k){ s += gruposAnt[g][k]; }); return s; }
    var custoOpAnt = sgAnt('custo_operacional');
    var despAdmAnt = sgAnt('despesa_admin');
    var tributosAnt = sgAnt('tributos');
    var despFinAnt = sgAnt('despesa_financeira');
    var naoOpAnt = sgAnt('nao_operacional');
    // Receitas do mês anterior
    var receitaAnt = 0;
    if(reservasResult.ok){
      var rsvAnt = filtrarReservasNoMes(reservasResult.rows, ym, mm);
      rsvAnt.forEach(function(r){ receitaAnt += reservaReceitaPrincipal(r) + reservaReceitaAdicional(r) - reservaDevolucao(r); });
    }
    receitaAnt += sgAnt('receita');
    var opAnt = receitaAnt - custoOpAnt;
    var ebitdaAnt = opAnt - despAdmAnt - tributosAnt;
    var liqAnt = ebitdaAnt - despFinAnt - naoOpAnt;
    totAnt = { receita: receitaAnt, op: opAnt, ebitda: ebitdaAnt, liq: liqAnt };
  }

  // CUSTO OP
  html += dreRenderSec({ cls:'sec-custo-op', titulo:'Custo operacional' }, grupos.custo_operacional, base);
  // Resultado operacional bruto
  html += dreTotalRow('tot-bruto', 'Resultado operacional bruto', resultadoOp, base, '', totAnt ? totAnt.op : undefined);

  // ADM
  html += dreRenderSec({ cls:'sec-despesa-admin', titulo:'Despesas administrativas' }, grupos.despesa_admin, base);
  // TRIBUTOS
  html += dreRenderSec({ cls:'sec-tributos', titulo:'Tributos' }, grupos.tributos, base);
  // EBITDA
  html += dreTotalRow('tot-ebitda', 'EBITDA', ebitda, base, '', totAnt ? totAnt.ebitda : undefined);

  // FINANCEIRAS
  html += dreRenderSec({ cls:'sec-despesa-fin', titulo:'Despesas financeiras' }, grupos.despesa_financeira, base);
  // NÃO OP
  html += dreRenderSec({ cls:'sec-nao-op', titulo:'Não operacional' }, grupos.nao_operacional, base);
  // LÍQUIDO
  html += dreTotalRow('tot-liquido', 'Resultado líquido', resultadoLiq, base, resultadoLiq < 0 ? 'negativo' : '', totAnt ? totAnt.liq : undefined);

  html += '</div>'; // .dre-table

  // Fórmula
  html += '<div class="dre-formula">Resultado líquido = Receitas − Custo op. − Despesas adm. − Tributos − Financeiras − Não op.</div>';

  if(receitasTotal === 0 && Object.keys(grupos).length === 0){
    el.innerHTML = warningHtml + '<div class="empty"><div class="empty-icon">📊</div>Sem movimento em '+dreMesLabel(y,m)+'.</div>';
    return;
  }
  el.innerHTML = html;

  // Drill-down: click em linha de categoria abre modal com comprobantes
  el.querySelectorAll(".dre-row[data-cat]").forEach(function(row){
    row.addEventListener("click", function(){
      abrirDrilldownDRE(row.dataset.cat);
    });
  });
}

// ── Drill-down modal ──
function abrirDrilldownDRE(catNome){
  var ini = dreFirstDay(_dreMes.y, _dreMes.m);
  var fim = dreLastDay(_dreMes.y, _dreMes.m);
  var incluirConsorcio = document.getElementById("dreIncluirConsorcio").checked;

  var list = _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(!c.data_competencia) return false;
    if(c.data_competencia < ini || c.data_competencia > fim) return false;
    if(!incluirConsorcio && c.centro_custo === 'consorcio') return false;
    var cat = c.categorias_dre ? c.categorias_dre.nome : "Sem categoria";
    return cat === catNome;
  });
  list.sort(function(a,b){ return Number(b.valor_total) - Number(a.valor_total); });

  var total = 0;
  list.forEach(function(c){ total += Number(c.valor_total) || 0; });

  document.getElementById("drillTitle").textContent = catNome;
  document.getElementById("drillInfo").textContent = dreMesLabel(_dreMes.y, _dreMes.m) + " · " + list.length + " comprobante" + (list.length !== 1 ? "s" : "");

  var html = "";
  if(list.length === 0){
    html = '<div class="empty"><div class="empty-icon">🧾</div>Nenhum comprobante.</div>';
  } else {
    html = list.map(function(c){
      var forn = c.fornecedores ? c.fornecedores.nome : "—";
      return '<div class="drill-row" data-comp="'+c.id+'">' +
               '<div class="drill-data">'+fmtDate(c.data_competencia)+'</div>' +
               '<div class="drill-desc">'+escapeHtml(c.descricao||"—")+'<span class="forne">'+escapeHtml(forn)+'</span></div>' +
               '<div class="drill-valor">'+fmtBRL(c.valor_total)+'</div>' +
             '</div>';
    }).join("");
    html += '<div class="drill-total"><span>Total</span><span>'+fmtBRL(total)+'</span></div>';
  }
  document.getElementById("drillList").innerHTML = html;

  // Click em um comprobante abre o modal de edição
  document.getElementById("drillList").querySelectorAll("[data-comp]").forEach(function(r){
    r.addEventListener("click", function(){
      closeDrillModal();
      openCompModal(r.dataset.comp);
    });
  });

  document.getElementById("modalDrill").classList.add("open");
}
function closeDrillModal(){
  document.getElementById("modalDrill").classList.remove("open");
}

async function exportDREExcel(){
  if(typeof XLSX === 'undefined'){ showToast("XLSX não carregou"); return; }
  if(!_dreMes){ showToast("Selecione um mês"); return; }
  var incluirConsorcio = document.getElementById("dreIncluirConsorcio").checked;
  var y = _dreMes.y, m = _dreMes.m;
  var grupos = agruparDespesasMes(y, m, incluirConsorcio);

  // Receitas de reservas
  var rsvRes = await loadReservasDRE();
  var rhosp = 0, radd = 0, rdev = 0, canalMap = {};
  if(rsvRes.ok){
    var rsvMes = filtrarReservasNoMes(rsvRes.rows, y, m);
    rsvMes.forEach(function(r){
      rhosp += reservaReceitaPrincipal(r);
      radd  += reservaReceitaAdicional(r);
      rdev  += reservaDevolucao(r);
      var c = (r.canal || "Direta").trim() || "Direta";
      canalMap[c] = (canalMap[c] || 0) + reservaReceitaPrincipal(r);
    });
  }

  var rows = [];
  function addGrupo(label, g){
    if(!g) return;
    rows.push({ Linha: label, Valor: null });
    Object.keys(g).sort(function(a,b){ return g[b]-g[a]; }).forEach(function(k){
      rows.push({ Linha: "  " + k, Valor: g[k] });
    });
    var s = 0; Object.keys(g).forEach(function(k){ s += g[k]; });
    rows.push({ Linha: label + " · Total", Valor: s });
    rows.push({});
  }
  // Receitas
  rows.push({ Linha: "RECEITAS", Valor: null });
  rows.push({ Linha: "  Hospedagem", Valor: rhosp });
  Object.keys(canalMap).sort(function(a,b){ return canalMap[b]-canalMap[a]; }).forEach(function(c){
    rows.push({ Linha: "    · " + c, Valor: canalMap[c] });
  });
  if(radd > 0) rows.push({ Linha: "  Serviços adicionais", Valor: radd });
  if(rdev > 0) rows.push({ Linha: "  (−) Devoluções", Valor: -rdev });
  if(grupos.receita){ Object.keys(grupos.receita).forEach(function(k){ rows.push({ Linha: "  " + k + " (comprobante)", Valor: grupos.receita[k] }); }); }
  var recExtra = 0; if(grupos.receita) Object.keys(grupos.receita).forEach(function(k){ recExtra += grupos.receita[k]; });
  rows.push({ Linha: "RECEITAS · Total", Valor: rhosp + radd - rdev + recExtra });
  rows.push({});

  addGrupo("CUSTO OPERACIONAL", grupos.custo_operacional);
  addGrupo("DESPESAS ADMINISTRATIVAS", grupos.despesa_admin);
  addGrupo("TRIBUTOS", grupos.tributos);
  addGrupo("DESPESAS FINANCEIRAS", grupos.despesa_financeira);
  addGrupo("NÃO OPERACIONAL", grupos.nao_operacional);

  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:40},{wch:16}];
  var sheetName = "DRE_" + y + "_" + String(m+1).padStart(2,"0");
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, "NORDAPP_" + sheetName + ".xlsx");
  showToast("Excel baixado ✓");
}

async function goToDRE(){
  showView("viewDRE");
  if(!_dreMes){
    var hoje = new Date();
    _dreMes = { y: hoje.getFullYear(), m: hoje.getMonth() };
  }
  if(_allComps.length === 0) await loadComprobantes();
  renderDRE();
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO REPORTE DE INGRESOS
// ═════════════════════════════════════════════════════════════════════
var UNIDADES_TOTAL = 9; // 8 lofts ativos + Casa Nordestina (editável · ler de app_config no futuro)
var _ingReservas = null;

function getIngPeriodo(){
  return {
    ini: document.getElementById("ingDataIni").value || null,
    fim: document.getElementById("ingDataFim").value || null
  };
}

function aplicarIngPeriodoPreset(preset){
  var hoje = new Date();
  var y = hoje.getFullYear(), m = hoje.getMonth();
  function iso(d){ return d.toISOString().slice(0,10); }
  var ini = "", fim = "";
  if(preset === "mes_atual"){ ini = iso(new Date(y,m,1)); fim = iso(new Date(y,m+1,0)); }
  else if(preset === "mes_anterior"){ ini = iso(new Date(y,m-1,1)); fim = iso(new Date(y,m,0)); }
  else if(preset === "ano_atual"){ ini = iso(new Date(y,0,1)); fim = iso(new Date(y,11,31)); }
  document.getElementById("ingDataIni").value = ini;
  document.getElementById("ingDataFim").value = fim;
  document.querySelectorAll(".chip-btn[data-ing-periodo]").forEach(function(b){
    b.classList.toggle("active", b.dataset.ingPeriodo === preset);
  });
  renderIngresos();
}

function noitesEntre(d1, d2){
  // noites = diff em dias
  var a = new Date(d1 + "T00:00:00");
  var b = new Date(d2 + "T00:00:00");
  return Math.round((b - a) / 86400000);
}
function diasEntre(d1, d2){
  // dias incluindo ambos
  return noitesEntre(d1, d2) + 1;
}

function reservaReceita(r){
  return reservaReceitaPrincipal(r) + reservaReceitaAdicional(r) - reservaDevolucao(r);
}

function filtrarIngReservasNoPeriodo(rows, per){
  // Usa checkin como ancla
  return rows.filter(function(r){
    if(!r.checkin) return false;
    var ck = String(r.checkin).slice(0,10);
    if(per.ini && ck < per.ini) return false;
    if(per.fim && ck > per.fim) return false;
    var st = String(r.status || "").toLowerCase();
    if(st.indexOf("cancel") >= 0) return false;
    return true;
  });
}

async function renderIngresos(){
  var per = getIngPeriodo();
  var el = document.getElementById("ingBody");

  // Cache reservas (usa mesma função do DRE)
  var rsvRes = await loadReservasDRE();
  if(!rsvRes.ok){
    el.innerHTML = '<div class="dre-warning">⚠ Não consegui ler reservas.</div>';
    return;
  }
  _ingReservas = rsvRes.rows;

  var list = filtrarIngReservasNoPeriodo(_ingReservas, per);

  // KPIs
  var receita = 0;
  var noitesOcupadas = 0;
  var hospedesCount = 0;

  list.forEach(function(r){
    receita += reservaReceita(r);
    if(r.checkin && r.checkout){
      var n = noitesEntre(r.checkin, r.checkout);
      if(n > 0) noitesOcupadas += n;
    }
    // hospedes aproximado
    // fica fora por enquanto (seria bom somar adultos+criancas)
  });

  // Noites disponíveis = unidades × dias do período
  var diasPeriodo = 0;
  if(per.ini && per.fim){
    diasPeriodo = diasEntre(per.ini, per.fim);
  }
  var noitesDisponiveis = diasPeriodo * UNIDADES_TOTAL;
  var ocupacao = noitesDisponiveis > 0 ? (noitesOcupadas / noitesDisponiveis) * 100 : 0;
  var ticketMedio = list.length > 0 ? receita / list.length : 0;
  var noiteMedia  = noitesOcupadas > 0 ? receita / noitesOcupadas : 0;

  var kpisEl = document.getElementById("ingKpis");
  kpisEl.innerHTML =
    '<div class="ing-kpi hero span2">' +
      '<div class="ing-kpi-label">Receita bruta</div>' +
      '<div class="ing-kpi-value">'+fmtBRL(receita)+'</div>' +
      '<div class="ing-kpi-sub">'+list.length+' reserva'+(list.length!==1?'s':'')+' · '+noitesOcupadas+' noites</div>' +
    '</div>' +
    '<div class="ing-kpi">' +
      '<div class="ing-kpi-label">Ticket médio</div>' +
      '<div class="ing-kpi-value">'+fmtBRL(ticketMedio)+'</div>' +
      '<div class="ing-kpi-sub">por reserva</div>' +
    '</div>' +
    '<div class="ing-kpi">' +
      '<div class="ing-kpi-label">Diária média</div>' +
      '<div class="ing-kpi-value">'+fmtBRL(noiteMedia)+'</div>' +
      '<div class="ing-kpi-sub">por noite</div>' +
    '</div>' +
    '<div class="ing-kpi span2">' +
      '<div class="ing-kpi-label">Ocupação</div>' +
      '<div class="ing-kpi-value">'+ocupacao.toFixed(1)+'%</div>' +
      '<div class="ing-kpi-sub">'+noitesOcupadas+' / '+noitesDisponiveis+' noites · '+UNIDADES_TOTAL+' unidades</div>' +
      '<div class="ing-ocup-bar"><div class="ing-ocup-bar-fill" style="width:'+Math.min(100,ocupacao).toFixed(1)+'%"></div></div>' +
    '</div>';

  // ── Outros serviços (receitas em comprobantes, exceto Hospedagem) ──
  if(_allComps.length === 0) await loadComprobantes();
  var outrosList = _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(!c.categorias_dre) return false;
    if(c.categorias_dre.grupo !== 'receita') return false;
    var nome = (c.categorias_dre.nome || "").toLowerCase();
    if(nome.indexOf("hospedagem") >= 0) return false; // já coberto por reservas
    if(!c.data_competencia) return false;
    if(per.ini && c.data_competencia < per.ini) return false;
    if(per.fim && c.data_competencia > per.fim) return false;
    return true;
  });
  // Agrupa por categoria
  var outrosPorCategoria = {};
  var outrosTotal = 0;
  outrosList.forEach(function(c){
    var cat = c.categorias_dre.nome;
    outrosPorCategoria[cat] = (outrosPorCategoria[cat] || 0) + (Number(c.valor_total) || 0);
    outrosTotal += Number(c.valor_total) || 0;
  });

  // Receita total agora inclui Outros serviços
  var receitaTotalGeral = receita + outrosTotal;

  // Atualizar hero KPI com receita + outros (mantem ticket/diária só hospedagem)
  document.getElementById("ingKpis").querySelector(".ing-kpi.hero .ing-kpi-value").innerHTML = fmtBRL(receitaTotalGeral);
  var heroSub = list.length + ' reserva'+(list.length!==1?'s':'')+' · '+noitesOcupadas+' noites';
  if(outrosTotal > 0) heroSub += ' · <span style="color:var(--ocean-mid);font-weight:600">+ '+outrosList.length+' outros</span>';
  document.getElementById("ingKpis").querySelector(".ing-kpi.hero .ing-kpi-sub").innerHTML = heroSub;

  // Breakdown por canal (hospedagem)
  var canalMap = {};
  list.forEach(function(r){
    var c = (r.canal || "Direta").trim() || "Direta";
    if(!canalMap[c]) canalMap[c] = { reservas: 0, noites: 0, receita: 0 };
    canalMap[c].reservas++;
    if(r.checkin && r.checkout){
      var n = noitesEntre(r.checkin, r.checkout);
      if(n > 0) canalMap[c].noites += n;
    }
    canalMap[c].receita += reservaReceita(r);
  });
  var canalArr = Object.keys(canalMap).map(function(k){ return { canal:k, ...canalMap[k] }; })
    .sort(function(a,b){ return b.receita - a.receita; });

  var canalHtml = '<div class="ing-table">' +
    '<div class="ing-table-title">Por canal</div>' +
    '<div class="ing-table-row header">' +
      '<div>Canal</div><div>Rsv</div><div>Noites</div><div>Receita</div><div>%</div>' +
    '</div>';
  canalArr.forEach(function(c){
    var pct = receitaTotalGeral > 0 ? (c.receita / receitaTotalGeral) * 100 : 0;
    canalHtml += '<div class="ing-table-row">' +
      '<div>'+escapeHtml(c.canal)+'</div>' +
      '<div>'+c.reservas+'</div>' +
      '<div>'+c.noites+'</div>' +
      '<div>'+fmtMoney(c.receita)+'</div>' +
      '<div>'+pct.toFixed(0)+'%</div>' +
    '</div>';
  });
  // Linha(s) Outros serviços
  Object.keys(outrosPorCategoria).sort(function(a,b){ return outrosPorCategoria[b]-outrosPorCategoria[a]; }).forEach(function(cat){
    var pct = receitaTotalGeral > 0 ? (outrosPorCategoria[cat] / receitaTotalGeral) * 100 : 0;
    canalHtml += '<div class="ing-table-row" style="color:rgba(240,216,144,0.95)">' +
      '<div>'+escapeHtml(cat)+' <span style="font-size:10px;opacity:0.7">(não-hosp.)</span></div>' +
      '<div>—</div>' +
      '<div>—</div>' +
      '<div>'+fmtMoney(outrosPorCategoria[cat])+'</div>' +
      '<div>'+pct.toFixed(0)+'%</div>' +
    '</div>';
  });
  canalHtml += '<div class="ing-table-row total">' +
    '<div>Total</div><div>'+list.length+'</div><div>'+noitesOcupadas+'</div><div>'+fmtMoney(receitaTotalGeral)+'</div><div>100%</div>' +
  '</div></div>';

  // Breakdown por unidade (usa mesmo cache de reservas)
  var aptoMap = {};
  list.forEach(function(r){
    var ap = (r.apto || "—").trim() || "—";
    if(!aptoMap[ap]) aptoMap[ap] = { reservas: 0, noites: 0, receita: 0 };
    aptoMap[ap].reservas++;
    if(r.checkin && r.checkout){
      var n = noitesEntre(r.checkin, r.checkout);
      if(n > 0) aptoMap[ap].noites += n;
    }
    aptoMap[ap].receita += reservaReceita(r);
  });
  var aptoArr = Object.keys(aptoMap).map(function(k){ return { apto:k, ...aptoMap[k] }; })
    .sort(function(a,b){ return b.receita - a.receita; });

  var aptoHtml = '<div class="ing-table">' +
    '<div class="ing-table-title">Por unidade</div>' +
    '<div class="ing-table-row header">' +
      '<div>Unidade</div><div>Rsv</div><div>Noites</div><div>Receita</div><div>Ocup</div>' +
    '</div>';
  aptoArr.forEach(function(a){
    var ocupApto = diasPeriodo > 0 ? (a.noites / diasPeriodo) * 100 : 0;
    aptoHtml += '<div class="ing-table-row">' +
      '<div>'+escapeHtml(a.apto)+'</div>' +
      '<div>'+a.reservas+'</div>' +
      '<div>'+a.noites+'</div>' +
      '<div>'+fmtMoney(a.receita)+'</div>' +
      '<div>'+ocupApto.toFixed(0)+'%</div>' +
    '</div>';
  });
  // Linha Outros serviços (sem unidade / sem ocupação)
  if(outrosTotal > 0){
    aptoHtml += '<div class="ing-table-row" style="color:rgba(240,216,144,0.95)">' +
      '<div>Outros serviços <span style="font-size:10px;opacity:0.7">(não-hosp.)</span></div>' +
      '<div>—</div>' +
      '<div>—</div>' +
      '<div>'+fmtMoney(outrosTotal)+'</div>' +
      '<div>—</div>' +
    '</div>';
  }
  aptoHtml += '</div>';

  var html = canalHtml + aptoHtml;
  if(list.length === 0 && outrosTotal === 0){
    html = '<div class="empty"><div class="empty-icon">📈</div>Sem reservas nem outros serviços no período.</div>';
  }
  el.innerHTML = html;
  var subtitle = list.length + " reserva" + (list.length !== 1 ? "s" : "");
  if(outrosList.length > 0) subtitle += " + " + outrosList.length + " outro" + (outrosList.length !== 1 ? "s" : "");
  document.getElementById("ingSubtitle").textContent = subtitle + " no período";
}

function exportIngresosExcel(){
  if(typeof XLSX === 'undefined' || !_ingReservas){ showToast("Sem dados"); return; }
  var per = getIngPeriodo();
  var list = filtrarIngReservasNoPeriodo(_ingReservas, per);

  var rows = list.map(function(r){
    var n = (r.checkin && r.checkout) ? noitesEntre(r.checkin, r.checkout) : 0;
    return {
      "Tipo": "Hospedagem",
      "Data": r.checkin || "",
      "Unidade": r.apto || "",
      "Canal": r.canal || "",
      "Noites": n,
      "Receita": reservaReceita(r),
      "Detalhe": (r.status || "") + (r.checkout ? " · co " + r.checkout : "")
    };
  });

  // Outros serviços
  var outros = _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(!c.categorias_dre) return false;
    if(c.categorias_dre.grupo !== 'receita') return false;
    var nome = (c.categorias_dre.nome || "").toLowerCase();
    if(nome.indexOf("hospedagem") >= 0) return false;
    if(!c.data_competencia) return false;
    if(per.ini && c.data_competencia < per.ini) return false;
    if(per.fim && c.data_competencia > per.fim) return false;
    return true;
  });
  outros.forEach(function(c){
    rows.push({
      "Tipo": "Outros serviços",
      "Data": c.data_competencia || "",
      "Unidade": "",
      "Canal": c.categorias_dre.nome,
      "Noites": "",
      "Receita": Number(c.valor_total) || 0,
      "Detalhe": c.descricao || ""
    });
  });

  if(rows.length === 0){ showToast("Sem dados"); return; }

  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:14},{wch:12},{wch:16},{wch:16},{wch:8},{wch:12},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws, "Ingresos");
  var tag = (per.ini && per.fim) ? (per.ini + "_a_" + per.fim) : new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, "NORDAPP_Ingresos_" + tag + ".xlsx");
  showToast("Excel baixado ✓");
}

async function carregarUnidadesConfig(){
  // Lê de app_config?chave=eq.unidades_ativas (opcional)
  try {
    var r = await api("app_config?chave=eq.unidades_ativas&select=valor");
    if(r && r.length > 0 && r[0].valor){
      var n = parseInt(r[0].valor, 10);
      if(n > 0) UNIDADES_TOTAL = n;
    }
  } catch(e){ /* usa default */ }
}

async function goToIngresos(){
  showView("viewIngresos");
  await carregarUnidadesConfig();
  if(!document.getElementById("ingDataIni").value){
    aplicarIngPeriodoPreset("mes_atual");
  } else {
    renderIngresos();
  }
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO CAIXA · Fluxo em regime de caixa
// ═════════════════════════════════════════════════════════════════════
var _allPagamentosCaixa = null;

function getCaixaPeriodo(){
  return {
    ini: document.getElementById("caixaDataIni").value || null,
    fim: document.getElementById("caixaDataFim").value || null
  };
}
function aplicarCaixaPeriodoPreset(preset){
  var hoje = new Date();
  var y = hoje.getFullYear(), m = hoje.getMonth();
  function iso(d){ return d.toISOString().slice(0,10); }
  var ini = "", fim = "";
  if(preset === "mes_atual"){ ini = iso(new Date(y,m,1)); fim = iso(new Date(y,m+1,0)); }
  else if(preset === "mes_anterior"){ ini = iso(new Date(y,m-1,1)); fim = iso(new Date(y,m,0)); }
  else if(preset === "ano_atual"){ ini = iso(new Date(y,0,1)); fim = iso(new Date(y,11,31)); }
  document.getElementById("caixaDataIni").value = ini;
  document.getElementById("caixaDataFim").value = fim;
  document.querySelectorAll(".chip-btn[data-caixa-periodo]").forEach(function(b){
    b.classList.toggle("active", b.dataset.caixaPeriodo === preset);
  });
  renderCaixa();
}

async function renderCaixa(){
  var per = getCaixaPeriodo();
  var el = document.getElementById("caixaBody");
  el.innerHTML = '<div class="loading">Carregando...</div>';

  // Precisa de pagamentos + reservas (para entradas)
  if(!_allPagamentosCaixa){
    _allPagamentosCaixa = await api("pagamentos?select=*,comprobantes(descricao,fornecedores(nome))&order=data_pagamento.desc&limit=5000") || [];
  }
  var reservasResult = await loadReservasDRE();

  // ── ENTRADAS (reservas · data_anticipo + data_saldo) ──
  var entradas = [];  // { data, valor, label, meio }
  if(reservasResult.ok){
    // Precisa dos campos de anticipo e saldo que não estão em loadReservasDRE
    // Faço fetch adicional com campos completos
    var reservasCaixa = await api("reservas?select=id,nome,canal,apto,anticipo,saldo_cobrado,pago_anticipo,pago_saldo,data_anticipo,data_saldo,devolucao,status&limit=5000");
    if(reservasCaixa){
      reservasCaixa.forEach(function(r){
        var st = String(r.status || "").toLowerCase();
        if(st.indexOf("cancel") >= 0) return;
        // Anticipo pago
        if(r.data_anticipo && Number(r.anticipo) > 0){
          var d = String(r.data_anticipo).slice(0,10);
          if((!per.ini || d >= per.ini) && (!per.fim || d <= per.fim)){
            entradas.push({
              data: d, valor: Number(r.anticipo),
              label: "Antecipado · " + (r.nome || "Sem nome"),
              meio: (r.pago_anticipo || "").toLowerCase() || "outro",
              tipo: "reserva_ant"
            });
          }
        }
        // Saldo pago
        if(r.data_saldo && Number(r.saldo_cobrado) > 0){
          var d2 = String(r.data_saldo).slice(0,10);
          if((!per.ini || d2 >= per.ini) && (!per.fim || d2 <= per.fim)){
            entradas.push({
              data: d2, valor: Number(r.saldo_cobrado),
              label: "Saldo · " + (r.nome || "Sem nome"),
              meio: (r.pago_saldo || "").toLowerCase() || "outro",
              tipo: "reserva_saldo"
            });
          }
        }
      });
    }
  }

  // ── SAÍDAS (pagamentos · data_pagamento) ──
  var saidas = [];
  _allPagamentosCaixa.forEach(function(p){
    var d = String(p.data_pagamento || "").slice(0,10);
    if(!d) return;
    if(per.ini && d < per.ini) return;
    if(per.fim && d > per.fim) return;
    var forn = (p.comprobantes && p.comprobantes.fornecedores) ? p.comprobantes.fornecedores.nome : "";
    var desc = p.comprobantes ? p.comprobantes.descricao : "";
    saidas.push({
      data: d, valor: Number(p.valor),
      label: forn + (desc ? " · " + desc : ""),
      meio: p.meio_pagamento || "outro"
    });
  });

  var totalEntradas = 0; entradas.forEach(function(e){ totalEntradas += e.valor; });
  var totalSaidas   = 0; saidas.forEach(function(s){ totalSaidas += s.valor; });
  var saldo = totalEntradas - totalSaidas;

  // Agrupar por meio
  var entradasPorMeio = {};
  entradas.forEach(function(e){
    var m = e.meio || "outro";
    entradasPorMeio[m] = (entradasPorMeio[m] || 0) + e.valor;
  });
  var saidasPorMeio = {};
  saidas.forEach(function(s){
    var m = s.meio || "outro";
    saidasPorMeio[m] = (saidasPorMeio[m] || 0) + s.valor;
  });

  // Normalizar nomes de meio (formato reservas vs comprobantes é diferente)
  function labelMeio(m){
    var lk = String(m).toLowerCase();
    if(MEIO_LABEL[lk]) return MEIO_LABEL[lk];
    if(lk.indexOf("inter") >= 0) return "Banco Inter · LG";
    if(lk.indexOf("bradesco") >= 0) return "Bradesco";
    if(lk.indexOf("itau") >= 0 || lk.indexOf("itaú") >= 0) return "Itaú";
    if(lk.indexOf("pix") >= 0) return "Pix";
    if(lk.indexOf("cart") >= 0) return "Cartão";
    if(lk.indexOf("dinheiro") >= 0 || lk.indexOf("cash") >= 0) return "Dinheiro";
    if(lk.indexOf("cripto") >= 0 || lk.indexOf("fiwind") >= 0 || lk.indexOf("usdt") >= 0) return "Cripto · Matias";
    if(lk.indexOf("transf_ar") >= 0 || lk.indexOf("macro") >= 0) return "Transfer AR · Matias";
    if(lk.indexOf("transf") >= 0) return "Transferência";
    return m || "Outro";
  }

  var html = "";

  // Saldo card
  html += '<div class="caixa-saldo '+(saldo < 0 ? 'negativo' : '')+'">' +
            '<div class="caixa-saldo-label">Saldo do período (entradas − saídas)</div>' +
            '<div class="caixa-saldo-valor">'+(saldo >= 0 ? '' : '−')+fmtBRL(Math.abs(saldo))+'</div>' +
            '<div class="caixa-saldo-detail">' +
              '<span>Entradas <b style="color:#2a5a3a">'+fmtBRL(totalEntradas)+'</b></span>' +
              '<span>Saídas <b style="color:#7a3a3a">'+fmtBRL(totalSaidas)+'</b></span>' +
            '</div>' +
          '</div>';

  // Tabela DRE-like
  html += '<div class="dre-table">';
  html += '<div class="dre-colheader"><div>Conta</div><div>R$</div><div>%</div></div>';

  // ENTRADAS por meio
  if(totalEntradas > 0){
    var entMap = {};
    Object.keys(entradasPorMeio).forEach(function(k){
      var lab = labelMeio(k);
      entMap[lab] = (entMap[lab] || 0) + entradasPorMeio[k];
    });
    html += dreRenderSec({ cls:'sec-receita', titulo:'Entradas (reservas)', sinal:'+' }, entMap, totalEntradas);
  }

  // SAIDAS por meio
  if(totalSaidas > 0){
    var saiMap = {};
    Object.keys(saidasPorMeio).forEach(function(k){
      var lab = labelMeio(k);
      saiMap[lab] = (saiMap[lab] || 0) + saidasPorMeio[k];
    });
    html += dreRenderSec({ cls:'sec-custo-op', titulo:'Saídas (pagamentos)' }, saiMap, totalSaidas);
  }

  html += dreTotalRow(saldo >= 0 ? 'tot-bruto' : 'tot-liquido', 'Saldo líquido do período', saldo, totalEntradas, saldo < 0 ? 'negativo' : '');

  html += '</div>';

  if(entradas.length === 0 && saidas.length === 0){
    html = '<div class="empty"><div class="empty-icon">🏦</div>Sem movimentos no período.</div>';
  }
  el.innerHTML = html;
  document.getElementById("caixaSubtitle").textContent = entradas.length + " entrada" + (entradas.length !== 1 ? "s" : "") + " · " + saidas.length + " saída" + (saidas.length !== 1 ? "s" : "");
}

async function goToCaixa(){
  showView("viewCaixa");
  _allPagamentosCaixa = null; // força refresh
  if(!document.getElementById("caixaDataIni").value){
    aplicarCaixaPeriodoPreset("mes_atual");
  } else {
    renderCaixa();
  }
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO EGRESOS · Análise granular de gastos
// ═════════════════════════════════════════════════════════════════════
function getEgrPeriodo(){
  return {
    ini: document.getElementById("egrDataIni").value || null,
    fim: document.getElementById("egrDataFim").value || null
  };
}
function aplicarEgrPeriodoPreset(preset){
  var hoje = new Date();
  var y = hoje.getFullYear(), m = hoje.getMonth();
  function iso(d){ return d.toISOString().slice(0,10); }
  var ini = "", fim = "";
  if(preset === "mes_atual"){ ini = iso(new Date(y,m,1)); fim = iso(new Date(y,m+1,0)); }
  else if(preset === "mes_anterior"){ ini = iso(new Date(y,m-1,1)); fim = iso(new Date(y,m,0)); }
  else if(preset === "ano_atual"){ ini = iso(new Date(y,0,1)); fim = iso(new Date(y,11,31)); }
  document.getElementById("egrDataIni").value = ini;
  document.getElementById("egrDataFim").value = fim;
  document.querySelectorAll(".chip-btn[data-egr-periodo]").forEach(function(b){
    b.classList.toggle("active", b.dataset.egrPeriodo === preset);
  });
  renderEgresos();
}

function compsEgrFiltrados(){
  var per = getEgrPeriodo();
  var incluirConsorcio = document.getElementById("egrIncluirConsorcio").checked;
  return _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(!c.categorias_dre) return true; // sem categoria tb é despesa (vai cair em Outros)
    // excluir receitas
    if(c.categorias_dre.grupo === 'receita') return false;
    if(!c.data_competencia) return false;
    if(per.ini && c.data_competencia < per.ini) return false;
    if(per.fim && c.data_competencia > per.fim) return false;
    if(!incluirConsorcio && c.centro_custo === 'consorcio') return false;
    return true;
  });
}

async function renderEgresos(){
  var el = document.getElementById("egrBody");
  el.innerHTML = '<div class="loading">Carregando...</div>';
  if(_allComps.length === 0) await loadComprobantes();

  var list = compsEgrFiltrados();
  var total = 0; list.forEach(function(c){ total += Number(c.valor_total) || 0; });
  var ticketMedio = list.length > 0 ? total / list.length : 0;

  // ── KPIs ──
  document.getElementById("egrKpis").innerHTML =
    '<div class="ing-kpi hero span2">' +
      '<div class="ing-kpi-label">Total gasto</div>' +
      '<div class="ing-kpi-value">'+fmtBRL(total)+'</div>' +
      '<div class="ing-kpi-sub">'+list.length+' comprobante'+(list.length!==1?'s':'')+'</div>' +
    '</div>' +
    '<div class="ing-kpi">' +
      '<div class="ing-kpi-label">Ticket médio</div>' +
      '<div class="ing-kpi-value">'+fmtBRL(ticketMedio)+'</div>' +
    '</div>' +
    '<div class="ing-kpi">' +
      '<div class="ing-kpi-label">Maior gasto</div>' +
      '<div class="ing-kpi-value">'+fmtBRL(list.length ? Math.max.apply(null, list.map(function(c){return Number(c.valor_total)||0;})) : 0)+'</div>' +
    '</div>';

  // ── Por categoria DRE ──
  var porCat = {};
  list.forEach(function(c){
    var cat = c.categorias_dre ? c.categorias_dre.nome : "Sem categoria";
    porCat[cat] = (porCat[cat] || 0) + (Number(c.valor_total) || 0);
  });
  var catArr = Object.keys(porCat).map(function(k){ return { nome:k, valor:porCat[k] }; })
    .sort(function(a,b){ return b.valor - a.valor; });

  var catHtml = '<div class="ing-table"><div class="ing-table-title">Por categoria</div>' +
    '<div class="ing-table-row header"><div>Categoria</div><div></div><div></div><div>R$</div><div>%</div></div>';
  catArr.forEach(function(k){
    var pct = total > 0 ? (k.valor / total) * 100 : 0;
    catHtml += '<div class="ing-table-row" data-egr-cat="'+escapeHtml(k.nome)+'">' +
      '<div>'+escapeHtml(k.nome)+'</div><div></div><div></div><div>'+fmtMoney(k.valor)+'</div><div>'+pct.toFixed(0)+'%</div>' +
    '</div>';
  });
  catHtml += '<div class="ing-table-row total"><div>Total</div><div></div><div></div><div>'+fmtMoney(total)+'</div><div>100%</div></div></div>';

  // ── Por fornecedor (top 15) ──
  var porForn = {};
  list.forEach(function(c){
    var nome = (c.fornecedores && c.fornecedores.nome) ? c.fornecedores.nome : "— sem fornecedor —";
    if(!porForn[nome]) porForn[nome] = { valor: 0, qtd: 0 };
    porForn[nome].valor += Number(c.valor_total) || 0;
    porForn[nome].qtd++;
  });
  var fornArr = Object.keys(porForn).map(function(k){ return { nome:k, valor:porForn[k].valor, qtd:porForn[k].qtd }; })
    .sort(function(a,b){ return b.valor - a.valor; }).slice(0, 15);

  var fornHtml = '<div class="ing-table"><div class="ing-table-title">Top fornecedores</div>' +
    '<div class="ing-table-row header"><div>Fornecedor</div><div>N</div><div></div><div>R$</div><div>%</div></div>';
  fornArr.forEach(function(k){
    var pct = total > 0 ? (k.valor / total) * 100 : 0;
    fornHtml += '<div class="ing-table-row">' +
      '<div>'+escapeHtml(k.nome)+'</div><div>'+k.qtd+'</div><div></div><div>'+fmtMoney(k.valor)+'</div><div>'+pct.toFixed(0)+'%</div>' +
    '</div>';
  });
  fornHtml += '</div>';

  // ── Top 10 comprobantes maiores (outliers) ──
  var outliers = list.slice().sort(function(a,b){ return Number(b.valor_total) - Number(a.valor_total); }).slice(0, 10);
  var outHtml = '<div class="ing-table"><div class="ing-table-title">Top 10 maiores</div>' +
    '<div class="ing-table-row header"><div>Comprobante</div><div></div><div></div><div>R$</div><div></div></div>';
  outliers.forEach(function(c){
    var forn = c.fornecedores ? c.fornecedores.nome : "—";
    var label = forn + ' · ' + (c.descricao || '').slice(0, 30);
    outHtml += '<div class="ing-table-row" data-egr-comp="'+c.id+'">' +
      '<div>'+escapeHtml(label)+'</div><div></div><div></div><div>'+fmtMoney(c.valor_total)+'</div><div></div>' +
    '</div>';
  });
  outHtml += '</div>';

  if(list.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-icon">📉</div>Sem gastos no período.</div>';
    return;
  }

  el.innerHTML = catHtml + fornHtml + outHtml;
  document.getElementById("egrSubtitle").textContent = list.length + " comprobante" + (list.length !== 1 ? "s" : "") + " · " + fmtBRL(total);

  // Drill-down em click na categoria
  el.querySelectorAll("[data-egr-cat]").forEach(function(row){
    row.addEventListener("click", function(){
      _dreMes = _dreMes || { y: new Date().getFullYear(), m: new Date().getMonth() };
      // Usa drill do DRE mas com o período de Egresos
      abrirDrillEgresos(row.dataset.egrCat);
    });
  });
  el.querySelectorAll("[data-egr-comp]").forEach(function(row){
    row.addEventListener("click", function(){
      openCompModal(row.dataset.egrComp);
    });
  });
}

function abrirDrillEgresos(catNome){
  var per = getEgrPeriodo();
  var incluirConsorcio = document.getElementById("egrIncluirConsorcio").checked;
  var list = _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(!c.categorias_dre) return catNome === "Sem categoria";
    if(c.categorias_dre.nome !== catNome) return false;
    if(!c.data_competencia) return false;
    if(per.ini && c.data_competencia < per.ini) return false;
    if(per.fim && c.data_competencia > per.fim) return false;
    if(!incluirConsorcio && c.centro_custo === 'consorcio') return false;
    return true;
  });
  list.sort(function(a,b){ return Number(b.valor_total) - Number(a.valor_total); });

  var total = 0; list.forEach(function(c){ total += Number(c.valor_total)||0; });
  var subtitle = per.ini && per.fim ? (fmtDate(per.ini) + " até " + fmtDate(per.fim)) : "Tudo";

  document.getElementById("drillTitle").textContent = catNome;
  document.getElementById("drillInfo").textContent = subtitle + " · " + list.length + " comprobante" + (list.length !== 1 ? "s" : "");

  var html = list.map(function(c){
    var forn = c.fornecedores ? c.fornecedores.nome : "—";
    return '<div class="drill-row" data-comp="'+c.id+'">' +
             '<div class="drill-data">'+fmtDate(c.data_competencia)+'</div>' +
             '<div class="drill-desc">'+escapeHtml(c.descricao||"—")+'<span class="forne">'+escapeHtml(forn)+'</span></div>' +
             '<div class="drill-valor">'+fmtBRL(c.valor_total)+'</div>' +
           '</div>';
  }).join("");
  html += '<div class="drill-total"><span>Total</span><span>'+fmtBRL(total)+'</span></div>';
  document.getElementById("drillList").innerHTML = html;

  document.getElementById("drillList").querySelectorAll("[data-comp]").forEach(function(r){
    r.addEventListener("click", function(){
      closeDrillModal();
      openCompModal(r.dataset.comp);
    });
  });
  document.getElementById("modalDrill").classList.add("open");
}

function exportEgresosExcel(){
  if(typeof XLSX === 'undefined'){ showToast("XLSX não carregou"); return; }
  var list = compsEgrFiltrados();
  if(list.length === 0){ showToast("Sem dados"); return; }

  var rows = list.map(function(c){
    var forn = c.fornecedores ? c.fornecedores.nome : "";
    var cat  = c.categorias_dre ? c.categorias_dre.nome : "";
    var grupo = c.categorias_dre ? c.categorias_dre.grupo : "";
    return {
      "Mês ref.":       c.data_competencia || "",
      "Pago em":        c.data_pagamento || "",
      "Fornecedor":     forn,
      "Descrição":      c.descricao || "",
      "Categoria":      cat,
      "Grupo DRE":      GRUPO_LABEL[grupo] || grupo,
      "Centro custo":   CENTRO_LABEL[c.centro_custo] || c.centro_custo || "",
      "Valor":          Number(c.valor_total) || 0,
      "Meio pagto":     MEIO_LABEL[c.meio_pagamento] || c.meio_pagamento || "",
      "Estado":         ESTADO_LABEL[c.estado] || c.estado || ""
    };
  });

  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:12},{wch:12},{wch:26},{wch:32},{wch:26},{wch:18},{wch:14},{wch:12},{wch:16},{wch:10}];
  XLSX.utils.book_append_sheet(wb, ws, "Egresos");
  var per = getEgrPeriodo();
  var tag = per.ini && per.fim ? (per.ini + "_a_" + per.fim) : new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, "NORDAPP_Egresos_" + tag + ".xlsx");
  showToast("Excel baixado ✓");
}

async function goToEgresos(){
  showView("viewEgresos");
  if(!document.getElementById("egrDataIni").value){
    aplicarEgrPeriodoPreset("mes_atual");
  } else {
    renderEgresos();
  }
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO RETIROS SÓCIOS
// ═════════════════════════════════════════════════════════════════════
var SOCIOS = ['Matias', 'Lao', 'Eze']; // 3 sócios (ordem canônica)
var _editingRetiroId = null;
var _retiroCatId = null;

function getRetPeriodo(){
  return {
    ini: document.getElementById("retDataIni").value || null,
    fim: document.getElementById("retDataFim").value || null
  };
}
function aplicarRetPeriodoPreset(preset){
  var hoje = new Date();
  var y = hoje.getFullYear(), m = hoje.getMonth();
  function iso(d){ return d.toISOString().slice(0,10); }
  var ini = "", fim = "";
  if(preset === "mes_atual"){ ini = iso(new Date(y,m,1)); fim = iso(new Date(y,m+1,0)); }
  else if(preset === "mes_anterior"){ ini = iso(new Date(y,m-1,1)); fim = iso(new Date(y,m,0)); }
  else if(preset === "ano_atual"){ ini = iso(new Date(y,0,1)); fim = iso(new Date(y,11,31)); }
  document.getElementById("retDataIni").value = ini;
  document.getElementById("retDataFim").value = fim;
  document.querySelectorAll(".chip-btn[data-ret-periodo]").forEach(function(b){
    b.classList.toggle("active", b.dataset.retPeriodo === preset);
  });
  renderRetiros();
}

function retirosFiltrados(){
  var per = getRetPeriodo();
  return _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(!c.categorias_dre) return false;
    if(c.categorias_dre.nome !== 'Retiros sócios') return false;
    if(!c.data_competencia) return false;
    if(per.ini && c.data_competencia < per.ini) return false;
    if(per.fim && c.data_competencia > per.fim) return false;
    return true;
  });
}

async function renderRetiros(){
  if(_allComps.length === 0) await loadComprobantes();
  var list = retirosFiltrados();

  // KPIs: total + por sócio
  var total = 0;
  var porSocio = {};
  SOCIOS.forEach(function(s){ porSocio[s] = 0; });
  list.forEach(function(c){
    var v = Number(c.valor_total) || 0;
    total += v;
    var nome = c.fornecedores ? c.fornecedores.nome : "—";
    if(porSocio[nome] !== undefined) porSocio[nome] += v;
    else porSocio[nome] = v;
  });

  var kpisHtml = '<div class="ing-kpi hero span2">' +
    '<div class="ing-kpi-label">Total retirado</div>' +
    '<div class="ing-kpi-value">'+fmtBRL(total)+'</div>' +
    '<div class="ing-kpi-sub">'+list.length+' retiro'+(list.length!==1?'s':'')+'</div>' +
  '</div>';
  SOCIOS.forEach(function(s){
    var v = porSocio[s] || 0;
    var pct = total > 0 ? (v / total) * 100 : 0;
    kpisHtml += '<div class="ing-kpi">' +
      '<div class="ing-kpi-label">'+s+'</div>' +
      '<div class="ing-kpi-value">'+fmtBRL(v)+'</div>' +
      '<div class="ing-kpi-sub">'+pct.toFixed(0)+'%</div>' +
    '</div>';
  });
  document.getElementById("retKpis").innerHTML = kpisHtml;

  // Lista de retiros
  var el = document.getElementById("retBody");
  if(list.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-icon">💼</div>Sem retiros no período.</div>';
    document.getElementById("retSubtitle").textContent = "0 retiros";
    return;
  }

  list.sort(function(a,b){ return (b.data_competencia||"").localeCompare(a.data_competencia||""); });

  var html = '<div class="ing-table"><div class="ing-table-title">Movimentos</div>' +
    '<div class="ing-table-row header"><div>Sócio · data</div><div>Meio</div><div></div><div>R$</div><div></div></div>';
  list.forEach(function(c){
    var nome = c.fornecedores ? c.fornecedores.nome : "—";
    var meio = c.meio_pagamento || "";
    var meioLabel = meio === 'cripto' ? 'Cripto' : (meio === 'transf_ar' ? 'Transfer AR' : (MEIO_LABEL[meio] || meio || "—"));
    html += '<div class="ing-table-row" data-ret-id="'+c.id+'">' +
      '<div>'+escapeHtml(nome)+' · '+fmtDate(c.data_competencia)+'</div>' +
      '<div>'+escapeHtml(meioLabel)+'</div>' +
      '<div></div>' +
      '<div>'+fmtMoney(c.valor_total)+'</div>' +
      '<div></div>' +
    '</div>';
  });
  html += '<div class="ing-table-row total"><div>Total</div><div></div><div></div><div>'+fmtMoney(total)+'</div><div></div></div></div>';

  el.innerHTML = html;
  document.getElementById("retSubtitle").textContent = list.length + " retiro" + (list.length !== 1 ? "s" : "") + " · " + fmtBRL(total);

  // Click em um retiro abre modal de edição
  el.querySelectorAll("[data-ret-id]").forEach(function(row){
    row.addEventListener("click", function(){ openRetiroModal(row.dataset.retId); });
  });
}

async function ensureCategoriaRetiros(){
  if(_retiroCatId) return _retiroCatId;
  var cat = _allCategorias.find(function(c){ return c.nome === 'Retiros sócios'; });
  if(cat){ _retiroCatId = cat.id; return cat.id; }
  // Cria se não existe
  var r = await api("categorias_dre", "POST", { nome:'Retiros sócios', grupo:'nao_operacional', ordem:600, created_by: currentUser.username || "system" });
  var created = Array.isArray(r) ? r[0] : r;
  if(created){ _retiroCatId = created.id; await loadCategorias(); return created.id; }
  return null;
}

async function populateSocioSelect(){
  // Busca fornecedores dos sócios por nome
  var sel = document.getElementById("rtSocio");
  var options = [];
  for(var i = 0; i < SOCIOS.length; i++){
    var nome = SOCIOS[i];
    var forn = _allFornecedores.find(function(f){ return (f.nome || "").toLowerCase() === nome.toLowerCase(); });
    if(!forn){
      // Criar fornecedor sócio
      var r = await api("fornecedores", "POST", {
        nome: nome,
        tipo: 'parte_relacionada',
        categoria: 'Sócio',
        comentarios: '[SÓCIO NORDESTINA]'
      });
      var created = Array.isArray(r) ? r[0] : r;
      if(created){
        _allFornecedores.push(created);
        forn = created;
      }
    }
    if(forn) options.push('<option value="'+forn.id+'">'+escapeHtml(nome)+'</option>');
  }
  sel.innerHTML = '<option value="">Selecionar...</option>' + options.join("");
}

function openRetiroModal(id){
  _editingRetiroId = id || null;
  var c = null;
  if(id) c = _allComps.find(function(x){ return String(x.id) === String(id); });

  document.getElementById("retiroModalTitle").textContent = c ? "Editar retiro" : "Novo retiro de sócio";
  document.getElementById("rtSocio").value = c ? (c.fornecedor_id || "") : "";
  document.getElementById("rtValor").value = c ? (c.valor_total || "") : "";
  document.getElementById("rtData").value = c ? (c.data_competencia || "") : new Date().toISOString().slice(0,10);
  document.getElementById("rtMeio").value = c ? (c.meio_pagamento || "cripto") : "cripto";
  document.getElementById("rtCuenta").value = c ? (c.banco_ref || "") : "";
  document.getElementById("rtObs").value = c ? (c.observacoes || "") : "";
  document.getElementById("btnDeleteRetiro").style.display = c ? "block" : "none";
  document.getElementById("modalRetiro").classList.add("open");
}
function closeRetiroModal(){
  document.getElementById("modalRetiro").classList.remove("open");
  _editingRetiroId = null;
}

async function saveRetiro(){
  if(!canEditComps()){ showToast("Sem permissão"); return; }
  var socio = document.getElementById("rtSocio").value;
  var valor = parseFloat(document.getElementById("rtValor").value);
  var data  = document.getElementById("rtData").value;
  var meio  = document.getElementById("rtMeio").value;
  var cuenta = document.getElementById("rtCuenta").value.trim();
  var obs   = document.getElementById("rtObs").value.trim();

  if(!socio){ showToast("Selecione sócio"); return; }
  if(!valor || valor <= 0){ showToast("Valor inválido"); return; }
  if(!data){ showToast("Data obrigatória"); return; }

  var catId = await ensureCategoriaRetiros();
  if(!catId){ showToast("Erro ao localizar categoria 'Retiros sócios'"); return; }

  var socioNome = "";
  var forn = _allFornecedores.find(function(f){ return String(f.id) === String(socio); });
  if(forn) socioNome = forn.nome;

  var desc = "Retiro · " + socioNome + (cuenta ? " · " + cuenta : "");
  var payload = {
    fornecedor_id: Number(socio),
    descricao: desc,
    categoria_dre_id: catId,
    centro_custo: 'geral',
    valor_total: valor,
    valor_pago: valor,
    estado: 'pago',
    data_competencia: data,
    data_pagamento: data,
    meio_pagamento: meio,
    banco_ref: cuenta || null,
    observacoes: '[RETIRO SÓCIO] ' + (obs || ''),
    updated_at: new Date().toISOString()
  };
  if(!_editingRetiroId) payload.created_by = currentUser.username || "system";

  var r;
  if(_editingRetiroId){
    r = await api("comprobantes?id=eq." + _editingRetiroId, "PATCH", payload);
  } else {
    r = await api("comprobantes", "POST", payload);
  }
  if(!r){ showToast("Erro ao salvar"); return; }
  showToast(_editingRetiroId ? "Atualizado ✓" : "Retiro registrado ✓");
  closeRetiroModal();
  await loadComprobantes();
  renderRetiros();
}

async function deleteRetiro(){
  if(!_editingRetiroId) return;
  if(!confirm("Apagar este retiro?")) return;
  var r = await api("comprobantes?id=eq." + _editingRetiroId, "DELETE");
  if(r === null){ showToast("Erro"); return; }
  showToast("Retiro apagado");
  closeRetiroModal();
  await loadComprobantes();
  renderRetiros();
}

function exportRetirosExcel(){
  if(typeof XLSX === 'undefined'){ showToast("XLSX não carregou"); return; }
  var list = retirosFiltrados();
  if(list.length === 0){ showToast("Sem dados"); return; }
  var rows = list.map(function(c){
    var nome = c.fornecedores ? c.fornecedores.nome : "—";
    return {
      "Data": c.data_competencia || "",
      "Sócio": nome,
      "Valor R$": Number(c.valor_total) || 0,
      "Meio": c.meio_pagamento || "",
      "Cuenta/destino": c.banco_ref || "",
      "Observações": (c.observacoes || "").replace('[RETIRO SÓCIO]', '').trim()
    };
  });
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [{wch:12},{wch:14},{wch:12},{wch:14},{wch:24},{wch:40}];
  XLSX.utils.book_append_sheet(wb, ws, "Retiros Sócios");
  var per = getRetPeriodo();
  var tag = per.ini && per.fim ? (per.ini + "_a_" + per.fim) : new Date().toISOString().slice(0,10);
  XLSX.writeFile(wb, "NORDAPP_RetirosSocios_" + tag + ".xlsx");
  showToast("Excel baixado ✓");
}

async function goToRetiros(){
  showView("viewRetiros");
  if(_allFornecedores.length === 0) await loadFornecedores();
  if(_allCategorias.length === 0) await loadCategorias();
  await loadComprobantes(); // força refresh (pode ter novos retiros carregados fora da UI)
  await populateSocioSelect();
  await ensureCategoriaRetiros();
  if(!document.getElementById("retDataIni").value){
    aplicarRetPeriodoPreset("ano_atual");
  } else {
    renderRetiros();
  }
}

// ═════════════════════════════════════════════════════════════════════
// MÓDULO CONCILIAÇÃO BANCÁRIA
// ═════════════════════════════════════════════════════════════════════
var _allMovs = [];
var _parsedMovs = null;  // temporário durante upload
var _parsedConta = null;
var _parsedArquivo = null;
var _currentMov = null;  // movimento sendo conciliado
var MESES_PT = {'janeiro':1,'fevereiro':2,'março':3,'marco':3,'abril':4,'maio':5,'junho':6,'julho':7,'agosto':8,'setembro':9,'outubro':10,'novembro':11,'dezembro':12};

async function parsePDFExtrato(file){
  if(typeof pdfjsLib === 'undefined'){
    showToast("PDF.js não carregou");
    return null;
  }
  var buf = await file.arrayBuffer();
  var pdf = await pdfjsLib.getDocument({data: buf}).promise;
  var fullText = "";
  for(var i = 1; i <= pdf.numPages; i++){
    var page = await pdf.getPage(i);
    var tc = await page.getTextContent();
    // Juntar text items preservando linha quando há diferença grande em y
    var lastY = null;
    var currentLine = "";
    tc.items.forEach(function(it){
      if(lastY !== null && Math.abs(it.transform[5] - lastY) > 2){
        fullText += currentLine + "\n";
        currentLine = "";
      }
      currentLine += it.str + " ";
      lastY = it.transform[5];
    });
    if(currentLine) fullText += currentLine + "\n";
  }
  return parsePDFExtratoText(fullText);
}

function parsePDFExtratoText(full){
  var movs = [];
  var curDate = null;
  var dataIni = null, dataFim = null, saldoFinal = null;
  var saldoMatch = full.match(/Saldo total\s*R\$\s*([\d\.,]+)/i);
  if(saldoMatch) saldoFinal = parseBRMoney(saldoMatch[1]);
  var periodoMatch = full.match(/Per[íi]odo:\s*(\d{2}\/\d{2}\/\d{4})\s*a\s*(\d{2}\/\d{2}\/\d{4})/i);
  if(periodoMatch){
    dataIni = brDateToISO(periodoMatch[1]);
    dataFim = brDateToISO(periodoMatch[2]);
  }

  var lines = full.split("\n");
  for(var i = 0; i < lines.length; i++){
    var line = lines[i].trim();
    if(!line) continue;
    // Data: "3 de Junho de 2026" (pode vir colada)
    var dm = line.match(/(\d{1,2})\s+de\s+(Janeiro|Fevereiro|Mar[çc]o|Abril|Maio|Junho|Julho|Agosto|Setembro|Outubro|Novembro|Dezembro)\s+de\s+(\d{4})/i);
    if(dm){
      var mes = MESES_PT[dm[2].toLowerCase()];
      if(mes){
        curDate = dm[3] + "-" + String(mes).padStart(2,"0") + "-" + String(parseInt(dm[1])).padStart(2,"0");
      }
    }
    // Transação: Tipo: "desc" -R$ X,XX R$ Saldo
    var tm = line.match(/^(Pix enviado|Pix recebido|Pagamento efetuado|Boleto pago|TED enviado|TED recebido|D[ée]bito|Transfer[êe]ncia|Rendimento|Dep[óo]sito|Tarifa):\s*"(.+?)"\s*(-?R\$\s*[\d\.]+,\d{2})\s*(-?R\$\s*[\d\.]+,\d{2})/);
    if(tm && curDate){
      var tipo = tm[1], desc = tm[2].trim();
      var valorTxt = tm[3], saldoTxt = tm[4];
      var signal = valorTxt.indexOf('-') === 0 ? -1 : 1;
      var valor = parseBRMoney(valorTxt.replace('-','')) * signal;
      var saldo = parseBRMoney(saldoTxt.replace('-','')) * (saldoTxt.indexOf('-') === 0 ? -1 : 1);
      movs.push({ data: curDate, tipo: tipo, descricao: desc, valor: valor, saldo_apos: saldo });
    }
  }

  return { movimentos: movs, data_ini: dataIni, data_fim: dataFim, saldo_final: saldoFinal };
}

function parseBRMoney(s){
  s = String(s).replace('R$','').replace(/\s/g,'').replace(/\./g,'').replace(',','.');
  return parseFloat(s) || 0;
}
function brDateToISO(s){
  var p = s.split('/');
  return p[2] + '-' + p[1] + '-' + p[0];
}

async function sha256Short(txt){
  var buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt));
  return Array.from(new Uint8Array(buf).slice(0,8)).map(function(b){ return b.toString(16).padStart(2,"0"); }).join("");
}

function openUploadModal(){
  if(!canEditComps()){ showToast("Sem permissão"); return; }
  document.getElementById("upConta").value = "banco_inter";
  document.getElementById("upArquivo").value = "";
  document.getElementById("upPreview").style.display = "none";
  document.getElementById("upPreview").innerHTML = "";
  document.getElementById("btnProcessarUpload").textContent = "Processar";
  _parsedMovs = null;
  document.getElementById("modalUpload").classList.add("open");
}
function closeUploadModal(){
  document.getElementById("modalUpload").classList.remove("open");
}

async function processarUpload(){
  var file = document.getElementById("upArquivo").files[0];
  var conta = document.getElementById("upConta").value;

  // Se já foi processado, botão agora é "Importar X movimentos"
  if(_parsedMovs){
    await confirmarImportExtrato(conta);
    return;
  }

  if(!file){ showToast("Selecione um arquivo PDF"); return; }
  showToast("Parseando PDF...");
  var result = await parsePDFExtrato(file);
  if(!result || result.movimentos.length === 0){
    showToast("Não achei movimentos no PDF");
    return;
  }
  _parsedMovs = result.movimentos;
  _parsedConta = conta;
  _parsedArquivo = file.name;
  _parsedExtra = result;

  var saidas = result.movimentos.filter(function(m){ return m.valor < 0; }).length;
  var entradas = result.movimentos.filter(function(m){ return m.valor > 0; }).length;
  var totalSaidas = result.movimentos.filter(function(m){ return m.valor < 0; }).reduce(function(s,m){ return s+Math.abs(m.valor); }, 0);
  var totalEntradas = result.movimentos.filter(function(m){ return m.valor > 0; }).reduce(function(s,m){ return s+m.valor; }, 0);

  var html = '<div class="pag-info">' +
    '<strong>'+result.movimentos.length+' movimentos</strong> parseados<br>' +
    'Período: ' + (result.data_ini || "?") + ' a ' + (result.data_fim || "?") + '<br>' +
    'Saídas: '+saidas+' · '+fmtBRL(totalSaidas)+'<br>' +
    'Entradas: '+entradas+' · '+fmtBRL(totalEntradas) +
    (result.saldo_final !== null ? '<br>Saldo final: <b>'+fmtBRL(result.saldo_final)+'</b>' : '') +
  '</div>' +
  '<div class="field-hint">Clicá "Importar" para salvar e iniciar conciliação.</div>';
  var pv = document.getElementById("upPreview");
  pv.innerHTML = html;
  pv.style.display = "block";
  document.getElementById("btnProcessarUpload").textContent = "Importar " + result.movimentos.length + " movimentos";
}

async function confirmarImportExtrato(conta){
  if(!_parsedMovs) return;
  // 1) Criar extrato_bancario
  var ext = {
    conta: conta,
    data_ini: _parsedExtra.data_ini,
    data_fim: _parsedExtra.data_fim,
    arquivo_nome: _parsedArquivo,
    total_mov: _parsedMovs.length,
    saldo_final: _parsedExtra.saldo_final,
    uploaded_by: currentUser.username || "system"
  };
  var r = await api("extratos_bancarios", "POST", ext);
  if(!r){ showToast("Erro ao criar extrato"); return; }
  var extratoRow = Array.isArray(r) ? r[0] : r;
  var extratoId = extratoRow.id;

  // 2) Inserir movimentos em lote, com hash de dedupe
  showToast("Importando movimentos...");
  var inserted = 0, skipped = 0;
  // Fazer em chunks de 50 para não estourar URL
  var chunk = [];
  for(var i = 0; i < _parsedMovs.length; i++){
    var m = _parsedMovs[i];
    var hash = await sha256Short(conta + "|" + m.data + "|" + m.valor + "|" + m.descricao);
    chunk.push({
      extrato_id: extratoId,
      conta: conta,
      data: m.data,
      tipo: m.tipo,
      descricao: m.descricao,
      valor: m.valor,
      saldo_apos: m.saldo_apos,
      hash_dedupe: hash
    });
    if(chunk.length === 50 || i === _parsedMovs.length - 1){
      // Upsert via Prefer: resolution=ignore-duplicates? PostgREST suporta.
      // Use POST com header Prefer para ignorar dup
      try {
        var resp = await fetch(SB_URL + "/rest/v1/movimentos_bancarios", {
          method: "POST",
          headers: Object.assign({}, H, { "Prefer": "resolution=merge-duplicates,return=representation" }),
          body: JSON.stringify(chunk)
        });
        if(resp.ok){
          var data = await resp.json();
          inserted += data.length;
        } else {
          console.error("Falha no chunk", await resp.text());
        }
      } catch(e){ console.error(e); }
      chunk = [];
    }
  }

  showToast(inserted + " movimentos importados ✓");
  _parsedMovs = null;
  closeUploadModal();
  await loadMovimentos();
  renderConciliacao();
}

async function loadMovimentos(){
  var data = await api("movimentos_bancarios?select=*&order=data.desc&limit=10000");
  _allMovs = data || [];
  return _allMovs;
}

function autoMatchSuggestion(mov){
  // Para saídas: busca comprobante pago ±3 dias com valor igual
  if(mov.valor >= 0) return [];
  var abs = Math.abs(mov.valor);
  var mDate = new Date(mov.data + "T00:00:00").getTime();
  var cands = _allComps.filter(function(c){
    if(c.estado === 'anulado') return false;
    if(Math.abs(Number(c.valor_total) - abs) > 0.5) return false;
    // Prefere matching por data_pagamento mas aceita competencia tb
    var cDateStr = c.data_pagamento || c.data_competencia;
    if(!cDateStr) return false;
    var cDate = new Date(cDateStr + "T00:00:00").getTime();
    if(Math.abs(cDate - mDate) > 3 * 86400000) return false;
    return true;
  });
  return cands.slice(0, 5);
}

function renderConciliacao(){
  var el = document.getElementById("concBody");
  var kpisEl = document.getElementById("concKpis");
  var filtEl = document.getElementById("concFiltros");

  if(_allMovs.length === 0){
    el.innerHTML = '<div class="empty"><div class="empty-icon">🔗</div>Nenhum extrato importado ainda.</div>';
    kpisEl.style.display = "none";
    filtEl.style.display = "none";
    return;
  }

  // Filtros
  var status = document.getElementById("concStatusFilter").value;
  var tipo   = document.getElementById("concTipoFilter").value;
  var list = _allMovs.slice();
  // Calcular status derivado por mov
  list.forEach(function(m){
    m._status = m.conciliado ? 'conciliado' : (m.ignorado ? 'ignorado' : (m.valor < 0 && autoMatchSuggestion(m).length > 0 ? 'match' : 'pendente'));
  });
  if(status && status !== 'todos') list = list.filter(function(m){ return m._status === status; });
  if(tipo === 'saida') list = list.filter(function(m){ return m.valor < 0; });
  else if(tipo === 'entrada') list = list.filter(function(m){ return m.valor > 0; });

  // KPIs
  var pend = _allMovs.filter(function(m){ return m._status === 'pendente'; }).length;
  var sugg = _allMovs.filter(function(m){ return m._status === 'match'; }).length;
  var conc = _allMovs.filter(function(m){ return m._status === 'conciliado'; }).length;
  var ign  = _allMovs.filter(function(m){ return m._status === 'ignorado'; }).length;
  kpisEl.innerHTML =
    '<div class="ing-kpi"><div class="ing-kpi-label">Pendentes</div><div class="ing-kpi-value">'+pend+'</div></div>' +
    '<div class="ing-kpi"><div class="ing-kpi-label">Com match</div><div class="ing-kpi-value">'+sugg+'</div></div>' +
    '<div class="ing-kpi"><div class="ing-kpi-label">Conciliados</div><div class="ing-kpi-value">'+conc+'</div></div>' +
    '<div class="ing-kpi"><div class="ing-kpi-label">Ignorados</div><div class="ing-kpi-value">'+ign+'</div></div>';
  kpisEl.style.display = "grid";
  filtEl.style.display = "flex";

  if(list.length === 0){
    el.innerHTML = '<div class="empty">Sem movimentos neste filtro.</div>';
    return;
  }

  var html = '<div class="mov-list">' + list.slice(0, 200).map(function(m){
    var cls = 'status-' + m._status;
    var sign = m.valor < 0 ? 'neg' : 'pos';
    var d = m.data.slice(8,10) + '/' + m.data.slice(5,7);
    var badge = m._status === 'conciliado' ? '<span class="mov-badge conciliado">OK</span>' :
                m._status === 'match' ? '<span class="mov-badge match">sug</span>' :
                m._status === 'ignorado' ? '<span class="mov-badge ignorado">ign</span>' :
                '<span class="mov-badge pendente">—</span>';
    return '<div class="mov-item '+cls+'" data-id="'+m.id+'">' +
             '<div class="mov-data">'+d+'</div>' +
             '<div class="mov-desc">'+escapeHtml(m.descricao||"")+'<span class="tipo">'+(m.tipo||"")+'</span></div>' +
             '<div class="mov-valor '+sign+'">'+(m.valor<0?'−':'+')+fmtBRL(Math.abs(m.valor)).replace('R$ ','')+'</div>' +
             badge +
           '</div>';
  }).join("") + '</div>';
  if(list.length > 200) html += '<div class="field-hint" style="text-align:center;margin-top:8px">Mostrando 200 de '+list.length+'. Filtrá para ver outros.</div>';

  el.innerHTML = html;
  document.getElementById("concSubtitle").textContent = _allMovs.length + " movimentos · " + conc + " conciliados (" + Math.round(100*conc/_allMovs.length) + "%)";

  el.querySelectorAll(".mov-item").forEach(function(it){
    it.addEventListener("click", function(){
      var id = it.dataset.id;
      var mov = _allMovs.find(function(m){ return String(m.id) === String(id); });
      if(mov) openConcModal(mov);
    });
  });
}

function openConcModal(mov){
  _currentMov = mov;
  var sign = mov.valor < 0 ? 'Saída' : 'Entrada';
  document.getElementById("concMovInfo").innerHTML =
    '<strong>'+sign+' · '+fmtBRL(Math.abs(mov.valor))+'</strong><br>' +
    fmtDate(mov.data) + ' · ' + (mov.tipo || "") + '<br>' +
    '<span style="font-size:12px">'+escapeHtml(mov.descricao||"")+'</span>' +
    (mov.conciliado ? '<br><span style="color:#3a6a4a;font-weight:600">✓ Já conciliado</span>' : '') +
    (mov.ignorado ? '<br><span style="color:#888;font-weight:600">⊘ Ignorado</span>' : '');

  var sugs = autoMatchSuggestion(mov);
  var html = "";
  if(sugs.length === 0){
    html = '<div class="field-hint" style="padding:12px;text-align:center">Nenhum comprobante compatível. Podés <b>Criar comprobante</b> ou <b>Ignorar</b> este movimento (ex: transferência interna).</div>';
  } else {
    html = '<div class="field-hint" style="margin:8px 0 4px">Sugestões (valor igual, data ±3d):</div><div class="sug-list">';
    sugs.forEach(function(c){
      var forn = c.fornecedores ? c.fornecedores.nome : "—";
      html += '<div class="sug-item">' +
                '<div class="sug-data">'+fmtDate(c.data_pagamento||c.data_competencia)+'</div>' +
                '<div class="sug-desc">'+escapeHtml(c.descricao||"")+'<span class="forne">'+escapeHtml(forn)+'</span></div>' +
                '<div class="sug-valor">'+fmtBRL(c.valor_total)+'</div>' +
                '<button class="btn-match" data-cid="'+c.id+'">Match ✓</button>' +
              '</div>';
    });
    html += '</div>';
  }
  document.getElementById("concSugestoes").innerHTML = html;
  document.getElementById("concSugestoes").querySelectorAll("[data-cid]").forEach(function(b){
    b.addEventListener("click", function(){ confirmarMatch(b.dataset.cid); });
  });
  document.getElementById("modalConc").classList.add("open");
}

function closeConcModal(){
  document.getElementById("modalConc").classList.remove("open");
  _currentMov = null;
}

async function confirmarMatch(compId){
  if(!_currentMov) return;
  var r = await api("movimentos_bancarios?id=eq." + _currentMov.id, "PATCH", {
    comprobante_id: Number(compId),
    conciliado: true,
    conciliado_at: new Date().toISOString(),
    conciliado_por: currentUser.username || "system"
  });
  if(!r){ showToast("Erro"); return; }
  showToast("Conciliado ✓");
  closeConcModal();
  await loadMovimentos();
  renderConciliacao();
}

async function ignorarMov(){
  if(!_currentMov) return;
  var r = await api("movimentos_bancarios?id=eq." + _currentMov.id, "PATCH", {
    ignorado: true,
    conciliado_at: new Date().toISOString(),
    conciliado_por: currentUser.username || "system"
  });
  if(!r){ showToast("Erro"); return; }
  showToast("Ignorado");
  closeConcModal();
  await loadMovimentos();
  renderConciliacao();
}

async function criarCompDeMov(){
  if(!_currentMov) return;
  if(_currentMov.valor >= 0){ showToast("Só saídas podem virar comprobantes"); return; }
  closeConcModal();
  // Abre Despesa Rápida com valores pré-preenchidos
  openRapidaModal();
  document.getElementById("rfDescricao").value = _currentMov.descricao || "";
  document.getElementById("rfValor").value = Math.abs(_currentMov.valor).toFixed(2);
  document.getElementById("rfData").value = _currentMov.data;
  document.getElementById("rfMeio").value = "banco_inter";
  // Nota: o usuário precisa escolher fornecedor e categoria manualmente
  showToast("Preenchido · escolhe fornecedor e categoria");
}

async function goToConciliacao(){
  showView("viewConciliacao");
  if(_allComps.length === 0) await loadComprobantes();
  await loadMovimentos();
  renderConciliacao();
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

  // ─── DRE ───
  var btnPrev = document.getElementById("dreMesPrev");
  if(btnPrev) btnPrev.addEventListener("click", function(){ dreGoMes(-1); });
  var btnNext = document.getElementById("dreMesNext");
  if(btnNext) btnNext.addEventListener("click", function(){ dreGoMes(1); });
  var chkCons = document.getElementById("dreIncluirConsorcio");
  if(chkCons) chkCons.addEventListener("change", renderDRE);
  var btnExpDRE = document.getElementById("btnExportDRE");
  if(btnExpDRE) btnExpDRE.addEventListener("click", exportDREExcel);
  var chkCompare = document.getElementById("dreComparar");
  if(chkCompare) chkCompare.addEventListener("change", renderDRE);

  // Drill-down modal
  var btnCloseDrill = document.getElementById("btnCloseDrill");
  if(btnCloseDrill) btnCloseDrill.addEventListener("click", closeDrillModal);
  var md = document.getElementById("modalDrill");
  if(md) md.addEventListener("click", function(e){ if(e.target === md) closeDrillModal(); });

  // ─── Conciliação bancária ───
  var btnUp = document.getElementById("btnUploadExtrato");
  if(btnUp) btnUp.addEventListener("click", openUploadModal);
  var btnCloseUp = document.getElementById("btnCloseUpload");
  if(btnCloseUp) btnCloseUp.addEventListener("click", closeUploadModal);
  var btnProc = document.getElementById("btnProcessarUpload");
  if(btnProc) btnProc.addEventListener("click", processarUpload);
  var btnCloseC = document.getElementById("btnCloseConc");
  if(btnCloseC) btnCloseC.addEventListener("click", closeConcModal);
  var btnIgn = document.getElementById("btnIgnorarMov");
  if(btnIgn) btnIgn.addEventListener("click", ignorarMov);
  var btnCrC = document.getElementById("btnCriarCompDeMov");
  if(btnCrC) btnCrC.addEventListener("click", criarCompDeMov);
  var mup = document.getElementById("modalUpload");
  if(mup) mup.addEventListener("click", function(e){ if(e.target === mup) closeUploadModal(); });
  var mco = document.getElementById("modalConc");
  if(mco) mco.addEventListener("click", function(e){ if(e.target === mco) closeConcModal(); });
  ["concStatusFilter","concTipoFilter"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", renderConciliacao);
  });

  // ─── Retiros Sócios ───
  document.querySelectorAll(".chip-btn[data-ret-periodo]").forEach(function(b){
    b.addEventListener("click", function(){ aplicarRetPeriodoPreset(b.dataset.retPeriodo); });
  });
  ["retDataIni","retDataFim"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", function(){
      document.querySelectorAll(".chip-btn[data-ret-periodo]").forEach(function(b){ b.classList.remove("active"); });
      renderRetiros();
    });
  });
  var btnNovoR = document.getElementById("btnNovoRetiro");
  if(btnNovoR) btnNovoR.addEventListener("click", function(){ openRetiroModal(null); });
  var btnCloseR = document.getElementById("btnCloseRetiro");
  if(btnCloseR) btnCloseR.addEventListener("click", closeRetiroModal);
  var btnSaveR = document.getElementById("btnSaveRetiro");
  if(btnSaveR) btnSaveR.addEventListener("click", saveRetiro);
  var btnDelR = document.getElementById("btnDeleteRetiro");
  if(btnDelR) btnDelR.addEventListener("click", deleteRetiro);
  var mret = document.getElementById("modalRetiro");
  if(mret) mret.addEventListener("click", function(e){ if(e.target === mret) closeRetiroModal(); });
  var btnExpRet = document.getElementById("btnExportRetiros");
  if(btnExpRet) btnExpRet.addEventListener("click", exportRetirosExcel);

  // ─── Egresos ───
  document.querySelectorAll(".chip-btn[data-egr-periodo]").forEach(function(b){
    b.addEventListener("click", function(){ aplicarEgrPeriodoPreset(b.dataset.egrPeriodo); });
  });
  ["egrDataIni","egrDataFim","egrIncluirConsorcio"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", function(){
      if(id.startsWith("egrData")) document.querySelectorAll(".chip-btn[data-egr-periodo]").forEach(function(b){ b.classList.remove("active"); });
      renderEgresos();
    });
  });
  var btnExpEgr = document.getElementById("btnExportEgresos");
  if(btnExpEgr) btnExpEgr.addEventListener("click", exportEgresosExcel);

  // ─── Caixa ───
  document.querySelectorAll(".chip-btn[data-caixa-periodo]").forEach(function(b){
    b.addEventListener("click", function(){ aplicarCaixaPeriodoPreset(b.dataset.caixaPeriodo); });
  });
  ["caixaDataIni","caixaDataFim"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", function(){
      document.querySelectorAll(".chip-btn[data-caixa-periodo]").forEach(function(b){ b.classList.remove("active"); });
      renderCaixa();
    });
  });

  // ─── Ingresos ───
  document.querySelectorAll(".chip-btn[data-ing-periodo]").forEach(function(b){
    b.addEventListener("click", function(){ aplicarIngPeriodoPreset(b.dataset.ingPeriodo); });
  });
  ["ingDataIni","ingDataFim"].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.addEventListener("change", function(){
      document.querySelectorAll(".chip-btn[data-ing-periodo]").forEach(function(b){ b.classList.remove("active"); });
      renderIngresos();
    });
  });
  var btnExpIng = document.getElementById("btnExportIng");
  if(btnExpIng) btnExpIng.addEventListener("click", exportIngresosExcel);

  // Despesa rápida
  var btnRap = document.getElementById("btnDespesaRapida");
  if(btnRap) btnRap.addEventListener("click", openRapidaModal);
  var btnCloseR = document.getElementById("btnCloseRapida");
  if(btnCloseR) btnCloseR.addEventListener("click", closeRapidaModal);
  var btnSaveR = document.getElementById("btnSaveRapida");
  if(btnSaveR) btnSaveR.addEventListener("click", saveRapida);
  var mr = document.getElementById("modalRapida");
  if(mr) mr.addEventListener("click", function(e){ if(e.target === mr) closeRapidaModal(); });

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
