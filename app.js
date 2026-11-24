/* BUILD: NORDAPP v0.1.0 · 2026-11-23 · Fase 1 setup */

(function(){
'use strict';

console.log("NORDAPP v0.1.0 · Fase 1 setup · 2026-11-23");

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
function updatePainelHeader(){
  var now = new Date();
  var days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  var months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  var hh = String(now.getHours()).padStart(2,"0");
  var mm = String(now.getMinutes()).padStart(2,"0");
  document.getElementById("painelDate").textContent =
    days[now.getDay()] + ", " + now.getDate() + " " + months[now.getMonth()] + " " + now.getFullYear() + " · " + hh + ":" + mm;
  if(currentUser){
    document.getElementById("painelGreet").textContent = "Olá, " + currentUser.nome;
    document.getElementById("painelRole").textContent = ROLE_LABELS[currentRole] || currentRole;
  }
  document.getElementById("buildStamp").textContent = "NORDAPP v0.1.0 · build 2026-11-23";
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
  // Fase 1: todos os módulos mostram placeholder "em construção"
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
