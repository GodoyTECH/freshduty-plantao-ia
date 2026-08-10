# 🤖 Godoy FreshOps AI — Agente de Inteligência, Ronda Hospitalar & Automação Freshservice

> **Desenvolvido por:** Godoy Solutions in TECH  
> **Usuário / Analista:** Caique Eduardo  
> **Finalidade:** Automação Pessoal de Produtividade, Ronda Diária & Passagem de Plantão  
> **Classificação do Repositório:** 🔒 **PRIVADO & CONFIDENCIAL**  

---

## 📌 1. Visão Geral & Proposta de Valor

O **Godoy FreshOps AI** é uma aplicação corporativa pessoal projetada para otimizar, padronizar e automatizar a compilação diária da **Ronda Diária nos 4 Setores Hospitalares** e dos **Chamados de Suporte Técnico** atendidos no **Freshservice**.

A ferramenta foi construída com foco em **utilização mobile em smartphones (100% Responsivo)** e desktops, permitindo ao analista registrar o plantão de qualquer lugar do hospital em poucos toques.

---

## 📱 2. PWA Nativo para Android & Instalação em 1 Clique

* **Instalação PWA Instantânea:** Botão destacado **"Instalar App"** que adiciona o aplicativo diretamente à tela inicial do celular Android sem necessidade de APKs ou Play Store.
* **Modo Standalone Fullscreen:** Execução em tela cheia sem barras de navegador.
* **Service Worker (`sw.js`):** Cache offline para carregamento instantâneo.
* **Notificações Push no Celular:** Vibração e alertas instantâneos ao receber chamados do Teams.

---

## ⚡ 3. Motor Duplo de IA OCR por Print de Tela (Galeria & Colagem com Ctrl + V)

* **Motor Principal — OCR.space Cloud API:** Processamento em nuvem ultra-rápido em português (`language: por`).
* **Motor Secundário — Tesseract.js:** Fallback de segurança em caso de oscilação de rede.
* **Colagem Direta (`Ctrl + V`):** Cole capturas de tela diretamente no aplicativo ou selecione fotos da galeria do celular.
* **Reconhecimento Inteligente:** Extrai automaticamente o número do chamado (`#SR-XXXXXX`), o solicitante, o problema e o script de solução.

---

## ⏰ 4. Relógio em Tempo Real, Auto-Reset Diário & Banco Neon PostgreSQL

* **Relógio Digital Live (`HH:MM:SS`):** Exibição em tempo real com data automática.
* **Auto-Reset na Meia-Noite:** Zera a lista de chamados do dia a cada virada de plantão.
* **Arquivamento em Nuvem Neon PostgreSQL:** Histórico preservado com segurança no banco em nuvem.
* **Schema SQL Incluído:** Arquivo [`database/schema.sql`](database/schema.sql) com tabelas prontas para execução.

---

## 🚶‍♂️ 5. Ronda Diária Enxuta & Formatação para WhatsApp

* **4 Setores Editáveis:** Nomes de setores 100% customizáveis.
* **Script Otimizado:** Setores com status `100% OK` ocultam automaticamente as observações para enxugar o texto.
* **Botão 1-Clique WhatsApp:** Copia o relatório da ronda formatado com emojis (`🟢/🟡`) para colar direto nos grupos de suporte.

---

## 🛠️ 6. Automação & Netlify CLI Integration

### ☁️ Comandos do Netlify CLI (Instalação & Gerenciamento):
```bash
# Instalar o Netlify CLI globalmente / localmente
npm install netlify-cli -g

# Fazer login no Netlify via terminal
npx netlify login

# Linkar este projeto ao seu site no Netlify
npx netlify link

# Fazer deploy em produção
npx netlify deploy --prod

# Listar variáveis de ambiente protegidas no Netlify
npx netlify env:list
```

### 🐍 Automação Python & Validação de Banco:
```bash
# Testar conexão segura com o Neon PostgreSQL (Credenciais ocultas)
python automation/test_neon_connection.py "SUA_DATABASE_URL_DO_NEON"

# Automação Freshservice & Google Sheets
python automation/freshops.py
```

---

## 🔒 7. Conformidade de Segurança & Repositório Privado

* **Repositório GitHub 100% PRIVADO:** Visibilidade restrita ao usuário.
* **Cofre de Variáveis Netlify:** Credenciais armazenadas em variáveis encriptadas (`DATABASE_URL 🔒`).
* **Zero Credenciais no Código:** Nenhuma senha ou chave gravada em texto puro no repositório.

---

*Desenvolvido por Godoy Solutions in TECH — 2026*
