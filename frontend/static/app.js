const API_URL = window.location.origin;
let authToken = localStorage.getItem('infx_token');
let currentMarketNews = [];

// Master Simulation Data for News-Driven Calendar (Feb 2026)
const simulatedMonthlyData = {
    1: { title: 'ISM Manufacturing PMI', impact: 'High', actual: '49.1', forecast: '47.2', bias: 'bull', details: 'PMI manufacturero superior a lo esperado indica expansión industrial robusta.', time: '10:00' },
    2: { title: 'JOLTS Job Openings', impact: 'High', actual: '9.02M', forecast: '8.85M', bias: 'bear', details: 'Abertura de empleos mayor a la esperada genera miedo a más subidas de tasas.', time: '10:00' },
    3: { title: 'ADP Non-Farm Employment Change', impact: 'High', actual: '107K', forecast: '145K', bias: 'bull', details: 'Menos empleos creados sugiere que el mercado laboral se enfría, positivo para Nasdaq.', time: '08:15' },
    4: { title: 'FOMC Press Conference', impact: 'High', actual: '--', forecast: '--', bias: 'bear', details: 'Discurso de Powell fue Hawkish, sugiriendo tasas altas por más tiempo.', time: '14:30' },
    5: { title: 'Unemployment Claims', impact: 'High', actual: '224K', forecast: '212K', bias: 'bull', details: 'Aumento en solicitudes de subsidio sugiere enfriamiento económico necesario.', time: '08:30' },
    8: { title: 'Retail Sales m/m', impact: 'High', actual: '-0.8%', forecast: '-0.2%', bias: 'bull', details: 'Ventas minoristas pobres sugieren que el consumidor está frenando, bajando inflación.', time: '08:30' },
    13: { title: 'Core CPI m/m', impact: 'High', actual: '0.4%', forecast: '0.3%', bias: 'bear', details: 'Inflación subyacente más caliente de lo esperado, negativo para activos de riesgo.', time: '08:30' },
    15: { title: 'Empire State Manufacturing Index', impact: 'Medium', actual: '-2.4', forecast: '-4.1', bias: 'bull', details: 'Sector manufacturero de NY mejor de lo previsto, impulsando el sentimiento.', time: '08:30' },
    20: { title: 'Advance GDP / Core PCE / PMI Session', impact: 'High', actual: 'MIXED', forecast: 'HIGH', bias: 'bear', details: 'GDP mucho menor al esperado (1.4% vs 2.8%) y PCE caliente (0.4%) generaron un fuerte sentimiento bajista para el mercado de riesgo.', time: '09:30' },
    21: { title: 'Saturday - Market Closed', impact: 'Low', actual: '--', forecast: '--', bias: 'neutral', details: 'Sesión de fin de semana. Mercado cerrado.', time: '00:00' }
};

// Mock Data for Today (Exact Sync with User List for Feb 20 - Friday)
const mockNews = [
    { title: 'Advance GDP q/q', currency: 'USD', impact: 'High', date_time: '2026-02-20T09:30:00', forecast: '2.8%', actual: '1.4%', previous: '4.4%', category: 'Nasdaq/Gold', source: 'ForexFactory' },
    { title: 'Core PCE Price Index m/m', currency: 'USD', impact: 'High', date_time: '2026-02-20T09:30:00', forecast: '0.3%', actual: '0.4%', previous: '0.2%', category: 'Gold/Forex', source: 'ForexFactory' },
    { title: 'Flash Manufacturing PMI', currency: 'USD', impact: 'High', date_time: '2026-02-20T10:45:00', forecast: '52.4', actual: '51.2', previous: '52.4', category: 'Nasdaq', source: 'ForexFactory' },
    { title: 'Flash Services PMI', currency: 'USD', impact: 'High', date_time: '2026-02-20T10:45:00', forecast: '53.0', actual: '52.3', previous: '52.7', category: 'Forex', source: 'ForexFactory' },
    { title: 'President Trump Speaks', currency: 'USD', impact: 'High', date_time: '2026-02-20T13:45:00', forecast: '--', actual: 'LIVE', previous: '--', category: 'Global', source: 'ForexFactory' }
];

// Elements
const loginScreen = document.getElementById('login-screen');
const landingScreen = document.getElementById('landing-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const newsContainer = document.getElementById('news-container');
const nextEventContainer = document.getElementById('next-event');
const currentDateEl = document.getElementById('current-date');
const btnToLogin = document.getElementById('btn-to-login');

// Navigation Elements
const navToday = document.querySelector('.nav-links a:nth-child(1)');
const navHistory = document.querySelector('.nav-links a:nth-child(2)');
const navAI = document.querySelector('.nav-links a:nth-child(3)');
const navCalendar = document.querySelector('.nav-links a:nth-child(4)');
const navCog = document.querySelector('.nav-links a:last-child');

const todayView = document.getElementById('today-view');
const historyView = document.getElementById('history-view');
const aiView = document.getElementById('ai-view');
const calendarView = document.getElementById('calendar-view');
const ajustesView = document.getElementById('ajustes-view');
const calendarPanel = document.getElementById('calendar-details-panel');

const publicRegisterForm = document.getElementById('public-register-form');
const toRegisterLink = document.getElementById('to-register');
const toLoginLink = document.getElementById('to-login');

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Particles JS
    if (window.particlesJS) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#00d4ff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#00d4ff", "opacity": 0.2, "width": 1 },
                "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }

    updateClock();
    setInterval(updateClock, 1000);

    if (authToken) {
        landingScreen.classList.remove('active');
        showDashboard();
    }

    if (btnToLogin) {
        btnToLogin.addEventListener('click', () => {
            showScreen('login-screen');
        });
    }

    // Theme initialization
    const savedTheme = localStorage.getItem('pxfx_theme') || 'default';
    setTheme(savedTheme);

    // Theme Listeners
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setTheme(theme);
        });
    });

    navToday.addEventListener('click', (e) => { e.preventDefault(); switchView('today'); });
    navHistory.addEventListener('click', (e) => { e.preventDefault(); switchView('history'); });
    navAI.addEventListener('click', (e) => { e.preventDefault(); switchView('ai'); });
    navCalendar.addEventListener('click', (e) => { e.preventDefault(); switchView('calendar'); });
    navCog.addEventListener('click', (e) => { e.preventDefault(); switchView('ajustes'); });

    // Login/Register Toggle
    toRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        publicRegisterForm.style.display = 'block';
        loginError.textContent = '';
    });

    toLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        publicRegisterForm.style.display = 'none';
        loginForm.style.display = 'block';
        loginError.textContent = '';
    });

    // Admin Forms
    document.getElementById('create-user-form').addEventListener('submit', createUser);
    document.getElementById('change-pass-form').addEventListener('submit', changePassword);

    // Public Registration
    publicRegisterForm.addEventListener('submit', handlePublicRegistration);

    // Profile Menu Logic
    const profileTrigger = document.getElementById('user-profile-trigger');
    const sessionMenu = document.getElementById('session-menu');

    if (profileTrigger && sessionMenu) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            sessionMenu.classList.toggle('active');
            console.log("SISTEMA: MENÚ DE SESIÓN TOGGLED.");
        });

        document.addEventListener('click', (e) => {
            if (!profileTrigger.contains(e.target)) {
                sessionMenu.classList.remove('active');
            }
        });
    }

    document.getElementById('session-lock').addEventListener('click', (e) => {
        e.stopPropagation();
        showScreen('login-screen');
        loginError.style.color = 'var(--accent)';
        loginError.textContent = 'TERMINAL BLOQUEADA. RE-AUTENTICAR PARA CONTINUAR.';
    });

    document.getElementById('session-switch').addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem('infx_token');
        localStorage.removeItem('infx_user');
        showScreen('login-screen');
    });

    document.getElementById('session-exit').addEventListener('click', (e) => {
        e.stopPropagation();
        localStorage.removeItem('infx_token');
        localStorage.removeItem('infx_user');
        window.location.reload();
    });
});

function logout() {
    localStorage.removeItem('infx_token');
    localStorage.removeItem('infx_user');
    window.location.reload();
}

async function handlePublicRegistration(e) {
    e.preventDefault();
    const u = document.getElementById('reg-username').value;
    const p = document.getElementById('reg-password').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: u, password: p })
        });

        if (response.ok) {
            loginError.style.color = 'var(--green)';
            loginError.textContent = 'CUENTA CREADA. YA PUEDES INICIAR SESIÓN.';
            publicRegisterForm.style.display = 'none';
            loginForm.style.display = 'block';
            e.target.reset();
        } else {
            const data = await response.json();
            loginError.style.color = 'var(--red)';
            loginError.textContent = data.detail || 'ERROR AL REGISTRAR.';
        }
    } catch (err) {
        loginError.style.color = 'var(--red)';
        loginError.textContent = 'ERROR DE CONEXIÓN.';
    }
}

setInterval(() => {
    if (dashboardScreen && dashboardScreen.classList.contains('active')) {
        const isToday = todayView.style.display !== 'none';
        const isCalendar = calendarView.style.display !== 'none';

        if (isToday) fetchNews();
        if (isCalendar) initCalendar();
    }
}, 60000);

function switchView(view) {
    [todayView, historyView, aiView, calendarView, ajustesView].forEach(v => v.style.display = 'none');
    [navToday, navHistory, navAI, navCalendar, navCog].forEach(n => n.classList.remove('active'));
    calendarPanel.style.display = 'none';

    if (view === 'today') { todayView.style.display = 'block'; navToday.classList.add('active'); fetchNews(); }
    else if (view === 'history') { historyView.style.display = 'block'; navHistory.classList.add('active'); fetchHistory(); }
    else if (view === 'ai') { aiView.style.display = 'block'; navAI.classList.add('active'); generateFullAIAnalysis(currentMarketNews); }
    else if (view === 'calendar') { calendarView.style.display = 'block'; navCalendar.classList.add('active'); initCalendar(); }
    else if (view === 'ajustes') {
        ajustesView.style.display = 'block';
        navCog.classList.add('active');
        const user = JSON.parse(localStorage.getItem('infx_user') || '{}');
        if (user.is_admin) {
            document.getElementById('admin-sessions-section').style.display = 'block';
            if (typeof fetchSessions === 'function') fetchSessions();
            fetchUsers();
        } else {
            document.getElementById('admin-sessions-section').style.display = 'none';
        }
    }
}

function updateClock() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    currentDateEl.textContent = now.toLocaleDateString('es-ES', options).toUpperCase();
}

function setTheme(theme) {
    document.body.classList.remove('theme-red', 'theme-white');
    if (theme !== 'default') {
        document.body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('pxfx_theme', theme);

    // UI Feedback for buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.style.borderColor = btn.getAttribute('data-theme') === theme ? 'var(--text-main)' : 'transparent';
        if (btn.getAttribute('data-theme') === 'white') btn.style.borderColor = btn.getAttribute('data-theme') === theme ? '#000' : '#ddd';
    });
}

// Login Logic
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        const response = await fetch(`${API_URL}/token`, { method: 'POST', body: formData });
        if (response.ok) {
            const data = await response.json();
            authToken = data.access_token;
            localStorage.setItem('infx_token', authToken);
            localStorage.setItem('infx_user', JSON.stringify({ username: username, is_admin: data.is_admin }));
            showDashboard();
            return;
        } else {
            handleLoginFallback(username, password);
        }
    } catch (err) {
        handleLoginFallback(username, password);
    }
});

function handleLoginFallback(username, password) {
    // 1. Check Hardcoded Admins
    const hardcoded = [
        { u: 'Josue10', p: 'Josue1020.', admin: true },
        { u: 'Josue10', p: 'Josue1020', admin: true },
        { u: 'el profe fenix', p: 'ProfeFenix#2026', admin: true },
        { u: 'admin', p: 'admin123', admin: true }
    ];

    let found = hardcoded.find(user =>
        user.u.toLowerCase() === username.toLowerCase() && user.p === password
    );

    // 2. Check Local Registered Users
    if (!found) {
        let localUsers = JSON.parse(localStorage.getItem('pxfx_local_users') || '[]');
        found = localUsers.find(user =>
            user.u.toLowerCase() === username.toLowerCase() && user.p === password
        );
    }

    if (found) {
        console.warn("SISTEMA: MODO OFFLINE ACTIVADO (BACKEND NO DETECTADO)");
        authToken = 'offline_session_token';
        localStorage.setItem('infx_token', authToken);
        localStorage.setItem('infx_user', JSON.stringify({ username: found.u, is_admin: found.admin }));
        showDashboard();
    } else {
        loginError.style.color = 'var(--red)';
        loginError.textContent = 'USUARIO O CONTRASEÑA INCORRECTOS.';
    }
}

function showScreen(screenId) {
    [landingScreen, loginScreen, dashboardScreen].forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

function showDashboard() {
    const user = JSON.parse(localStorage.getItem('infx_user') || '{}');
    showScreen('dashboard-screen');

    // Update User Profile UI
    const nameEl = document.querySelector('.user-info .name');
    const statusEl = document.querySelector('.user-info .status');
    const avatarEl = document.querySelector('.avatar');

    if (nameEl) nameEl.textContent = user.username || 'Usuario';
    if (statusEl) statusEl.textContent = user.is_admin ? 'Administrador Pro' : 'Premium Pro';
    if (avatarEl) avatarEl.textContent = (user.username || 'U').substring(0, 2).toUpperCase();

    // Removed navAdmin toggling since admin options are now handled dynamically in switchView

    fetchNews();
}

// Admin Logic
async function fetchUsers() {
    const list = document.getElementById('user-list');
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const users = await response.json();
        list.innerHTML = users.map(u => `
            <div class="user-row">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span>${u.username} ${u.is_admin ? '<i class="fas fa-crown" style="color:var(--yellow); font-size:0.7rem;"></i>' : ''}</span>
                    <span class="user-tag">${u.is_admin ? 'ADMIN' : 'USER'}</span>
                </div>
                ${u.username !== 'Josue10' ? `<button onclick="deleteUser('${u.username}')" class="btn-glow small" style="background:rgba(255,62,101,0.1); border-color:rgba(255,62,101,0.3); padding:5px 10px; font-size:0.6rem; width:auto;">ELIMINAR</button>` : ''}
            </div>
        `).join('');
    } catch (err) {
        // FALLBACK: Local users list
        let localUsers = JSON.parse(localStorage.getItem('pxfx_local_users') || '[]');
        list.innerHTML = localUsers.map(u => `
            <div class="user-row">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span>${u.u}</span>
                    <span class="user-tag">USER (LOCAL)</span>
                </div>
                <button onclick="deleteLocalUser('${u.u}')" class="btn-glow small" style="background:rgba(255,62,101,0.1); border-color:rgba(255,62,101,0.3); padding:5px 10px; font-size:0.6rem; width:auto;">ELIMINAR</button>
            </div>
        `).join('');
    }
}

async function deleteUser(username) {
    if (!confirm(`¿CONFIRMAR ELIMINACIÓN DE USUARIO: ${username}?`)) return;
    try {
        const response = await fetch(`${API_URL}/admin/users/${username}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) fetchUsers();
    } catch (err) { alert("Error de red."); }
}

function deleteLocalUser(u) {
    if (!confirm(`¿ELIMINAR USUARIO LOCAL: ${u}?`)) return;
    let localUsers = JSON.parse(localStorage.getItem('pxfx_local_users') || '[]');
    localUsers = localUsers.filter(user => user.u !== u);
    localStorage.setItem('pxfx_local_users', JSON.stringify(localUsers));
    fetchUsers();
}

async function createUser(e) {
    e.preventDefault();
    const msg = document.getElementById('create-user-msg');
    const u = document.getElementById('new-username').value;
    const p = document.getElementById('new-password').value;
    const admin = document.getElementById('new-is-admin').checked;

    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: u, password: p, is_admin: admin })
        });
        if (response.ok) {
            msg.textContent = 'USUARIO CREADO EXITOSAMENTE.';
            msg.className = 'msg success';
            e.target.reset();
            fetchUsers();
        } else {
            const data = await response.json();
            msg.textContent = data.detail || 'ERROR AL CREAR USUARIO.';
            msg.className = 'msg error';
        }
    } catch (err) { msg.textContent = 'ERROR DE RED.'; }
}

async function changePassword(e) {
    e.preventDefault();
    const msg = document.getElementById('change-pass-msg');
    const u = document.getElementById('target-username').value;
    const p = document.getElementById('target-password').value;

    try {
        const response = await fetch(`${API_URL}/admin/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: u, new_password: p })
        });
        if (response.ok) {
            msg.textContent = 'CONTRASEÑA ACTUALIZADA.';
            msg.className = 'msg success';
            e.target.reset();
        } else {
            const data = await response.json();
            msg.textContent = data.detail || 'ERROR AL MODIFICAR.';
            msg.className = 'msg error';
        }
    } catch (err) { msg.textContent = 'ERROR DE RED.'; }
}

// --- CALENDAR ENGINE (LIVE REAL-TIME UPDATES) ---
function initCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const now = new Date();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    const daysInMonth = 28; // Feb 2026

    for (let i = 1; i <= daysInMonth; i++) {
        // Skip Weekends (Feb 2026: 1st is Sun, 7th is Sat, 8th is Sun...)
        const dateObj = new Date(2026, 1, i);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        const dayData = simulatedMonthlyData[i];
        let isViewable = false;
        let bias = 'neutral';

        if (i < currentDay) {
            isViewable = true;
            bias = dayData ? dayData.bias : (i % 2 === 0 ? 'bull' : 'bear');
        } else if (i === currentDay) {
            // Check if news time has passed
            if (dayData && dayData.time) {
                const [h, m] = dayData.time.split(':').map(Number);
                if (currentHour > h || (currentHour === h && currentMin >= m)) {
                    isViewable = true;
                    bias = dayData.bias;
                }
            }
        }

        const dayEl = document.createElement('div');
        dayEl.className = `calendar-day ${isViewable ? 'active-day' : 'future-daylocked'}`;

        dayEl.innerHTML = `
            <span class="day-num">${i}</span>
            ${isViewable
                ? `<span class="day-bias ${bias}">${bias === 'bull' ? 'ALCISTA' : 'BAJISTA'}</span>`
                : ``
            }
            ${(isViewable && dayData) ? '<i class="fas fa-bolt" style="color:var(--yellow); font-size:0.5rem; margin-top:3px;"></i>' : ''}
        `;

        if (isViewable) {
            dayEl.onclick = () => showDayDetails(i, bias, dayData);
        } else {
            dayEl.style.cursor = 'default';
        }
        grid.appendChild(dayEl);
    }
}

function showDayDetails(day, bias, dayData) {
    calendarPanel.style.display = 'block';
    document.getElementById('selected-date-title').innerText = `SESSION: ${day} FEBRERO 2026`;
    const content = document.getElementById('day-bias-content');

    const explanation = dayData ? dayData.details : "Sesión de mercado regular sin noticias de alto impacto registradas.";
    const newsTitle = dayData ? dayData.title : "Sesión en Rango / Lateral";
    const actual = dayData ? dayData.actual : "--";
    const forecast = dayData ? dayData.forecast : "--";

    content.innerHTML = `
        <div class="bias-card" style="grid-template-columns: 1fr; gap: 10px;">
            <div class="bias-item ${bias === 'bull' ? 'bullish' : 'bearish'}" style="padding: 20px;">
                <span class="bias-label" style="font-size:1rem;">SENTIMIENTO ${bias === 'bull' ? 'ALCISTA' : 'BAJISTA'}</span>
                <i class="fas ${bias === 'bull' ? 'fa-arrow-up' : 'fa-arrow-down'}" style="font-size:2rem; margin:10px 0;"></i>
            </div>
        </div>
        
        <div class="glass-box" style="margin-top:10px; padding:15px; border:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.3);">
            <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--accent); margin-bottom:5px;">>> FUENTE: FOREX FACTORY</div>
            <div style="font-weight:700; font-size:0.9rem; margin-bottom:5px;">${newsTitle}</div>
            <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-dim);">
                <span>ACTUAL: ${actual}</span>
                <span>FORECAST: ${forecast}</span>
            </div>
        </div>

        <div class="glass-box" style="margin-top:10px; padding:15px; background: rgba(0,212,255,0.02);">
            <p class="insight-text" style="font-size:0.8rem; line-height:1.5;">
                <strong style="color:var(--accent)">ANÁLISIS IA (REAL-TIME):</strong> ${explanation}
            </p>
        </div>
    `;
}

// --- ENGINE DE IA FINANCIERA ---
function analyzeMarket(news) {
    let reports = [];
    news.forEach(item => {
        if (!item.actual || item.actual === 'WAITING' || item.actual === '--') return;
        let direction = ""; let impact = "NEUTRAL"; let why = "";
        let nasdaqStatus = "NEUTRAL"; let goldStatus = "NEUTRAL";
        let nasdaqDir = "FLAT"; let goldDir = "FLAT";

        const act = parseFloat(item.actual); const for_cast = parseFloat(item.forecast);
        const title = item.title.toLowerCase();

        if (title.includes('gdp')) {
            if (act < for_cast) {
                direction = "USD BEARISH"; impact = "NEGATIVE";
                nasdaqStatus = "POSITIVE"; goldStatus = "POSITIVE";
                nasdaqDir = "BULLISH"; goldDir = "BULLISH";
                why = "Crecimiento menor al esperado sugiere debilidad económica extrema.";
            } else {
                direction = "USD BULLISH"; impact = "POSITIVE";
                nasdaqStatus = "NEGATIVE"; goldStatus = "NEGATIVE";
                nasdaqDir = "BEARISH"; goldDir = "BEARISH";
                why = "Expansión económica sólida impulsa la confianza en el dólar.";
            }
        } else if (title.includes('pce') || title.includes('cpi')) {
            if (act > for_cast) {
                direction = "HAWKISH / BEARISH"; impact = "NEGATIVE";
                nasdaqStatus = "NEGATIVE"; goldStatus = "NEGATIVE";
                nasdaqDir = "BEARISH"; goldDir = "BEARISH";
                why = "Inflación más alta de lo previsto presiona a la FED a mantener tasas altas.";
            } else {
                direction = "DOVISH / BULLISH"; impact = "POSITIVE";
                nasdaqStatus = "POSITIVE"; goldStatus = "POSITIVE";
                nasdaqDir = "BULLISH"; goldDir = "BULLISH";
                why = "Enfriamiento de la inflación permite un respiro al mercado de activos.";
            }
        } else if (title.includes('pmi')) {
            if (act < for_cast) {
                direction = "BEARISH"; impact = "NEGATIVE";
                nasdaqStatus = "NEGATIVE"; goldStatus = "NEUTRAL";
                nasdaqDir = "BEARISH"; goldDir = "FLAT";
                why = "Contracción o desaceleración en el sector manufacturero/servicios.";
            } else {
                direction = "BULLISH"; impact = "POSITIVE";
                nasdaqStatus = "POSITIVE"; goldStatus = "NEUTRAL";
                nasdaqDir = "BULLISH"; goldDir = "FLAT";
                why = "Actividad sectorial por encima de previsiones impulsa al Nasdaq.";
            }
        } else if (title.includes('unemployment') || title.includes('claims') || title.includes('nfp')) {
            if (act < for_cast) {
                direction = "LABOR STRENGTH"; impact = "POSITIVE";
                nasdaqStatus = "NEGATIVE"; goldStatus = "NEGATIVE";
                nasdaqDir = "BEARISH"; goldDir = "BEARISH";
                why = "Menos solicitudes de desempleo indican un mercado laboral fuerte (USD BULLISH).";
            }
            else {
                direction = "LABOR WEAKNESS"; impact = "NEGATIVE";
                nasdaqStatus = "POSITIVE"; goldStatus = "POSITIVE";
                nasdaqDir = "BULLISH"; goldDir = "BULLISH";
                why = "Más solicitudes de desempleo sugieren un debilitamiento del mercado laboral (USD BEARISH).";
            }
        } else if (title.includes('trump') || title.includes('speaks')) {
            direction = "VOLATILITY"; impact = "NEUTRAL";
            nasdaqStatus = "NEUTRAL"; goldStatus = "POSITIVE";
            nasdaqDir = "VOLATILE"; goldDir = "BULLISH";
            why = "Discurso político genera incertidumbre y movimientos rápidos en US30/Gold.";
        }

        if (direction) reports.push({
            event: item.title,
            direction,
            type: impact,
            why,
            prev: item.previous || '--',
            fore: item.forecast || '--',
            act: item.actual || '--',
            nasdaq: { status: nasdaqStatus, dir: nasdaqDir },
            gold: { status: goldStatus, dir: goldDir }
        });
    });
    return reports;
}

function generateFullAIAnalysis(news) {
    const container = document.getElementById('ai-main-dashboard');
    if (!container) return;

    container.innerHTML = `<div class="scanning-placeholder"><div class="scanner-beam"></div><p>SINCRONIZANDO FLUJOS CON FOREX FACTORY...</p></div>`;

    setTimeout(() => {
        // Use currentMarketNews if provided news is empty
        const data = (news && news.length > 0) ? news : currentMarketNews;
        const reports = analyzeMarket(data);

        if (reports.length === 0) {
            container.innerHTML = `
                <div class="glass-box" style="padding:40px; text-align:center;">
                    <i class="fas fa-exclamation-triangle" style="font-size:3rem; color:var(--yellow); margin-bottom:20px;"></i>
                    <h2 style="font-size:1.2rem; margin-bottom:10px;">DATOS INSUFICIENTES</h2>
                    <p style="color:var(--text-dim); font-size:0.9rem;">No hay suficientes noticias de alto impacto procesadas para generar un análisis de sesgo institucional en este momento.</p>
                </div>
            `;
            return;
        }

        let nasdaqBull = 0, nasdaqBear = 0;
        let goldBull = 0, goldBear = 0;

        reports.forEach(r => {
            if (r.nasdaq.status === "POSITIVE") nasdaqBull++;
            else if (r.nasdaq.status === "NEGATIVE") nasdaqBear++;

            if (r.gold.status === "POSITIVE") goldBull++;
            else if (r.gold.status === "NEGATIVE") goldBear++;
        });

        const nasdaqSentiment = nasdaqBull >= nasdaqBear ? "ALCISTA" : "BAJISTA";
        const goldSentiment = goldBull >= goldBear ? "ALCISTA" : "BAJISTA";

        const totalVotes = (nasdaqBull + goldBull + nasdaqBear + goldBear) || 1;
        const alcistaPerc = Math.round(((nasdaqBull + goldBull) / totalVotes) * 100);
        const bajistaPerc = 100 - alcistaPerc;

        container.innerHTML = `
            <div class="bias-card">
                <div class="bias-item bullish">
                    <span class="bias-label">SENTIMIENTO COMPRADOR</span>
                    <i class="fas fa-arrow-trend-up" style="font-size:2rem; margin:15px 0;"></i>
                    <span class="bias-percentage">${alcistaPerc}%</span>
                </div>
                <div class="bias-item bearish">
                    <span class="bias-label">SENTIMIENTO VENDEDOR</span>
                    <i class="fas fa-arrow-trend-down" style="font-size:2rem; margin:15px 0;"></i>
                    <span class="bias-percentage">${bajistaPerc}%</span>
                </div>
            </div>
            <div class="asset-bias-strip">
                <div class="mini-bias ${nasdaqSentiment === 'ALCISTA' ? 'up' : 'down'}">
                    <span class="name">NASDAQ 100</span>
                    <span class="val" style="color: ${nasdaqSentiment === 'ALCISTA' ? 'var(--green)' : 'var(--red)'}">${nasdaqSentiment}</span>
                </div>
                <div class="mini-bias ${goldSentiment === 'ALCISTA' ? 'up' : 'down'}">
                    <span class="name">XAUUSD (ORO)</span>
                    <span class="val" style="color: ${goldSentiment === 'ALCISTA' ? 'var(--green)' : 'var(--red)'}">${goldSentiment}</span>
                </div>
            </div>
            <div class="glass-box analysis-summary" style="margin-top:25px; padding:25px; border:1px solid rgba(255,255,255,0.05); background:rgba(0,0,0,0.3);">
                 <h3 style="color:var(--accent); font-size:0.9rem; margin-bottom:12px; font-family:var(--font-mono); letter-spacing:1px;">&gt;&gt; CONCLUSIÓN DEL ANALISTA IA (PRO):</h3>
                 <p style="font-size:0.9rem; line-height:1.6; color:rgba(255,255,255,0.85);">
                    Tras auditar los indicadores de **Forex Factory**, el motor neuronal detecta un sesgo dominante 
                    ${alcistaPerc >= bajistaPerc ? '<strong style="color:var(--green); text-shadow:0 0 10px rgba(0,255,136,0.3);">ALCISTA</strong>' : '<strong style="color:var(--red); text-shadow:0 0 10px rgba(255,62,101,0.3);">BAJISTA</strong>'} 
                    para la sesión actual. 
                    <br><br>
                    El **NASDAQ 100** se proyecta **${nasdaqSentiment}** debido a la desviación acumulada en los datos macroeconómicos, 
                    mientras que el **ORO** actúa como barómetro de liquidez con una dirección proyectada **${goldSentiment}**.
                 </p>
            </div>
        `;
    }, 1200);
}

function updateAIPanel(reports) {
    const aiContainer = document.getElementById('ai-insight');
    if (!aiContainer || reports.length === 0) return;

    aiContainer.innerHTML = reports.map(r => `
        <div class="ai-report-item ${r.type.toLowerCase()}">
            <div class="report-header">
                <span class="report-event">${r.event}</span>
                <span class="report-tag">${r.direction}</span>
            </div>
            <div class="report-details-box" style="padding: 10px 0;">
                <div class="data-row" style="display:flex; justify-content:space-between; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-dim); margin-bottom: 8px;">
                    <div>PREV: <span style="color:var(--text)">${r.prev}</span></div>
                    <div>FOR: <span style="color:var(--text)">${r.fore}</span></div>
                    <div>ACT: <span style="color:var(--accent)">${r.act}</span></div>
                </div>
                <div class="why-box" style="font-size:0.8rem; line-height:1.4; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
                    <strong style="color:var(--accent); font-size:0.7rem;">ANALYSIS:</strong> ${r.why}
                </div>
            </div>
        </div>
    `).join('');
}

async function fetchNews() {
    const refreshBtn = document.getElementById('refresh-data');
    if (refreshBtn) { refreshBtn.innerHTML = 'ESCANEANDO...'; refreshBtn.disabled = true; }
    setTimeout(async () => {
        let news = [];
        try { const response = await fetch(`${API_URL}/news/today`, { headers: { 'Authorization': `Bearer ${authToken}` } }); news = await response.json(); }
        catch (err) { news = mockNews; }
        currentMarketNews = news;
        renderNews(news); renderUpcoming(news);
        const reports = analyzeMarket(news); updateAIPanel(reports);
        if (refreshBtn) { refreshBtn.innerHTML = 'Actualizar'; refreshBtn.disabled = false; }
    }, 800);
}

async function fetchHistory() {
    const historyContainer = document.getElementById('history-container');
    historyContainer.innerHTML = '<div class="no-data">ESCANEANDO HISTORIAL SEMANAL...</div>';

    const now = new Date();
    const day = now.getDay(); // 0=Sun, 6=Sat
    const isWeekend = (day === 0 || day === 6);

    setTimeout(async () => {
        let history = [];
        if (isWeekend) {
            historyContainer.innerHTML = '<div class="no-data">CIERRE DE SEMANA: HISTORIAL REINICIADO (SÁBADO/DOMINGO).</div>';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/news/history`, { headers: { 'Authorization': `Bearer ${authToken}` } });
            history = await response.json();
        } catch (err) {
            // Mock fallback only for weekdays
            history = [
                { title: 'Consumer Sentiment', date_time: '2026-02-18T10:00:00', forecast: '79.0', actual: '81.2', source: 'ForexFactory' },
                { title: 'ADP Employment Change', date_time: '2026-02-18T08:15:00', forecast: '145K', actual: '107K', source: 'ForexFactory' }
            ];
        }
        renderHistory(history);
    }, 500);
}

function renderHistory(history) {
    const historyContainer = document.getElementById('history-container');
    if (!history || history.length === 0) {
        historyContainer.innerHTML = '<div class="no-data">TRADING SESSION: NO HAY REGISTROS EN ESTA SEMANA TODAVÍA.</div>';
        return;
    }
    historyContainer.innerHTML = history.map(item => {
        const sentiment = getSentiment(item);
        return `<div class="news-item history-item ${sentiment.type.toLowerCase()}"><div class="news-time">${item.date_time.split('T')[0]}</div><div style="flex:1; margin-left: 20px;"><span class="news-title">${item.title}</span><span class="news-category">${item.source} | ${sentiment.verdict}</span></div><div class="data-box"><span class="data-label">ACTUAL / FORECAST</span><span class="data-value">${item.actual} / ${item.forecast}</span></div></div>`;
    }).join('');
}

function getSentiment(item) {
    if (!item.actual || item.actual === '--') return { verdict: 'NEUTRAL', type: 'NEUTRAL' };
    const act = parseFloat(item.actual); const for_cast = parseFloat(item.forecast);
    const title = item.title.toLowerCase();
    let isBullish = act > for_cast; if (title.includes('unemployment') || title.includes('claims')) isBullish = act < for_cast;
    return isBullish ? { verdict: 'POSITIVO', type: 'POSITIVE' } : { verdict: 'NEGATIVO', type: 'NEGATIVE' };
}

function renderNews(news) {
    if (!newsContainer) return;

    // Filter for RED IMPACT (High) USD news from Forex Factory specifically
    const usdHighImpactNews = news.filter(item =>
        item.impact === 'High' &&
        (item.source === 'ForexFactory' || item.source === 'FF')
    );

    if (usdHighImpactNews.length === 0) {
        newsContainer.innerHTML = '<div class="news-item no-data">TRADING SESSION: NO HAY NOTICIAS DE ALTO IMPACTO (USD).</div>';
        return;
    }

    newsContainer.innerHTML = usdHighImpactNews.map(item => `
        <div class="news-item">
            <div class="news-time">${item.date_time.includes('T') ? item.date_time.split('T')[1].substring(0, 5) : item.date_time}</div>
            <div>
                <span class="news-title">${item.title}</span>
                <span class="news-category">USD | ALTO IMPACTO | ${item.source}</span>
            </div>
            <div class="data-box">
                <span class="data-label">FORECAST</span>
                <span class="data-value">${item.forecast || '--'}</span>
            </div>
            <div class="data-box">
                <span class="data-label">ACTUAL</span>
                <span class="data-value" style="color: ${item.actual ? 'var(--green)' : 'var(--text-dim)'}">${item.actual || 'WAITING'}</span>
            </div>
        </div>
    `).join('');
}

function renderUpcoming(news) {
    if (!nextEventContainer) return;

    // Get high impact news that already happened today to determine current asset direction
    const recentNews = news.filter(n => n.actual && n.actual !== 'WAITING' && n.actual !== '--' && n.impact === 'High');
    const reports = analyzeMarket(recentNews);

    if (reports.length === 0) {
        nextEventContainer.innerHTML = '<div class="no-data">ESPERANDO APERTURA DE SESIÓN / NOTICIAS...</div>';
        return;
    }

    // Take the latest news event to drive the dashboard
    const latest = reports[reports.length - 1];

    nextEventContainer.innerHTML = `
        <div class="asset-directions-container">
            <div class="asset-direction-box ${latest.nasdaq.status.toLowerCase()}">
                <span class="asset-name">NASDAQ 100</span>
                <span class="asset-status">${latest.nasdaq.dir}</span>
                <span class="asset-box-indicator" style="background: ${latest.nasdaq.status === 'POSITIVE' ? 'var(--green)' : 'var(--red)'}; color: black;">
                    ${latest.nasdaq.status === 'POSITIVE' ? 'INDICADOR ALCISTA' : 'INDICADOR BAJISTA'}
                </span>
            </div>
            <div class="asset-direction-box ${latest.gold.status.toLowerCase()}">
                <span class="asset-name">XAUUSD (ORO)</span>
                <span class="asset-status">${latest.gold.dir}</span>
                <span class="asset-box-indicator" style="background: ${latest.gold.status === 'POSITIVE' ? 'var(--green)' : 'var(--red)'}; color: black;">
                    ${latest.gold.status === 'POSITIVE' ? 'INDICADOR ALCISTA' : 'INDICADOR BAJISTA'}
                </span>
            </div>
            <div style="font-size:0.6rem; color:var(--text-dim); text-align:center; margin-top:5px; font-family:var(--font-mono)">
                BASADO EN: ${latest.event}
            </div>
        </div>
    `;
}

async function fetchSessions() {
    const list = document.getElementById('active-sessions-list');
    try {
        const response = await fetch(`${API_URL}/admin/sessions`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const sessions = await response.json();
        list.innerHTML = sessions.map(s => `
            <div class="user-row session-row">
                <div style="display:flex; flex-direction:column;">
                    <span style="font-weight:700;">${s.username}</span>
                    <span style="font-size:0.6rem; color:var(--text-dim);">DESDE: ${new Date(s.login_time).toLocaleString()}</span>
                </div>
                <button onclick="terminateSession(${s.id})" class="btn-glow small" style="background:rgba(255,62,101,0.1); border-color:rgba(255,62,101,0.3); padding:5px 10px; font-size:0.6rem;">
                    ELIMINAR
                </button>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<div class="msg error">Red neuronal ocupada. Reintenta.</div>';
    }
}

async function terminateSession(sessionId) {
    if (!confirm("¿CONFIRMAR DESCONEXIÓN FORZADA?")) return;
    try {
        const response = await fetch(`${API_URL}/admin/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            fetchSessions();
        }
    } catch (err) { alert("Error al terminar sesión."); }
}
