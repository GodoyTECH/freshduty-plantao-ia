/**
 * FreshDuty AI — Aplicação Principal de Passagem de Plantão & Gestão de Chamados
 */

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'freshduty_tickets_data';
    const THEME_KEY = 'freshduty_theme_mode';

    // Seed inicial de chamados demonstrativos
    const SEED_TICKETS = [
        {
            id: '1',
            numero: '#SR-312654',
            problema: 'Leitor de código de barras da recepção da UTI desconfigurado, não efetuando leitura de etiquetas de medicação.',
            solucao: 'Realizada reconfiguração dos parâmetros USB do leitor, reiniciado o serviço de impressão e testado com sucesso.',
            validacao: 'Validado em conjunto com Grazielly Nadja (Enfermagem UTI)',
            data: new Date().toLocaleDateString('pt-BR')
        },
        {
            id: '2',
            numero: '#SR-312688',
            problema: 'Impressora de etiquetas do 3º andar travada em fila de impressão (Spooler de impressão indisponível).',
            solucao: 'Executado script de limpeza da pasta PRINTERS e reiniciado serviço Spooler no Windows Server.',
            validacao: 'Validado com Marcos Silva (Supervisão Enfermagem)',
            data: new Date().toLocaleDateString('pt-BR')
        }
    ];

    // Carrega chamados do LocalStorage ou Seed
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

    // Render Stats
    function updateStats() {
        if (statTotalTickets) statTotalTickets.textContent = tickets.length;
        if (statValidatedTickets) {
            const validated = tickets.filter(t => t.validacao && t.validacao.trim().length > 3).length;
            statValidatedTickets.textContent = validated;
        }
    }

    // Render Table
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
                        Nenhum chamado encontrado para este plantão.
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
                        <button class="btn btn-icon" title="Editar Chamado" onclick="editTicket('${t.id}')">
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
        if (confirm('Tem certeza que deseja remover este chamado do plantão?')) {
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

        // Extrai código do chamado (ex: #SR-312654 ou #312654)
        const matchNumber = text.match(/\[?(#?[A-Za-z0-9-]+312\d{3}|#[A-Za-z0-9-]+)\]?/i);
        const ticketNum = matchNumber ? matchNumber[1].replace('[', '').replace(']', '') : '#SR-312654';

        // Extrai solicitante
        const matchSolicitante = text.match(/Solicitado por\s+([^\n\r]+)/i);
        const solicitante = matchSolicitante ? matchSolicitante[1].trim() : '';

        teamsModalBackdrop.classList.remove('active');

        // Preenche automaticamente o formulário para o usuário completar
        ticketForm.reset();
        document.getElementById('ticketIdHidden').value = '';
        document.getElementById('ticketNumber').value = ticketNum;
        document.getElementById('ticketProblem').value = solicitante ? `Atendimento solicitado por ${solicitante}.` : '';
        document.getElementById('ticketValidation').value = solicitante ? `Validado com ${solicitante}` : '';
        
        modalFormTitle.innerHTML = '<i class="ri-magic-line"></i> Novo Chamado Importado do Teams';
        ticketModalBackdrop.classList.add('active');
    });

    // EXPORTAR PLANILHA EXCEL (.XLSX)
    exportExcelBtn.addEventListener('click', () => {
        if (tickets.length === 0) {
            alert('Nenhum chamado no plantão para exportar.');
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
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Passagem de Plantão');

        const fileName = `Passagem_de_Plantao_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    });

    // COPIAR RELATÓRIO FORMATADO PARA E-MAIL DE PLANTÃO
    copyEmailReportBtn.addEventListener('click', () => {
        if (tickets.length === 0) {
            alert('Nenhum chamado para gerar relatório.');
            return;
        }

        const dataHoje = new Date().toLocaleDateString('pt-BR');
        let report = `===================================================\n`;
        report += `🏥 PASSAGEM DE PLANTÃO — SUPORTE TÉCNICO HOSPITALAR\n`;
        report += `👤 Analista: Caíque Eduardo\n`;
        report += `📅 Data: ${dataHoje} | Turno: Diurno (07h às 19h)\n`;
        report += `===================================================\n\n`;
        report += `✅ CHAMADOS ATENDIDOS E FINALIZADOS:\n\n`;

        tickets.forEach((t, idx) => {
            report += `${idx + 1}. [${t.numero}]\n`;
            report += `   • ⚠️ Problema: ${t.problema}\n`;
            report += `   • 🛠️ Solução: ${t.solucao}\n`;
            report += `   • ✅ Validação: ${t.validacao}\n\n`;
        });

        report += `---------------------------------------------------\n`;
        report += `📊 TOTAL DE ATENDIMENTOS NO PLANTÃO: ${tickets.length} Chamados\n`;
        report += `===================================================\n`;

        navigator.clipboard.writeText(report).then(() => {
            alert('✨ Relatório de Passagem de Plantão copiado com sucesso! Agora é só colar no seu e-mail.');
        }).catch(err => {
            console.error('Erro ao copiar', err);
        });
    });

    // Initial Execution
    renderTable();
    updateStats();
});
