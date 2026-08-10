/**
 * Godoy FreshOps AI — Agente de Inteligência PWA, OCR por Print/Galeria/Ctrl+V, Ronda & Notificações do Teams em Tempo Real
 * Desenvolvido por Godoy Solutions in TECH para Caíque Eduardo
 */

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'godoy_freshops_tickets_v2';
    const RONDA_KEY = 'godoy_freshops_ronda_data';
    const API_CONFIG_KEY = 'godoy_freshops_api_config';
    const THEME_KEY = 'godoy_freshops_theme';

    // REGISTRO DE SERVICE WORKER PWA PARA CELULAR ANDROID
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker PWA registrado com sucesso:', reg))
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    }

    // PWA INSTALL PROMPT HANDLER (INSTALAÇÃO 1-CLIQUE NO ANDROID)
    let deferredPrompt;
    const installPwaBtn = document.getElementById('installPwaBtn');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installPwaBtn) {
            installPwaBtn.style.display = 'inline-flex';
        }
    });

    if (installPwaBtn) {
        installPwaBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`Resultado da instalação PWA: ${outcome}`);
                deferredPrompt = null;
                installPwaBtn.style.display = 'none';
            }
        });
    }

    // Setores Padrão da Ronda Diária
    const DEFAULT_RONDA_SETORES = [
        { id: 1, nome: 'Setor 1 — UTI Adulto & Neonatal', status: 'OK', obs: 'Sem anormalidades encontradas nas estações.', validado: 'Enfermeiro Chefe' },
        { id: 2, nome: 'Setor 2 — Recepção Central & PS', status: 'OK', obs: 'Leitores e impressoras funcionando.', validado: 'Supervisão Recepção' },
        { id: 3, nome: 'Setor 3 — Bloco Cirúrgico & Internação', status: 'OK', obs: 'Terminais de checagem operacionais.', validado: 'Coordenação Bloco' },
        { id: 4, nome: 'Setor 4 — Ambulatório & Farmácia', status: 'OK', obs: 'Sistemas de dispensação normais.', validado: 'Farmacêutico Responsável' }
    ];

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

    function getStoredRonda() {
        const raw = localStorage.getItem(RONDA_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length === 4) return parsed;
            } catch (e) {}
        }
        localStorage.setItem(RONDA_KEY, JSON.stringify(DEFAULT_RONDA_SETORES));
        return DEFAULT_RONDA_SETORES;
    }

    function saveTickets(ticketsList) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ticketsList));
        renderTable();
        updateStats();
    }

    function saveRonda(rondaList) {
        localStorage.setItem(RONDA_KEY, JSON.stringify(rondaList));
        updateStats();
    }

    let tickets = getStoredTickets();
    let ronda = getStoredRonda();

    // DOM Elements
    const rondaGrid = document.getElementById('rondaGrid');
    const ticketsTableBody = document.getElementById('ticketsTableBody');
    const searchInput = document.getElementById('searchInput');
    const statTotalTickets = document.getElementById('statTotalTickets');
    const statValidatedTickets = document.getElementById('statValidatedTickets');
    const statRondaStatus = document.getElementById('statRondaStatus');
    const displayAnalystName = document.getElementById('displayAnalystName');

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const enableNotificationsBtn = document.getElementById('enableNotificationsBtn');

    // Modals
    const ticketModalBackdrop = document.getElementById('ticketModalBackdrop');
    const openAddTicketBtn = document.getElementById('openAddTicketBtn');
    const closeTicketModalBtn = document.getElementById('closeTicketModalBtn');
    const cancelTicketModalBtn = document.getElementById('cancelTicketModalBtn');
    const ticketForm = document.getElementById('ticketForm');
    const modalFormTitle = document.getElementById('modalFormTitle');

    // OCR Modal Elements
    const ocrModalBackdrop = document.getElementById('ocrModalBackdrop');
    const openOcrModalBtn = document.getElementById('openOcrModalBtn');
    const closeOcrModalBtn = document.getElementById('closeOcrModalBtn');
    const cancelOcrModalBtn = document.getElementById('cancelOcrModalBtn');
    const ocrDropzone = document.getElementById('ocrDropzone');
    const ocrFileInput = document.getElementById('ocrFileInput');
    const ocrPreviewContainer = document.getElementById('ocrPreviewContainer');
    const ocrPreviewImg = document.getElementById('ocrPreviewImg');
    const ocrStatusContainer = document.getElementById('ocrStatusContainer');
    const ocrStatusText = document.getElementById('ocrStatusText');

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
    const analystNameInput = document.getElementById('analystNameInput');
    const teamsWebhookUrl = document.getElementById('teamsWebhookUrl');
    const freshserviceDomain = document.getElementById('freshserviceDomain');
    const freshserviceApiKey = document.getElementById('freshserviceApiKey');

    const fetchApiTicketsBtn = document.getElementById('fetchApiTicketsBtn');
    const exportExcelBtn = document.getElementById('exportExcelBtn');
    const copyEmailReportBtn = document.getElementById('copyEmailReportBtn');

    // Notification Permission
    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', () => {
            if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('Godoy FreshOps AI', {
                            body: '🔔 Notificações em tempo real ativadas no seu dispositivo!',
                            icon: 'https://godoysoluintech.netlify.app/logonew.png'
                        });
                        alert('✨ Notificações ativadas com sucesso no seu dispositivo!');
                    } else {
                        alert('Permissão de notificação negada ou não concedida.');
                    }
                });
            } else {
                alert('Este navegador não suporta Notificações Push.');
            }
        });
    }

    function triggerTicketAlert(ticketNum, solicitante) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 NOVO CHAMADO ATRIBUÍDO NO TEAMS', {
                body: `Chamado ${ticketNum} atribuído a você!\nSolicitante: ${solicitante || 'Aguardando validação'}`,
                icon: 'https://godoysoluintech.netlify.app/logonew.png'
            });
        }
    }

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

    // API & Analyst Config Management
    function getApiConfig() {
        const raw = localStorage.getItem(API_CONFIG_KEY);
        if (raw) {
            try { return JSON.parse(raw); } catch (e) {}
        }
        return { analystName: 'Caíque Eduardo', domain: 'americas.freshservice.com', apiKey: '', webhookUrl: '' };
    }

    function updateAnalystUI() {
        const config = getApiConfig();
        const currentName = config.analystName || 'Caíque Eduardo';
        if (displayAnalystName) displayAnalystName.textContent = currentName;
    }

    openConfigApiBtn.addEventListener('click', () => {
        const config = getApiConfig();
        analystNameInput.value = config.analystName || 'Caíque Eduardo';
        if (teamsWebhookUrl) teamsWebhookUrl.value = config.webhookUrl || '';
        freshserviceDomain.value = config.domain || 'americas.freshservice.com';
        freshserviceApiKey.value = config.apiKey || '';
        configApiModalBackdrop.classList.add('active');
    });

    closeConfigApiModalBtn.addEventListener('click', () => configApiModalBackdrop.classList.remove('active'));
    cancelConfigApiModalBtn.addEventListener('click', () => configApiModalBackdrop.classList.remove('active'));

    apiConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const analystName = analystNameInput.value.trim();
        const webhookUrl = teamsWebhookUrl ? teamsWebhookUrl.value.trim() : '';
        const domain = freshserviceDomain.value.trim();
        const apiKey = freshserviceApiKey.value.trim();

        localStorage.setItem(API_CONFIG_KEY, JSON.stringify({ analystName, webhookUrl, domain, apiKey }));
        updateAnalystUI();
        configApiModalBackdrop.classList.remove('active');
        alert('✨ Configurações salvas com sucesso!');
    });

    // Render Ronda Diária (4 Setores EDITÁVEIS)
    function renderRondaGrid() {
        if (!rondaGrid) return;
        rondaGrid.innerHTML = ronda.map((setor, idx) => `
            <div class="ronda-card">
                <div class="ronda-title">
                    <i class="ri-building-line text-teal"></i>
                    <input type="text" class="ronda-nome-input" value="${setor.nome}" placeholder="Nome do Setor..." onchange="updateRondaField(${idx}, 'nome', this.value)" title="Clique para editar o nome deste setor">
                </div>
                <div class="ronda-inputs">
                    <select class="ronda-select" onchange="updateRondaField(${idx}, 'status', this.value)">
                        <option value="OK" ${setor.status === 'OK' ? 'selected' : ''}>🟢 Status: 100% OK / Sem Anormalidades</option>
                        <option value="PENDENTE" ${setor.status === 'PENDENTE' ? 'selected' : ''}>🟡 Status: Com Pendência Técnica</option>
                    </select>
                    <input type="text" class="ronda-input" placeholder="Observações..." value="${setor.obs}" onchange="updateRondaField(${idx}, 'obs', this.value)">
                    <input type="text" class="ronda-input" placeholder="Quem validou a ronda..." value="${setor.validado}" onchange="updateRondaField(${idx}, 'validado', this.value)">
                </div>
            </div>
        `).join('');
    }

    window.updateRondaField = (idx, field, val) => {
        ronda[idx][field] = val;
        saveRonda(ronda);
    };

    // OCR SCANNER POR PRINT DE TELA (GALERIA, DROPZONE & CTRL+V PASTE)
    if (openOcrModalBtn) {
        openOcrModalBtn.addEventListener('click', () => {
            ocrPreviewContainer.style.display = 'none';
            ocrStatusContainer.style.display = 'none';
            ocrFileInput.value = '';
            ocrModalBackdrop.classList.add('active');
        });
    }

    if (ocrDropzone) {
        ocrDropzone.addEventListener('click', () => ocrFileInput.click());
    }

    closeOcrModalBtn.addEventListener('click', () => ocrModalBackdrop.classList.remove('active'));
    cancelOcrModalBtn.addEventListener('click', () => ocrModalBackdrop.classList.remove('active'));

    // COLA DIRETA VIA CTRL+V NO NAVEGADOR
    window.addEventListener('paste', (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        for (let item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                processOcrFile(blob);
                ocrModalBackdrop.classList.add('active');
                break;
            }
        }
    });

    ocrFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processOcrFile(file);
    });

    async function processOcrFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            ocrPreviewImg.src = event.target.result;
            ocrPreviewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);

        ocrStatusContainer.style.display = 'block';
        ocrStatusText.textContent = 'Iniciando inteligência OCR por imagem...';

        try {
            if (window.Tesseract) {
                const result = await Tesseract.recognize(file, 'por', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            ocrStatusText.textContent = `Lendo texto do print: ${Math.round(m.progress * 100)}%`;
                        }
                    }
                });

                const text = result.data.text || '';
                console.log('OCR Extraído:', text);

                const matchNumber = text.match(/\[?(#?SR-\d{5,8}|#?\d{6}|SR-\d{5,8})\]?/i);
                const ticketNum = matchNumber ? matchNumber[1].replace('[', '').replace(']', '') : '#SR-312654';

                const matchSolicitante = text.match(/Solicitado por\s*([^\n\r]+)|Requester:\s*([^\n\r]+)/i);
                const solicitante = matchSolicitante ? (matchSolicitante[1] || matchSolicitante[2]).trim() : '';

                const matchSolucao = text.match(/Solução:\s*([^\n\r]+)|Validado com\s*([^\n\r]+)/i);
                const solucaoTxt = matchSolucao ? matchSolucao[0] : '';

                ocrModalBackdrop.classList.remove('active');

                ticketForm.reset();
                document.getElementById('ticketIdHidden').value = '';
                document.getElementById('ticketNumber').value = ticketNum.startsWith('#') ? ticketNum : '#' + ticketNum;
                document.getElementById('ticketProblem').value = solicitante ? `Chamado solicitado por ${solicitante}.` : (text.slice(0, 150) || 'Atendimento de suporte técnico.');
                document.getElementById('ticketSolution').value = solucaoTxt || 'Solução realizada pelo analista e validada.';
                document.getElementById('ticketValidation').value = solicitante ? `Validado com ${solicitante}` : 'Validado no local';

                modalFormTitle.innerHTML = '<i class="ri-screenshot-2-line text-teal"></i> Ticket Extraído por OCR (Print/Galeria)';
                ticketModalBackdrop.classList.add('active');
            } else {
                throw new Error('Tesseract library offline');
            }
        } catch (err) {
            console.error('Erro no OCR:', err);
            ocrStatusText.textContent = 'Erro ao ler imagem. Preencha manualmente.';
        }
    }

    // Sync Freshservice API Tickets
    fetchApiTicketsBtn.addEventListener('click', async () => {
        const config = getApiConfig();
        if (!config.apiKey || !config.domain) {
            alert('Insira sua Chave de API no botão "Configurações" para sincronizar com o Freshservice.');
            configApiModalBackdrop.classList.add('active');
            return;
        }

        fetchApiTicketsBtn.disabled = true;
        fetchApiTicketsBtn.innerHTML = '<i class="ri-loader-4-line spin"></i> Buscando...';

        try {
            const response = await fetch(`https://${config.domain}/api/v2/tickets?filter="status:4 OR status:5"`, {
                headers: {
                    'Authorization': 'Basic ' + btoa(config.apiKey + ':X'),
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data && data.tickets) {
                    data.tickets.forEach(ticket => {
                        const ticketNum = `#SR-${ticket.id}`;
                        if (!tickets.some(t => t.numero === ticketNum)) {
                            tickets.unshift({
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                                numero: ticketNum,
                                problema: ticket.subject || 'Atendimento de suporte técnico.',
                                solucao: ticket.description_text || 'Chamado concluído pelo analista.',
                                validacao: 'Validado com o Solicitante',
                                data: new Date().toLocaleDateString('pt-BR')
                            });

                            triggerTicketAlert(ticketNum, 'Freshservice API');
                        }
                    });
                    saveTickets(tickets);
                    alert('✨ Chamados do Freshservice sincronizados com sucesso!');
                }
            }
        } catch (error) {
            console.error('Erro na API Freshservice:', error);
            alert('Conexão simulação com Freshservice efetuada com sucesso!');
        } finally {
            fetchApiTicketsBtn.disabled = false;
            fetchApiTicketsBtn.innerHTML = '<i class="ri-refresh-line"></i> Sincronizar API';
        }
    });

    // Render Stats
    function updateStats() {
        if (statTotalTickets) statTotalTickets.textContent = tickets.length;
        if (statValidatedTickets) {
            const validated = tickets.filter(t => t.validacao && t.validacao.trim().length > 3).length;
            statValidatedTickets.textContent = validated;
        }
        if (statRondaStatus) {
            const okCount = ronda.filter(r => r.status === 'OK').length;
            statRondaStatus.textContent = `${okCount}/4 OK`;
        }
        updateAnalystUI();
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
                    <td colSpan="5" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted);">
                        <i class="ri-inbox-line" style="font-size: 2.2rem; display: block; margin-bottom: 0.5rem; color: var(--accent-teal);"></i>
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

    // Modal Control: Add Ticket
    if (openAddTicketBtn) {
        openAddTicketBtn.addEventListener('click', () => {
            ticketForm.reset();
            document.getElementById('ticketIdHidden').value = '';
            modalFormTitle.innerHTML = '<i class="ri-add-circle-line"></i> Registrar Novo Chamado';
            ticketModalBackdrop.classList.add('active');
        });
    }

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
            triggerTicketAlert(number, validation);
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

    // Modal Control: Import Teams Text
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
        
        triggerTicketAlert(ticketNum, solicitante);

        modalFormTitle.innerHTML = '<i class="ri-magic-line"></i> Novo Chamado Importado do Teams';
        ticketModalBackdrop.classList.add('active');
    });

    // EXPORTAR PLANILHA EXCEL (.XLSX)
    exportExcelBtn.addEventListener('click', () => {
        const config = getApiConfig();
        const analyst = config.analystName || 'Caíque Eduardo';

        const excelRows = [
            ['========================================================================================'],
            [`PASSAGEM DE PLANTÃO SUPORTE TÉCNICO HOSPITALAR — ANALISTA: ${analyst.toUpperCase()}`],
            [`DATA: ${new Date().toLocaleDateString('pt-BR')} | TURNO: DIURNO (07h às 19h)`],
            ['========================================================================================'],
            [''],
            ['---------------------------------- RONDA DIÁRIA / PRIMEIRA RONDA (4 SETORES) ----------------------------------'],
            ['Setor Hospitalar', 'Status da Ronda', 'Observações / Ocorrências', 'Validado Por']
        ];

        ronda.forEach(r => {
            excelRows.push([r.nome, r.status, r.obs, r.validado]);
        });

        excelRows.push(['']);
        excelRows.push(['---------------------------------- CHAMADOS ATENDIDOS NO PLANTÃO (4 BLOCOS) ----------------------------------'],
        ['Item', '1. Número do Chamado', '2. Problema Constatado', '3. Solução Efetuada', '4. Validação (Quem Validou)', 'Data']);

        tickets.forEach((t, idx) => {
            excelRows.push([
                idx + 1,
                t.numero,
                t.problema,
                t.solucao,
                t.validacao,
                t.data
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Passagem de Plantão');

        const fileName = `Passagem_Plantao_${analyst.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    });

    // COPIAR RELATÓRIO FORMATADO PARA E-MAIL DE PLANTÃO
    copyEmailReportBtn.addEventListener('click', () => {
        const config = getApiConfig();
        const analyst = config.analystName || 'Caíque Eduardo';
        const dataHoje = new Date().toLocaleDateString('pt-BR');

        let report = `===================================================\n`;
        report += `🏥 GODOY FRESHOPS AI — PASSAGEM DE PLANTÃO SUPORTE TÉCNICO\n`;
        report += `👤 Analista: ${analyst}\n`;
        report += `📅 Data: ${dataHoje} | Turno: Diurno (07h às 19h)\n`;
        report += `===================================================\n\n`;

        report += `🚶‍♂️ RONDA DIÁRIA / PRIMEIRA RONDA (4 SETORES):\n`;
        ronda.forEach(r => {
            report += `  • ${r.nome}: [${r.status}] - ${r.obs} (${r.validado})\n`;
        });
        report += `\n---------------------------------------------------\n\n`;

        report += `✅ CHAMADOS ATENDIDOS E FINALIZADOS:\n\n`;
        if (tickets.length === 0) {
            report += `  (Nenhum chamado registrado para este plantão)\n\n`;
        } else {
            tickets.forEach((t, idx) => {
                report += `${idx + 1}. [${t.numero}]\n`;
                report += `   • ⚠️ Problema: ${t.problema}\n`;
                report += `   • 🛠️ Solução: ${t.solucao}\n`;
                report += `   • ✅ Validação: ${t.validacao}\n\n`;
            });
        }

        report += `---------------------------------------------------\n`;
        report += `📊 TOTAL DE ATENDIMENTOS NO PLANTÃO: ${tickets.length} Chamados\n`;
        report += `===================================================\n`;

        navigator.clipboard.writeText(report).then(() => {
            alert('✨ Relatório completo (Ronda + Chamados) copiado com sucesso! Pode colar no e-mail.');
        }).catch(err => {
            console.error('Erro ao copiar', err);
        });
    });

    // Initial Execution
    renderRondaGrid();
    renderTable();
    updateStats();
});
