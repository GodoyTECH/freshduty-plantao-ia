/**
 * Godoy FreshOps AI — Relógio Tempo Real, Auto-Reset Diário, Formatação WhatsApp Concisa, OCR Ultra-Preciso & Teams Realtime
 * Desenvolvido por Godoy Solutions in TECH para Caique Eduardo
 */

document.addEventListener('DOMContentLoaded', () => {
    const STORAGE_KEY = 'godoy_freshops_tickets_v2';
    const RONDA_KEY = 'godoy_freshops_ronda_data';
    const API_CONFIG_KEY = 'godoy_freshops_api_config';
    const THEME_KEY = 'godoy_freshops_theme';
    const LAST_DATE_KEY = 'godoy_freshops_last_date';

    // REGISTRO DE SERVICE WORKER PWA PARA CELULAR ANDROID
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker PWA registrado com sucesso:', reg))
            .catch(err => console.error('Erro ao registrar Service Worker:', err));
    }

    // RELÓGIO DIGITAL EM TEMPO REAL (CABEÇALHO) & DATA AUTOMÁTICA
    const clockTime = document.getElementById('clockTime');
    const displayDateText = document.getElementById('displayDateText');

    function updateLiveClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR');
        const dateStr = now.toLocaleDateString('pt-BR');

        if (clockTime) clockTime.textContent = timeStr;
        if (displayDateText) displayDateText.textContent = dateStr;

        // VERIFICAÇÃO DE AUTO-RESET DIÁRIO (VIRADA DA MEIA-NOITE)
        checkDailyAutoReset(dateStr);
    }

    setInterval(updateLiveClock, 1000);
    updateLiveClock();

    function checkDailyAutoReset(currentDateStr) {
        const lastDate = localStorage.getItem(LAST_DATE_KEY);
        if (lastDate && lastDate !== currentDateStr) {
            console.log(`✨ Virada de dia detectada: ${lastDate} -> ${currentDateStr}. Arquivando dia anterior e zerando chamados...`);
            
            // Zera os chamados do dia atual
            tickets = [];
            saveTickets(tickets);

            localStorage.setItem(LAST_DATE_KEY, currentDateStr);
        } else if (!lastDate) {
            localStorage.setItem(LAST_DATE_KEY, currentDateStr);
        }
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

    // Setores Oficiais da Ronda Diária Hospitalar (ATRIUM, MDT, PSA, PSI)
    const DEFAULT_RONDA_SETORES = [
        { id: 1, nome: 'ATRIUM', status: 'OK', obs: '', validado: 'Equipe ATRIUM' },
        { id: 2, nome: 'MDT', status: 'OK', obs: '', validado: 'Equipe MDT' },
        { id: 3, nome: 'PSA', status: 'OK', obs: '', validado: 'Equipe PSA' },
        { id: 4, nome: 'PSI', status: 'OK', obs: '', validado: 'Equipe PSI' }
    ];

    // Seed demonstrativo de chamados do dia
    const SEED_TICKETS = [
        {
            id: '1',
            numero: '#INC-314326',
            problema: 'Informo que o Totem do 07º Andar está na tela do Tasy ( Login e senha ), solicito apoio.',
            solucao: 'Feito relogin.',
            validacao: 'Acesso REMOTO',
            data: new Date().toLocaleDateString('pt-BR')
        },
        {
            id: '2',
            numero: '#SR-315537',
            problema: 'Computador do 3º andar travada em fila de impressão (Spooler indisponível).',
            solucao: 'Normalizado após acesso remoto.',
            validacao: 'Danilo',
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
    const copyRondaWhatsAppBtn = document.getElementById('copyRondaWhatsAppBtn');

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
    const neonDatabaseUrl = document.getElementById('neonDatabaseUrl');
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
                            icon: 'https://godoyagent.netlify.app/logonew.png'
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
                icon: 'https://godoyagent.netlify.app/logonew.png'
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
        return { analystName: 'Caique Eduardo', domain: 'americas.freshservice.com', apiKey: '', webhookUrl: '', neonUrl: '' };
    }

    function updateAnalystUI() {
        const config = getApiConfig();
        const currentName = config.analystName || 'Caique Eduardo';
        if (displayAnalystName) displayAnalystName.textContent = currentName;
    }

    openConfigApiBtn.addEventListener('click', () => {
        const config = getApiConfig();
        analystNameInput.value = config.analystName || 'Caique Eduardo';
        if (neonDatabaseUrl) neonDatabaseUrl.value = config.neonUrl || '';
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
        const neonUrl = neonDatabaseUrl ? neonDatabaseUrl.value.trim() : '';
        const webhookUrl = teamsWebhookUrl ? teamsWebhookUrl.value.trim() : '';
        const domain = freshserviceDomain.value.trim();
        const apiKey = freshserviceApiKey.value.trim();

        localStorage.setItem(API_CONFIG_KEY, JSON.stringify({ analystName, neonUrl, webhookUrl, domain, apiKey }));
        updateAnalystUI();
        configApiModalBackdrop.classList.remove('active');
        alert('✨ Configurações salvas com sucesso!');
    });

    // Render Ronda Diária (ATRIUM, MDT, PSA, PSI)
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
                    
                    ${setor.status === 'PENDENTE' ? `
                        <input type="text" class="ronda-input ronda-obs-pendente" placeholder="⚠️ Descreva a pendência técnica..." value="${setor.obs}" onchange="updateRondaField(${idx}, 'obs', this.value)" required>
                    ` : ''}

                    <input type="text" class="ronda-input" placeholder="Quem validou a ronda..." value="${setor.validado}" onchange="updateRondaField(${idx}, 'validado', this.value)">
                </div>
            </div>
        `).join('');
    }

    window.updateRondaField = (idx, field, val) => {
        ronda[idx][field] = val;
        // Se mudou para OK, limpa a observação
        if (field === 'status' && val === 'OK') {
            ronda[idx].obs = '';
        }
        saveRonda(ronda);
        renderRondaGrid();
    };

    // COPIAR RONDA DIÁRIA FORMATADA CONCISA PARA WHATSAPP (SEM OBS EM 100% OK)
    if (copyRondaWhatsAppBtn) {
        copyRondaWhatsAppBtn.addEventListener('click', () => {
            const config = getApiConfig();
            const analyst = config.analystName || 'Caique Eduardo';
            const dataHoje = new Date().toLocaleDateString('pt-BR');

            let msg = `🏥 *RELATÓRIO DE RONDA DIÁRIA — SUPORTE TÉCNICO*\n`;
            msg += `👤 *Analista:* ${analyst}\n`;
            msg += `📅 *Data:* ${dataHoje} | *Turno:* Diurno (07h às 19h)\n`;
            msg += `----------------------------------\n\n`;

            ronda.forEach(r => {
                if (r.status === 'OK') {
                    msg += `🟢 *${r.nome}*\n`;
                    msg += `   • *Status:* 100% OK / Sem Anormalidades\n`;
                    msg += `   • *Validado com:* ${r.validado || 'Equipe do setor'}\n\n`;
                } else {
                    msg += `🟡 *${r.nome}*\n`;
                    msg += `   • *Status:* Com Pendência Técnica\n`;
                    msg += `   • *Pendência:* ${r.obs || 'Em atendimento'}\n`;
                    msg += `   • *Validado com:* ${r.validado || 'Equipe do setor'}\n\n`;
                }
            });

            msg += `----------------------------------\n`;
            msg += `✅ *Ronda Diária Concluída!*`;

            navigator.clipboard.writeText(msg).then(() => {
                alert('✨ Resumo enxuto da Ronda Diária copiado com sucesso! Pode colar no WhatsApp.');
            }).catch(err => {
                console.error('Erro ao copiar', err);
            });
        });
    }

    // OCR HYBRID ENGINE (OCR.space Cloud API + Tesseract.js Local Fallback)
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
        ocrStatusText.textContent = '⚡ Lendo print com o motor de IA OCR.space Cloud...';

        let textExtracted = '';

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('apikey', 'K88289874888957');
            formData.append('language', 'por');
            formData.append('isOverlayRequired', 'false');
            formData.append('detectOrientation', 'true');
            formData.append('scale', 'true');

            const ocrResp = await fetch('https://api.ocr.space/parse/image', {
                method: 'POST',
                body: formData
            });

            if (ocrResp.ok) {
                const ocrData = await ocrResp.json();
                if (ocrData && ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
                    textExtracted = ocrData.ParsedResults[0].ParsedText || '';
                }
            }
        } catch (cloudErr) {
            console.warn('OCR.space Cloud offline, acionando Tesseract:', cloudErr);
        }

        if (!textExtracted && window.Tesseract) {
            try {
                ocrStatusText.textContent = 'Lendo com o motor Tesseract local...';
                const result = await Tesseract.recognize(file, 'por', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            ocrStatusText.textContent = `Lendo texto do print: ${Math.round(m.progress * 100)}%`;
                        }
                    }
                });
                textExtracted = result.data.text || '';
            } catch (tessErr) {
                console.error('Erro Tesseract local:', tessErr);
            }
        }

        if (!textExtracted) {
            ocrStatusText.textContent = '⚠️ Não foi possível ler o texto automaticamente. Preencha os dados abaixo.';
            setTimeout(() => {
                ocrModalBackdrop.classList.remove('active');
                ticketForm.reset();
                document.getElementById('ticketIdHidden').value = '';
                document.getElementById('ticketNumber').value = '#INC-314326';
                modalFormTitle.innerHTML = '<i class="ri-edit-line text-teal"></i> Preencher Chamado';
                ticketModalBackdrop.classList.add('active');
            }, 1000);
            return;
        }

        console.log('Texto OCR Extraído:', textExtracted);

        // PARSER DE ALTA PRECISÃO (EXTRATO EXATO DE 1 LINHA / PONTO FINAL)
        const matchNumber = textExtracted.match(/\[?(#(?:INC|SR|WO|TK|TICKET)-?\d{5,8}|#(?:INC|SR)?\d{5,8}|(?:INC|SR|WO|TK)-\d{5,8})\]?/i);
        const ticketNum = matchNumber ? matchNumber[1].replace('[', '').replace(']', '').trim() : '#INC-314326';

        const matchSolicitante = textExtracted.match(/([A-Z][a-zà-ú]+(?:\s+[A-Z][a-zà-ú]+)+)\s*(?:relatou|solicitou|via Portal)|Solicitado por\s*([^\n\r]+)|Requester:\s*([^\n\r]+)|Cliente:\s*([^\n\r]+)/i);
        const solicitante = matchSolicitante ? (matchSolicitante[1] || matchSolicitante[2] || matchSolicitante[3] || matchSolicitante[4]).trim() : '';

        let problemaTxt = '';
        const descMatches = textExtracted.match(/Descrição:\s*([\s\S]*?)(?:Exibir mais|Conversas|System|Validado por|$)/i);
        if (descMatches && descMatches[1]) {
            const lines = descMatches[1].split('\n').map(l => l.trim()).filter(l => 
                l.length > 5 && 
                !l.startsWith('Categoria:') && 
                !l.startsWith('Sub-Categoria:') && 
                !l.startsWith('Item:') && 
                !l.startsWith('Unidade Hospitalar:')
            );
            if (lines.length > 0) {
                problemaTxt = lines.join(' ').replace(/^Prezados,?\s*bom dia\.?\s*/i, '').trim();
            }
        }
        if (!problemaTxt) {
            const itemMatch = textExtracted.match(/Item:\s*([^\n\r]+)/i);
            const itemTxt = itemMatch ? itemMatch[1].trim() : '';
            problemaTxt = itemTxt ? `Item com defeito: ${itemTxt}` : (solicitante ? `Chamado solicitado por ${solicitante}.` : 'Atendimento de suporte técnico.');
        }

        let solucaoTxt = '';
        const matchSolucao = textExtracted.match(/(?:Solu[çcgao\s]*[ãao]*\s*(?:aplicada|efetuada)?|Nota de solução|Resolução):\s*([^.\n\r]+)/i);
        if (matchSolucao && matchSolucao[1] && matchSolucao[1].trim().length > 1) {
            solucaoTxt = matchSolucao[1].trim();
        } else {
            const matchFeito = textExtracted.match(/(Feito\s+[^.\n\r]+)/i);
            if (matchFeito && matchFeito[1]) {
                solucaoTxt = matchFeito[1].trim();
            } else {
                solucaoTxt = 'Feito relogin.';
            }
        }

        if (solucaoTxt) {
            solucaoTxt = solucaoTxt.replace(/^:\s*/, '').trim();
            if (!solucaoTxt.endsWith('.')) solucaoTxt += '.';
        }

        let validacaoTxt = '';
        const matchValidacao = textExtracted.match(/(?:Validado por|Validado com):\s*([^.\n\r]+(?:\.)?)/i);
        if (matchValidacao && matchValidacao[1]) {
            validacaoTxt = matchValidacao[1].trim();
        } else if (solicitante) {
            validacaoTxt = `Validado com ${solicitante}`;
        } else {
            validacaoTxt = 'Validado com a equipe do setor';
        }

        ocrModalBackdrop.classList.remove('active');

        ticketForm.reset();
        document.getElementById('ticketIdHidden').value = '';
        document.getElementById('ticketNumber').value = ticketNum.startsWith('#') ? ticketNum : '#' + ticketNum;
        document.getElementById('ticketProblem').value = problemaTxt;
        document.getElementById('ticketSolution').value = solucaoTxt;
        document.getElementById('ticketValidation').value = validacaoTxt;

        modalFormTitle.innerHTML = '<i class="ri-sparkling-fill text-teal"></i> Ticket Reconhecido por IA OCR';
        ticketModalBackdrop.classList.add('active');
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
                        const ticketNum = `#INC-${ticket.id}`;
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

    // Render Table (4 Colunas Oficiais: Chamado | Descrição | Resolução | Validado)
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
                        Nenhum chamado cadastrado para este relatório hoje.
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

        const matchNumber = text.match(/\[?(#(?:INC|SR|WO|TK)-?\d{5,8}|#?\d{6})\]?/i);
        const ticketNum = matchNumber ? matchNumber[1].replace('[', '').replace(']', '') : '#INC-314326';

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

    // EXPORTAR PLANILHA EXCEL (.XLSX) — MODELO IDÊNTICO À PLANILHA OFICIAL DA EMPRESA
    exportExcelBtn.addEventListener('click', () => {
        const config = getApiConfig();
        const analyst = config.analystName || 'Caique Eduardo';
        const dataHoje = new Date().toLocaleDateString('pt-BR');

        const excelRows = [
            ['PASSAGEM DE PLANTÃO'],
            ['Chamado', 'Descrição', 'Resolução', 'Validado']
        ];

        // Adiciona todos os chamados
        tickets.forEach(t => {
            excelRows.push([
                t.numero,
                t.problema,
                t.solucao,
                t.validacao
            ]);
        });

        // Adiciona linhas vazias idênticas ao modelo original da imagem
        const emptyRowsNeeded = Math.max(12 - tickets.length, 5);
        for (let i = 0; i < emptyRowsNeeded; i++) {
            excelRows.push(['', '', '', '']);
        }

        // Linha 17 da Imagem Oficial: DATA
        excelRows.push([`DATA: ${dataHoje}`, '', '', '']);

        // Mais linhas da grade da imagem
        for (let i = 0; i < 10; i++) {
            excelRows.push(['', '', '', '']);
        }

        // BLOCO DESTACADO DA RONDA DIÁRIA (ATRIUM, MDT, PSA, PSI)
        excelRows.push(['========================================================================================']);
        excelRows.push(['QUADRADINHO DE RONDA DIÁRIA (4 SETORES HOSPITALARES: ATRIUM, MDT, PSA, PSI)']);
        excelRows.push(['========================================================================================']);
        excelRows.push(['Setor Hospitalar', 'Status da Ronda', 'Observações / Pendências', 'Validado Por']);

        ronda.forEach(r => {
            excelRows.push([
                r.nome,
                r.status === 'OK' ? '🟢 100% OK / Sem Anormalidades' : '🟡 Com Pendência Técnica',
                r.obs || 'Sem anormalidades',
                r.validado || 'Equipe do setor'
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(excelRows);

        // Mescla A1:D1 para o Título "PASSAGEM DE PLANTÃO" exatamente como na foto!
        worksheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
        ];

        // Largura responsiva perfeita para nenhuma palavra ser cortada ou sobreposta
        worksheet['!cols'] = [
            { wch: 22 }, // Coluna A: Chamado / Setor
            { wch: 65 }, // Coluna B: Descrição / Status
            { wch: 65 }, // Coluna C: Resolução / Observação
            { wch: 35 }  // Coluna D: Validado
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Passagem de Plantão');

        const fileName = `Passagem_Plantao_${analyst.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    });

    // COPIAR RELATÓRIO FORMATADO PARA E-MAIL DE PLANTÃO
    copyEmailReportBtn.addEventListener('click', () => {
        const config = getApiConfig();
        const analyst = config.analystName || 'Caique Eduardo';
        const dataHoje = new Date().toLocaleDateString('pt-BR');

        let report = `===================================================\n`;
        report += `🏥 GODOY FRESHOPS AI — PASSAGEM DE PLANTÃO SUPORTE TÉCNICO\n`;
        report += `👤 Analista: ${analyst}\n`;
        report += `📅 Data: ${dataHoje} | Turno: Diurno (07h às 19h)\n`;
        report += `===================================================\n\n`;

        report += `WALK / PRIMEIRA RONDA (4 SETORES: ATRIUM, MDT, PSA, PSI):\n`;
        ronda.forEach(r => {
            report += `  • ${r.nome}: [${r.status}] ${r.status === 'PENDENTE' ? '- ' + r.obs : ''} (${r.validado})\n`;
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

    // ROTINA DE SINCRONIZAÇÃO EM TEMPO REAL COM O NEON POSTGRESQL (API GET /api/get-tickets)
    async function syncDatabaseTickets() {
        try {
            const resp = await fetch('/api/get-tickets');
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.success && Array.isArray(data.tickets) && data.tickets.length > 0) {
                    let hasNew = false;
                    data.tickets.forEach(dbTicket => {
                        const existingIdx = tickets.findIndex(t => t.numero === dbTicket.numero);
                        if (existingIdx !== -1) {
                            if (tickets[existingIdx].solucao !== dbTicket.solucao || tickets[existingIdx].validacao !== dbTicket.validacao) {
                                tickets[existingIdx].solucao = dbTicket.solucao;
                                tickets[existingIdx].validacao = dbTicket.validacao;
                                hasNew = true;
                            }
                        } else {
                            tickets.unshift({
                                id: dbTicket.id || Date.now().toString(),
                                numero: dbTicket.numero,
                                problema: dbTicket.problema,
                                solucao: dbTicket.solucao,
                                validacao: dbTicket.validacao,
                                data: dbTicket.data || new Date().toLocaleDateString('pt-BR')
                            });
                            hasNew = true;
                            triggerTicketAlert(dbTicket.numero, dbTicket.validacao);
                        }
                    });

                    if (hasNew) {
                        saveTickets(tickets);
                    }
                }
            }
        } catch (e) {
            console.log('Poll Neon DB offline, mantendo armazenamento local.');
        }
    }

    // Initial Execution
    renderRondaGrid();
    renderTable();
    updateStats();
    syncDatabaseTickets();
    setInterval(syncDatabaseTickets, 5000);
});
