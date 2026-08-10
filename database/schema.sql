-- =========================================================
-- Schema SQL para Banco de Dados Neon PostgreSQL
-- Projeto: Godoy FreshOps AI — Histórico de Chamados e Rondas Hospitalares
-- Desenvolvido por Godoy Solutions in TECH para Caíque Eduardo
-- =========================================================

-- 1. Tabela de Rondas Diárias Arquivadas por Data
CREATE TABLE IF NOT EXISTS rondas_historico (
    id SERIAL PRIMARY KEY,
    data_ronda DATE NOT NULL DEFAULT CURRENT_DATE,
    setor_nome VARCHAR(255) NOT NULL,
    status_ronda VARCHAR(50) NOT NULL,
    observacao TEXT,
    validado_por VARCHAR(255),
    analista_nome VARCHAR(255) DEFAULT 'Caíque Eduardo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Chamados Atendidos Arquivados por Data
CREATE TABLE IF NOT EXISTS chamados_historico (
    id SERIAL PRIMARY KEY,
    data_chamado DATE NOT NULL DEFAULT CURRENT_DATE,
    numero_chamado VARCHAR(100) NOT NULL,
    problema_constatado TEXT NOT NULL,
    solucao_efetuada TEXT NOT NULL,
    validado_por VARCHAR(255) NOT NULL,
    analista_nome VARCHAR(255) DEFAULT 'Caíque Eduardo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices de consulta rápida por data e número de chamado
CREATE INDEX IF NOT EXISTS idx_chamados_data ON chamados_historico(data_chamado);
CREATE INDEX IF NOT EXISTS idx_chamados_numero ON chamados_historico(numero_chamado);
