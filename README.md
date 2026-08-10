# 🤖 Godoy FreshOps AI — Agente de Inteligência, Ronda Hospitalar & Automação Freshservice

> **Desenvolvido por:** Godoy Solutions in TECH  
> **Usuário / Analista:** Caíque Eduardo  
> **Finalidade:** Automação Pessoal de Produtividade, Ronda Diária & Passagem de Plantão  
> **Classificação do Repositório:** 🔒 **PRIVADO & CONFIDENCIAL**  

---

## 📌 1. Visão Geral & Proposta de Valor

O **Godoy FreshOps AI** é uma aplicação corporativa pessoal projetada para otimizar, padronizar e automatizar a compilação diária da **Ronda Diária nos 4 Setores Hospitalares** e dos **Chamados de Suporte Técnico** atendidos no **Freshservice**.

A ferramenta foi construída com foco em **utilização mobile em smartphones (100% Responsivo)** e desktops, permitindo ao analista registrar o plantão de qualquer lugar do hospital em poucos toques.

 Ela gera relatórios em texto formatado para e-mail com 1 clique e exporta a **Planilha Excel (.xlsx)** automatizada com o bloco da Ronda Diária no cabeçalho e os 4 blocos de chamados abaixo.

---

## 📱 2. Design 100% Responsivo para Smartphone (Celular)

* **Interface Mobile-First:** Botões grandes para toque com os dedos (alvos de toque com no mínimo 44px de altura).
* **Visão em Cartões Interativos:** Na tela do celular, a tabela de chamados e a ronda hospitalar se transformam automaticamente em cartões empilhados e responsivos.
* **Ações Rápidas de Acesso Fácil:** Botões de criação manual de chamados, cópia de relatório e exportação Excel organizados estrategicamente na barra de ações.

---

## 🚶‍♂️ 3. Bloco de Ronda Diária / Primeira Ronda (4 Setores Hospitalares)

Antes dos chamados atendidos, a ferramenta inclui o módulo de registro da **Primeira Ronda Diária** realizada nos 4 setores hospitalares:

1. **Setor 1 — UTI Adulto & Neonatal:** Status (`100% OK / Sem Anormalidades` ou `Com Pendências`), Observações e Quem Validou (ex: *Enfermeiro Chefe*).
2. **Setor 2 — Recepção Central & PS:** Status, Observações e Quem Validou (ex: *Supervisão Recepção*).
3. **Setor 3 — Bloco Cirúrgico & Internação:** Status, Observações e Quem Validou (ex: *Coordenação Bloco*).
4. **Setor 4 — Ambulatório & Farmácia:** Status, Observações e Quem Validou (ex: *Farmacêutico Responsável*).

---

## 📋 4. Estrutura dos 4 Blocos de Atendimento

Para cada chamado registrado (manualmente ou via API), o sistema organiza:

1. **📌 1. Nº do Chamado (Ticket ID):** Código oficial do Freshservice (ex: `#SR-312654`).
2. **⚠️ 2. Problema Constatado:** Descrição da falha técnica identificada.
3. **🛠️ 3. Solução Efetuada:** Resolução / procedimento técnico aplicado.
4. **✅ 4. Validação (Quem Validou):** Registro do responsável ou setor de enfermagem que testou e validou a solução.

---

## 📊 5. Automação da Planilha Excel & Integração com Google Sheets (Python)

### 📊 5.1 Geração da Planilha Excel (.xlsx)
O botão **"Planilha Excel (.xlsx)"** gera e faz o download imediato da planilha estruturada da seguinte forma:
- **Linha 1 a 3:** Cabeçalho com o nome do analista, data e turno.
- **Bloco da Ronda Diária:** As 4 linhas dos setores hospitalares com o status, observações e quem validou.
- **Bloco dos Chamados:** A tabela completa com os 4 blocos de dados de cada atendimento do plantão.

### 🐍 5.2 Automação Python & Google Sheets API (`automation/freshops.py`)
No diretório [`automation/freshops.py`](automation/freshops.py), fornecemos o script em **Python 3 moderno** que utiliza:
- `requests`: Para consultar a REST API v2 do Freshservice.
- `openpyxl`: Para estilizar e montar a planilha Excel nativa.
- `gspread`: Para sincronização automatizada direta com planilhas do **Google Sheets**.

#### Como rodar o script Python:
```bash
# Instalar dependências
pip install requests openpyxl gspread google-auth

# Executar a automação
python automation/freshops.py
```

---

## 🔒 6. Conformidade de Segurança & Repositório Privado

* **Repositório GitHub 100% PRIVADO:** Garantia de confidencialidade dos processos e logs.
* **Execução Local & Zero Armazenamento Externo:** Chaves de API e registros do plantão permanecem no `localStorage` do dispositivo do analista.
* **Escopo Restrito ao Analista:** Consultas REST API restritas apenas ao ID do usuário autenticado no Freshservice.

---

*Desenvolvido por Godoy Solutions in TECH — 2026*
