/* ========================================
   AUTOSKOLA PRO - Complete Gamified Logic v2
   ======================================== */

// ==========================================
// CONSTANTS
// ==========================================
const APP_DATA_KEY = 'autoskolaProData';
const APP_USERS_KEY = 'autoskolaProUsers';
const APP_SESSION_KEY = 'autoskolaProSession';
const APP_THEME_KEY = 'autoskolaProTheme';
const CEO_EMAIL = 'scale.czsklol@gmail.com';
const CEO_PASSWORD = 'kokotko123';

const LEVELS = [
    { level: 1, title: 'Chodec', xpNeeded: 0 },
    { level: 2, title: 'Žák', xpNeeded: 50 },
    { level: 3, title: 'Řidič', xpNeeded: 150 },
    { level: 4, title: 'Závodník', xpNeeded: 300 },
    { level: 5, title: 'Profesionál', xpNeeded: 500 },
    { level: 6, title: 'Mistr silnic', xpNeeded: 800 },
    { level: 7, title: 'Legenda', xpNeeded: 1200 },
    { level: 8, title: 'Bůh volantu', xpNeeded: 1800 }
];

const ACHIEVEMENTS = {
    first_blood: { id: 'first_blood', title: 'První krev', desc: 'Správně odpověz na 1. otázku', icon: 'fa-droplet', xpReward: 20 },
    streak_5: { id: 'streak_5', title: 'Pán Plamene', desc: 'Dosáhni série 5 správných odpovědí', icon: 'fa-fire', xpReward: 50 },
    genius: { id: 'genius', title: 'Génius', desc: 'Dokonči test na 100 % bez chyby', icon: 'fa-brain', xpReward: 100 },
    clean_slate: { id: 'clean_slate', title: 'Čistý štít', desc: 'Oprav všechny své chybné otázky', icon: 'fa-shield-halved', xpReward: 75 },
    speedster: { id: 'speedster', title: 'Rychlík', desc: 'Odpověz správně za méně než 3 vteřiny', icon: 'fa-bolt', xpReward: 30 },
    zelenac: { id: 'zelenac', title: 'Zelenáč', desc: 'Odpověz na 10 otázek celkem', icon: 'fa-seedling', xpReward: 15 },
    vytrvalec: { id: 'vytrvalec', title: 'Vytrvalec', desc: 'Odpověz na 15 otázek celkem', icon: 'fa-person-running', xpReward: 25 }
};

// ==========================================
// AUDIO SYSTEM
// ==========================================
const AudioFX = {
    correct: null, wrong: null, fanfare: null, achievement: null,
    init() {
        try {
            this.correct = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
            this.wrong = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
            this.fanfare = new Audio('https://actions.google.com/sounds/v1/crowds/audience_claps.ogg');
            this.achievement = new Audio('https://actions.google.com/sounds/v1/crowds/audience_applause.ogg');
        } catch(e) {}
    },
    play(sound) {
        try { if (this[sound]) { this[sound].currentTime = 0; this[sound].play().catch(() => {}); } } catch(e) {}
    }
};

// ==========================================
// THEME SYSTEM
// ==========================================
function initTheme() {
    const saved = localStorage.getItem(APP_THEME_KEY);
    if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem(APP_THEME_KEY, 'dark'); }
}

function toggleTheme() {
    const current = localStorage.getItem(APP_THEME_KEY);
    if (current === 'light') { document.documentElement.removeAttribute('data-theme'); localStorage.setItem(APP_THEME_KEY, 'dark'); }
    else { document.documentElement.setAttribute('data-theme', 'light'); localStorage.setItem(APP_THEME_KEY, 'light'); }
    updateThemeIcon();
}

function updateThemeIcon() {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = localStorage.getItem(APP_THEME_KEY) === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// ==========================================
// CLOUD SYNC PLACEHOLDERS
// ==========================================
// Tyto funkce slouží jako připravená struktura pro budoucí napojení
// na online databázi (Firebase, Supabase, vlastní API atd.).
// Aktuálně pouze čtou/zapisují do localStorage (každé zařízení má vlastní data).
// Pro reálnou synchronizaci stačí nahradit těla těchto funkcí voláním API.

/**
 * Uloží všechna data aplikace (uživatele, otázky, progress) na cloud.
 * Volá se po každé změně dat (registrace, přihlášení, zodpovězení otázky, úprava profilu).
 * 
 * @param {string} userId - ID aktuálního uživatele
 * @param {object} userData - Data uživatele k synchronizaci { xp, bestScore, achievements, streak, totalAnswered, name, email, avatar }
 * @param {function} onSuccess - Callback při úspěšném uložení
 * @param {function} onError - Callback při chybě
 * 
 * Příklad napojení na Firebase Firestore:
 *   async function saveDataToCloud(userId, userData, onSuccess, onError) {
 *     try {
 *       await db.collection('users').doc(userId).set(userData, { merge: true });
 *       if (onSuccess) onSuccess();
 *     } catch (error) {
 *       console.error('Cloud sync error:', error);
 *       if (onError) onError(error);
 *     }
 *   }
 */
function saveDataToCloud(userId, userData, onSuccess, onError) {
    // === AKTUÁLNĚ: pouze lokální uložení (již probíhá přes updateCurrentUser) ===
    // === PRO BUDOUCÍ POUŽITÍ: zde vložte volání Firebase/Supabase API ===
    console.log('[Cloud Sync] Data saved locally for user:', userId, userData);
    if (onSuccess) onSuccess();
}

/**
 * Načte data uživatele z cloudu při přihlášení.
 * Volá se po úspěšném přihlášení, aby se stáhla nejnovější data.
 * 
 * @param {string} userId - ID uživatele k načtení
 * @param {function} onSuccess - Callback s načtenými daty
 * @param {function} onError - Callback při chybě
 * 
 * Příklad napojení na Firebase Firestore:
 *   async function fetchDataFromCloud(userId, onSuccess, onError) {
 *     try {
 *       const doc = await db.collection('users').doc(userId).get();
 *       if (doc.exists) {
 *         if (onSuccess) onSuccess(doc.data());
 *       } else {
 *         if (onSuccess) onSuccess(null); // Nový uživatel, žádná cloud data
 *       }
 *     } catch (error) {
 *       console.error('Cloud fetch error:', error);
 *       if (onError) onError(error);
 *     }
 *   }
 */
function fetchDataFromCloud(userId, onSuccess, onError) {
    // === AKTUÁLNĚ: data jsou již v localStorage, nic nestahujeme ===
    // === PRO BUDOUCÍ POUŽITÍ: zde vložte volání Firebase/Supabase API ===
    console.log('[Cloud Sync] Data fetched locally for user:', userId);
    if (onSuccess) onSuccess(null);
}

// ==========================================
// DATA INIT
// ==========================================
function initAppData() {
    // === VŽDY zajistí konzistentní výchozí data na KAŽDÉM zařízení ===
    if (!localStorage.getItem(APP_USERS_KEY)) {
        localStorage.setItem(APP_USERS_KEY, JSON.stringify([{
            id: 'ceo_001', email: CEO_EMAIL, password: CEO_PASSWORD,
            name: 'CEO Majitel', isCEO: true, registeredAt: new Date().toISOString(),
            xp: 0, bestScore: 0, achievements: [], streak: 0, bestStreak: 0, totalAnswered: 0, avatar: ''
        }]));
    }
    if (!localStorage.getItem(APP_DATA_KEY)) {
        localStorage.setItem(APP_DATA_KEY, JSON.stringify({
            groups: [
                { id: 'group_b', letter: 'B', name: 'Osobní automobily', categories: {
                    znacky: [
                        { id: 'b_zn_001', question: 'Co znamená červený trojúhelník s černým symbolem?', imageUrl: '', options: ['A: Výstražná značka - nebezpečí', 'B: Značka upravující přednost', 'C: Zákazová značka'], correctIndex: 0, category: 'znacky', explanation: 'Červený trojúhelník je výstražná značka.' },
                        { id: 'b_zn_002', question: 'Jaká je max. povolená rychlost v obci?', imageUrl: '', options: ['A: 30 km/h', 'B: 50 km/h', 'C: 70 km/h'], correctIndex: 1, category: 'znacky', explanation: 'V obci je max. 50 km/h.' },
                        { id: 'b_zn_003', question: 'Co znamená modrá kruhová značka s bílou šipkou?', imageUrl: '', options: ['A: Zákaz vjezdu', 'B: Příkazová značka - směr jízdy', 'C: Informativní značka'], correctIndex: 1, category: 'znacky', explanation: 'Modrá kruhová = příkazová.' }
                    ],
                    situace: [
                        { id: 'b_sit_001', question: 'Jaký bezpečný odstup od cyklisty v obci?', imageUrl: '', options: ['A: 0,5m', 'B: 1m', 'C: 1,5m'], correctIndex: 2, category: 'situace', explanation: 'Alespoň 1,5 metru.' },
                        { id: 'b_sit_002', question: 'Chodec na přechodu. Co uděláte?', imageUrl: '', options: ['A: Zpomalím', 'B: Zastavím a nechám ho přejít', 'C: Troubím'], correctIndex: 1, category: 'situace', explanation: 'Musíte zastavit.' },
                        { id: 'b_sit_003', question: 'V jakém stavu smíte řídit?', imageUrl: '', options: ['A: Technicky způsobilém', 'B: S drobnými závadami', 'C: Na stavu nezáleží'], correctIndex: 0, category: 'situace', explanation: 'Vozidlo musí být technicky způsobilé.' }
                    ]
                }},
                { id: 'group_c', letter: 'C', name: 'Nákladní automobily', categories: { znacky: [], situace: [] } },
                { id: 'group_am', letter: 'AM', name: 'Motocykly do 125 ccm', categories: { znacky: [], situace: [] } }
            ],
            availableCategories: ['znacky', 'situace']
        }));
    }
}

// ==========================================
// UTILITY
// ==========================================
function generateId() { return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
function getAppData() { try { return JSON.parse(localStorage.getItem(APP_DATA_KEY)) || { groups: [], availableCategories: ['znacky', 'situace'] }; } catch { return { groups: [], availableCategories: ['znacky', 'situace'] }; } }
function saveAppData(d) { localStorage.setItem(APP_DATA_KEY, JSON.stringify(d)); }
function getUsers() { try { return JSON.parse(localStorage.getItem(APP_USERS_KEY)) || []; } catch { return []; } }
function saveUsers(u) { localStorage.setItem(APP_USERS_KEY, JSON.stringify(u)); }
function getCurrentSession() { try { return JSON.parse(localStorage.getItem(APP_SESSION_KEY)) || null; } catch { return null; } }
function saveSession(s) { if (s) localStorage.setItem(APP_SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(APP_SESSION_KEY); }

function getCurrentUser() {
    const session = getCurrentSession();
    if (!session) return null;
    return getUsers().find(u => u.id === session.userId) || null;
}

function updateCurrentUser(updates) {
    const session = getCurrentSession();
    if (!session) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.id === session.userId);
    if (idx === -1) return;
    Object.assign(users[idx], updates);
    saveUsers(users);
    if (updates.name) { session.name = updates.name; saveSession(session); }
    if (updates.email) { session.email = updates.email; saveSession(session); }
}

// ==========================================
// XP & LEVEL SYSTEM
// ==========================================
function addXP(amount) {
    const user = getCurrentUser();
    if (!user) return null;
    const currentXp = (user.xp || 0) + amount;
    const oldLevel = getLevel(user.xp || 0);
    const newLevel = getLevel(currentXp);
    updateCurrentUser({ xp: currentXp });
    if (newLevel.level > oldLevel.level) {
        showLevelUpNotification(newLevel);
        AudioFX.play('fanfare');
    }
    updateNavbarXP();
    return { xp: currentXp, level: newLevel };
}

function getLevel(xp) {
    let lvl = LEVELS[0];
    for (const l of LEVELS) { if (xp >= l.xpNeeded) lvl = l; }
    return lvl;
}

function getXPProgress(xp) {
    const current = getLevel(xp);
    const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1;
    if (nextIdx >= LEVELS.length) return { current, next: null, progress: 100, xpInLevel: 0, xpNeeded: 1 };
    const next = LEVELS[nextIdx];
    const xpInLevel = xp - current.xpNeeded;
    const xpNeeded = next.xpNeeded - current.xpNeeded;
    return { current, next, progress: Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)), xpInLevel, xpNeeded };
}

function showLevelUpNotification(level) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success', title: `🎉 Level ${level.level}: ${level.title}!`,
            text: `Postoupil jsi na úroveň ${level.title}!`,
            timer: 3000, showConfirmButton: false,
            background: '#1a1a2e', color: '#fff', iconColor: '#fbbf24',
            customClass: { popup: 'animate__animated animate__bounceIn' }
        });
    }
}

// ==========================================
// ACHIEVEMENT SYSTEM
// ==========================================
function checkAchievement(achievementId) {
    const user = getCurrentUser();
    if (!user) return false;
    const achievements = user.achievements || [];
    if (achievements.includes(achievementId)) return false;
    const ach = Object.values(ACHIEVEMENTS).find(a => a.id === achievementId);
    if (!ach) return false;
    achievements.push(achievementId);
    updateCurrentUser({ achievements });
    addXP(ach.xpReward);
    AudioFX.play('achievement');
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'success', title: `🏆 Achievement: ${ach.title}!`,
            html: `<div style="font-size:3rem;margin-bottom:0.5rem;"><i class="fas ${ach.icon}"></i></div><p>${ach.desc}<br><small style="color:#fbbf24;">+${ach.xpReward} XP</small></p>`,
            timer: 4000, showConfirmButton: false,
            background: '#1a1a2e', color: '#fff', iconColor: '#fbbf24',
            customClass: { popup: 'animate__animated animate__bounceIn' }
        });
    }
    return true;
}

// ==========================================
// STREAK SYSTEM
// ==========================================
function updateStreak(correct) {
    const user = getCurrentUser();
    if (!user) return 0;
    let streak = user.streak || 0;
    if (correct) { streak++; if (streak >= 5) checkAchievement('streak_5'); }
    else { streak = 0; }
    const bestStreak = Math.max(user.bestStreak || 0, streak);
    updateCurrentUser({ streak, bestStreak });
    return streak;
}

function getStreakDisplay() {
    const user = getCurrentUser();
    if (!user) return null;
    const streak = user.streak || 0;
    if (streak >= 3) return { count: streak, text: 'Jedeš bomby! 🔥' };
    return null;
}

// ==========================================
// LEADERBOARD
// ==========================================
function getLeaderboard(limit = 5) {
    return getUsers()
        .map(u => ({ name: u.name, email: u.email, xp: u.xp || 0, bestScore: u.bestScore || 0, isCEO: u.isCEO, avatar: u.avatar || '' }))
        .sort((a, b) => b.xp - a.xp || b.bestScore - a.bestScore)
        .slice(0, limit);
}

function renderLeaderboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const top = getLeaderboard(5);
    if (top.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>Zatím žádní hráči.</p></div>';
        return;
    }
    container.innerHTML = `
        <table class="leaderboard-table">
            <thead><tr><th>#</th><th>Hráč</th><th>Level</th><th>XP</th><th>Skóre</th></tr></thead>
            <tbody>${top.map((u, i) => {
                const lvl = getLevel(u.xp);
                const rc = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default';
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                const avatarHtml = u.avatar ? `<img src="${u.avatar}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:0.3rem;">` : '';
                return `<tr><td><span class="leaderboard-rank ${rc}">${medal || (i + 1)}</span></td>
                    <td>${avatarHtml}${u.isCEO ? '<i class="fas fa-crown" style="color:#fbbf24;"></i> ' : ''}${u.name}</td>
                    <td style="color:var(--accent);font-weight:600;">${lvl.title}</td><td>${u.xp} XP</td><td>${u.bestScore}%</td></tr>`;
            }).join('')}</tbody></table>`;
}

// ==========================================
// MODAL SYSTEM
// ==========================================
function showInfoModal(icon, title, message, buttonText, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `<div class="modal-content animate__animated animate__bounceIn">
        <div class="modal-icon"><i class="fas ${icon}"></i></div><h3>${title}</h3><p>${message}</p>
        <button class="btn-autoskola modal-close-btn">${buttonText || 'OK'}</button></div>`;
    document.body.appendChild(overlay);
    const cb = overlay.querySelector('.modal-close-btn');
    cb.addEventListener('click', function() { overlay.remove(); if (callback) callback(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) { overlay.remove(); if (callback) callback(); } });
}

function showLoginRequiredModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `<div class="modal-content animate__animated animate__bounceIn">
        <div class="modal-icon"><i class="fas fa-lock"></i></div><h3>Přístup omezen</h3>
        <p>Pro přístup k testům se musíte přihlásit nebo registrovat.</p>
        <div class="d-flex gap-3 justify-content-center flex-wrap">
            <a href="login.html" class="btn-autoskola">Přihlásit</a>
            <a href="register.html" class="btn-autoskola btn-autoskola-outline">Registrovat</a></div></div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
}

// ==========================================
// LOADING SCREEN
// ==========================================
function showLoadingScreen(callback) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay active';
    overlay.innerHTML = `<div class="loading-spinner-wheel"><i class="fas fa-car-side"></i></div>
        <div class="loading-text">Generuji tvůj test...</div><div class="loading-spinner"></div>`;
    document.body.appendChild(overlay);
    setTimeout(() => { overlay.remove(); if (callback) callback(); }, 1500);
}

// ==========================================
// NAVBAR
// ==========================================
function initializeNavbar() {
    const placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    const session = getCurrentSession();
    const user = getCurrentUser();
    const page = window.location.pathname.split('/').pop() || 'index.html';

    let rightLinks = '';
    if (session) {
        const lvl = getLevel(user?.xp || 0);
        const prog = getXPProgress(user?.xp || 0);
        rightLinks = `
            <li class="nav-item d-flex align-items-center gap-2 flex-nowrap my-2 my-lg-0">
                <span class="nav-link" style="cursor:default;color:#22c55e;padding:0.2rem 0.4rem;font-size:0.8rem;white-space:nowrap;">
                    <i class="fas fa-user-circle me-1"></i>${session.name || session.email}
                </span>
                <div class="xp-bar-container d-flex align-items-center gap-1">
                    <div class="xp-bar" style="width:70px;"><div class="xp-bar-fill" style="width:${prog.progress}%"></div></div>
                    <span class="xp-text" style="font-size:0.65rem;">Lv.${lvl.level}</span>
                </div>
            </li>
            ${session.isCEO ? `<li class="nav-item"><a class="nav-link ${page === 'admin.html' ? 'active' : ''}" href="admin.html"><i class="fas fa-shield-alt me-1"></i>Admin</a></li>` : ''}
            <li class="nav-item"><a class="nav-link" href="#" id="logoutBtn"><i class="fas fa-sign-out-alt me-1"></i>Odhlásit</a></li>`;
    } else {
        rightLinks = `
            <li class="nav-item"><a class="nav-link ${page === 'login.html' ? 'active' : ''}" href="login.html"><i class="fas fa-sign-in-alt me-1"></i>Přihlásit</a></li>
            <li class="nav-item"><a class="nav-link ${page === 'register.html' ? 'active' : ''}" href="register.html"><i class="fas fa-user-plus me-1"></i>Registrovat</a></li>`;
    }

    placeholder.innerHTML = `
        <nav class="navbar navbar-expand-lg fixed-top">
            <div class="container">
                <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
                    <i class="fas fa-graduation-cap" style="color:#ff6b00;font-size:1.3rem;"></i>
                    <span style="font-weight:800;font-size:1.1rem;background:linear-gradient(135deg,#fff,#ff6b00);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Autoškola Pro</span>
                </a>
                <div class="d-flex align-items-center gap-1 order-lg-3">
                    <button class="theme-toggle" id="themeToggleBtn" title="Přepnout režim" style="width:34px;height:34px;font-size:0.9rem;">
                        ${localStorage.getItem(APP_THEME_KEY) === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>'}
                    </button>
                    <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarMain">
                        <i class="fas fa-bars" style="color:#fff;font-size:1.1rem;"></i>
                    </button>
                </div>
                <div class="collapse navbar-collapse order-lg-2" id="navbarMain">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item"><a class="nav-link ${page === 'index.html' ? 'active' : ''}" href="index.html"><i class="fas fa-home me-1"></i>Domů</a></li>
                        <li class="nav-item"><a class="nav-link app-link ${page === 'app.html' ? 'active' : ''}" href="#"><i class="fas fa-car me-1"></i>Aplikace</a></li>
                        <li class="nav-item"><a class="nav-link ${page === 'leaderboard.html' ? 'active' : ''}" href="leaderboard.html"><i class="fas fa-trophy me-1"></i>Žebříček</a></li>
                    </ul>
                    <ul class="navbar-nav">${rightLinks}</ul>
                </div>
            </div>
        </nav>`;

    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    const navbar = document.querySelector('.navbar');
    if (navbar) window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 50), { passive: true });

    document.querySelectorAll('.app-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (!getCurrentSession()) showLoginRequiredModal();
            else window.location.href = 'app.html';
        });
    });

    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        saveSession(null);
        window.location.href = 'index.html';
    });

    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function() {
            const collapse = document.getElementById('navbarMain');
            if (collapse?.classList.contains('show')) bootstrap.Collapse.getInstance(collapse)?.hide();
        });
    });
}

function updateNavbarXP() {
    const user = getCurrentUser();
    if (!user) return;
    const lvl = getLevel(user.xp || 0);
    const prog = getXPProgress(user.xp || 0);
    const fill = document.querySelector('.xp-bar-fill');
    const text = document.querySelector('.xp-text');
    if (fill) fill.style.width = prog.progress + '%';
    if (text) text.textContent = `Lv.${lvl.level}`;
}

// ==========================================
// AUTH
// ==========================================
function handleLogin(email, password) {
    const user = getUsers().find(u => u.email === email && u.password === password);
    if (!user) return { success: false, message: 'Nesprávný email nebo heslo.' };
    saveSession({ userId: user.id, email: user.email, name: user.name, isCEO: user.isCEO || false, loggedInAt: new Date().toISOString() });
    return { success: true, message: 'Přihlášení proběhlo úspěšně!', isCEO: user.isCEO };
}

function handleRegister(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email === email)) return { success: false, message: 'Účet s tímto emailem již existuje.' };
    if (email === CEO_EMAIL) return { success: false, message: 'Tento email je již registrován.' };
    const newUser = { id: generateId(), email, password, name, isCEO: false, registeredAt: new Date().toISOString(), xp: 0, bestScore: 0, achievements: [], streak: 0, bestStreak: 0, totalAnswered: 0, avatar: '' };
    users.push(newUser);
    saveUsers(users);
    saveSession({ userId: newUser.id, email: newUser.email, name: newUser.name, isCEO: false, loggedInAt: new Date().toISOString() });
    return { success: true, message: 'Registrace proběhla úspěšně!', isCEO: false };
}

// ==========================================
// PROFILE SYSTEM
// ==========================================
function renderProfile() {
    const user = getCurrentUser();
    if (!user) return;
    const container = document.getElementById('profile-content');
    if (!container) return;

    const achievements = user.achievements || [];
    const totalAnswered = user.totalAnswered || 0;

    // Check badge achievements
    if (totalAnswered >= 10) checkAchievement('zelenac');
    if (totalAnswered >= 15) checkAchievement('vytrvalec');

    const allBadges = [
        { id: 'zelenac', icon: 'fa-seedling', label: 'Zelenáč', desc: '10 otázek', unlocked: achievements.includes('zelenac') },
        { id: 'vytrvalec', icon: 'fa-person-running', label: 'Vytrvalec', desc: '15 otázek', unlocked: achievements.includes('vytrvalec') },
        { id: 'first_blood', icon: 'fa-droplet', label: 'První krev', desc: '1. správná', unlocked: achievements.includes('first_blood') },
        { id: 'streak_5', icon: 'fa-fire', label: 'Pán Plamene', desc: 'Streak 5', unlocked: achievements.includes('streak_5') },
        { id: 'genius', icon: 'fa-brain', label: 'Génius', desc: '100% test', unlocked: achievements.includes('genius') },
        { id: 'clean_slate', icon: 'fa-shield-halved', label: 'Čistý štít', desc: 'Opraveno vše', unlocked: achievements.includes('clean_slate') },
        { id: 'speedster', icon: 'fa-bolt', label: 'Rychlík', desc: '<3s odpověď', unlocked: achievements.includes('speedster') }
    ];

    const lvl = getLevel(user.xp || 0);
    const prog = getXPProgress(user.xp || 0);

    container.innerHTML = `
        <div class="row g-3">
            <div class="col-md-5">
                <div class="admin-card">
                    <h3><i class="fas fa-user-cog me-2"></i>Upravit profil</h3>
                    <form id="profile-form">
                        <div class="mb-2">
                            <label class="text-white-50 small mb-1">Profilový obrázek (URL)</label>
                            <input type="url" class="admin-input" id="profile-avatar" placeholder="https://..." value="${user.avatar || ''}">
                        </div>
                        <div class="mb-2">
                            <label class="text-white-50 small mb-1">Jméno</label>
                            <input type="text" class="admin-input" id="profile-name" value="${user.name || ''}">
                        </div>
                        <div class="mb-2">
                            <label class="text-white-50 small mb-1">Email</label>
                            <input type="email" class="admin-input" id="profile-email" value="${user.email || ''}">
                        </div>
                        <div class="mb-2">
                            <label class="text-white-50 small mb-1">Nové heslo (nechte prázdné pro zachování)</label>
                            <input type="password" class="admin-input" id="profile-password" placeholder="Nové heslo">
                        </div>
                        <button type="submit" class="btn-autoskola w-100" style="font-size:0.85rem;">
                            <i class="fas fa-save me-2"></i>Uložit změny
                        </button>
                    </form>
                </div>
            </div>
            <div class="col-md-7">
                <div class="admin-card">
                    <h3><i class="fas fa-medal me-2"></i>Osobní odznaky</h3>
                    <p class="text-white-50 small mb-3">Celkem zodpovězeno: <strong style="color:#ff6b00;">${totalAnswered}</strong> otázek</p>
                    <div class="row g-2">
                        ${allBadges.map(b => `
                            <div class="col-4 col-md-3 text-center">
                                <div style="width:100%;aspect-ratio:1;border-radius:1rem;
                                    background:${b.unlocked ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)'};
                                    border:2px solid ${b.unlocked ? 'rgba(255,107,0,0.4)' : 'rgba(255,255,255,0.06)'};
                                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                                    transition:all 0.3s ease;padding:0.5rem;
                                    ${b.unlocked ? '' : 'filter:grayscale(1);opacity:0.4;'}"
                                    title="${b.desc}">
                                    <i class="fas ${b.icon}" style="font-size:1.5rem;color:${b.unlocked ? '#ff6b00' : 'rgba(255,255,255,0.3)'};"></i>
                                    <span style="font-size:0.6rem;margin-top:0.3rem;color:${b.unlocked ? '#ff6b00' : 'rgba(255,255,255,0.3)'};font-weight:600;">${b.label}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="admin-card">
                    <h3><i class="fas fa-chart-simple me-2"></i>Statistiky</h3>
                    <div class="row g-2 text-center">
                        <div class="col-4"><div style="font-size:1.3rem;font-weight:900;color:#ff6b00;">${user.xp || 0}</div><div class="text-white-50 small">XP</div></div>
                        <div class="col-4"><div style="font-size:1.3rem;font-weight:900;color:#22c55e;">${lvl.title}</div><div class="text-white-50 small">Level ${lvl.level}</div></div>
                        <div class="col-4"><div style="font-size:1.3rem;font-weight:900;color:#fbbf24;">${user.bestScore || 0}%</div><div class="text-white-50 small">Nejlepší</div></div>
                    </div>
                    <div class="mt-2">
                        <div class="progress-bar-custom" style="height:4px;"><div class="progress-fill" style="width:${prog.progress}%"></div></div>
                        <div class="text-white-50 small mt-1 text-center">${prog.xpInLevel} / ${prog.xpNeeded} XP do dalšího levelu</div>
                    </div>
                </div>
            </div>
        </div>`;

    // Profile form handler
    document.getElementById('profile-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('profile-name').value.trim();
        const email = document.getElementById('profile-email').value.trim();
        const password = document.getElementById('profile-password').value.trim();
        const avatar = document.getElementById('profile-avatar').value.trim();

        if (!name || !email) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Jméno a email jsou povinné.', 'OK'); return; }

        const updates = { name, email, avatar };
        if (password) updates.password = password;

        // Check email uniqueness
        if (email !== getCurrentUser()?.email) {
            const users = getUsers();
            if (users.find(u => u.email === email && u.id !== getCurrentSession()?.userId)) {
                showInfoModal('fa-exclamation-circle', 'Chyba', 'Tento email již používá jiný uživatel.', 'OK');
                return;
            }
        }

        updateCurrentUser(updates);
        showInfoModal('fa-check-circle', 'Uloženo', 'Profil byl aktualizován.', 'OK', () => {
            initializeNavbar();
            renderProfile();
        });
    });
}

// ==========================================
// TEST LOGIC
// ==========================================
let testState = { groupId: null, category: null, questions: [], currentIndex: 0, score: 0, totalAnswered: 0, wrongQuestions: [], isReviewMode: false, answerTimestamps: [], answered: false };

function loadGroups() { return getAppData().groups || []; }

function loadQuestions(groupId, category) {
    const group = getAppData().groups.find(g => g.id === groupId);
    if (!group) return [];
    if (category === 'all') {
        const all = [];
        Object.keys(group.categories).forEach(k => { if (Array.isArray(group.categories[k])) all.push(...group.categories[k]); });
        return all;
    }
    if (category === 'wrong') {
        const ids = getWrongQuestionIds(groupId);
        const all = getAllQuestionsForGroup(groupId);
        return all.filter(q => ids.includes(q.id));
    }
    return group.categories[category] || [];
}

function getAllQuestionsForGroup(groupId) {
    const group = getAppData().groups.find(g => g.id === groupId);
    if (!group) return [];
    const all = [];
    Object.keys(group.categories || {}).forEach(k => { if (Array.isArray(group.categories[k])) all.push(...group.categories[k]); });
    return all;
}

function getGroupProgress(groupId) {
    const session = getCurrentSession();
    if (!session) return { total: 0, answered: 0, percentage: 0 };
    const all = getAllQuestionsForGroup(groupId);
    if (all.length === 0) return { total: 0, answered: 0, percentage: 0 };
    const prog = JSON.parse(localStorage.getItem('autoskolaProProgress_' + session.userId) || '{}');
    const ids = prog[groupId] || [];
    return { total: all.length, answered: ids.length, percentage: Math.round((ids.length / all.length) * 100) };
}

function markQuestionAnswered(groupId, qId) {
    const session = getCurrentSession();
    if (!session) return;
    const key = 'autoskolaProProgress_' + session.userId;
    const d = JSON.parse(localStorage.getItem(key) || '{}');
    if (!d[groupId]) d[groupId] = [];
    if (!d[groupId].includes(qId)) d[groupId].push(qId);
    localStorage.setItem(key, JSON.stringify(d));
}

function addWrongQuestion(groupId, qId) {
    const session = getCurrentSession();
    if (!session) return;
    const key = 'autoskolaProWrong_' + session.userId;
    const d = JSON.parse(localStorage.getItem(key) || '{}');
    if (!d[groupId]) d[groupId] = [];
    if (!d[groupId].includes(qId)) d[groupId].push(qId);
    localStorage.setItem(key, JSON.stringify(d));
}

function getWrongQuestionIds(groupId) {
    const session = getCurrentSession();
    if (!session) return [];
    const d = JSON.parse(localStorage.getItem('autoskolaProWrong_' + session.userId) || '{}');
    return d[groupId] || [];
}

function hasAnyWrongQuestions() {
    const session = getCurrentSession();
    if (!session) return false;
    const d = JSON.parse(localStorage.getItem('autoskolaProWrong_' + session.userId) || '{}');
    return Object.values(d).some(arr => arr.length > 0);
}

function removeWrongQuestionAfterTwoCorrect(groupId, qId) {
    const session = getCurrentSession();
    if (!session) return false;
    const key = 'autoskolaProWrong_' + session.userId;
    const d = JSON.parse(localStorage.getItem(key) || '{}');
    if (!d[groupId]) return false;
    const trackKey = 'autoskolaProCorrectTrack_' + session.userId;
    const track = JSON.parse(localStorage.getItem(trackKey) || '{}');
    if (!track[groupId]) track[groupId] = {};
    if (!track[groupId][qId]) track[groupId][qId] = 0;
    track[groupId][qId]++;
    localStorage.setItem(trackKey, JSON.stringify(track));
    if (track[groupId][qId] >= 2) {
        d[groupId] = d[groupId].filter(id => id !== qId);
        if (d[groupId].length === 0) delete d[groupId];
        localStorage.setItem(key, JSON.stringify(d));
        delete track[groupId][qId];
        if (Object.keys(track[groupId]).length === 0) delete track[groupId];
        localStorage.setItem(trackKey, JSON.stringify(track));
        const remaining = getWrongQuestionIds(groupId);
        if (remaining.length === 0) {
            checkAchievement('clean_slate');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success', title: '🎉 Čistý štít!',
                    text: 'Opravil/a jsi všechny své chybné otázky!',
                    timer: 3000, showConfirmButton: false,
                    background: '#1a1a2e', color: '#fff', iconColor: '#22c55e',
                    customClass: { popup: 'animate__animated animate__bounceIn' }
                });
            }
        }
        return true;
    }
    return false;
}

function renderProgressCircle(percentage, size = 36) {
    const r = (size / 2) - 4;
    const circ = 2 * Math.PI * r;
    const off = circ - (percentage / 100) * circ;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
        <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${percentage > 0 ? '#22c55e' : 'rgba(255,255,255,0.08)'}" stroke-width="3" stroke-dasharray="${circ}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset 0.5s ease;"/></svg>`;
}

function displayGroups(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const groups = loadGroups();
    if (groups.length === 0) { container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Zatím žádné skupiny.</p></div>'; return; }
    container.innerHTML = groups.map(g => {
        const prog = getGroupProgress(g.id);
        return `<div class="group-card" data-group-id="${g.id}" style="padding:1rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div class="group-letter" style="font-size:1.5rem;">${g.letter}</div>
                <div style="flex-shrink:0;">${renderProgressCircle(prog.percentage, 32)}</div></div>
            <div class="group-name" style="font-size:0.8rem;">${g.name}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.3rem;">
                <span style="color:rgba(255,255,255,0.3);font-size:0.65rem;"><i class="fas fa-question-circle me-1"></i>${prog.total} ot.</span>
                <span style="color:${prog.percentage > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)'};font-size:0.65rem;font-weight:600;">${prog.percentage}%</span></div></div>`;
    }).join('');
    container.querySelectorAll('.group-card').forEach(card => {
        card.addEventListener('click', function() { testState.groupId = this.dataset.groupId; showCategorySelection(this.dataset.groupId); });
    });
}

function showCategorySelection(groupId) {
    const group = getAppData().groups.find(g => g.id === groupId);
    if (!group) return;
    const s1 = document.getElementById('step-group-selection');
    const s2 = document.getElementById('step-category-selection');
    const s3 = document.getElementById('step-test-interface');
    const s4 = document.getElementById('step-test-results');
    const s5 = document.getElementById('step-profile');
    if (s1 && s2) { s1.classList.add('d-none'); s2.classList.remove('d-none'); if (s3) s3.classList.add('d-none'); if (s4) s4.classList.add('d-none'); if (s5) s5.classList.add('d-none'); }
    const container = document.getElementById('category-cards');
    if (!container) return;
    const cats = [];
    Object.keys(group.categories).forEach(key => {
        const count = (group.categories[key] || []).length;
        let icon = 'fa-folder', label = key;
        if (key === 'znacky') { icon = 'fa-traffic-light'; label = 'Dopravní značky'; }
        else if (key === 'situace') { icon = 'fa-car-crash'; label = 'Dopravní situace'; }
        else { icon = 'fa-tag'; label = key.charAt(0).toUpperCase() + key.slice(1); }
        cats.push({ key, icon, name: label, count });
    });
    cats.push({ key: 'all', icon: 'fa-layer-group', name: 'Všechny otázky', count: getAllQuestionsForGroup(groupId).length });
    const wc = getWrongQuestionIds(groupId).length;
    // Only show wrong category if there are wrong questions
    if (wc > 0) cats.push({ key: 'wrong', icon: 'fa-exclamation-triangle', name: 'Otázky, které neumím', count: wc });

    container.innerHTML = cats.map(cat => `<div class="category-card" data-category="${cat.key}" style="padding:1rem;">
        <div class="category-icon" style="font-size:1.5rem;margin-bottom:0.4rem;"><i class="fas ${cat.icon}"></i></div>
        <h6 style="font-weight:700;font-size:0.8rem;margin-bottom:0.2rem;">${cat.name}</h6>
        <span style="color:rgba(255,255,255,0.4);font-size:0.7rem;">${cat.count} otázek</span></div>`).join('');
    container.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', function() {
            testState.category = this.dataset.category;
            startTest(groupId, this.dataset.category);
        });
    });
    document.getElementById('back-to-groups')?.addEventListener('click', function() { s1.classList.remove('d-none'); s2.classList.add('d-none'); testState.groupId = null; }, { once: true });
}

function startTest(groupId, category) {
    let questions = loadQuestions(groupId, category);
    if (category === 'wrong') {
        const ids = getWrongQuestionIds(groupId);
        questions = getAllQuestionsForGroup(groupId).filter(q => ids.includes(q.id));
    }
    if (questions.length === 0) {
        showInfoModal('fa-info-circle', 'Žádné otázky', 'V této kategorii zatím nejsou žádné otázky.', 'Zpět', () => {
            const s1 = document.getElementById('step-group-selection');
            const s2 = document.getElementById('step-category-selection');
            if (s1 && s2) { s2.classList.add('d-none'); s1.classList.remove('d-none'); }
        });
        return;
    }
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    testState = { groupId, category, questions: shuffled, currentIndex: 0, score: 0, totalAnswered: 0, wrongQuestions: [], isReviewMode: false, answerTimestamps: [], answered: false };

    showLoadingScreen(() => {
        const s1 = document.getElementById('step-group-selection');
        const s2 = document.getElementById('step-category-selection');
        const s3 = document.getElementById('step-test-interface');
        if (s1 && s2 && s3) { s1.classList.add('d-none'); s2.classList.add('d-none'); s3.classList.remove('d-none'); }
        displayCurrentQuestion();
    });
}

function displayCurrentQuestion() {
    const { questions, currentIndex } = testState;
    if (currentIndex >= questions.length) { showTestResults(); return; }
    const q = questions[currentIndex];
    const total = questions.length;
    testState.answered = false;

    document.getElementById('question-counter') && (document.getElementById('question-counter').textContent = `Otázka ${currentIndex + 1}/${total}`);
    document.getElementById('score-display') && (document.getElementById('score-display').textContent = `${testState.score}/${testState.totalAnswered}`);
    const pf = document.getElementById('progress-fill');
    if (pf) pf.style.width = ((currentIndex) / total * 100) + '%';

    // XP & Streak info above question (no popup)
    const xpInfo = document.getElementById('xp-info');
    const streak = getStreakDisplay();
    if (xpInfo) {
        let html = '<div class="d-flex align-items-center gap-2 flex-wrap" style="font-size:0.8rem;">';
        html += '<span style="color:#fbbf24;"><i class="fas fa-star me-1"></i>+10 XP za správnou</span>';
        if (streak) html += `<span class="streak-badge" style="font-size:0.75rem;">🔥 ${streak.count}x ${streak.text}</span>`;
        html += '</div>';
        xpInfo.innerHTML = html;
    }

    const qc = document.getElementById('question-container');
    if (!qc) return;
    let imgHtml = '';
    if (q.imageUrl && q.imageUrl.trim()) imgHtml = `<div class="text-center my-2"><img src="${q.imageUrl}" alt="" class="img-fluid" style="max-height:160px;border-radius:0.75rem;border:1px solid rgba(255,107,0,0.15);"></div>`;
    qc.innerHTML = `<div class="animate__animated animate__fadeIn">
        <h5 class="fw-bold mb-3" style="line-height:1.4;font-size:0.95rem;">${q.question}</h5>
        ${imgHtml}
        <div class="d-flex flex-column gap-2">${q.options.map((opt, idx) => {
            const letter = String.fromCharCode(65 + idx);
            return `<button class="option-btn" data-option-index="${idx}" style="padding:0.7rem 1rem;">
                <span class="option-letter" style="width:28px;height:28px;font-size:0.8rem;">${letter}</span>
                <span style="font-size:0.85rem;">${opt.replace(/^[A-C]:\s*/, '')}</span></button>`;
        }).join('')}</div></div>`;

    const startTime = Date.now();
    qc.querySelectorAll('.option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (testState.answered) return; // SPAM PROTECTION
            const elapsed = (Date.now() - startTime) / 1000;
            handleAnswer(parseInt(this.dataset.optionIndex), elapsed);
        });
    });
    updateNavButtons();
}

function handleAnswer(selectedIndex, elapsed = 0) {
    if (testState.answered) return; // SPAM PROTECTION - already answered
    testState.answered = true;

    const { questions, currentIndex } = testState;
    const q = questions[currentIndex];
    const correct = selectedIndex === q.correctIndex;

    document.querySelectorAll('.option-btn').forEach(btn => {
        btn.disabled = true;
        const idx = parseInt(btn.dataset.optionIndex);
        if (idx === q.correctIndex) btn.classList.add('correct');
        else if (idx === selectedIndex && !correct) btn.classList.add('wrong');
    });

    testState.totalAnswered++;
    testState.answerTimestamps.push(elapsed);

    // Track total answered for profile badges
    const user = getCurrentUser();
    if (user) {
        const newTotal = (user.totalAnswered || 0) + 1;
        updateCurrentUser({ totalAnswered: newTotal });
        if (newTotal >= 10) checkAchievement('zelenac');
        if (newTotal >= 15) checkAchievement('vytrvalec');
    }

    if (correct) {
        testState.score++;
        markQuestionAnswered(testState.groupId, q.id);
        addXP(10);
        updateStreak(true);
        AudioFX.play('correct');

        if (testState.totalAnswered === 1) checkAchievement('first_blood');
        if (elapsed < 3) checkAchievement('speedster');

        if (testState.category === 'wrong') {
            removeWrongQuestionAfterTwoCorrect(testState.groupId, q.id);
        }

        // NO POPUP - just update the display
        const xpInfo = document.getElementById('xp-info');
        if (xpInfo) {
            const streak = getStreakDisplay();
            let html = '<div class="d-flex align-items-center gap-2 flex-wrap" style="font-size:0.8rem;">';
            html += '<span style="color:#22c55e;"><i class="fas fa-check-circle me-1"></i>Správně! +10 XP</span>';
            if (streak) html += `<span class="streak-badge" style="font-size:0.75rem;">🔥 ${streak.count}x ${streak.text}</span>`;
            html += '</div>';
            xpInfo.innerHTML = html;
        }
    } else {
        addWrongQuestion(testState.groupId, q.id);
        updateStreak(false);
        AudioFX.play('wrong');

        const explanation = q.explanation || 'Žádné vysvětlení k dispozici.';
        Swal.fire({
            icon: 'error', title: 'Špatně!',
            html: `<p style="margin-bottom:0.5rem;">Správná odpověď: <strong style="color:#22c55e;">${q.options[q.correctIndex].replace(/^[A-C]:\s*/, '')}</strong></p>
                   <div style="background:rgba(255,107,0,0.1);border-radius:0.75rem;padding:0.75rem;margin-top:0.5rem;text-align:left;">
                   <small><i class="fas fa-lightbulb" style="color:#fbbf24;"></i> <strong>Tahák:</strong> ${explanation}</small></div>`,
            timer: 3000, showConfirmButton: false,
            background: '#1a1a2e', color: '#fff', iconColor: '#ef4444',
            customClass: { popup: 'animate__animated animate__bounceIn' }
        });
    }

    setTimeout(() => { nextQuestion(); }, correct ? 800 : 3000);
}

function nextQuestion() { testState.currentIndex++; displayCurrentQuestion(); }
function previousQuestion() { if (testState.currentIndex > 0) { testState.currentIndex--; testState.isReviewMode = true; displayCurrentQuestion(); } }

function updateNavButtons() {
    const prev = document.getElementById('prev-question-btn');
    const next = document.getElementById('next-question-btn');
    if (prev) prev.style.display = testState.currentIndex > 0 ? 'flex' : 'none';
    if (next) {
        const last = testState.currentIndex >= testState.questions.length - 1;
        next.innerHTML = last ? '<i class="fas fa-flag-checkered me-2"></i>Dokončit' : '<i class="fas fa-arrow-right me-2"></i>Další';
    }
}

function showTestResults() {
    const { score, totalAnswered, questions, wrongQuestions } = testState;
    const pct = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 0;
    const passed = pct >= 70;
    const s3 = document.getElementById('step-test-interface');
    const s4 = document.getElementById('step-test-results');
    if (s3 && s4) { s3.classList.add('d-none'); s4.classList.remove('d-none'); }

    const user = getCurrentUser();
    if (user && pct > (user.bestScore || 0)) updateCurrentUser({ bestScore: pct });
    if (pct === 100 && totalAnswered > 0) checkAchievement('genius');
    if (passed) AudioFX.play('fanfare');

    document.getElementById('final-score') && (document.getElementById('final-score').textContent = score);
    document.getElementById('final-total') && (document.getElementById('final-total').textContent = totalAnswered);
    document.getElementById('final-percentage') && (document.getElementById('final-percentage').textContent = pct + '%');
    document.getElementById('final-passed') && (document.getElementById('final-passed').textContent = passed ? 'Prospěl/a' : 'Neprospěl/a');
    const ri = document.getElementById('result-icon');
    if (ri) { ri.className = passed ? 'fas fa-trophy' : 'fas fa-redo-alt'; ri.style.color = passed ? '#fbbf24' : '#ef4444'; }

    document.getElementById('new-test-btn')?.addEventListener('click', resetTest, { once: true });

    // Only show retry button if there are wrong questions
    const retryBtn = document.getElementById('retry-wrong-btn');
    const hasWrong = getWrongQuestionIds(testState.groupId).length > 0;
    if (retryBtn) {
        if (hasWrong) {
            retryBtn.style.display = 'flex';
            retryBtn.addEventListener('click', function() {
                const wrongIds = getWrongQuestionIds(testState.groupId);
                if (wrongIds.length > 0) {
                    const all = getAllQuestionsForGroup(testState.groupId);
                    testState.questions = all.filter(q => wrongIds.includes(q.id));
                    testState.currentIndex = 0; testState.score = 0; testState.totalAnswered = 0;
                    testState.wrongQuestions = []; testState.isReviewMode = false;
                    s4.classList.add('d-none'); s3.classList.remove('d-none'); displayCurrentQuestion();
                }
            }, { once: true });
        } else {
            retryBtn.style.display = 'none';
        }
    }
}

function resetTest() {
    testState = { groupId: null, category: null, questions: [], currentIndex: 0, score: 0, totalAnswered: 0, wrongQuestions: [], isReviewMode: false, answerTimestamps: [], answered: false };
    const s1 = document.getElementById('step-group-selection');
    const s2 = document.getElementById('step-category-selection');
    const s3 = document.getElementById('step-test-interface');
    const s4 = document.getElementById('step-test-results');
    const s5 = document.getElementById('step-profile');
    if (s1 && s2 && s3 && s4) { s4.classList.add('d-none'); s3.classList.add('d-none'); s2.classList.add('d-none'); s1.classList.remove('d-none'); if (s5) s5.classList.add('d-none'); displayGroups('group-cards'); }
}

// ==========================================
// ADMIN LOGIC
// ==========================================
function checkAdminAccess() {
    const s = getCurrentSession();
    if (!s || !s.isCEO) { window.location.href = 'index.html'; return false; }
    return true;
}

function adminLoadGroups() {
    const data = getAppData();
    const select = document.getElementById('admin-group-select');
    const delSelect = document.getElementById('admin-delete-group-select');
    const catSelect = document.getElementById('admin-category-select');
    const filterCat = document.getElementById('admin-filter-category');
    const tabsContainer = document.getElementById('admin-group-tabs');
    if (!select) return;
    const opts = data.groups.map(g => `<option value="${g.id}">${g.letter} - ${g.name}</option>`).join('');
    select.innerHTML = '<option value="">Vyberte skupinu</option>' + opts;
    if (delSelect) delSelect.innerHTML = '<option value="">Vyberte skupinu</option>' + opts;

    const allCats = new Set(['znacky', 'situace']);
    data.groups.forEach(g => { if (g.categories) Object.keys(g.categories).forEach(k => allCats.add(k)); });
    const catOpts = Array.from(allCats).map(c => {
        let label = c; if (c === 'znacky') label = 'Dopravní značky'; else if (c === 'situace') label = 'Dopravní situace';
        return `<option value="${c}">${label}</option>`;
    }).join('');
    if (catSelect) catSelect.innerHTML = '<option value="">Nejprve vyberte skupinu</option>' + catOpts;
    if (filterCat) filterCat.innerHTML = '<option value="">Všechny kategorie</option>' + catOpts;

    if (tabsContainer) {
        if (data.groups.length === 0) { tabsContainer.innerHTML = '<li class="text-white-50 small">Zatím žádné skupiny.</li>'; return; }
        tabsContainer.innerHTML = data.groups.map((g, idx) => `<li class="nav-item"><button class="nav-link ${idx === 0 ? 'active' : ''}" data-group-id="${g.id}"
            style="background:${idx === 0 ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.05)'};color:${idx === 0 ? '#ff6b00' : 'rgba(255,255,255,0.7)'};
            border:1px solid ${idx === 0 ? 'rgba(255,107,0,0.3)' : 'rgba(255,255,255,0.1)'};border-radius:0.5rem;padding:0.3rem 0.8rem;font-size:0.75rem;font-weight:600;cursor:pointer;">
            <i class="fas fa-car me-1"></i>${g.letter}</button></li>`).join('');
        tabsContainer.querySelectorAll('[data-group-id]').forEach(btn => {
            btn.addEventListener('click', function() {
                tabsContainer.querySelectorAll('[data-group-id]').forEach(b => { b.style.background = 'rgba(255,255,255,0.05)'; b.style.color = 'rgba(255,255,255,0.7)'; b.style.borderColor = 'rgba(255,255,255,0.1)'; });
                this.style.background = 'rgba(255,107,0,0.2)'; this.style.color = '#ff6b00'; this.style.borderColor = 'rgba(255,107,0,0.3)';
                select.value = this.dataset.groupId;
                const cs = document.getElementById('admin-category-select');
                if (cs) cs.disabled = false;
                displayAdminQuestions(this.dataset.groupId, null);
            });
        });
        if (data.groups.length > 0) { select.value = data.groups[0].id; const cs = document.getElementById('admin-category-select'); if (cs) cs.disabled = false; displayAdminQuestions(data.groups[0].id, null); }
    }
    select.addEventListener('change', function() {
        const gid = this.value;
        const cs = document.getElementById('admin-category-select');
        if (cs) { cs.disabled = !gid; cs.value = ''; }
        displayAdminQuestions(gid, null);
        if (tabsContainer && gid) {
            tabsContainer.querySelectorAll('[data-group-id]').forEach(b => {
                b.style.background = 'rgba(255,255,255,0.05)'; b.style.color = 'rgba(255,255,255,0.7)'; b.style.borderColor = 'rgba(255,255,255,0.1)';
                if (b.dataset.groupId === gid) { b.style.background = 'rgba(255,107,0,0.2)'; b.style.color = '#ff6b00'; b.style.borderColor = 'rgba(255,107,0,0.3)'; }
            });
        }
    });
}

function displayAdminQuestions(groupId, category) {
    const container = document.getElementById('admin-questions-list');
    if (!container) return;
    if (!groupId) { container.innerHTML = '<div class="empty-state"><i class="fas fa-arrow-left"></i><p>Vyberte skupinu.</p></div>'; return; }
    const data = getAppData();
    const group = data.groups.find(g => g.id === groupId);
    if (!group) { container.innerHTML = '<div class="empty-state"><p>Skupina nenalezena.</p></div>'; return; }
    let questions = [];
    Object.keys(group.categories || {}).forEach(key => {
        if (!category || category === key) (group.categories[key] || []).forEach(q => questions.push({ ...q, catKey: key }));
    });
    if (questions.length === 0) { container.innerHTML = '<div class="empty-state"><i class="fas fa-question-circle"></i><p>Žádné otázky.</p></div>'; return; }
    const letters = ['A', 'B', 'C'];
    container.innerHTML = questions.map((q, idx) => {
        let cn = q.catKey; if (cn === 'znacky') cn = 'Značky'; else if (cn === 'situace') cn = 'Situace'; else cn = cn.charAt(0).toUpperCase() + cn.slice(1);
        return `<div class="question-item" style="padding:0.75rem;animation-delay:${idx*0.03}s">
            <div class="d-flex justify-content-between align-items-start gap-2">
                <div><div class="q-text" style="font-size:0.8rem;">${q.question}</div>
                <div class="q-meta" style="font-size:0.75rem;"><span class="question-counter" style="font-size:0.7rem;">${cn}</span>
                <span class="ms-2">Správně: <span class="q-correct">${letters[q.correctIndex]}: ${q.options[q.correctIndex].replace(/^[A-C]:\s*/, '')}</span></span>
                ${q.imageUrl ? '<span class="ms-2"><i class="fas fa-image" style="color:#ff6b00;"></i></span>' : ''}
                ${q.explanation ? '<span class="ms-2"><i class="fas fa-lightbulb" style="color:#fbbf24;"></i></span>' : ''}</div></div>
                <button class="delete-btn" data-qid="${q.id}" data-gid="${groupId}" data-cat="${q.catKey}" style="padding:0.2rem 0.4rem;"><i class="fas fa-trash-alt" style="font-size:0.8rem;"></i></button></div></div>`;
    }).join('');
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() { if (confirm('Smazat otázku?')) deleteQuestion(this.dataset.gid, this.dataset.cat, this.dataset.qid); });
    });
}

function deleteQuestion(groupId, category, qId) {
    const data = getAppData();
    const group = data.groups.find(g => g.id === groupId);
    if (!group || !group.categories[category]) return;
    const idx = group.categories[category].findIndex(q => q.id === qId);
    if (idx !== -1) { group.categories[category].splice(idx, 1); saveAppData(data); }
    displayAdminQuestions(document.getElementById('admin-group-select')?.value || groupId, null);
}

function addNewGroup(letter, name) {
    const data = getAppData();
    if (data.groups.find(g => g.letter.toUpperCase() === letter.toUpperCase())) return { success: false, message: 'Skupina již existuje.' };
    const defaultCats = {};
    data.availableCategories.forEach(c => { defaultCats[c] = []; });
    data.groups.push({ id: 'group_' + letter.toLowerCase(), letter: letter.toUpperCase(), name, categories: defaultCats });
    saveAppData(data);
    return { success: true, message: `Skupina ${letter.toUpperCase()} přidána.` };
}

function addNewQuestion(groupId, category, questionText, options, correctIndex, imageUrl, explanation) {
    const data = getAppData();
    const group = data.groups.find(g => g.id === groupId);
    if (!group) return { success: false, message: 'Skupina nenalezena.' };
    if (!group.categories[category]) group.categories[category] = [];
    const formatted = options.map((opt, idx) => { const l = String.fromCharCode(65 + idx); return opt.startsWith(l + ':') ? opt : l + ': ' + opt; });
    group.categories[category].push({ id: generateId(), question: questionText, imageUrl: imageUrl || '', options: formatted, correctIndex, category, explanation: explanation || '' });
    saveAppData(data);
    const sel = document.getElementById('admin-group-select');
    const cs = document.getElementById('admin-category-select');
    if (sel && cs) displayAdminQuestions(sel.value, cs.value);
    return { success: true, message: 'Otázka přidána.' };
}

function deleteGroup(groupId) {
    const data = getAppData();
    const idx = data.groups.findIndex(g => g.id === groupId);
    if (idx === -1) return { success: false, message: 'Skupina nenalezena.' };
    data.groups.splice(idx, 1); saveAppData(data);
    return { success: true, message: 'Skupina smazána.' };
}

function addNewCategory(categoryKey, categoryLabel) {
    const data = getAppData();
    if (data.availableCategories.includes(categoryKey)) return { success: false, message: 'Kategorie již existuje.' };
    data.availableCategories.push(categoryKey);
    data.groups.forEach(g => { if (!g.categories[categoryKey]) g.categories[categoryKey] = []; });
    saveAppData(data);
    return { success: true, message: `Kategorie "${categoryLabel}" přidána ke všem skupinám.` };
}

function resetDatabase() {
    localStorage.removeItem(APP_DATA_KEY);
    localStorage.removeItem(APP_USERS_KEY);
    localStorage.removeItem(APP_SESSION_KEY);
    const keys = Object.keys(localStorage);
    keys.forEach(k => {
        if (k.startsWith('autoskolaProProgress_') || k.startsWith('autoskolaProWrong_') || k.startsWith('autoskolaProCorrectTrack_')) localStorage.removeItem(k);
    });
    initAppData();
    const users = getUsers();
    const ceo = users.find(u => u.isCEO);
    if (ceo) saveSession({ userId: ceo.id, email: ceo.email, name: ceo.name, isCEO: true, loggedInAt: new Date().toISOString() });
}

// ==========================================
// ADMIN EVENT BINDINGS
// ==========================================
function initializeAdminPanel() {
    if (!checkAdminAccess()) return;
    adminLoadGroups();

    document.getElementById('admin-filter-category')?.addEventListener('change', function() {
        displayAdminQuestions(document.getElementById('admin-group-select')?.value, this.value);
    });

    document.getElementById('add-group-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const letter = document.getElementById('group-letter').value.trim().toUpperCase();
        const name = document.getElementById('group-name').value.trim();
        if (!letter || !name) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyplňte všechna pole.', 'OK'); return; }
        const r = addNewGroup(letter, name);
        if (r.success) { showInfoModal('fa-check-circle', 'Hotovo', r.message, 'OK'); document.getElementById('group-letter').value = ''; document.getElementById('group-name').value = ''; adminLoadGroups(); }
        else showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'OK');
    });

    document.getElementById('add-category-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const key = document.getElementById('category-key').value.trim().toLowerCase().replace(/\s+/g, '_');
        const label = document.getElementById('category-label').value.trim();
        if (!key || !label) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyplňte obě pole.', 'OK'); return; }
        const r = addNewCategory(key, label);
        if (r.success) { showInfoModal('fa-check-circle', 'Hotovo', r.message, 'OK'); document.getElementById('category-key').value = ''; document.getElementById('category-label').value = ''; adminLoadGroups(); }
        else showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'OK');
    });

    document.getElementById('add-question-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const groupId = document.getElementById('admin-group-select').value;
        const category = document.getElementById('admin-category-select').value;
        const question = document.getElementById('question-text').value.trim();
        const a = document.getElementById('option-a').value.trim();
        const b = document.getElementById('option-b').value.trim();
        const c = document.getElementById('option-c').value.trim();
        const img = document.getElementById('question-image').value.trim();
        const expl = document.getElementById('question-explanation').value.trim();
        const cr = document.querySelector('input[name="correct-answer"]:checked');
        if (!cr) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Označte správnou odpověď.', 'OK'); return; }
        const ci = parseInt(cr.value);
        if (!groupId || !category) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyberte skupinu a kategorii.', 'OK'); return; }
        if (!question || !a || !b || !c) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyplňte všechny údaje.', 'OK'); return; }
        const r = addNewQuestion(groupId, category, question, [a, b, c], ci, img, expl);
        if (r.success) {
            showInfoModal('fa-check-circle', 'Hotovo', r.message, 'OK');
            ['question-text','option-a','option-b','option-c','question-image','question-explanation'].forEach(id => document.getElementById(id).value = '');
            const checked = document.querySelector('input[name="correct-answer"]:checked');
            if (checked) checked.checked = false;
        } else showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'OK');
    });

    document.getElementById('delete-group-btn')?.addEventListener('click', function() {
        const sel = document.getElementById('admin-delete-group-select');
        const gid = sel?.value;
        if (!gid) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyberte skupinu.', 'OK'); return; }
        if (confirm('Opravdu smazat skupinu i s otázkami?')) {
            const r = deleteGroup(gid);
            if (r.success) { showInfoModal('fa-check-circle', 'Hotovo', r.message, 'OK'); adminLoadGroups(); }
            else showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'OK');
        }
    });

    document.getElementById('reset-db-btn')?.addEventListener('click', function() {
        if (confirm('⚠️ OPRAVDU chcete resetovat celou databázi? Všechna data budou smazána!')) {
            if (confirm('🔴 Toto je nevratná akce! Všechny otázky, uživatelé a pokrok budou ztraceny. Opravdu pokračovat?')) {
                resetDatabase();
                showInfoModal('fa-check-circle', 'Databáze resetována', 'Všechna data byla smazána a nahrána výchozí data. Stránka se obnoví.', 'OK', () => location.reload());
            }
        }
    });
}

// ==========================================
// PAGE INITIALIZATIONS
// ==========================================
function initializeIndexPage() {
    document.getElementById('contact-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        showInfoModal('fa-check-circle', 'Odesláno', 'Děkujeme za zprávu.', 'OK');
        this.reset();
    });
    renderLeaderboard('leaderboard-container');
}

function initializeLoginPage() {
    document.getElementById('login-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-password').value.trim();
        if (!email || !pass) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyplňte všechny údaje.', 'OK'); return; }
        const r = handleLogin(email, pass);
        if (r.success) {
            Swal.fire({ icon: 'success', title: 'Přihlášen!', timer: 1200, showConfirmButton: false, background: '#1a1a2e', color: '#fff', iconColor: '#22c55e' })
                .then(() => window.location.href = 'app.html');
        } else showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'Zkusit znovu');
    });
}

function initializeRegisterPage() {
    document.getElementById('register-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const pass = document.getElementById('register-password').value.trim();
        const pass2 = document.getElementById('register-password-confirm').value.trim();
        if (!name || !email || !pass || !pass2) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyplňte všechny údaje.', 'OK'); return; }
        if (pass !== pass2) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Hesla se neshodují.', 'OK'); return; }
        if (pass.length < 6) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Heslo min. 6 znaků.', 'OK'); return; }
        const r = handleRegister(name, email, pass);
        if (r.success) {
            Swal.fire({ icon: 'success', title: 'Registrován!', timer: 1200, showConfirmButton: false, background: '#1a1a2e', color: '#fff', iconColor: '#22c55e' })
                .then(() => window.location.href = 'app.html');
        } else showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'Zkusit znovu');
    });
}

function initializeAppPage() {
    if (!getCurrentSession()) { showLoginRequiredModal(); return; }
    displayGroups('group-cards');

    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
        tab.addEventListener('click', function() {
            const target = this.dataset.tab;
            document.querySelectorAll('[data-tab]').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('d-none'));
            document.getElementById(target)?.classList.remove('d-none');
            if (target === 'step-profile') renderProfile();
        });
    });

    document.getElementById('exit-test-btn')?.addEventListener('click', function() {
        const s3 = document.getElementById('step-test-interface');
        const s2 = document.getElementById('step-category-selection');
        if (s3 && s2) { s3.classList.add('d-none'); s2.classList.remove('d-none'); }
    });

    document.getElementById('prev-question-btn')?.addEventListener('click', previousQuestion);
    document.getElementById('next-question-btn')?.addEventListener('click', function() {
        if (testState.currentIndex >= testState.questions.length - 1) showTestResults();
        else nextQuestion();
    });
}

function initializeLeaderboardPage() {
    renderLeaderboard('leaderboard-container-full');
}

// ==========================================
// PARTICLES
// ==========================================
function createParticles() {
    if (document.querySelector('.particles')) return;
    const c = document.createElement('div');
    c.className = 'particles';
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*2+2}px;height:${p.style.width};animation-duration:${Math.random()*15+20}s;animation-delay:${Math.random()*15}s;opacity:${Math.random()*0.3+0.1}`;
        c.appendChild(p);
    }
    document.body.appendChild(c);
}

// ==========================================
// DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initAppData();
    AudioFX.init();
    createParticles();
    initializeNavbar();

    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (page === 'login.html') initializeLoginPage();
    else if (page === 'register.html') initializeRegisterPage();
    else if (page === 'app.html') initializeAppPage();
    else if (page === 'admin.html') initializeAdminPanel();
    else if (page === 'leaderboard.html') initializeLeaderboardPage();
    else if (page === 'index.html' || page === '') initializeIndexPage();

    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            const h = this.getAttribute('href');
            if (h !== '#') { e.preventDefault(); document.querySelector(h)?.scrollIntoView({ behavior: 'smooth' }); }
        });
    });
});