# 🤖 Godoy FreshOps AI — Agente de Inteligência & Automação Freshservice

> **Desenvolvido por:** Godoy Solutions in TECH  
> **Usuário / Analista:** Caíque Eduardo  
> **Finalidade:** Automação Pessoal de Produtividade & Padronização de Passagem de Plantão de Suporte Técnico  
> **Classificação do Repositório:** 🔒 **PRIVADO & CONFIDENCIAL**  

---

## 📌 1. Visão Geral & Proposta de Valor

O **Godoy FreshOps AI** é uma aplicação corporativa pessoal desenvolvida com o propósito de otimizar, padronizar e automatizar a compilação diária dos chamados de suporte técnico hospitalar atendidos no sistema **Freshservice**.

Atualmente, ao término de cada plantão, o analista de suporte precisa compilar manualmente os chamados notificados no **Microsoft Teams (AmericasBot)** e encerrados no **Freshservice** para montar o relatório oficial de passagem de plantão e alimentar a planilha corporativa da equipe.

Esta aplicação elimina o retrabalho manual, consolidando os atendimentos em **4 blocos padronizados de dados**, gerando relatórios em texto para e-mail com 1 clique e exportando planilhas no formato **Excel (.xlsx)**.

---

## 🎯 2. Escopo & Funcionalidades da Aplicação

### 📋 2.1 Estrutura Organizacional em 4 Blocos de Atendimento
Para cada chamado processado, a ferramenta estrutura rigorosamente as seguintes informações:

1. **📌 1. Número do Chamado (Ticket ID):** Código oficial do chamado no Freshservice (ex: `#SR-312654`).
2. **⚠️ 2. Problema Constatado:** Descrição técnica resumida da falha relatada (ex: *Leitor de código de barras desconfigurado na recepção da UTI*).
3. **🛠️ 3. Solução Efetuada:** Ações corretivas aplicadas pelo analista (ex: *Reconfiguração de parâmetros USB, limpeza de fila de impressão e testes de validação*).
4. **✅ 4. Validação (Quem Validou):** Registro do profissional / setor hospitalar que testou e aprovou a solução (ex: *Validado em conjunto com a Enfermagem / Grazielly Nadja*).

### 🚀 2.2 Principais Recursos de Produtividade
* ⚡ **Sincronização via REST API v2 do Freshservice:** Leitura automatizada apenas dos chamados encerrados/resolvidos pelo próprio analista no dia.
* 📊 **Gerador de Planilha Excel (.xlsx):** Exportação imediata em arquivo `.xlsx` com as 4 colunas formatadas para anexar ou colar na planilha corporativa de plantão.
* 📋 **Gerador de Relatório para E-mail:** Formatação automática em texto estruturado pronto para cópia instantânea (`Ctrl+C`) e colagem no e-mail de passagem de plantão.
* 💬 **Importador Inteligente do Microsoft Teams:** Leitor de cards do *AmericasBot* que extrai o número do ticket e solicitante mesmo em preenchimento offline.

---

## 🛡️ 3. Arquitetura de Segurança, Privacidade & Conformidade (LGPD)

Esta aplicação foi desenvolvida sob os mais rigorosos padrões de segurança da informação corporativa:

### 🔒 3.1 Escopo Restrito ao Usuário (Princípio do Menor Privilégio)
* **Acesso Exclusivo aos Próprios Chamados:** A requisição REST API do Freshservice consulta estritamente o endpoint filtrado pelo próprio ID do usuário autenticado (`GET /api/v2/tickets?filter="agent_id:me"`).
* **Sem Acesso a Dados da Empresa/Outros Setores:** A chave de API pessoal do analista possui **exatamente as mesmas permissões** que ele já possui na interface web do Freshservice. Ela não possui privilégios administrativos e não acessa chamados de outros departamentos.

### 🚫 3.2 Zero Armazenamento Externo & Proteção Contra Vazamento (Zero Leak)
* **Execução Client-Side / Local:** Toda a aplicação roda no navegador do próprio computador corporativo do analista.
* **Armazenamento Seguro em `localStorage`:** A chave de API e os registros do plantão ficam armazenados exclusivamente na memória local do navegador do dispositivo do analista.
* **Sem Servidores Intermediários de Terceiros:** Não existem servidores externos, bancos de dados na nuvem não autorizados ou intermediários capturando informações. O tráfego ocorre de forma direta entre o navegador e a API oficial do Freshservice via **HTTPS/TLS criptografado**.

### 🔒 3.3 Código-Fonte Privado
* O repositório no GitHub está configurado como **`PRIVATE`**, garantindo que nenhum script, fluxo ou estrutura interna corporativa fique exposto publicamente.

---

## 📄 4. Exemplo de Relatório Gerado para E-mail de Plantão

```text
===================================================
🏥 GODOY FRESHOPS AI — RELATÓRIO DE PASSAGEM DE PLANTÃO
👤 Analista: Caíque Eduardo | Suporte Técnico
📅 Data: 10/08/2026 | Turno: Diurno
===================================================

✅ CHAMADOS ATENDIDOS E FINALIZADOS:

1. [#SR-312654]
   • ⚠️ Problema Constatado: Leitor de código de barras desconfigurado na recepção da UTI.
   • 🛠️ Solução Efetuada: Reconfiguração dos parâmetros USB, limpeza de fila de impressão e testes de leitura.
   • ✅ Validação: Validado com Grazielly Nadja (Enfermagem UTI)

2. [#SR-312688]
   • ⚠️ Problema Constatado: Impressora de etiquetas do 3º andar travada em fila de impressão.
   • 🛠️ Solução Efetuada: Executado script de limpeza de spooler no Windows Server e reiniciado serviço.
   • ✅ Validação: Validado com Marcos Silva (Supervisão Enfermagem)

---------------------------------------------------
📊 TOTAL DE ATENDIMENTOS NO PLANTÃO: 2 Chamados
===================================================
```

---

## 🛠️ 5. Tecnologias Utilizadas

* **HTML5 & CSS3 Vanilla:** Interface corporativa hospitalar responsiva (Modos Claro / Escuro).
* **JavaScript ES6+:** Manipulação assíncrona da API v2 do Freshservice.
* **SheetJS (`xlsx`):** Geração e exportação client-side de planilhas em formato Excel.
* **RemixIcon:** Iconografia de suporte técnico e infraestrutura médica.

---

## 📝 6. Conclusão & Solicitação de Ativação da API Key

A utilização da **API Key pessoal do Freshservice** nesta ferramenta tem como único objetivo a **automação de leitura de dados de suporte do próprio analista**, promovendo ganhos significativos de produtividade, eliminação de erros manuais na passagem de plantão e rastreabilidade dos atendimentos prestados ao hospital.

*Desenvolvido por Godoy Solutions in TECH — 2026*
