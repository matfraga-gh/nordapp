-- ═══════════════════════════════════════════════════════════════════════════
-- NORDAPP · Migrations Fase 1 · Setup inicial
-- Idempotente — pode rodar múltiplas vezes sem erro.
-- 
-- IMPORTANTE: Todas as alterações são ADITIVAS. Nenhuma coluna existente
-- é removida ou renomeada. A app atual continua funcionando normalmente.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Extensões necessárias
-- ─────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Extensões em tabelas existentes (ADITIVAS)
-- ─────────────────────────────────────────────────────────────────────────

-- RESERVAS: email, telefone, tags, link a ficha hóspede
ALTER TABLE reservas
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[],
  ADD COLUMN IF NOT EXISTS hospede_id UUID,
  ADD COLUMN IF NOT EXISTS documento_anexo_url TEXT;

-- ENTRIES: dupla data, DRE, módulo, conta bancária, anexo, conciliação, estado
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS data_competencia DATE,
  ADD COLUMN IF NOT EXISTS data_pagamento DATE,
  ADD COLUMN IF NOT EXISTS dre_rubro TEXT,
  ADD COLUMN IF NOT EXISTS dre_conta TEXT,
  ADD COLUMN IF NOT EXISTS dre_subconta TEXT,
  ADD COLUMN IF NOT EXISTS modulo TEXT DEFAULT 'hotel',
  ADD COLUMN IF NOT EXISTS conta_bancaria TEXT,
  ADD COLUMN IF NOT EXISTS anexo_url TEXT,
  ADD COLUMN IF NOT EXISTS conciliado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS estado_comprobante TEXT,
  ADD COLUMN IF NOT EXISTS recorrente BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recorrente_parent_id BIGINT,
  ADD COLUMN IF NOT EXISTS fornecedor_id INT;

-- Backfill data_competencia e data_pagamento para entries existentes
-- (assume que data representa competencia, e se já estava marcado como pago, también pagamento)
UPDATE entries
SET data_competencia = date
WHERE data_competencia IS NULL;

UPDATE entries
SET data_pagamento = date
WHERE data_pagamento IS NULL AND date IS NOT NULL;

-- Backfill estado_comprobante: todo lançamento existente se marca como 'pago'
UPDATE entries
SET estado_comprobante = 'pago'
WHERE estado_comprobante IS NULL AND type = 'expense';

-- FORNECEDORES: estende com campos de contato e bancários
ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS tipo TEXT,
  ADD COLUMN IF NOT EXISTS cnpj_cpf TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS telefone TEXT,
  ADD COLUMN IF NOT EXISTS banco_pagto TEXT,
  ADD COLUMN IF NOT EXISTS chave_pix TEXT,
  ADD COLUMN IF NOT EXISTS comentarios TEXT,
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- APP_CONFIG: regime SN, dados LG, email config
ALTER TABLE app_config
  ADD COLUMN IF NOT EXISTS regime_sn TEXT DEFAULT 'competencia',
  ADD COLUMN IF NOT EXISTS razao_social TEXT,
  ADD COLUMN IF NOT EXISTS cnpj TEXT,
  ADD COLUMN IF NOT EXISTS endereco TEXT,
  ADD COLUMN IF NOT EXISTS email_remetente TEXT;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Novas tabelas
-- ─────────────────────────────────────────────────────────────────────────

-- CRM de hóspedes (ficha persistente)
CREATE TABLE IF NOT EXISTS hospedes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_completo TEXT NOT NULL,
  documento TEXT,
  email TEXT,
  telefone TEXT,
  idioma_preferido TEXT,
  observacoes_permanentes TEXT,
  tags_padrao TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospedes_documento ON hospedes(documento);
CREATE INDEX IF NOT EXISTS idx_hospedes_email ON hospedes(email);

-- Templates de comunicação
CREATE TABLE IF NOT EXISTS templates_comunicacao (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  idioma TEXT DEFAULT 'pt',
  canal TEXT NOT NULL,
  assunto TEXT,
  corpo_template TEXT NOT NULL,
  automatico BOOLEAN DEFAULT FALSE,
  trigger TEXT,
  dias_offset INT DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Histórico de comunicações enviadas
CREATE TABLE IF NOT EXISTS comunicacoes_enviadas (
  id SERIAL PRIMARY KEY,
  reserva_id BIGINT,
  hospede_id UUID,
  tipo TEXT,
  canal TEXT,
  destinatario TEXT,
  corpo TEXT,
  enviado_em TIMESTAMP DEFAULT NOW(),
  enviado_por INT,
  status TEXT DEFAULT 'enviado'
);

CREATE INDEX IF NOT EXISTS idx_comunicacoes_reserva ON comunicacoes_enviadas(reserva_id);

-- Empregados com conta corrente
CREATE TABLE IF NOT EXISTS empregados_cc (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  role TEXT,
  salario_mensal NUMERIC(12,2),
  dia_pagamento INT,
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Retiros de sócios
CREATE TABLE IF NOT EXISTS socios_retiros (
  id SERIAL PRIMARY KEY,
  socio TEXT NOT NULL,
  tipo TEXT NOT NULL,
  conta_origem TEXT,
  moeda_origem TEXT DEFAULT 'BRL',
  valor_origem NUMERIC(14,2) NOT NULL,
  taxa_cambio NUMERIC(14,6) DEFAULT 1,
  valor_brl NUMERIC(14,2) NOT NULL,
  data DATE NOT NULL,
  conta_destino TEXT,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INT
);

CREATE INDEX IF NOT EXISTS idx_socios_retiros_data ON socios_retiros(data);
CREATE INDEX IF NOT EXISTS idx_socios_retiros_socio ON socios_retiros(socio);

-- Audit log genérico
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  tabela TEXT NOT NULL,
  registro_id TEXT NOT NULL,
  acao TEXT NOT NULL,
  usuario_id INT,
  valores_antes JSONB,
  valores_depois JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_tabela_reg ON audit_log(tabela, registro_id);
CREATE INDEX IF NOT EXISTS idx_audit_data ON audit_log(created_at);

-- Comentarios internos genéricos
CREATE TABLE IF NOT EXISTS comentarios (
  id SERIAL PRIMARY KEY,
  entidade TEXT NOT NULL,
  entidade_id TEXT NOT NULL,
  usuario_id INT,
  usuario_nome TEXT,
  texto TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_entidade ON comentarios(entidade, entidade_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Config inicial de contas bancárias (hardcoded como constants no app)
-- No é tabela — definido na config global do app.js.
-- Lista:  Bradesco LG · Inter LG · Caixa Brasil · Cartão Bradesco · 
--         Cartão Inter · Cripto Matias
-- ─────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Verificação
-- ─────────────────────────────────────────────────────────────────────────
SELECT 'reservas colunas novas' AS tabela, COUNT(*) AS cols
FROM information_schema.columns
WHERE table_name = 'reservas'
  AND column_name IN ('telefone','email','tags','hospede_id','documento_anexo_url')
UNION ALL
SELECT 'entries colunas novas', COUNT(*)
FROM information_schema.columns
WHERE table_name = 'entries'
  AND column_name IN ('data_competencia','data_pagamento','dre_rubro','dre_conta','dre_subconta',
                      'modulo','conta_bancaria','anexo_url','conciliado','estado_comprobante',
                      'recorrente','fornecedor_id')
UNION ALL
SELECT 'tabelas novas', COUNT(*)
FROM information_schema.tables
WHERE table_name IN ('hospedes','templates_comunicacao','comunicacoes_enviadas',
                     'empregados_cc','socios_retiros','audit_log','comentarios');

-- Se tudo correu bem, deve retornar:
--   reservas colunas novas · 5
--   entries colunas novas   · 12
--   tabelas novas           · 7
-- Caso contrário, ROLLBACK e revisar.

COMMIT;
