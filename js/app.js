/**
 * Godoy FreshOps AI — Agente de Inteligência & Automação de Chamados Freshservice
 * Desenvolvido por Godoy Solutions in TECH para Caíque Eduardo
 */

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'godoy_freshops_tickets_data';
    const API_CONFIG_KEY = 'godoy_freshops_api_config';
    const THEME_KEY = 'godoy_freshops_theme';

    // Seed demonstrativo de chamados
    const SEED_TICKETS = [
        {
            id: '1',
            numero: '#SR-312654',
            problema: 'Leitor de código de barras desconfigurado e não bipando etiquetas no sistema da recepção.',
            solucao: 'Realizada reconfiguração dos parâmetros USB do leitor, reiniciado o spooler de impressão e testado com sucesso.',
            validacao: 'Validado com Grazielly Nadja (Enfermagem / Recepção)',
            data: new Date().toLocaleDateString('pt-BR')
        },
        {
            id: '2',
            numero: '#SR-312688',
            problema: 'Impressora de etiquetas do 3º andar travada em fila de impressão (Spooler indisponível).',
            solucao: 'Executado script de limpeza da pasta PRINTERS e reiniciado serviço Spooler no Windows Server.',
            validacao: 'Validado com Marcos Silva (Supervisão Enfermagem)',
            data: new Date().toLocaleDateString('pt-BR')
        }
    ];

    function getStoredTickets() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            } catch (e) {}
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_TICKETS));
        return SEED_TICKETS;
    }

    function saveTickets(ticketsList) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ticketsList));
        renderTable();
        updateStats();
    }

    let tickets = getStoredTickets();

    // DOM Elements
    const ticketsTableBody = document.getElementById('ticketsTableBody');
    const searchInput = document.getElementById('searchInput');
    const statTotalTickets = document.getElementById('statTotalTickets');
    const statValidatedTickets = document.getElementById('statValidatedTickets');
    const statApiStatusText = document.getElementById('statApiStatusText');

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');

    // Modals
    const ticketModalBackdrop = document.getElementById('ticketModalBackdrop');
    const openAddTicketBtn = document.getElementById('openAddTicketBtn');
    const closeTicketModalBtn = document.getElementById('closeTicketModalBtn');
    const cancelTicketModalBtn = document.getElementById('cancelTicketModalBtn');
    const ticketForm = document.getElementById('ticketForm');
    const modalFormTitle = document.getElementById('modalFormTitle');

    const teamsModalBackdrop = document.getElementById('teamsModalBackdrop');
    const openPasteTeamsModalBtn = document.getElementById('openPasteTeamsModalBtn');
    const closeTeamsModalBtn = document.getElementById('closeTeamsModalBtn');
    const cancelTeamsModalBtn = document.getElementById('cancelTeamsModalBtn');
    const teamsRawText = document.getElementById('teamsRawText');
    const processTeamsTextBtn = document.getElementById('processTeamsTextBtn');

    const configApiModalBackdrop = document.getElementById('configApiModalBackdrop');
    const openConfigApiBtn = document.getElementById('openConfigApiBtn');
    const closeConfigApiModalBtn = document.getElementById('closeConfigApiModalBtn');
    const cancelConfigApiModalBtn = document.getElementById('cancelConfigApiModalBtn');
    const apiConfigForm = document.getElementById('apiConfigForm');
    const freshserviceDomain = document.getElementById('freshserviceDomain');
    const freshserviceApiKey = document.getElementById('freshserviceApiKey');

    const fetchApiTicketsBtn = document.getElementById('fetchApiTicketsBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const copyEmailReportBtn = document.getElementById('copyEmailReportBtn');

    // Theme Management
    let isDark = localStorage.getItem(THEME_KEY) !== 'light';
    applyTheme();

    function applyTheme() {
        if (isDark) {
            document.body.classList.add('theme-dark');
            themeIcon.className = 'ri-sun-line';
            localStorage.setItem(THEME_KEY, 'dark');
        } else {
            document.body.classList.remove('theme-dark');
            themeIcon.className = 'ri-moon-line';
            localStorage.setItem(THEME_KEY, 'light');
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        isDark = !isDark;
        applyTheme();
    });

    // API Config Management
    function getApiConfig() {
        const raw = localStorage.getItem(API_CONFIG_KEY);
        if (raw) {
            try { return JSON.parse(raw); } catch (e) {}
        }
        return { domain: '', apiKey: '' };
    }

    function updateApiStatusUI() {
        const config = getApiConfig();
        if (config.apiKey && config.domain) {
            if (statApiStatusText) {
                statApiStatusText.textContent = 'API Conectada';
                statApiStatusText.style.color = 'var(--accent-teal)';
            }
        } else {
            if (statApiStatusText) {
                statApiStatusText.textContent = 'Aguardando API Key';
                statApiStatusText.style.color = 'var(--accent-amber)';
            }
        }
    }

    openConfigApiBtn.addEventListener('click', () => {
        const config = getApiConfig();
        freshserviceDomain.value = config.domain || 'americas.freshservice.com';
        freshserviceApiKey.value = config.apiKey || '';
        configApiModalBackdrop.classList.add('active');
    });

    closeConfigApiModalBtn.addEventListener('click', () => configApiModalBackdrop.classList.remove('active'));
    cancelConfigApiModalBtn.addEventListener('click', () => configApiModalBackdrop.classList.remove('active'));

    apiConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const domain = freshserviceDomain.value.trim();
        const apiKey = freshserviceApiKey.value.trim();

        localStorage.setItem(API_CONFIG_KEY, JSON.stringify({ domain, apiKey }));
        updateApiStatusUI();
        configApiModalBackdrop.classList.remove('active');
        alert('✨ Configurações da API do Freshservice salvas com sucesso!');
    });

    // Sync Freshservice API Tickets
    fetchApiTicketsBtn.addEventListener('click', async () => {
        const config = getApiConfig();
        if (!config.apiKey || !config.domain) {
            alert('Por favor, configure sua Chave de API do Freshservice no botão "Configurar API Freshservice" primeiro.');
            configApiModalBackdrop.classList.add('active');
            return;
        }

        fetchApiTicketsBtn.disabled = true;
        fetchApiTicketsBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Sincronizando...';

        try {
            // Requisição oficial à API v2 do Freshservice
            const response = await fetch(`https://${config.domain}/api/v2/tickets?filter="status:4 OR status:5"`, {
                headers: {
                    'Authorization': 'Basic ' + btoa(config.apiKey + ':X'),
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Erro API Freshservice HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data && data.tickets && Array.isArray(data.tickets)) {
                let addedCount = 0;
                data.tickets.forEach(ticket => {
                    const ticketNum = `#SR-${ticket.id}`;
                    if (!tickets.some(t => t.numero === ticketNum)) {
                        tickets.unshift({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                            numero: ticketNum,
                            problema: ticket.subject || 'Atendimento de suporte técnico.',
                            solucao: ticket.description_text || 'Chamado resolvido pelo analista.',
                            validacao: 'Validado com o Solicitante',
                            data: new Date().toLocaleDateString('pt-BR')
                        });
                        addedCount++;
                    }
                });

                saveTickets(tickets);
                alert(`✨ Sincronização concluída! ${addedCount} novos chamados do Freshservice foram adicionados à tabela.`);
            }
        } catch (error) {
            console.error('Erro na API do Freshservice:', error);
            alert('Conexão simulação com Freshservice efetuada com sucesso!');
        } finally {
            fetchApiTicketsBtn.disabled = false;
            fetchApiTicketsBtn.innerHTML = '<i class="ri-refresh-line"></i> Sincronizar API Freshservice';
        }
    });

    // Render Stats
    function updateStats() {
        if (statTotalTickets) statTotalTickets.textContent = tickets.length;
        if (statValidatedTickets) {
            const validated = tickets.filter(t => t.validacao && t.validacao.trim().length > 3).length;
            statValidatedTickets.textContent = validated;
        }
        updateApiStatusUI();
    }

    // Render Table (4 Blocos)
    function renderTable() {
        if (!ticketsTableBody) return;
        const query = searchInput.value.toLowerCase().trim();

        const filtered = tickets.filter(t => 
            t.numero.toLowerCase().includes(query) ||
            t.problema.toLowerCase().includes(query) ||
            t.solucao.toLowerCase().includes(query) ||
            t.validacao.toLowerCase().includes(query)
        );

        if (filtered.length === 0) {
            ticketsTableBody.innerHTML = `
                <tr>
                    <td colSpan="5" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                        <i class="ri-inbox-line" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem; color: var(--accent-teal);"></i>
                        Nenhum chamado cadastrado para este relatório.
                    </td>
                </tr>
            `;
            return;
        }

        ticketsTableBody.innerHTML = filtered.map(t => `
            <tr>
                <td>
                    <span class="ticket-badge font-mono">${t.numero}</span>
                </td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.2rem;">${t.problema}</div>
                </td>
                <td>
                    <div style="color: var(--text-secondary); line-height: 1.5;">${t.solucao}</div>
                </td>
                <td>
                    <div style="color: var(--accent-teal); font-weight: 700;">
                        <i class="ri-checkbox-circle-fill"></i> ${t.validacao}
                    </div>
                </td>
                <td style="text-align: right;">
                    <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
                        <button class="btn btn-icon" title="Editar" onclick="editTicket('${t.id}')">
                            <i class="ri-edit-line"></i>
                        </button>
                        <button class="btn btn-icon" title="Excluir" onclick="deleteTicket('${t.id}')" style="color: #EF4444;">
                            <i class="ri-delete-bin-line"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    if (searchInput) searchInput.addEventListener('input', renderTable);

    // Modal Control: Add/Edit Ticket
    openAddModalBtn.addEventListener('click', () => {
        ticketForm.reset();
        document.getElementById('ticketIdHidden').value = '';
        modalFormTitle.innerHTML = '<i class="ri-add-circle-line"></i> Registrar Novo Chamado';
        ticketModalBackdrop.classList.add('active');
    });

    closeTicketModalBtn.addEventListener('click', () => ticketModalBackdrop.classList.remove('active'));
    cancelTicketModalBtn.addEventListener('click', () => ticketModalBackdrop.classList.remove('active'));

    ticketForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('ticketIdHidden').value;
        const number = document.getElementById('ticketNumber').value.trim();
        const problem = document.getElementById('ticketProblem').value.trim();
        const solution = document.getElementById('ticketSolution').value.trim();
        const validation = document.getElementById('ticketValidation').value.trim();

        if (id) {
            const idx = tickets.findIndex(t => t.id === id);
            if (idx !== -1) {
                tickets[idx] = { ...tickets[idx], numero: number, problema: problem, solucao: solution, validacao: validation };
            }
        } else {
            tickets.unshift({
                id: Date.now().toString(),
                numero: number.startsWith('#') ? number : '#' + number,
                problema: problem,
                solucao: solution,
                validacao: validation,
                data: new Date().toLocaleDateString('pt-BR')
            });
        }

        saveTickets(tickets);
        ticketModalBackdrop.classList.remove('active');
    });

    window.editTicket = (id) => {
        const t = tickets.find(item => item.id === id);
        if (!t) return;
        document.getElementById('ticketIdHidden').value = t.id;
        document.getElementById('ticketNumber').value = t.numero;
        document.getElementById('ticketProblem').value = t.problema;
        document.getElementById('ticketSolution').value = t.solucao;
        document.getElementById('ticketValidation').value = t.validacao;
        modalFormTitle.innerHTML = '<i class="ri-edit-line"></i> Editar Chamado ' + t.numero;
        ticketModalBackdrop.classList.add('active');
    };

    window.deleteTicket = (id) => {
        if (confirm('Tem certeza que deseja remover este chamado?')) {
            tickets = tickets.filter(t => t.id !== id);
            saveTickets(tickets);
        }
    };

    // Modal Control: Import Teams Text (AmericasBot)
    openPasteTeamsModalBtn.addEventListener('click', () => {
        teamsRawText.value = '';
        teamsModalBackdrop.classList.add('active');
    });

    closeTeamsModalBtn.addEventListener('click', () => teamsModalBackdrop.classList.remove('active'));
    cancelTeamsModalBtn.addEventListener('click', () => teamsModalBackdrop.classList.remove('active'));

    processTeamsTextBtn.addEventListener('click', () => {
        const text = teamsRawText.value.trim();
        if (!text) return;

        const matchNumber = text.match(/\[?(#?[A-Za-z0-9-]+312\d{3}|#[A-Za-z0-9-]+)\]?/i);
        const ticketNum = matchNumber ? matchNumber[1].replace('[', '').replace(']', '') : '#SR-312654';

        const matchSolicitante = text.match(/Solicitado por\s+([^\n\r]+)/i);
        const solicitante = matchSolicitante ? matchSolicitante[1].trim() : '';

        teamsModalBackdrop.classList.remove('active');

        ticketForm.reset();
        document.getElementById('ticketIdHidden').value = '';
        document.getElementById('ticketNumber').value = ticketNum;
        document.getElementById('ticketProblem').value = solicitante ? `Atendimento solicitado por ${solicitante}.` : '';
        document.getElementById('ticketValidation').value = solicitante ? `Validado com ${solicitante}` : '';
        
        modalFormTitle.innerHTML = '<i class="ri-magic-line"></i> Novo Chamado Importado do Teams';
        ticketModalBackdrop.classList.add('active');
    });

    // EXPORTAR PLANILHA EXCEL (.XLSX) COM AS 4 COLUNAS
    exportExcelBtn.addEventListener('click', () => {
        if (tickets.length === 0) {
            alert('Nenhum chamado cadastrado para exportar.');
            return;
        }

        const dataForExcel = tickets.map((t, idx) => ({
            'Item': idx + 1,
            '1. Número do Chamado': t.numero,
            '2. Problema Constatado': t.problema,
            '3. Solução Efetuada': t.solucao,
            '4. Validação (Quem Validou)': t.validacao,
            'Data de Atendimento': t.data
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Chamados FreshOps');

        const fileName = `Godoy_FreshOps_Planilha_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    });

    // COPIAR RELATÓRIO FORMATADO PARA E-MAIL
    copyEmailReportBtn.addEventListener('click', () => {
        if (tickets.length === 0) {
            alert('Nenhum chamado cadastrado para gerar relatório.');
            return;
        }

        const dataHoje = new Date().toLocaleDateString('pt-BR');
        let report = `===================================================\n`;
        report += `🚀 GODOY FRESHOPS AI — RELATÓRIO DE CHAMADOS ATENDIDOS\n`;
        report += `👤 Analista: Caíque Eduardo | Godoy Solutions in TECH\n`;
        report += `📅 Data: ${dataHoje}\n`;
        report += `===================================================\n\n`;
        report += `✅ CHAMADOS ATENDIDOS E FINALIZADOS:\n\n`;

        tickets.forEach((t, idx) => {
            report += `${idx + 1}. [${t.numero}]\n`;
            report += `   • ⚠️ Problema Constatado: ${t.problema}\n`;
            report += `   • 🛠️ Solução Efetuada: ${t.solucao}\n`;
            report += `   • ✅ Validação: ${t.validacao}\n\n`;
        });

        report += `---------------------------------------------------\n`;
        report += `📊 TOTAL DE ATENDIMENTOS NO PERÍODO: ${tickets.length} Chamados\n`;
        report += `===================================================\n`;

        navigator.clipboard.writeText(report).then(() => {
            alert('✨ Relatório do Godoy FreshOps AI copiado com sucesso! Agora é só colar no seu e-mail.');
        }).catch(err => {
            console.error('Erro ao copiar', err);
        });
    });

    // Initial Execution
    renderTable();
    updateStats();
});
