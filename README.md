# NORDAPP

Nova versão da app de gestão da Pousada Nordestina.
Rodará em paralelo à app atual (`nordestina-app`) até substituí-la por completo.

**Versão atual:** v0.1.0 · Fase 1 setup
**Deploy:** https://matfraga-gh.github.io/nordapp/
**Documento de arquitetura:** `../nordestina-app/outputs/NORDAPP_arquitectura_v1.md`

---

## Setup inicial · Fase 1

### Passo 1 · Supabase (uma vez)

1. Entre no SQL Editor do Supabase (mesmo projeto da app atual)
2. Abra o arquivo `000_migrations_fase1.sql`
3. Execute o script completo
4. Verifique a seção final — deve retornar:
   - `reservas colunas novas · 5`
   - `entries colunas novas · 12`
   - `tabelas novas · 7`

Se tudo OK, as migrations estão prontas. O schema é **aditivo**: a app atual continua funcionando normalmente.

### Passo 2 · GitHub Pages

1. Criar o repositório `matfraga-gh/nordapp` (público ou privado)
2. Subir os arquivos deste diretório:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md` (este)
3. Habilitar GitHub Pages: **Settings → Pages → Branch: `main` → `/` (root)**
4. Aguardar ~1-2 min para o deploy inicial
5. Acessar: https://matfraga-gh.github.io/nordapp/

### Passo 3 · Login

Qualquer usuário cadastrado na tabela `usuarios` do Supabase atual pode entrar.
Mapeamento de roles:

| Rol antigo | Role NORDAPP |
|---|---|
| master | 👑 Master |
| administrativa | 💼 Administração |
| comercial | 📅 Reservas |
| checkin | 📅 Reservas |
| housekeeping | 📅 Reservas |
| auditor | 🔍 Auditor |
| propietario | 🔍 Auditor |

---

## O que está pronto (v0.1.0)

- ✅ Login funcional (mesma base de usuários da app atual)
- ✅ Painel principal com 4 cards (Vendas · Despesas · Reportes · Admin)
- ✅ Filtro por role (cada role vê só o que lhe corresponde)
- ✅ Hub de cada card com sub-tiles (ex: Vendas tem 5 sub-módulos)
- ✅ Navegação de 2 níveis (Painel → Hub → View)
- ✅ Placeholder "Em construção" para todos os módulos específicos
- ✅ Logout + sessão persistente
- ✅ Rebranding visual (paleta ocean + sand, Cormorant + Jost)

## O que falta implementar (próximas fases)

### Fase 2 · Núcleo Despesas
- Módulo Comprobantes (carga, import extrato, recorrentes)
- Módulo Pagos (bandeja, conciliação)
- Módulo Fornecedores
- Reportes > Painel de Resultados (DRE)
- Reportes > Caixa

### Fase 3 · Reportes complementares
- Ingresos · Egresos · Simples Nacional · Comissões

### Fase 4 · Módulos específicos
- Sócios · Pessoal · Permissões UI

### Fase 5 · Vendas
- Reservas com ficha hóspede
- Hóspedes CRM · Receita Antecipada
- Comunicações (templates + email automático)
- Disponibilidade mejorada (ícones, drag/drop)

### Fase 6 · Admin fino
- Usuários · Permissões · Configurações · Templates · Consórcio link

### Fase 7 · Cierre
- Testing paralelo · migración datos · baja app vieja · redirect URL

### Fase 8 · Consórcio (post-NORDAPP)

### Fase 9 · Seguridad RLS + Auth real

---

## Convenções de desenvolvimento

- **Build stamp:** atualizar no console.log de `app.js` + comentário `/* BUILD: ... */` na linha 1
- **Cache GitHub Pages:** ~10 min após subir, usar Ctrl+Shift+R
- **Supabase keys:** publishable key no código (mesmo padrão AZUCAPP e app atual)
- **Secrets (API keys reais):** Supabase Secrets (ex: Resend API key)

## Stack

- HTML/CSS/JS vanilla (sem framework)
- Supabase (PostgreSQL + PostgREST)
- GitHub Pages (hosting)
- Cotação câmbio: dolarapi.com
- Email futuro: Resend (via Edge Function)

