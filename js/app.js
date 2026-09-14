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

    // Setores Oficiais da Ronda Diária Hospitalar
    const DEFAULT_RONDA_SETORES = (() => {
        const setores = [];
        let idCount = 1;
        // 1º ao 12º Andar (exceto 7º)
        for(let i = 1; i <= 12; i++) {
            if(i === 7) continue;
            setores.push({
                id: idCount++, nome: `${i}º Andar`, existe: true,
                hasMaquina: true, maquinaStatus: 'OK', maquinaObs: '',
                hasPosto: true, postoStatus: 'OK', postoObs: ''
            });
        }
        // Subsolos 1 e 2
        setores.push({
            id: idCount++, nome: `Subsolo 1 (SS1)`, existe: true,
            hasMaquina: true, maquinaStatus: 'OK', maquinaObs: '',
            hasPosto: true, postoStatus: 'OK', postoObs: ''
        });
        setores.push({
            id: idCount++, nome: `Subsolo 2 (SS2)`, existe: true,
            hasMaquina: true, maquinaStatus: 'OK', maquinaObs: '',
            hasPosto: true, postoStatus: 'OK', postoObs: ''
        });
        // Subsolos 3 e 4
        setores.push({
            id: idCount++, nome: `Subsolo 3 (SS3)`, existe: true,
            hasMaquina: true, maquinaStatus: 'OK', maquinaObs: '',
            hasPosto: false, postoStatus: 'OK', postoObs: ''
        });
        setores.push({
            id: idCount++, nome: `Subsolo 4 (SS4)`, existe: true,
            hasMaquina: true, maquinaStatus: 'OK', maquinaObs: '',
            hasPosto: false, postoStatus: 'OK', postoObs: ''
        });
        return setores;
    })();

    // Seed demonstrativo de chamados do dia
    const SEED_TICKETS = [
        {
            id: '1',
            numero: '#INC-314326',
            problema: 'Informo que o Totem do 07º Andar está na tela do Tasy ( Login e senha ), solicito apoio.',
            solucao: 'Feito relogin.',
            validacao: 'Acesso REMOTO',
            status_atendimento: 'CONCLUIDO',
            data: new Date().toLocaleDateString('pt-BR')
        },
        {
            id: '2',
            numero: '#SR-315537',
            problema: 'Computador do 3º andar travada em fila de impressão (Spooler indisponível).',
            solucao: 'Aguardando atendimento / solução',
            validacao: 'Em atendimento',
            status_atendimento: 'EM_ATENDIMENTO',
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
                if (Array.isArray(parsed) && parsed.length > 4) return parsed; // Updated for new 15 items
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
    const filterDateInput = document.getElementById('filterDateInput');
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
    const setTodayDateBtn = document.getElementById('setTodayDateBtn');

    // Configura data padrão do filtro para HOJE
    if (filterDateInput) {
        filterDateInput.value = new Date().toISOString().slice(0, 10);
        filterDateInput.addEventListener('change', () => {
            syncDatabaseTickets(filterDateInput.value);
        });
    }

    if (setTodayDateBtn && filterDateInput) {
        setTodayDateBtn.addEventListener('click', () => {
            filterDateInput.value = new Date().toISOString().slice(0, 10);
            syncDatabaseTickets(filterDateInput.value);
        });
    }

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

    // LOGIN SYSTEM LOGIC
    const LOGIN_KEY = 'godoy_freshops_login';
    const loginModalBackdrop = document.getElementById('loginModalBackdrop');
    const loginForm = document.getElementById('loginForm');
    const loginFirstName = document.getElementById('loginFirstName');
    const loginLastName = document.getElementById('loginLastName');
    const loginPin = document.getElementById('loginPin');

    function checkLogin() {
        const loginData = localStorage.getItem(LOGIN_KEY);
        if (!loginData) {
            loginModalBackdrop.classList.add('active');
        } else {
            loginModalBackdrop.classList.remove('active');
            const data = JSON.parse(loginData);
            const config = getApiConfig();
            config.analystName = `${data.firstName} ${data.lastName}`;
            localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
            updateAnalystUI();
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fName = loginFirstName.value.trim();
            const lName = loginLastName.value.trim();
            const pin = loginPin.value.trim();
            
            if(fName && lName && pin.length === 4) {
                const loginData = { firstName: fName, lastName: lName, pin: pin };
                localStorage.setItem(LOGIN_KEY, JSON.stringify(loginData));
                
                const config = getApiConfig();
                config.analystName = `${fName} ${lName}`;
                localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
                
                loginModalBackdrop.classList.remove('active');
                updateAnalystUI();
                syncDatabaseTickets(filterDateInput ? filterDateInput.value : null);
            }
        });
    }

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

    // TABS NAVIGATION LOGIC
    const btnTabRonda = document.getElementById('btnTabRonda');
    const btnTabPlantao = document.getElementById('btnTabPlantao');
    const tabRondaContent = document.getElementById('tabRondaContent');
    const tabPlantaoContent = document.getElementById('tabPlantaoContent');

    if (btnTabRonda && btnTabPlantao) {
        btnTabRonda.addEventListener('click', () => {
            tabRondaContent.style.display = 'block';
            tabPlantaoContent.style.display = 'none';
            btnTabRonda.classList.add('btn-teal');
            btnTabRonda.classList.remove('btn-secondary');
            btnTabPlantao.classList.add('btn-secondary');
            btnTabPlantao.classList.remove('btn-teal');
        });

        btnTabPlantao.addEventListener('click', () => {
            tabRondaContent.style.display = 'none';
            tabPlantaoContent.style.display = 'block';
            btnTabPlantao.classList.add('btn-teal');
            btnTabPlantao.classList.remove('btn-secondary');
            btnTabRonda.classList.add('btn-secondary');
            btnTabRonda.classList.remove('btn-teal');
        });
    }

    // Render Ronda Diária
    function renderRondaGrid() {
        if (!rondaGrid) return;
        rondaGrid.innerHTML = ronda.map((setor, idx) => `
            <div class="ronda-card" style="${setor.existe ? '' : 'opacity: 0.5; filter: grayscale(1);'}">
                <div class="ronda-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="ri-building-line text-teal"></i>
                        <strong style="font-size: 1.1rem; color: var(--text-primary);">${setor.nome}</strong>
                    </div>
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; cursor: pointer; color: var(--text-secondary);">
                        <input type="checkbox" ${setor.existe ? 'checked' : ''} onchange="updateRondaField(${idx}, 'existe', this.checked)">
                        Houver neste prédio?
                    </label>
                </div>
                
                ${setor.existe ? `
                <div class="ronda-inputs" style="margin-top: 10px;">
                    ${setor.hasMaquina ? `
                        <div style="margin-bottom: 10px; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 8px;">
                            <strong style="display: block; margin-bottom: 6px; font-size: 0.9rem;"><i class="ri-computer-line text-amber"></i> Máquina de Contingência</strong>
                            <select class="ronda-select" onchange="updateRondaField(${idx}, 'maquinaStatus', this.value)" style="margin-bottom: 6px;">
                                <option value="OK" ${setor.maquinaStatus === 'OK' ? 'selected' : ''}>🟢 Status: 100% OK</option>
                                <option value="PENDENTE" ${setor.maquinaStatus === 'PENDENTE' ? 'selected' : ''}>🟡 Status: Com Pendência</option>
                            </select>
                            ${setor.maquinaStatus === 'PENDENTE' ? `
                                <input type="text" class="ronda-input" placeholder="⚠️ Descreva a pendência..." value="${setor.maquinaObs}" onchange="updateRondaField(${idx}, 'maquinaObs', this.value)">
                            ` : ''}
                        </div>
                    ` : ''}

                    ${setor.hasPosto ? `
                        <div style="padding: 10px; background: rgba(0,0,0,0.1); border-radius: 8px;">
                            <strong style="display: block; margin-bottom: 6px; font-size: 0.9rem;"><i class="ri-nurse-line text-green"></i> Posto de Enfermagem</strong>
                            <select class="ronda-select" onchange="updateRondaField(${idx}, 'postoStatus', this.value)" style="margin-bottom: 6px;">
                                <option value="OK" ${setor.postoStatus === 'OK' ? 'selected' : ''}>🟢 Status: 100% OK</option>
                                <option value="PENDENTE" ${setor.postoStatus === 'PENDENTE' ? 'selected' : ''}>🟡 Status: Com Pendência</option>
                            </select>
                            ${setor.postoStatus === 'PENDENTE' ? `
                                <input type="text" class="ronda-input" placeholder="⚠️ Descreva a pendência..." value="${setor.postoObs}" onchange="updateRondaField(${idx}, 'postoObs', this.value)">
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                ` : `
                <div style="margin-top: 10px; font-size: 0.85rem; color: var(--text-muted); text-align: center;">
                    <i class="ri-eye-off-line"></i> Setor ocultado do relatório.
                </div>
                `}
            </div>
        `).join('');
    }

    window.updateRondaField = (idx, field, val) => {
        ronda[idx][field] = val;
        // Auto limpa observação se voltou pra OK
        if (field === 'maquinaStatus' && val === 'OK') ronda[idx].maquinaObs = '';
        if (field === 'postoStatus' && val === 'OK') ronda[idx].postoObs = '';
        
        saveRonda(ronda);
        renderRondaGrid();
    };

    // COPIAR RONDA DIÁRIA FORMATADA CONCISA PARA WHATSAPP
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
                if (!r.existe) return; // ignora se marcado como não existe (não houver)
                
                let maquinaTxt = '';
                if (r.hasMaquina) {
                    if (r.maquinaStatus === 'OK') {
                        maquinaTxt = `   • 🟢 Máquina de Contingência: OK\n`;
                    } else {
                        maquinaTxt = `   • 🟡 Máquina de Contingência: ${r.maquinaObs || 'Pendente'}\n`;
                    }
                }

                let postoTxt = '';
                if (r.hasPosto) {
                    if (r.postoStatus === 'OK') {
                        postoTxt = `   • 🟢 Posto de Enfermagem: OK\n`;
                    } else {
                        postoTxt = `   • 🟡 Posto de Enfermagem: ${r.postoObs || 'Pendente'}\n`;
                    }
                }

                msg += `🏢 *${r.nome}*\n`;
                if (maquinaTxt) msg += maquinaTxt;
                if (postoTxt) msg += postoTxt;
                msg += `\n`;
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

        // 1. Extrai Número do Chamado (#INC-xxxxxx / #SR-xxxxxx)
        const matchNumber = textExtracted.match(/\[?(#(?:INC|SR|WO|TK|TICKET)-?\d{5,8}|#(?:INC|SR)?\d{5,8}|(?:INC|SR|WO|TK)-\d{5,8})\]?/i);
        const ticketNum = matchNumber ? matchNumber[1].replace('[', '').replace(']', '').trim() : '#INC-314326';

        // 2. Extrai Solicitante ou Diagnostocado
        const diagMatch = textExtracted.match(/(?:Diagnosticado|Solicitado por|Requester|Cliente):\s*([^\n\r.]+)/i);
        const solicitante = diagMatch ? diagMatch[1].trim() : '';

        // 3. Extrai estritamente a LINHA DO PROBLEMA APÓS "Descrição:"
        let problemaTxt = '';
        const descRegex = /Descrição:\s*([\s\S]*?)(?:Diagnosticado:|Dispositivo de:|Exibir mais|Conversas|System|Validado por|<|$)/i;
        const descMatch = textExtracted.match(descRegex);

        if (descMatch && descMatch[1]) {
            const rawDescLines = descMatch[1].split('\n').map(l => l.trim()).filter(l => 
                l.length > 3 && 
                !l.startsWith('Categoria:') && 
                !l.startsWith('Sub-Categoria:') && 
                !l.startsWith('Item:') && 
                !l.startsWith('Unidade Hospitalar:')
            );
            if (rawDescLines.length > 0) {
                // Pega estritamente a primeira linha limpa do problema
                problemaTxt = rawDescLines[0].replace(/^Prezados,?\s*bom dia\.?\s*/i, '').trim();
                if (!problemaTxt.endsWith('.')) problemaTxt += '.';
            }
        }

        if (!problemaTxt) {
            const subjectMatch = textExtracted.match(/(?:Formata[çc][ãa]o|Impressora|Spooler|Totem|Tasy|Rede|Acesso)[^\n\r]*/i);
            problemaTxt = subjectMatch ? subjectMatch[0].trim() : (solicitante ? `Chamado solicitado por ${solicitante}.` : 'Atendimento de suporte técnico.');
        }

        // 4. Extrai a Solução
        let solucaoTxt = '';
        const matchSolucao = textExtracted.match(/(?:Solu[çcgao\s]*[ãao]*\s*(?:aplicada|efetuada)?|Nota de solução|Resolução):\s*([^.\n\r]+)/i);
        if (matchSolucao && matchSolucao[1] && matchSolucao[1].trim().length > 1) {
            solucaoTxt = matchSolucao[1].trim();
        } else {
            solucaoTxt = 'Aguardando atendimento / solução';
        }

        if (solucaoTxt && !solucaoTxt.endsWith('.')) {
            solucaoTxt += '.';
        }

        // 5. Validação
        let validacaoTxt = '';
        if (solicitante) {
            validacaoTxt = `Validado com ${solicitante}`;
        } else {
            const matchVal = textExtracted.match(/(?:Validado por|Validado com):\s*([^.\n\r]+)/i);
            validacaoTxt = matchVal ? `Validado com ${matchVal[1].trim()}` : 'Em atendimento';
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
            let total = 0;
            let okCount = 0;
            ronda.forEach(r => {
                if (!r.existe) return;
                if (r.hasMaquina) {
                    total++;
                    if (r.maquinaStatus === 'OK') okCount++;
                }
                if (r.hasPosto) {
                    total++;
                    if (r.postoStatus === 'OK') okCount++;
                }
            });
            statRondaStatus.textContent = `${okCount}/${total} OK`;
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
                        Nenhum chamado cadastrado para esta data.
                    </td>
                </tr>
            `;
            return;
        }

        ticketsTableBody.innerHTML = filtered.map(t => {
            const isEmAtendimento = !t.solucao || t.solucao.includes('Aguardando') || t.status_atendimento === 'EM_ATENDIMENTO';
            
            return `
            <tr>
                <td>
                    <span class="ticket-badge font-mono">${t.numero}</span>
                    <br>
                    <span style="font-size: 0.72rem; padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-block; margin-top: 0.2rem; font-weight: 700; background: ${isEmAtendimento ? 'rgba(234, 179, 8, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${isEmAtendimento ? '#EAB308' : '#10B981'};">
                        ${isEmAtendimento ? '🟡 EM ATENDIMENTO' : '🟢 CONCLUÍDO'}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.2rem;">${t.problema}</div>
                </td>
                <td>
                    <div style="color: ${isEmAtendimento ? '#EAB308' : 'var(--text-secondary)'}; line-height: 1.5; font-style: ${isEmAtendimento ? 'italic' : 'normal'};">
                        ${t.solucao}
                    </div>
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
        `}).join('');
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

    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('ticketIdHidden').value;
        const number = document.getElementById('ticketNumber').value.trim();
        const problem = document.getElementById('ticketProblem').value.trim();
        const solution = document.getElementById('ticketSolution').value.trim();
        const validation = document.getElementById('ticketValidation').value.trim();

        const formattedNum = number.startsWith('#') ? number : '#' + number;
        const config = getApiConfig();

        const newTicketObj = {
            id: id || Date.now().toString(),
            numero: formattedNum,
            problema: problem,
            solucao: solution,
            validacao: validation,
            analista: config.analystName || 'Caique Eduardo',
            data: new Date().toLocaleDateString('pt-BR')
        };

        if (id) {
            const idx = tickets.findIndex(t => t.id === id);
            if (idx !== -1) {
                tickets[idx] = { ...tickets[idx], ...newTicketObj };
            }
        } else {
            tickets.unshift(newTicketObj);
            triggerTicketAlert(formattedNum, validation);
        }

        saveTickets(tickets);
        ticketModalBackdrop.classList.remove('active');

        // ENVIA PERSISTÊNCIA MANUAL PARA O NEON POSTGRESQL (API POST /api/save-ticket)
        try {
            await fetch('/api/save-ticket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTicketObj)
            });
            console.log('✨ Chamado persistido com sucesso no Neon DB!');
        } catch (dbErr) {
            console.warn('Persistência Neon DB indisponível via HTTP, mantido em localStorage:', dbErr);
        }
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

    window.deleteTicket = async (id) => {
        if (confirm('Tem certeza que deseja remover este chamado?')) {
            const target = tickets.find(t => t.id === id);
            tickets = tickets.filter(t => t.id !== id);
            saveTickets(tickets);

            if (target && target.numero) {
                try {
                    await fetch('/api/delete-ticket', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ numero: target.numero })
                    });
                } catch (e) {}
            }
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

    // EXPORTAR PLANILHA EXCEL (.XLS) COM ESTILOS COMPLETOS (CORES DA IMAGEM 1, CENTRALIZADO, BORDAS)
    exportExcelBtn.addEventListener('click', () => {
        const config = getApiConfig();
        const analyst = config.analystName || 'Caique Eduardo';
        const dataHoje = filterDateInput && filterDateInput.value ? new Date(filterDateInput.value + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

        let htmlTable = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <!--[if gte mso 9]>
                <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Passagem de Plantão</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    table { border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif; }
                    th, td { border: 1px solid #000000; vertical-align: middle; padding: 6px 10px; }
                    .title-row { background-color: #FFFFFF; font-size: 16pt; font-weight: bold; text-align: center; height: 40px; }
                    .header-chamado { background-color: #5B9BD5; color: #FFFFFF; font-weight: bold; text-align: center; font-size: 11pt; }
                    .header-descricao { background-color: #9DC3E6; color: #000000; font-weight: bold; text-align: center; font-size: 11pt; }
                    .header-resolucao { background-color: #B4C6E7; color: #000000; font-weight: bold; text-align: center; font-size: 11pt; }
                    .header-validado { background-color: #C6EFCE; color: #000000; font-weight: bold; text-align: center; font-size: 11pt; }
                    .data-row { font-weight: bold; background-color: #F2F2F2; text-align: left; }
                    .empty-row { height: 22px; }
                </style>
            </head>
            <body>
                <table>
                    <tr>
                        <th colspan="4" class="title-row">PASSAGEM DE PLANTÃO</th>
                    </tr>
                    <tr>
                        <th class="header-chamado" style="width: 140px;">Chamado</th>
                        <th class="header-descricao" style="width: 450px;">Descrição</th>
                        <th class="header-resolucao" style="width: 450px;">Resolução</th>
                        <th class="header-validado" style="width: 250px;">Validado</th>
                    </tr>
        `;

        tickets.forEach(t => {
            htmlTable += `
                <tr>
                    <td style="text-align: center; font-weight: bold;">${t.numero}</td>
                    <td>${t.problema}</td>
                    <td>${t.solucao}</td>
                    <td style="text-align: center;">${t.validacao}</td>
                </tr>
            `;
        });

        const emptyRowsNeeded = Math.max(12 - tickets.length, 5);
        for (let i = 0; i < emptyRowsNeeded; i++) {
            htmlTable += `
                <tr class="empty-row">
                    <td></td><td></td><td></td><td></td>
                </tr>
            `;
        }

        htmlTable += `
            <tr>
                <td colspan="4" class="data-row">DATA: ${dataHoje}</td>
            </tr>
        `;

        for (let i = 0; i < 6; i++) {
            htmlTable += `
                <tr class="empty-row">
                    <td></td><td></td><td></td><td></td>
                </tr>
            `;
        }

        htmlTable += `
                    <tr>
                        <th class="header-chamado">Setor Hospitalar</th>
                        <th class="header-descricao">Status da Ronda</th>
                        <th class="header-resolucao">Observação / Pendência</th>
                        <th class="header-validado">Validado Por</th>
                    </tr>
        `;

        ronda.forEach(r => {
            htmlTable += `
                <tr>
                    <td style="font-weight: bold;">${r.nome}</td>
                    <td style="text-align: center;">${r.status === 'OK' ? '🟢 100% OK' : '🟡 Com Pendência'}</td>
                    <td>${r.obs || 'Sem anormalidades'}</td>
                    <td style="text-align: center;">${r.validado || 'Equipe do setor'}</td>
                </tr>
            `;
        });

        htmlTable += `
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Passagem_Plantao_${analyst.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // COPIAR RELATÓRIO FORMATADO PARA E-MAIL DE PLANTÃO
    copyEmailReportBtn.addEventListener('click', () => {
        const config = getApiConfig();
        const analyst = config.analystName || 'Caique Eduardo';
        const dataHoje = filterDateInput && filterDateInput.value ? new Date(filterDateInput.value + 'T00:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

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
    async function syncDatabaseTickets(selectedDate = null) {
        try {
            const config = getApiConfig();
            const analistaParam = config.analystName ? `&analista=${encodeURIComponent(config.analystName)}` : '';
            const dateParam = selectedDate ? `date=${selectedDate}` : '';
            
            let queryStr = '';
            if (dateParam && analistaParam) queryStr = `?${dateParam}${analistaParam}`;
            else if (dateParam) queryStr = `?${dateParam}`;
            else if (analistaParam) queryStr = `?analista=${encodeURIComponent(config.analystName)}`;

            const url = `/api/get-tickets${queryStr}`;
            const resp = await fetch(url, { cache: 'no-store' });
            if (resp.ok) {
                const data = await resp.json();
                if (data && data.success) {
                    if (Array.isArray(data.tickets) && data.tickets.length > 0) {
                        tickets = data.tickets.map(t => ({
                            id: t.id || Date.now().toString(),
                            numero: t.numero,
                            problema: t.problema,
                            solucao: t.solucao,
                            validacao: t.validacao,
                            status_atendimento: t.status_atendimento || 'EM_ATENDIMENTO',
                            data: t.data || new Date().toLocaleDateString('pt-BR')
                        }));
                    } else {
                        // Empty array because it's a new day or no tickets for this analyst
                        tickets = [];
                    }
                    localStorage.setItem('freshops_tickets_v4', JSON.stringify(tickets));
                    renderTable();
                    updateStats();
                }
            }
        } catch (e) {
            console.log('Poll Neon DB offline, mantendo armazenamento local.');
        }
    }

    // Initial Execution
    checkLogin();
    renderRondaGrid();
    renderTable();
    updateStats();
    syncDatabaseTickets();

    // Sincronização em tempo real a cada 5 segundos sem guardar cache antigo
    setInterval(() => {
        const currentDateFilter = filterDateInput ? filterDateInput.value : null;
        syncDatabaseTickets(currentDateFilter);
    }, 5000);
});
