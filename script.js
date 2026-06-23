/* ========================================
   AUTOSKOLA PRO - Final v6 (SQLite + Signs)
   ======================================== */

// ==========================================
// CONSTANTS
// ==========================================
const APP_DATA_KEY = 'autoskolaProData';
const APP_USERS_KEY = 'autoskolaProUsers';
const APP_SESSION_KEY = 'autoskolaProSession';
const APP_THEME_KEY = 'autoskolaProTheme';
const APP_SIGNS_KEY = 'autoskolaProSigns';
const CEO_EMAIL = 'scale.czsklol@gmail.com';
const CEO_PASSWORD = 'kokotko123';

const API_URL = window.location.origin + '/api';
const REMOTE_QUESTION_MAX = 1200;
const REMOTE_FETCH_TIMEOUT = 120000;
const REMOTE_INFO_RETRY = 2;

const REMOTE_TOPICS = [
    { key: 'remote_1', icon: 'fa-book', name: 'Pravidla provozu', topic: 1 },
    { key: 'remote_2', icon: 'fa-traffic-light', name: 'Dopravní značky', topic: 2 },
    { key: 'remote_3', icon: 'fa-shield-alt', name: 'Bezpečná jízda', topic: 3 },
    { key: 'remote_4', icon: 'fa-car-crash', name: 'Dopravní situace', topic: 4 },
    { key: 'remote_5', icon: 'fa-tools', name: 'Podmínky provozu vozidel', topic: 5 },
    { key: 'remote_6', icon: 'fa-file-alt', name: 'Předpisy o provozu', topic: 6 },
    { key: 'remote_7', icon: 'fa-heartbeat', name: 'Zdravotnická příprava', topic: 7 }
];

const remoteTopicInfoCache = {};

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

const MOCK_LEADERBOARD = [
    { id: 'mock_1', name: 'Petr Novák', xp: 2840, avatar: '', isCEO: false },
    { id: 'mock_2', name: 'Jana Svobodová', xp: 2150, avatar: '', isCEO: false },
    { id: 'mock_3', name: 'Martin Dvořák', xp: 1890, avatar: '', isCEO: false },
    { id: 'mock_4', name: 'Eva Černá', xp: 1420, avatar: '', isCEO: false },
    { id: 'mock_5', name: 'Tomáš Horák', xp: 980, avatar: '', isCEO: false },
    { id: 'mock_6', name: 'Lucie Procházková', xp: 750, avatar: '', isCEO: false },
    { id: 'mock_7', name: 'Jakub Veselý', xp: 520, avatar: '', isCEO: false },
    { id: 'mock_8', name: 'Kateřina Kučerová', xp: 310, avatar: '', isCEO: false }
];

// ==========================================
// AUDIO (disabled - no sounds)
// ==========================================
const AudioFX = {
    correct: null, wrong: null, fanfare: null, achievement: null,
    init() {},
    play(s) {}
};

// ==========================================
// THEME
// ==========================================
function initTheme() {
    const s = localStorage.getItem(APP_THEME_KEY);
    if (s === 'light') document.documentElement.setAttribute('data-theme','light');
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem(APP_THEME_KEY,'dark'); }
}
function toggleTheme() {
    const c = localStorage.getItem(APP_THEME_KEY);
    if (c === 'light') { document.documentElement.removeAttribute('data-theme'); localStorage.setItem(APP_THEME_KEY,'dark'); }
    else { document.documentElement.setAttribute('data-theme','light'); localStorage.setItem(APP_THEME_KEY,'light'); }
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.innerHTML = localStorage.getItem(APP_THEME_KEY)==='light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// ==========================================
// DATA
// ==========================================
function initAppData() {
    if (!localStorage.getItem(APP_USERS_KEY)) {
        localStorage.setItem(APP_USERS_KEY, JSON.stringify([{
            id: 'ceo_001', email: CEO_EMAIL, password: CEO_PASSWORD,
            name: 'CEO Majitel', isCEO: true, registeredAt: new Date().toISOString(),
            xp: 0, bestScore: 0, achievements: [], streak: 0, bestStreak: 0, totalAnswered: 0, avatar: ''
        }]));
    }
    const defaultData = {
        groups: [
            { id: 'group_online', letter: 'B', name: 'Skupina B', categories: {} }
        ],
        availableCategories: ['znacky', 'situace']
    };
    if (!localStorage.getItem(APP_DATA_KEY)) {
        localStorage.setItem(APP_DATA_KEY, JSON.stringify(defaultData));
    } else {
        const existingData = getAppData();
        existingData.groups = (existingData.groups || []).filter(g => !['group_b', 'group_c', 'group_am'].includes(g.id));
        let online = existingData.groups.find(g => g.id === 'group_online');
        if (!online) {
            existingData.groups.push(defaultData.groups[0]);
        } else {
            online.letter = 'B';
            online.name = 'Skupina B';
            if (!online.categories) online.categories = {};
        }
        const mergedData = mergeDefaultAppData(existingData, defaultData);
        saveAppData(mergedData);
    }
    // Inicializovat značky
    if (!localStorage.getItem(APP_SIGNS_KEY)) {
        localStorage.setItem(APP_SIGNS_KEY, JSON.stringify({ categories: [], signs: [] }));
    }
}

function mergeDefaultAppData(existing, defaults) {
    if (!existing || typeof existing !== 'object') return defaults;
    if (!existing.groups) existing.groups = [];
    if (!existing.availableCategories) existing.availableCategories = [];
    for (const cat of defaults.availableCategories || []) {
        if (!existing.availableCategories.includes(cat)) existing.availableCategories.push(cat);
    }
    for (const defGroup of defaults.groups || []) {
        let group = existing.groups.find(g => g.id === defGroup.id);
        if (!group) {
            existing.groups.push(defGroup);
            continue;
        }
        if (!group.categories) group.categories = {};
        for (const [catKey, defQuestions] of Object.entries(defGroup.categories || {})) {
            if (!group.categories[catKey]) group.categories[catKey] = [];
            const existingIds = new Set((group.categories[catKey] || []).map(q => q.id));
            for (const q of defQuestions) {
                if (!existingIds.has(q.id)) group.categories[catKey].push(q);
            }
        }
    }
    return existing;
}

function generateId() { return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,9); }
function getAppData() { try { return JSON.parse(localStorage.getItem(APP_DATA_KEY)) || { groups: [], availableCategories: ['znacky','situace'] }; } catch { return { groups: [], availableCategories: ['znacky','situace'] }; } }
function saveAppData(d) { localStorage.setItem(APP_DATA_KEY, JSON.stringify(d)); }
function getUsers() { try { return JSON.parse(localStorage.getItem(APP_USERS_KEY)) || []; } catch { return []; } }
function saveUsers(u) { localStorage.setItem(APP_USERS_KEY, JSON.stringify(u)); }
function getCurrentSession() { try { return JSON.parse(localStorage.getItem(APP_SESSION_KEY)) || null; } catch { return null; } }
function saveSession(s) { if (s) localStorage.setItem(APP_SESSION_KEY, JSON.stringify(s)); else localStorage.removeItem(APP_SESSION_KEY); }
function getCurrentUser() {
    const s = getCurrentSession(); if (!s) return null; return getUsers().find(u => u.id === s.userId) || null;
}

// ==========================================
// SIGNS DATA (Dopravní značky)
// ==========================================
function getSignsData() {
    try { return JSON.parse(localStorage.getItem(APP_SIGNS_KEY)) || { categories: [], signs: [] }; }
    catch { return { categories: [], signs: [] }; }
}
function saveSignsData(d) { localStorage.setItem(APP_SIGNS_KEY, JSON.stringify(d)); }

function addSignCategory(name, icon) {
    const data = getSignsData();
    if (data.categories.find(c => c.name === name)) return { success: false, message: 'Kategorie již existuje.' };
    data.categories.push({ id: generateId(), name, icon: icon || 'fa-triangle-exclamation' });
    saveSignsData(data);
    return { success: true, message: `Kategorie "${name}" přidána.` };
}

function deleteSignCategory(catId) {
    const data = getSignsData();
    data.categories = data.categories.filter(c => c.id !== catId);
    data.signs = data.signs.filter(s => s.categoryId !== catId);
    saveSignsData(data);
}

function addSign(categoryId, name, imageUrl, description) {
    const data = getSignsData();
    if (!data.categories.find(c => c.id === categoryId)) return { success: false, message: 'Kategorie neexistuje.' };
    data.signs.push({
        id: generateId(),
        categoryId,
        name,
        imageUrl: imageUrl || '',
        description: description || ''
    });
    saveSignsData(data);
    return { success: true, message: `Značka "${name}" přidána.` };
}

function deleteSign(signId) {
    const data = getSignsData();
    data.signs = data.signs.filter(s => s.id !== signId);
    saveSignsData(data);
}

// ==========================================
// API VOLÁNÍ
// ==========================================
async function apiGet(url) {
    try {
        const resp = await fetch(API_URL + url);
        return await resp.json();
    } catch(e) {
        return { success: false, message: e.message };
    }
}

async function fetchWithTimeout(url, options = {}, timeout = REMOTE_FETCH_TIMEOUT) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { signal: controller.signal, ...options });
        return response;
    } finally {
        clearTimeout(id);
    }
}

async function apiPost(url, data) {
    try {
        const resp = await fetch(API_URL + url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await resp.json();
    } catch(e) {
        return { success: false, message: e.message };
    }
}

async function apiPut(url, data) {
    try {
        const resp = await fetch(API_URL + url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await resp.json();
    } catch(e) {
        return { success: false, message: e.message };
    }
}

async function getRemoteTopicInfo(topicId) {
    if (remoteTopicInfoCache[topicId]) return remoteTopicInfoCache[topicId];
    let lastError = null;
    for (let attempt = 1; attempt <= REMOTE_INFO_RETRY; attempt++) {
        try {
            const resp = await fetchWithTimeout(`${API_URL}/remote-group-info?topic=${topicId}`);
            const data = await resp.json();
            if (!data.success) throw new Error(data.message || 'Nepodařilo se načíst info tématu');
            remoteTopicInfoCache[topicId] = data;
            return data;
        } catch (e) {
            lastError = e;
            if (attempt < REMOTE_INFO_RETRY) await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    throw lastError || new Error('Nepodařilo se načíst info tématu');
}

// ==========================================
// SYNC S DATABÁZÍ
// ==========================================
async function syncUsersFromDB() {
    const result = await apiGet('/users');
    if (result.success && result.users) {
        const local = getUsers();
        result.users.forEach(du => {
            const ex = local.find(u => u.id === du.id);
            if (ex) {
                ex.xp = Math.max(ex.xp || 0, du.xp || 0);
                ex.bestScore = Math.max(ex.bestScore || 0, du.bestScore || 0);
                ex.totalAnswered = Math.max(ex.totalAnswered || 0, du.totalAnswered || 0);
            } else {
                local.push(du);
            }
        });
        saveUsers(local);
        return true;
    }
    return false;
}

async function syncUserToDB(userId, data) {
    const result = await apiPut('/users/' + userId, data);
    if (result.success && result.user) {
        const local = getUsers();
        const idx = local.findIndex(u => u.id === userId);
        if (idx !== -1) {
            Object.assign(local[idx], result.user);
            saveUsers(local);
        }
        return true;
    }
    return false;
}

// ==========================================
// XP & LEVELS
// ==========================================
function addXP(amount) {
    const u = getCurrentUser(); if (!u) return null;
    const nx = (u.xp||0)+amount; const ol = getLevel(u.xp||0); const nl = getLevel(nx);
    updateCurrentUser({xp:nx});
    if (nl.level > ol.level) { showLevelUpNotification(nl); }
    updateNavbarXP();
    return {xp:nx, level:nl};
}
function getLevel(xp) { let l = LEVELS[0]; for (const x of LEVELS) { if (xp >= x.xpNeeded) l = x; } return l; }
function getXPProgress(xp) {
    const c = getLevel(xp); const ni = LEVELS.findIndex(l => l.level===c.level)+1;
    if (ni >= LEVELS.length) return {current:c, next:null, progress:100, xpInLevel:0, xpNeeded:1};
    const n = LEVELS[ni]; return {c,n,progress:Math.min(100,Math.round(((xp-c.xpNeeded)/(n.xpNeeded-c.xpNeeded)*100))),xpInLevel:xp-c.xpNeeded,xpNeeded:n.xpNeeded-c.xpNeeded};
}
function showLevelUpNotification(l) {
    if (typeof Swal !== 'undefined') Swal.fire({icon:'success',title:`🎉 Level ${l.level}: ${l.title}!`,text:`Postoupil jsi na úroveň ${l.title}!`,timer:3000,showConfirmButton:false,background:'#1a1a2e',color:'#fff',iconColor:'#fbbf24',customClass:{popup:'animate__animated animate__bounceIn'}});
}
function checkAchievement(id) {
    const u = getCurrentUser(); if (!u) return false;
    const a = u.achievements||[]; if (a.includes(id)) return false;
    const ach = Object.values(ACHIEVEMENTS).find(x => x.id===id); if (!ach) return false;
    a.push(id); updateCurrentUser({achievements:a}); addXP(ach.xpReward);
    if (typeof Swal !== 'undefined') Swal.fire({icon:'success',title:`🏆 ${ach.title}!`,html:`<div style="font-size:3rem;margin-bottom:0.5rem;"><i class="fas ${ach.icon}"></i></div><p>${ach.desc}<br><small style="color:#fbbf24;">+${ach.xpReward} XP</small></p>`,timer:4000,showConfirmButton:false,background:'#1a1a2e',color:'#fff',iconColor:'#fbbf24',customClass:{popup:'animate__animated animate__bounceIn'}});
    return true;
}
function updateStreak(correct) {
    const u = getCurrentUser(); if (!u) return 0;
    let s = u.streak||0; if (correct) { s++; if (s>=5) checkAchievement('streak_5'); } else s = 0;
    updateCurrentUser({streak:s, bestStreak:Math.max(u.bestStreak||0,s)}); return s;
}
function getStreakDisplay() {
    const u = getCurrentUser(); if (!u) return null; const s = u.streak||0;
    if (s >= 3) return {count:s, text:'Jedeš bomby! 🔥'}; return null;
}

// ==========================================
// AUTH
// ==========================================
async function handleLogin(email, password) {
    const result = await apiPost('/login', { email, password });
    if (result.success) {
        const u = result.user;
        const users = getUsers();
        const ex = users.find(x => x.id === u.id);
        if (ex) Object.assign(ex, u);
        else users.push(u);
        saveUsers(users);
        saveSession({userId: u.id, email: u.email, name: u.name, isCEO: u.isCEO, loggedInAt: new Date().toISOString()});
        return {success: true, message: 'Přihlášení proběhlo úspěšně!', isCEO: u.isCEO};
    }
    return {success: false, message: result.message || 'Nesprávný email nebo heslo.'};
}

async function handleRegister(name, email, password) {
    const result = await apiPost('/register', { name, email, password });
    if (result.success) {
        const u = result.user;
        const users = getUsers();
        users.push(u);
        saveUsers(users);
        saveSession({userId: u.id, email: u.email, name: u.name, isCEO: false, loggedInAt: new Date().toISOString()});
        return {success: true, message: 'Registrace proběhla úspěšně!', isCEO: false};
    }
    return {success: false, message: result.message || 'Registrace selhala.'};
}

function updateCurrentUser(upd) {
    const s = getCurrentSession(); if (!s) return;
    const users = getUsers(); const idx = users.findIndex(u => u.id === s.userId); if (idx === -1) return;
    Object.assign(users[idx], upd); saveUsers(users);
    if (upd.name) { s.name = upd.name; saveSession(s); }
    if (upd.email) { s.email = upd.email; saveSession(s); }
    syncUserToDB(s.userId, upd);
}

// ==========================================
// LEADERBOARD
// ==========================================
async function renderLeaderboard(containerId) {
    const c = document.getElementById(containerId); if (!c) return;
    const result = await apiGet('/users');
    let players = [];
    if (result.success && result.users && result.users.length > 0 && result.users.some(u => u.xp > 0)) {
        players = result.users.map(u => ({name: u.name, xp: u.xp || 0, avatar: u.avatar || '', isCEO: u.isCEO || false}))
            .sort((a,b) => b.xp - a.xp).slice(0, 10);
        const local = getUsers();
        result.users.forEach(du => {
            const ex = local.find(u => u.id === du.id);
            if (ex) Object.assign(ex, du);
            else local.push(du);
        });
        saveUsers(local);
    } else {
        const users = getUsers();
        if (users && users.length > 0 && users.some(u => u.xp > 0)) {
            players = users.map(u => ({name: u.name, xp: u.xp || 0, avatar: u.avatar || '', isCEO: u.isCEO || false}))
                .sort((a,b) => b.xp - a.xp).slice(0, 10);
        }
    }
    if (players.length === 0) players = MOCK_LEADERBOARD;
    const ln = ['','Chodec','Žák','Řidič','Závodník','Profesionál','Mistr silnic','Legenda','Bůh volantu'];
    c.innerHTML = `<div class="table-responsive"><table class="leaderboard-table"><thead><tr><th style="width:50px;">#</th><th>Hráč</th><th style="width:120px;">Level</th><th style="width:100px;">XP</th></tr></thead><tbody>${
        players.map((p,i)=>{
            const r=i+1; const lv=getLevel(p.xp||0); const lvName=ln[lv.level]||'Chodec';
            let rc='rank-default',m=''; if(r===1){rc='rank-1';m='🥇'}else if(r===2){rc='rank-2';m='🥈'}else if(r===3){rc='rank-3';m='🥉'}
            const ah=p.avatar?`<img src="${p.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:0.5rem;">`
                :`<div style="width:28px;height:28px;border-radius:50%;background:rgba(255,107,0,0.15);display:inline-flex;align-items:center;justify-content:center;margin-right:0.5rem;font-size:0.75rem;color:#ff6b00;font-weight:700;flex-shrink:0;">${(p.name||'?').charAt(0)}</div>`;
const crown = p.isCEO ? '<i class="fas fa-crown" style="color:#fbbf24;"></i>' : '';
const devBadge = p.isCEO ? '<span style="font-size:0.75rem;font-weight:700;color:#ff8c00;border:1.5px solid #ff8c00;background-color:rgba(255, 140, 0, 0.15);padding:2px 8px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px;">Dev</span>' : '';

return `<tr class="animate__animated animate__fadeIn" style="animation-delay:${i*0.05}s;">
    <td>
        <span class="leaderboard-rank ${rc}" style="width:36px;height:36px;font-size:0.9rem;">${m||r}</span>
    </td>
    <td>
        <div style="display:flex;align-items:center;">
            ${ah}
            <div>
                <div style="display:flex;align-items:center;gap:6px;font-weight:600;font-size:0.9rem;color:var(--text-primary);">
                    ${p.name||'Neznámý'}
                    ${crown}
                    ${devBadge}
                </div>
            </div>
        </div>
    </td>
    <td>
        <span style="color:var(--accent);font-weight:700;font-size:0.85rem;">${lvName}</span>
    </td>
    <td>
        <span style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">${(p.xp||0).toLocaleString()}</span>
        <span style="font-size:0.65rem;color:var(--text-muted);display:block;">XP</span>
    </td>
</tr>`;
        }).join('')}</tbody></table></div>`;
}

// ==========================================
// MODALS
// ==========================================
function showInfoModal(icon, title, msg, btnText, cb) {
    const o = document.createElement('div'); o.className='modal-overlay active';
    o.innerHTML=`<div class="modal-content animate__animated animate__bounceIn"><div class="modal-icon"><i class="fas ${icon}"></i></div><h3>${title}</h3><p>${msg}</p><button class="btn-autoskola modal-close-btn">${btnText||'OK'}</button></div>`;
    document.body.appendChild(o);
    o.querySelector('.modal-close-btn').addEventListener('click',function(){o.remove();if(cb)cb();});
    o.addEventListener('click',function(e){if(e.target===o){o.remove();if(cb)cb();}});
}
function showLoginRequiredModal() {
    const o=document.createElement('div');o.className='modal-overlay active';
    o.innerHTML=`<div class="modal-content animate__animated animate__bounceIn"><div class="modal-icon"><i class="fas fa-lock"></i></div><h3>Přístup omezen</h3><p>Pro přístup k testům se musíte přihlásit nebo registrovat.</p><div class="d-flex gap-3 justify-content-center flex-wrap"><a href="login.html" class="btn-autoskola">Přihlásit</a><a href="register.html" class="btn-autoskola btn-autoskola-outline">Registrovat</a></div></div>`;
    document.body.appendChild(o); o.addEventListener('click',function(e){if(e.target===o)o.remove();});
}
function showLoadingScreen(cbOrText, duration=1500) {
    const o=document.createElement('div');o.className='loading-overlay active';
    const text = typeof cbOrText === 'string' ? cbOrText : 'Generuji tvůj test...';
    o.innerHTML=`<div class="loading-spinner-wheel"><i class="fas fa-car-side"></i></div><div class="loading-text">${text}</div><div class="loading-spinner"></div>`;
    document.body.appendChild(o);
    if (typeof cbOrText === 'function') {
        setTimeout(()=>{o.remove();cbOrText();},duration);
    }
    return o;
}

// ==========================================
// NAVBAR
// ==========================================
function initializeNavbar() {
    const p = document.getElementById('navbar-placeholder'); if (!p) return;
    const session = getCurrentSession(); const user = getCurrentUser();
    const page = window.location.pathname.split('/').pop() || 'index.html';
    let desktopUser = '';
    let mobileUserSection = '';
    if (session) {
        const lv = getLevel(user?.xp||0); const prog = getXPProgress(user?.xp||0);
        const initial = (session.name||'?').charAt(0).toUpperCase();
        const xpPct = prog.progress;
        desktopUser = `
            <div style="position:relative;">
                <div class="user-btn" id="userMenuBtn">
                    <div class="user-avatar">${initial}</div>
                    <div>
                        <div style="font-size:0.85rem;font-weight:600;line-height:1.2;">${session.name||session.email}</div>
                        <div class="user-xp-bar"><div class="fill" style="width:${xpPct}%;"></div></div>
                    </div>
                    <span class="user-level">Lv.${lv.level}</span>
                    <i class="fas fa-chevron-down" style="font-size:0.6rem;opacity:0.6;transition:transform 0.3s;"></i>
                </div>
                <div class="user-dropdown" id="userDropdown">
                    <div style="padding:0.5rem 0.7rem;border-bottom:1px solid var(--border-color);margin-bottom:0.25rem;">
                        <div style="font-weight:600;font-size:0.85rem;">${session.name||session.email}</div>
                        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.15rem;">Lv.${lv.level} ${lv.title} &middot; ${user?.xp||0} XP</div>
                        <div style="margin-top:0.4rem;width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
                            <div style="height:100%;width:${xpPct}%;background:linear-gradient(90deg,var(--accent),#fbbf24);border-radius:2px;"></div>
                        </div>
                    </div>
                    <button class="user-dropdown-item" onclick=\"window.location.href='app.html'\">
                        <i class="fas fa-car" style="color:var(--accent);"></i> Aplikace
                    </button>
                    ${session.isCEO ? `
                    <button class="user-dropdown-item" onclick=\"window.location.href='admin.html'\">
                        <i class="fas fa-shield-alt" style="color:var(--accent);"></i> Admin panel
                    </button>` : ''}
                    <button class="user-dropdown-item danger" id="logoutBtnDesktop">
                        <i class="fas fa-sign-out-alt"></i> Odhlásit
                    </button>
                </div>
            </div>`;
        mobileUserSection = `
            <div class="mobile-user-section">
                <div class="user-btn" style="justify-content:center;margin-bottom:0.5rem;">
                    <div class="user-avatar">${initial}</div>
                    <div>
                        <div style="font-size:0.85rem;font-weight:600;line-height:1.2;">${session.name||session.email}</div>
                        <div style="font-size:0.65rem;color:var(--text-muted);">Lv.${lv.level} ${lv.title} &middot; ${user?.xp||0} XP</div>
                    </div>
                </div>
                <a class="nav-link active" href="app.html"><i class="fas fa-car"></i>Aplikace</a>
                ${session.isCEO ? `<a class="nav-link" href="admin.html"><i class="fas fa-shield-alt"></i>Admin panel</a>` : ''}
                <a class="nav-link" href="#" id="logoutBtnMobile" style="color:#ef4444;"><i class="fas fa-sign-out-alt"></i>Odhlásit</a>
            </div>`;
    } else {
        desktopUser = `
            <a class="nav-link ${page==='login.html'?'active':''}" href="login.html" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;color:var(--text-secondary);text-decoration:none;font-weight:500;font-size:0.9rem;border-radius:0.5rem;transition:all 0.2s;"><i class="fas fa-sign-in-alt"></i>Přihlásit</a>
            <a class="nav-link ${page==='register.html'?'active':''}" href="register.html" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 0.75rem;color:var(--text-secondary);text-decoration:none;font-weight:500;font-size:0.9rem;border-radius:0.5rem;transition:all 0.2s;"><i class="fas fa-user-plus"></i>Registrovat</a>`;
        mobileUserSection = `
            <div class="mobile-user-section">
                <a class="nav-link ${page==='login.html'?'active':''}" href="login.html"><i class="fas fa-sign-in-alt"></i>Přihlásit</a>
                <a class="nav-link ${page==='register.html'?'active':''}" href="register.html"><i class="fas fa-user-plus"></i>Registrovat</a>
            </div>`;
    }
    p.innerHTML = `
        <nav class="navbar">
            <div class="container">
                <a class="navbar-brand" href="index.html">
                    <i class="fas fa-graduation-cap" style="color:#ff6b00;font-size:1.3rem;"></i>
                    <span style="background:linear-gradient(135deg,#fff,#ff6b00);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">Autoškola Pro</span>
                </a>
                <ul class="nav-links">
                    <li><a class="nav-link ${page==='index.html'?'active':''}" href="index.html"><i class="fas fa-home"></i>Domů</a></li>
                    <li><a class="nav-link app-link ${page==='app.html'?'active':''}" href="#"><i class="fas fa-car"></i>Aplikace</a></li>
                    <li><a class="nav-link ${page==='leaderboard.html'?'active':''}" href="leaderboard.html"><i class="fas fa-trophy"></i>Žebříček</a></li>
                </ul>
                <div class="nav-right">
                    <button class="theme-toggle" id="themeToggleBtn" title="Přepnout režim">
                        ${localStorage.getItem(APP_THEME_KEY)==='light'?'<i class="fas fa-moon"></i>':'<i class="fas fa-sun"></i>'}
                    </button>
                    ${desktopUser}
                    <button class="nav-hamburger" id="navHamburger" aria-label="Menu">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
            </div>
            <div class="nav-mobile-menu" id="navMobileMenu">
                <a class="nav-link ${page==='index.html'?'active':''}" href="index.html"><i class="fas fa-home"></i>Domů</a>
                <a class="nav-link app-link ${page==='app.html'?'active':''}" href="#"><i class="fas fa-car"></i>Aplikace</a>
                <a class="nav-link ${page==='leaderboard.html'?'active':''}" href="leaderboard.html"><i class="fas fa-trophy"></i>Žebříček</a>
                ${mobileUserSection}
            </div>
        </nav>`;
    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    const nav = document.querySelector('.navbar');
    if (nav) window.addEventListener('scroll', ()=>nav.classList.toggle('scrolled',window.scrollY>50), {passive:true});
    document.querySelectorAll('.app-link').forEach(l=>{
        l.addEventListener('click',function(e){e.preventDefault();if(!getCurrentSession())showLoginRequiredModal();else window.location.href='app.html';});
    });
    document.getElementById('logoutBtnDesktop')?.addEventListener('click',function(e){e.preventDefault();saveSession(null);window.location.href='index.html';});
    document.getElementById('logoutBtnMobile')?.addEventListener('click',function(e){e.preventDefault();saveSession(null);window.location.href='index.html';});
    const hamburger = document.getElementById('navHamburger');
    const mobileMenu = document.getElementById('navMobileMenu');
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = mobileMenu.classList.contains('open');
            if (isOpen) {
                mobileMenu.classList.remove('open');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            } else {
                mobileMenu.classList.add('open');
                hamburger.innerHTML = '<i class="fas fa-times"></i>';
            }
        });
        mobileMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('open');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
        document.addEventListener('click', function(e) {
            if (mobileMenu.classList.contains('open') && !e.target.closest('.navbar')) {
                mobileMenu.classList.remove('open');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }
    const userBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userBtn && userDropdown) {
        userBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = userDropdown.classList.contains('show');
            userDropdown.classList.toggle('show');
            const chevron = this.querySelector('.fa-chevron-down');
            if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });
        userDropdown.addEventListener('click', function(e) { e.stopPropagation(); });
        document.addEventListener('click', function() {
            userDropdown.classList.remove('show');
            const chevron = document.querySelector('#userMenuBtn .fa-chevron-down');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
        });
    }
}

function updateNavbarXP() {
    const u = getCurrentUser(); if (!u) return;
    const lv = getLevel(u.xp||0); const prog = getXPProgress(u.xp||0);
    const fill = document.querySelector('#userMenuBtn .user-xp-bar .fill');
    if (fill) fill.style.width = prog.progress + '%';
    const levelBadge = document.querySelector('#userMenuBtn .user-level');
    if (levelBadge) levelBadge.textContent = 'Lv.' + lv.level;
    const dropFill = document.querySelector('#userDropdown div[style*="background:linear-gradient"]');
    if (dropFill) dropFill.style.width = prog.progress + '%';
    const dropInfo = document.querySelector('#userDropdown div[style*="border-bottom"]');
    if (dropInfo) {
        const xpSpan = dropInfo.querySelector('div:nth-child(2)');
        if (xpSpan) xpSpan.innerHTML = 'Lv.' + lv.level + ' ' + lv.title + ' &middot; ' + (u.xp||0) + ' XP';
    }
}

// ==========================================
// PROFILE
// ==========================================
function renderProfile() {
    const u=getCurrentUser();if(!u)return;const c=document.getElementById('profile-content');if(!c)return;
    const ach=u.achievements||[];const ta=u.totalAnswered||0;
    if(ta>=10)checkAchievement('zelenac');if(ta>=15)checkAchievement('vytrvalec');
    const badges=[
        {id:'zelenac',icon:'fa-seedling',label:'Zelenáč',desc:'Odpověz na první otázku správně.',unlocked:ach.includes('zelenac')},
        {id:'vytrvalec',icon:'fa-person-running',label:'Vytrvalec',desc:'Odpověz na 15 otázek za sebou.',unlocked:ach.includes('vytrvalec')},
        {id:'first_blood',icon:'fa-droplet',label:'První krev',desc:'Odpověz na první otázku správně.',unlocked:ach.includes('first_blood')},
        {id:'streak_5',icon:'fa-fire',label:'Pán Plamene',desc:'Odpověz na 5 otázek za sebou.',unlocked:ach.includes('streak_5')},
        {id:'genius',icon:'fa-brain',label:'Génius',desc:'Odpověz na všechny otázky správně.',unlocked:ach.includes('genius')},
        {id:'clean_slate',icon:'fa-shield-halved',label:'Čistý štít',desc:'Opraveno vše',unlocked:ach.includes('clean_slate')},
        {id:'speedster',icon:'fa-bolt',label:'Rychlík',desc:'Odpověz na otázku za méně než 3 sekundy.',unlocked:ach.includes('speedster')}
    ];
    const lv=getLevel(u.xp||0);const prog=getXPProgress(u.xp||0);
    c.innerHTML=`<div class="row g-3"><div class="col-md-5"><div class="admin-card"><h3><i class="fas fa-user-cog me-2"></i>Upravit profil</h3>
        <form id="profile-form"><div class="mb-2"><label class="text-white-50 small mb-1">Avatar (URL)</label><input type="url" class="admin-input" id="profile-avatar" value="${u.avatar||''}"></div>
        <div class="mb-2"><label class="text-white-50 small mb-1">Jméno</label><input type="text" class="admin-input" id="profile-name" value="${u.name||''}"></div>
        <div class="mb-2"><label class="text-white-50 small mb-1">Email</label><input type="email" class="admin-input" id="profile-email" value="${u.email||''}"></div>
        <div class="mb-2"><label class="text-white-50 small mb-1">Nové heslo</label><input type="password" class="admin-input" id="profile-password" placeholder="Nové heslo"></div>
        <button type="submit" class="btn-autoskola w-100" style="font-size:0.85rem;"><i class="fas fa-save me-2"></i>Uložit</button></form></div></div>
        <div class="col-md-6"><div class="admin-card"><h3><i class="fas fa-medal me-2"></i>Odznaky</h3>
        <p class="text-white-50 small mb-3">Zodpovězeno: <strong style="color:#ff6b00;">${ta}</strong> otázek</p>
            <div class="badges-grid">${badges.map(b=>`<div class="achievement-card ${b.unlocked?'unlocked':'locked'}" title="${b.desc}"><i class="fas ${b.icon}" style="color:${b.unlocked?'#ff6b00':'rgba(255,255,255,0.3)'};"></i><div class="badge-text"><div class="badge-title">${b.label}</div><div class="badge-desc">${b.desc}</div></div></div>`).join('')}</div></div>
                <div class="admin-card"><h3><i class="fas fa-chart-simple me-2"></i>Statistiky</h3>
                <div class="profile-stats">
                    <div class="stat-card">
                        <div class="stat-value"><i class="fas fa-star stat-icon" style="color:#ff6b00;"></i>${u.xp||0}</div>
                        <div class="stat-label">XP</div>
                        <div class="stat-sub">Celkem</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value"><i class="fas fa-award stat-icon" style="color:#22c55e;"></i>${lv.title}</div>
                        <div class="stat-label">Level</div>
                        <div class="stat-sub">Lv. ${lv.level}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value"><i class="fas fa-chart-line stat-icon" style="color:#fbbf24;"></i>${u.bestScore||0}%</div>
                        <div class="stat-label">Nejlepší</div>
                        <div class="stat-sub">Skóre</div>
                    </div>
                </div>
                <div class="mt-2"><div class="progress-bar-custom" style="height:4px;"><div class="progress-fill" style="width:${prog.progress}%"></div></div><div class="progress-info text-white-50 text-center">${prog.xpInLevel} / ${prog.xpNeeded} XP do dalšího levelu</div></div></div></div></div>`;
    document.getElementById('profile-form')?.addEventListener('submit',function(e){
        e.preventDefault();
        const n=document.getElementById('profile-name').value.trim();const em=document.getElementById('profile-email').value.trim();
        const pw=document.getElementById('profile-password').value.trim();const av=document.getElementById('profile-avatar').value.trim();
        if(!n||!em){showInfoModal('fa-exclamation-circle','Chyba','Jméno a email jsou povinné.','OK');return;}
        const upd={name:n,email:em,avatar:av};if(pw)upd.password=pw;
        if(em!==getCurrentUser()?.email){const users=getUsers();if(users.find(u=>u.email===em&&u.id!==getCurrentSession()?.userId)){showInfoModal('fa-exclamation-circle','Chyba','Tento email již používá jiný uživatel.','OK');return;}}
        updateCurrentUser(upd);showInfoModal('fa-check-circle','Uloženo','Profil aktualizován.','OK',()=>{initializeNavbar();renderProfile();});
    });
}

// ==========================================
// TEST LOGIC
// ==========================================
let testState={groupId:null,category:null,questions:[],currentIndex:0,score:0,totalAnswered:0,wrongQuestions:[],isReviewMode:false,answerTimestamps:[],answered:false};

function loadGroups(){return getAppData().groups||[];}
function getAllQuestionsForGroup(gid){const g=getAppData().groups.find(x=>x.id===gid);if(!g)return[];const a=[];Object.keys(g.categories||{}).forEach(k=>{if(Array.isArray(g.categories[k]))a.push(...g.categories[k]);});return a;}
function loadQuestions(gid,cat){
    const g=getAppData().groups.find(x=>x.id===gid);if(!g)return[];
    if(cat==='all'){const a=[];Object.keys(g.categories).forEach(k=>{if(Array.isArray(g.categories[k]))a.push(...g.categories[k]);});return a;}
    if(cat==='wrong'){const ids=getWrongQuestionIds(gid);const a=getAllQuestionsForGroup(gid);return a.filter(q=>ids.includes(q.id));}
    return g.categories[cat]||[];
}
async function getRemoteGroupCount(){
    const results = await Promise.all(REMOTE_TOPICS.map(async rt => {
        try {
            const info = await getRemoteTopicInfo(rt.topic);
            return Number(info.total_questions) || null;
        } catch (e) { return null; }
    }));
    const validCounts = results.filter(count => typeof count === 'number' && !Number.isNaN(count));
    if (validCounts.length === 0) return null;
    return validCounts.reduce((sum, value) => sum + value, 0);
}
async function getGroupProgress(gid){
    const s=getCurrentSession();if(!s)return{total:0,answered:0,percentage:0,unknown:false};
    const p=JSON.parse(localStorage.getItem('autoskolaProProgress_'+s.userId)||'{}');
    const answered = Array.isArray(p[gid]) ? p[gid].length : 0;
    if(gid==='group_online'){
        const total = await getRemoteGroupCount();
        const unknown = total === null;
        return { total: unknown ? 0 : total, answered, percentage: unknown || total === 0 ? 0 : Math.round((answered/total)*100), unknown };
    }
    const a=getAllQuestionsForGroup(gid);if(a.length===0)return{total:0,answered:answered,percentage:0,unknown:false};
    return{total:a.length,answered,percentage:Math.round((answered/a.length)*100),unknown:false};
}
function markQuestionAnswered(gid,qid){const s=getCurrentSession();if(!s)return;const k='autoskolaProProgress_'+s.userId;const d=JSON.parse(localStorage.getItem(k)||'{}');if(!d[gid])d[gid]=[];if(!d[gid].includes(qid))d[gid].push(qid);localStorage.setItem(k,JSON.stringify(d));}
function getSeenQuestionIds(gid){const s=getCurrentSession();if(!s)return[];const d=JSON.parse(localStorage.getItem('autoskolaProProgress_'+s.userId)||'{}');return d[gid]||[];}
function getUnseenQuestions(gid, categoryKey){const all = categoryKey === 'all' ? getAllQuestionsForGroup(gid) : loadQuestions(gid, categoryKey);const seen = new Set(getSeenQuestionIds(gid));return all.filter(q => !seen.has(q.id));}
function getUnseenQuestionCount(gid, categoryKey){return getUnseenQuestions(gid, categoryKey).length;}
function addWrongQuestion(gid,qid){const s=getCurrentSession();if(!s)return;const k='autoskolaProWrong_'+s.userId;const d=JSON.parse(localStorage.getItem(k)||'{}');if(!d[gid])d[gid]=[];if(!d[gid].includes(qid))d[gid].push(qid);localStorage.setItem(k,JSON.stringify(d));}
function getWrongQuestionIds(gid){const s=getCurrentSession();if(!s)return[];const d=JSON.parse(localStorage.getItem('autoskolaProWrong_'+s.userId)||'{}');return d[gid]||[];}

function renderProgressCircle(pct,size=36){const r=(size/2)-4;const c=2*Math.PI*r;const o=c-(pct/100)*c;return`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${pct>0?'#22c55e':'rgba(255,255,255,0.08)'}" stroke-width="3" stroke-dasharray="${c}" stroke-dashoffset="${o}" transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset 0.5s ease;"/></svg>`;}

// ==========================================
// DISPLAY GROUPS (v app.html)
// ==========================================
async function displayGroups(containerId) {
    const c=document.getElementById(containerId);if(!c)return;
    const groups=loadGroups();
    // Přidáme "Dopravní značky" jako první skupinu
    let html = '';
    // Karta pro Dopravní značky
    const signsData = getSignsData();
    const signCount = signsData.signs.length;
    html += `<div class="group-card" data-group-id="group_signs" style="border-color:rgba(255,107,0,0.3);background:linear-gradient(135deg,rgba(255,107,0,0.08),rgba(255,107,0,0.02));">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;">
            <div>
                <div class="group-letter" style="font-size:2.5rem;"><i class="fas fa-traffic-light"></i></div>
                <div class="group-name" style="font-weight:700;">Dopravní značky</div>
            </div>
            <div style="flex-shrink:0;text-align:center;">
                <div style="font-size:1.5rem;font-weight:900;color:var(--accent);">${signCount}</div>
                <div style="font-size:0.7rem;color:var(--text-muted);">značek</div>
            </div>
        </div>
        <div class="group-details">
            <span><i class="fas fa-image me-1"></i>Prohlížení a testy</span>
            <span>${signsData.categories.length} kategorií</span>
        </div>
    </div>`;
    // Ostatní skupiny
    for (const g of groups) {
        const p=await getGroupProgress(g.id);
        const totalText = p.unknown ? '??' : p.total;
        const completionText = p.unknown ? 'Načítám...' : `${p.percentage}%`;
        html += `<div class="group-card" data-group-id="${g.id}"><div style="display:flex;align-items:center;justify-content:space-between;gap:1rem;"><div><div class="group-letter">${g.letter}</div><div class="group-name">${g.name}</div></div><div style="flex-shrink:0;">${renderProgressCircle(p.unknown ? 0 : p.percentage,40)}</div></div><div class="group-details"><span><i class="fas fa-question-circle me-1"></i>${totalText} otázek</span><span>${completionText} dokončeno</span></div></div>`;
    }
    c.innerHTML = html;
    c.querySelectorAll('.group-card').forEach(card=>{
        card.addEventListener('click',function(){
            const gid = this.dataset.groupId;
            if (gid === 'group_signs') {
                showSignCategories();
            } else {
                testState.groupId = gid;
                showCategorySelection(gid);
            }
        });
    });
}

// ==========================================
// DOPRAVNÍ ZNAČKY - PROHLÍŽENÍ
// ==========================================
function showSignCategories() {
    const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface'),s4=document.getElementById('step-test-results'),s5=document.getElementById('step-profile');
    const con=document.getElementById('category-cards');if(!con)return;
    const data = getSignsData();
    const cats = data.categories;
    if (cats.length === 0) {
        con.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Zatím žádné kategorie značek. CEO je může přidat v admin panelu.</p></div>';
    } else {
        con.innerHTML = cats.map(cat => {
            const count = data.signs.filter(s => s.categoryId === cat.id).length;
            return `<div class="category-card" data-sign-cat-id="${cat.id}">
                <div class="category-icon"><i class="fas ${cat.icon || 'fa-triangle-exclamation'}"></i></div>
                <div class="category-content">
                    <div class="category-title">${cat.name}</div>
                    <div class="category-desc">${count} značek</div>
                </div>
                <div class="category-count" style="display:flex;gap:0.25rem;flex-direction:column;align-items:flex-end;">
                    <span>${count}</span>
                    <button class="btn-autoskola btn-autoskola-sm" style="font-size:0.65rem;padding:0.15rem 0.5rem;" onclick="event.stopPropagation();startSignTest('${cat.id}')">
                        <i class="fas fa-question-circle me-1"></i>Test
                    </button>
                </div>
            </div>`;
        }).join('');
        con.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', function() {
                const catId = this.dataset.signCatId;
                showSignsInCategory(catId);
            });
        });
    }
    if(s1&&s2){s1.classList.add('d-none');s2.classList.remove('d-none');if(s3)s3.classList.add('d-none');if(s4)s4.classList.add('d-none');if(s5)s5.classList.add('d-none');}
    document.getElementById('back-to-groups')?.addEventListener('click',function(){s1.classList.remove('d-none');s2.classList.add('d-none');testState.groupId=null;},{once:true});
}

function showSignsInCategory(catId) {
    const data = getSignsData();
    const cat = data.categories.find(c => c.id === catId);
    if (!cat) return;
    const signs = data.signs.filter(s => s.categoryId === catId);
    const s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface');
    const con=document.getElementById('question-container');if(!con)return;
    // Zobrazíme v test interface jako prohlížeč
    if (signs.length === 0) {
        con.innerHTML = `<div class="empty-state"><i class="fas fa-traffic-light"></i><p>Žádné značky v této kategorii.</p></div>`;
    } else {
        con.innerHTML = `<div style="text-align:center;margin-bottom:1rem;">
            <h5 style="font-weight:800;font-size:1.1rem;"><i class="fas ${cat.icon || 'fa-triangle-exclamation'} me-2" style="color:var(--accent);"></i>${cat.name}</h5>
            <p class="text-muted" style="font-size:0.8rem;">Kliknutím na značku zobrazíte detail</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">${signs.map(s => `
            <div class="sign-card" onclick="showSignDetail('${s.id}')">
                ${s.imageUrl ? `<img src="${s.imageUrl}" alt="${s.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ff6b00%22 font-size=%2230%22%3E⚠%3C/text%3E%3C/svg%3E';">` : `<div style="width:100px;height:100px;border-radius:0.75rem;background:rgba(255,107,0,0.1);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--accent);flex-shrink:0;"><i class="fas ${cat.icon || 'fa-triangle-exclamation'}"></i></div>`}
                <div class="sign-info">
                    <div class="sign-title">${s.name}</div>
                    <div class="sign-desc">${s.description || 'Bez popisu'}</div>
                </div>
            </div>
        `).join('')}</div>`;
    }
    if(s2&&s3){s2.classList.add('d-none');s3.classList.remove('d-none');}
    // Nastavíme exit tlačítko pro prohlížení (bez once:true)
    const exitBtn = document.getElementById('exit-test-btn');
    if (exitBtn) {
        exitBtn._handler = function(){s3.classList.add('d-none');s2.classList.remove('d-none');};
        exitBtn.removeEventListener('click', exitBtn._handler);
        exitBtn.addEventListener('click', exitBtn._handler);
    }
    document.getElementById('prev-question-btn')?.style.setProperty('display','none');
    document.getElementById('next-question-btn')?.style.setProperty('display','none');
}

function showSignDetail(signId) {
    const data = getSignsData();
    const sign = data.signs.find(s => s.id === signId);
    if (!sign) return;
    const cat = data.categories.find(c => c.id === sign.categoryId);
    const con=document.getElementById('question-container');if(!con)return;
    con.innerHTML = `<div class="sign-viewer">
        <button class="btn-autoskola btn-autoskola-sm btn-autoskola-outline" onclick="showSignsInCategory('${sign.categoryId}')" style="font-size:0.75rem;padding:0.3rem 0.8rem;margin-bottom:0.75rem;">
            <i class="fas fa-arrow-left me-1"></i>Zpět na značky
        </button>
        ${sign.imageUrl ? `<img src="${sign.imageUrl}" alt="${sign.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ff6b00%22 font-size=%2230%22%3E⚠%3C/text%3E%3C/svg%3E';">` : `<div style="width:120px;height:120px;border-radius:1rem;background:rgba(255,107,0,0.1);display:flex;align-items:center;justify-content:center;font-size:3rem;color:var(--accent);margin:0 auto 1.5rem;"><i class="fas ${cat?.icon || 'fa-triangle-exclamation'}"></i></div>`}
        <div class="sign-viewer-title">${sign.name}</div>
        <div class="sign-viewer-desc">${sign.description || 'Bez popisu'}</div>
        ${cat ? `<div style="margin-top:0.75rem;font-size:0.8rem;color:var(--text-muted);">Kategorie: ${cat.name}</div>` : ''}
    </div>`;
}

// ==========================================
// TEST Z DOPRAVNÍCH ZNAČEK
// ==========================================
function startSignTest(catId) {
    const data = getSignsData();
    const cat = data.categories.find(c => c.id === catId);
    if (!cat) return;
    const signs = data.signs.filter(s => s.categoryId === catId);
    if (signs.length < 1) {
        showInfoModal('fa-exclamation-circle', 'Málo značek', 'Pro test je potřeba alespoň 4 značky v kategorii.', 'OK');
        return;
    }
    // Vytvoříme otázky: "Která značka je ...?" s 4 možnostmi
    const questions = signs.map(sign => {
        const others = signs.filter(s => s.id !== sign.id);
        const shuffledOthers = others.sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [sign, ...shuffledOthers].sort(() => Math.random() - 0.5);
        const correctIndex = options.findIndex(o => o.id === sign.id);
        return {
            id: sign.id,
            question: `Která značka je tato?`,
            imageUrl: sign.imageUrl,
            options: options.map(o => o.name),
            correctIndex,
            explanation: sign.description || '',
            category: 'signs'
        };
    });
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, Math.min(20, questions.length));
    testState = { groupId: 'group_signs', category: catId, questions: shuffled, currentIndex: 0, score: 0, totalAnswered: 0, wrongQuestions: [], isReviewMode: false, answerTimestamps: [], answered: false };
    const s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface');
    if(s2&&s3){s2.classList.add('d-none');s3.classList.remove('d-none');}
    displayCurrentQuestion();
    document.getElementById('prev-question-btn')?.style.removeProperty('display');
    document.getElementById('next-question-btn')?.style.removeProperty('display');
}

// ==========================================
// CATEGORY SELECTION (původní)
// ==========================================
async function showCategorySelection(gid) {
    const g=getAppData().groups.find(x=>x.id===gid);if(!g)return;
    const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface'),s4=document.getElementById('step-test-results'),s5=document.getElementById('step-profile');
    const con=document.getElementById('category-cards');if(!con)return;
    let cats=[];
    if (gid === 'group_online') {
        const overlay = showLoadingScreen('Načítám online témata...');
        try {
            const topicInfos = await Promise.all(REMOTE_TOPICS.map(async rt => {
                let info = null;
                try { info = await getRemoteTopicInfo(rt.topic); } catch (e) { info = { total_questions: 0 }; }
                return { key: rt.key, icon: rt.icon, name: rt.name, topic: rt.topic, info };
            }));
            const unknown = topicInfos.some(item => !item.info || !Number(item.info.total_questions));
            const sumCount = unknown ? '??' : topicInfos.reduce((sum, item) => sum + (Number(item.info.total_questions) || 0), 0);
            cats = topicInfos.map(item => ({ key: item.key, icon: item.icon, name: item.name, count: item.info && Number(item.info.total_questions) ? Number(item.info.total_questions) : '??' }));
            cats.unshift({ key: 'remote_all', icon: 'fa-layer-group', name: 'Všechny otázky', count: unknown ? '??' : sumCount });
        } catch (error) {
            cats = REMOTE_TOPICS.map(rt => ({ key: rt.key, icon: rt.icon, name: rt.name, count: '??' }));
            cats.unshift({ key: 'remote_all', icon: 'fa-layer-group', name: 'Všechny otázky', count: '??' });
        } finally { if (overlay) overlay.remove(); }
    } else {
        Object.keys(g.categories).forEach(key=>{
            const cnt=(g.categories[key]||[]).length;
            const unknownCount=getUnseenQuestionCount(gid,key);
            let icon='fa-folder'; let label=key;
            if(key==='znacky'){icon='fa-traffic-light';label='Dopravní značky';}
            else if(key==='situace'){icon='fa-car-crash';label='Dopravní situace';}
            else{icon='fa-tag';label=key.charAt(0).toUpperCase()+key.slice(1);}
            cats.push({key,icon,name:label,count:cnt,desc:`${cnt} otázek • ${unknownCount} neznámých`});
        });
        cats.push({key:'all',icon:'fa-layer-group',name:'Všechny otázky',count:getAllQuestionsForGroup(gid).length,desc:`Všechny otázky`});
        const wc=getWrongQuestionIds(gid).length;
        if(wc>0)cats.push({key:'wrong',icon:'fa-exclamation-triangle',name:'Otázky, které neumím',count:wc,desc:`Otázky, které jste již označil jako neumíte`});
    }
    con.innerHTML=cats.map(cat=>`<div class="category-card" data-category="${cat.key}"><div class="category-icon"><i class="fas ${cat.icon}"></i></div><div class="category-content"><div class="category-title">${cat.name}</div><div class="category-desc">${cat.desc||cat.count+' otázek'}</div></div><div class="category-count">${cat.count}</div></div>`).join('');
    con.querySelectorAll('.category-card').forEach(card=>{card.addEventListener('click',function(){const category=this.dataset.category;if(gid !== 'group_online' && g.categories && g.categories[category]){chooseLocalCategoryMode(gid,category);}else{testState.category=category;startTest(gid,category);}});});
    if(s1&&s2){s1.classList.add('d-none');s2.classList.remove('d-none');if(s3)s3.classList.add('d-none');if(s4)s4.classList.add('d-none');if(s5)s5.classList.add('d-none');}
    document.getElementById('back-to-groups')?.addEventListener('click',function(){s1.classList.remove('d-none');s2.classList.add('d-none');testState.groupId=null;},{once:true});
}

async function chooseLocalCategoryMode(gid, categoryKey){
    if (typeof Swal !== 'undefined') {
        const categoryLabel = categoryKey === 'znacky' ? 'Dopravní značky' : categoryKey === 'situace' ? 'Dopravní situace' : categoryKey.charAt(0).toUpperCase()+categoryKey.slice(1);
        const unseenCount = getUnseenQuestionCount(gid, categoryKey);
        const result = await Swal.fire({
            title: `Kategorie ${categoryLabel}`,
            text: `Vyberte, zda chcete odpovídat na všechny otázky nebo pouze na neznámé.`,
            icon: 'question',
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: 'Všechny otázky',
            denyButtonText: `Neznámé (${unseenCount})`,
            cancelButtonText: 'Zpět',
            background:'#1a1a2e', color:'#fff', iconColor:'#fbbf24',
            customClass:{popup:'animate__animated animate__fadeInDown'}
        });
        if (result.isConfirmed) { testState.category = categoryKey; return startTest(gid, categoryKey); }
        if (result.isDenied) { testState.category = `${categoryKey}_unknown`; return startTest(gid, `${categoryKey}_unknown`); }
        return;
    }
    testState.category = categoryKey;
    return startTest(gid, categoryKey);
}

async function startTest(gid,cat){
    if (cat.startsWith('remote_')) {
        if (cat === 'remote_all') { await startRemoteTest(gid, 0, true); }
        else { const topicId = parseInt(cat.split('_')[1], 10); await startRemoteTest(gid, topicId); }
        return;
    }
    let qs;
    if (cat === 'wrong') { const ids=getWrongQuestionIds(gid); qs=getAllQuestionsForGroup(gid).filter(q=>ids.includes(q.id)); }
    else if (cat.endsWith('_unknown')) { const baseCat = cat.replace(/_unknown$/, ''); qs = getUnseenQuestions(gid, baseCat); }
    else { qs = loadQuestions(gid,cat); }
    if(qs.length===0){
        const msg = cat.endsWith('_unknown') ? 'V této kategorii už nejsou žádné neznámé otázky.' : 'V této kategorii zatím nejsou žádné otázky.';
        showInfoModal('fa-info-circle','Žádné otázky',msg,'Zpět',()=>{const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection');if(s1&&s2){s2.classList.add('d-none');s1.classList.remove('d-none');}});
        return;
    }
    const shuffled=[...qs].sort(()=>Math.random()-0.5);
    testState={groupId:gid,category:cat,questions:shuffled,currentIndex:0,score:0,totalAnswered:0,wrongQuestions:[],isReviewMode:false,answerTimestamps:[],answered:false};
    showLoadingScreen(()=>{const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface');if(s1&&s2&&s3){s1.classList.add('d-none');s2.classList.add('d-none');s3.classList.remove('d-none');}displayCurrentQuestion();});
}

async function startRemoteTest(gid, topicId, allTopics=false) {
    let overlay = null;
    try {
        let totalAvailable = 0; let count = 25; let loadingText = '';
        if (allTopics) {
            try { const remoteCount = await getRemoteGroupCount(); totalAvailable = remoteCount || 0; count = Math.min(totalAvailable, 1200); loadingText = `Načítám ${count} online otázek...`; }
            catch (e) { count = 1200; loadingText = 'Načítám 1200 online otázek...'; }
        } else {
            try { const info = await getRemoteTopicInfo(topicId); totalAvailable = Number(info.total_questions) || 0; count = Math.min(totalAvailable, 1200); loadingText = `Načítám ${count} online otázek...`; }
            catch (e) { count = 200; loadingText = 'Načítám 200 online otázek...'; }
        }
        overlay = showLoadingScreen(loadingText);
        const questions = await fetchRemoteQuestions(allTopics ? 0 : topicId, count);
        if (overlay) overlay.remove();
        if (!questions || questions.length === 0) {
            showInfoModal('fa-info-circle','Žádné otázky','Nepodařilo se načíst online otázky.','Zpět',()=>{const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection');if(s1&&s2){s2.classList.add('d-none');s1.classList.remove('d-none');}});
            return;
        }
        const shuffled = questions.sort(()=>Math.random()-0.5);
        testState={groupId:gid,category:`remote_${topicId}`,questions:shuffled,currentIndex:0,score:0,totalAnswered:0,wrongQuestions:[],isReviewMode:false,answerTimestamps:[],answered:false};
        const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface');
        if(s1&&s2&&s3){s1.classList.add('d-none');s2.classList.add('d-none');s3.classList.remove('d-none');}
        displayCurrentQuestion();
    } catch (error) {
        if (overlay) overlay.remove();
        showInfoModal('fa-exclamation-circle','Chyba','Nepodařilo se načíst online otázky: '+error.message,'OK');
    }
}

async function fetchRemoteQuestions(topicId, count=5) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT);
    try {
        const response = await fetch(`${API_URL}/remote-test?topic=${topicId}&count=${count}`, { signal: controller.signal });
        if (!response.ok) { const text = await response.text(); throw new Error(text || `HTTP ${response.status}`); }
        const result = await response.json();
        if (!result.success) throw new Error(result.message || 'Chyba při volání externího testu');
        return result.questions.map(q => {
            const answers = [
                { text: q.correct_text, correct: true },
                { text: q.wrong1_text, correct: false },
                { text: q.wrong2_text, correct: false }
            ].sort(() => Math.random() - 0.5);
            const correctIndex = answers.findIndex(a => a.correct);
            return {
                id: q.question_id || `remote_${topicId}_${Math.random().toString(36).slice(2,8)}`,
                question: q.question_text || 'Otázka není dostupná.',
                imageUrl: q.question_media || '',
                options: answers.map(a => a.text),
                correctIndex,
                category: 'remote',
                explanation: ''
            };
        });
    } catch (e) {
        if (e.name === 'AbortError') throw new Error('Vypršel čas při načítání online otázky.');
        throw e;
    } finally { clearTimeout(timeoutId); }
}

function displayCurrentQuestion(){
    const{questions,currentIndex}=testState;if(currentIndex>=questions.length){showTestResults();return;}
    const q=questions[currentIndex];const total=questions.length;testState.answered=false;
    document.getElementById('question-counter')&&(document.getElementById('question-counter').textContent=`Otázka ${currentIndex+1}/${total}`);
    document.getElementById('score-display')&&(document.getElementById('score-display').textContent=`${testState.score}/${testState.totalAnswered}`);
    const pf=document.getElementById('progress-fill');if(pf)pf.style.width=((currentIndex)/total*100)+'%';
    const xi=document.getElementById('xp-info');const streak=getStreakDisplay();
    if(xi){let h='<div class="d-flex align-items-center gap-2 flex-wrap" style="font-size:0.8rem;">';h+='<span style="color:#fbbf24;"><i class="fas fa-star me-1"></i>+10 XP za správnou</span>';if(streak)h+=`<span class="streak-badge" style="font-size:0.75rem;">🔥 ${streak.count}x ${streak.text}</span>`;h+='</div>';xi.innerHTML=h;}
    const qc=document.getElementById('question-container');if(!qc)return;
    let img='';if(q.imageUrl&&q.imageUrl.trim())img=`<div class="text-center my-2"><img src="${q.imageUrl}" alt="" class="img-fluid" style="max-height:160px;border-radius:0.75rem;border:1px solid rgba(255,107,0,0.15);"></div>`;
    qc.innerHTML=`<div class="animate__animated animate__fadeIn"><h5 class="fw-bold mb-3" style="line-height:1.4;font-size:0.95rem;">${q.question}</h5>${img}<div class="d-flex flex-column gap-2">${q.options.map((opt,idx)=>{const l=String.fromCharCode(65+idx);return`<button class="option-btn" data-option-index="${idx}" style="padding:0.7rem 1rem;"><span class="option-letter" style="width:28px;height:28px;font-size:0.8rem;">${l}</span><span style="font-size:0.85rem;">${opt.replace(/^[A-C]:\s*/,'')}</span></button>`;}).join('')}</div></div>`;
    const start=Date.now();qc.querySelectorAll('.option-btn').forEach(btn=>{btn.addEventListener('click',function(){if(testState.answered)return;const elapsed=(Date.now()-start)/1000;handleAnswer(parseInt(this.dataset.optionIndex),elapsed);});});
    updateNavButtons();
}

function handleAnswer(selectedIndex,elapsed=0){
    if(testState.answered)return;testState.answered=true;
    const{questions,currentIndex}=testState;const q=questions[currentIndex];const correct=selectedIndex===q.correctIndex;
    document.querySelectorAll('.option-btn').forEach(btn=>{btn.disabled=true;const idx=parseInt(btn.dataset.optionIndex);if(idx===q.correctIndex)btn.classList.add('correct');else if(idx===selectedIndex&&!correct)btn.classList.add('wrong');});
    testState.totalAnswered++;testState.answerTimestamps.push(elapsed);
    const user=getCurrentUser();if(user){const nt=(user.totalAnswered||0)+1;updateCurrentUser({totalAnswered:nt});if(nt>=10)checkAchievement('zelenac');if(nt>=15)checkAchievement('vytrvalec');}
    markQuestionAnswered(testState.groupId,q.id);
    if(correct){
        testState.score++;addXP(10);updateStreak(true);
        if(testState.totalAnswered===1)checkAchievement('first_blood');if(elapsed<3)checkAchievement('speedster');
        const xi=document.getElementById('xp-info');if(xi){const s=getStreakDisplay();let h='<div class="d-flex align-items-center gap-2 flex-wrap" style="font-size:0.8rem;">';h+='<span style="color:#22c55e;"><i class="fas fa-check-circle me-1"></i>Správně! +10 XP</span>';if(s)h+=`<span class="streak-badge" style="font-size:0.75rem;">🔥 ${s.count}x ${s.text}</span>`;h+='</div>';xi.innerHTML=h;}
    }else{
        addWrongQuestion(testState.groupId,q.id);updateStreak(false);
        const expl=q.explanation||'Žádné vysvětlení k dispozici.';
        Swal.fire({icon:'error',title:'Špatně!',html:`<p style="margin-bottom:0.5rem;">Správná: <strong style="color:#22c55e;">${q.options[q.correctIndex].replace(/^[A-C]:\s*/,'')}</strong></p><div style="background:rgba(255,107,0,0.1);border-radius:0.75rem;padding:0.75rem;margin-top:0.5rem;text-align:left;"><small><i class="fas fa-lightbulb" style="color:#fbbf24;"></i> <strong>Tahák:</strong> ${expl}</small></div>`,timer:3000,showConfirmButton:false,background:'#1a1a2e',color:'#fff',iconColor:'#ef4444',customClass:{popup:'animate__animated animate__bounceIn'}});
    }
    setTimeout(()=>nextQuestion(),correct?800:3000);
}
function nextQuestion(){testState.currentIndex++;displayCurrentQuestion();}
function previousQuestion(){if(testState.currentIndex>0){testState.currentIndex--;testState.isReviewMode=true;displayCurrentQuestion();}}
function updateNavButtons(){const p=document.getElementById('prev-question-btn'),n=document.getElementById('next-question-btn');if(p)p.style.display=testState.currentIndex>0?'flex':'none';if(n){const l=testState.currentIndex>=testState.questions.length-1;n.innerHTML=l?'<i class="fas fa-flag-checkered me-2"></i>Dokončit':'<i class="fas fa-arrow-right me-2"></i>Další';}}

function showTestResults(){
    const{score,totalAnswered}=testState;const pct=totalAnswered>0?Math.round((score/totalAnswered)*100):0;const passed=pct>=70;
    const s3=document.getElementById('step-test-interface'),s4=document.getElementById('step-test-results');
    if(s3&&s4){s3.classList.add('d-none');s4.classList.remove('d-none');}
    const user=getCurrentUser();if(user&&pct>(user.bestScore||0))updateCurrentUser({bestScore:pct});if(pct===100&&totalAnswered>0)checkAchievement('genius');
    document.getElementById('final-score')&&(document.getElementById('final-score').textContent=score);
    document.getElementById('final-total')&&(document.getElementById('final-total').textContent=totalAnswered);
    document.getElementById('final-percentage')&&(document.getElementById('final-percentage').textContent=pct+'%');
    document.getElementById('final-passed')&&(document.getElementById('final-passed').textContent=passed?'Prospěl/a':'Neprospěl/a');
    const ri=document.getElementById('result-icon');if(ri){ri.className=passed?'fas fa-trophy':'fas fa-redo-alt';ri.style.color=passed?'#fbbf24':'#ef4444';}
    document.getElementById('new-test-btn')?.addEventListener('click',resetTest,{once:true});
    const retry=document.getElementById('retry-wrong-btn');const hasWrong=getWrongQuestionIds(testState.groupId).length>0;
    if(retry){if(hasWrong){retry.style.display='flex';retry.addEventListener('click',function(){const ids=getWrongQuestionIds(testState.groupId);if(ids.length>0){const all=getAllQuestionsForGroup(testState.groupId);testState.questions=all.filter(q=>ids.includes(q.id));testState.currentIndex=0;testState.score=0;testState.totalAnswered=0;testState.wrongQuestions=[];testState.isReviewMode=false;s4.classList.add('d-none');s3.classList.remove('d-none');displayCurrentQuestion();}},{once:true});}else{retry.style.display='none';}}
}
function resetTest(){
    testState={groupId:null,category:null,questions:[],currentIndex:0,score:0,totalAnswered:0,wrongQuestions:[],isReviewMode:false,answerTimestamps:[],answered:false};
    const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface'),s4=document.getElementById('step-test-results'),s5=document.getElementById('step-profile');
    if(s1&&s2&&s3&&s4){s4.classList.add('d-none');s3.classList.add('d-none');s2.classList.add('d-none');s1.classList.remove('d-none');if(s5)s5.classList.add('d-none');displayGroups('group-cards');}
}

// ==========================================
// ADMIN
// ==========================================
function checkAdminAccess(){const s=getCurrentSession();if(!s||!s.isCEO){window.location.href='index.html';return false;}return true;}

function adminLoadGroups(){
    const data=getAppData();const sel=document.getElementById('admin-group-select'),del=document.getElementById('admin-delete-group-select'),cat=document.getElementById('admin-category-select'),fc=document.getElementById('admin-filter-category'),tabs=document.getElementById('admin-group-tabs');
    if(!sel)return;const opts=data.groups.map(g=>`<option value="${g.id}">${g.letter} - ${g.name}</option>`).join('');
    sel.innerHTML='<option value="">Vyberte skupinu</option>'+opts;if(del)del.innerHTML='<option value="">Vyberte skupinu</option>'+opts;
    const allCats=new Set(['znacky','situace']);data.groups.forEach(g=>{if(g.categories)Object.keys(g.categories).forEach(k=>allCats.add(k));});
    const catOpts=Array.from(allCats).map(c=>{let l=c;if(c==='znacky')l='Dopravní značky';else if(c==='situace')l='Dopravní situace';return`<option value="${c}">${l}</option>`;}).join('');
    if(cat)cat.innerHTML='<option value="">Nejprve vyberte skupinu</option>'+catOpts;if(fc)fc.innerHTML='<option value="">Všechny kategorie</option>'+catOpts;
    if(tabs){
        if(data.groups.length===0){tabs.innerHTML='<li class="text-white-50 small">Zatím žádné skupiny.</li>';return;}
        tabs.innerHTML=data.groups.map((g,idx)=>`<li class="nav-item"><button class="nav-link ${idx===0?'active':''}" data-group-id="${g.id}" style="background:${idx===0?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.05)'};color:${idx===0?'#ff6b00':'rgba(255,255,255,0.7)'};border:1px solid ${idx===0?'rgba(255,107,0,0.3)':'rgba(255,255,255,0.1)'};border-radius:0.5rem;padding:0.3rem 0.8rem;font-size:0.75rem;font-weight:600;cursor:pointer;"><i class="fas fa-car me-1"></i>${g.letter}</button></li>`).join('');
        tabs.querySelectorAll('[data-group-id]').forEach(btn=>{btn.addEventListener('click',function(){tabs.querySelectorAll('[data-group-id]').forEach(b=>{b.style.background='rgba(255,255,255,0.05)';b.style.color='rgba(255,255,255,0.7)';b.style.borderColor='rgba(255,255,255,0.1)';});this.style.background='rgba(255,107,0,0.2)';this.style.color='#ff6b00';this.style.borderColor='rgba(255,107,0,0.3)';sel.value=this.dataset.groupId;const cs=document.getElementById('admin-category-select');if(cs)cs.disabled=false;displayAdminQuestions(this.dataset.groupId,null);});});
        if(data.groups.length>0){sel.value=data.groups[0].id;const cs=document.getElementById('admin-category-select');if(cs)cs.disabled=false;displayAdminQuestions(data.groups[0].id,null);}
    }
    sel.addEventListener('change',function(){const gid=this.value;const cs=document.getElementById('admin-category-select');if(cs){cs.disabled=!gid;cs.value='';}displayAdminQuestions(gid,null);if(tabs&&gid){tabs.querySelectorAll('[data-group-id]').forEach(b=>{b.style.background='rgba(255,255,255,0.05)';b.style.color='rgba(255,255,255,0.7)';b.style.borderColor='rgba(255,255,255,0.1)';if(b.dataset.groupId===gid){b.style.background='rgba(255,107,0,0.2)';b.style.color='#ff6b00';b.style.borderColor='rgba(255,107,0,0.3)';}});}});
}

function displayAdminQuestions(gid,cat){
    const c=document.getElementById('admin-questions-list');if(!c)return;
    if(!gid){c.innerHTML='<div class="empty-state"><i class="fas fa-arrow-left"></i><p>Vyberte skupinu.</p></div>';return;}
    const data=getAppData();const group=data.groups.find(g=>g.id===gid);if(!group){c.innerHTML='<div class="empty-state"><p>Skupina nenalezena.</p></div>';return;}
    let questions=[];Object.keys(group.categories||{}).forEach(key=>{if(!cat||cat===key)(group.categories[key]||[]).forEach(q=>questions.push({...q,catKey:key}));});
    if(questions.length===0){c.innerHTML='<div class="empty-state"><i class="fas fa-question-circle"></i><p>Žádné otázky.</p></div>';return;}
    const letters=['A','B','C'];
    c.innerHTML=questions.map((q,idx)=>{let cn=q.catKey;if(cn==='znacky')cn='Značky';else if(cn==='situace')cn='Situace';else cn=cn.charAt(0).toUpperCase()+cn.slice(1);return`<div class="question-item" style="padding:0.75rem;animation-delay:${idx*0.03}s"><div class="d-flex justify-content-between align-items-start gap-2"><div><div class="q-text" style="font-size:0.8rem;">${q.question}</div><div class="q-meta" style="font-size:0.75rem;"><span class="question-counter" style="font-size:0.7rem;">${cn}</span><span class="ms-2">Správně: <span class="q-correct">${letters[q.correctIndex]}: ${q.options[q.correctIndex].replace(/^[A-C]:\s*/,'')}</span></span>${q.imageUrl?'<span class="ms-2"><i class="fas fa-image" style="color:#ff6b00;"></i></span>':''}${q.explanation?'<span class="ms-2"><i class="fas fa-lightbulb" style="color:#fbbf24;"></i></span>':''}</div></div><button class="delete-btn" data-qid="${q.id}" data-gid="${gid}" data-cat="${q.catKey}" style="padding:0.2rem 0.4rem;"><i class="fas fa-trash-alt" style="font-size:0.8rem;"></i></button></div></div>`;}).join('');
    c.querySelectorAll('.delete-btn').forEach(btn=>{btn.addEventListener('click',function(){if(confirm('Smazat otázku?'))deleteQuestion(this.dataset.gid,this.dataset.cat,this.dataset.qid);});});
}

function deleteQuestion(gid,cat,qid){const data=getAppData();const group=data.groups.find(g=>g.id===gid);if(!group||!group.categories[cat])return;const idx=group.categories[cat].findIndex(q=>q.id===qid);if(idx!==-1){group.categories[cat].splice(idx,1);saveAppData(data);}displayAdminQuestions(document.getElementById('admin-group-select')?.value||gid,null);}
function addNewGroup(letter,name){const data=getAppData();if(data.groups.find(g=>g.letter.toUpperCase()===letter.toUpperCase()))return{success:false,message:'Skupina již existuje.'};const dc={};data.availableCategories.forEach(c=>{dc[c]=[];});data.groups.push({id:'group_'+letter.toLowerCase(),letter:letter.toUpperCase(),name,categories:dc});saveAppData(data);return{success:true,message:`Skupina ${letter.toUpperCase()} přidána.`};}
function addNewQuestion(gid,cat,text,opts,ci,img,expl){const data=getAppData();const group=data.groups.find(g=>g.id===gid);if(!group)return{success:false,message:'Skupina nenalezena.'};if(!group.categories[cat])group.categories[cat]=[];const f=opts.map((opt,idx)=>{const l=String.fromCharCode(65+idx);return opt.startsWith(l+':')?opt:l+': '+opt;});group.categories[cat].push({id:generateId(),question:text,imageUrl:img||'',options:f,correctIndex:ci,category:cat,explanation:expl||''});saveAppData(data);const sel=document.getElementById('admin-group-select'),cs=document.getElementById('admin-category-select');if(sel&&cs)displayAdminQuestions(sel.value,cs.value);return{success:true,message:'Otázka přidána.'};}
function deleteGroup(gid){const data=getAppData();const idx=data.groups.findIndex(g=>g.id===gid);if(idx===-1)return{success:false,message:'Skupina nenalezena.'};data.groups.splice(idx,1);saveAppData(data);return{success:true,message:'Skupina smazána.'};}
function addNewCategory(key,label){const data=getAppData();if(data.availableCategories.includes(key))return{success:false,message:'Kategorie již existuje.'};data.availableCategories.push(key);data.groups.forEach(g=>{if(!g.categories[key])g.categories[key]=[];});saveAppData(data);return{success:true,message:`Kategorie "${label}" přidána.`};}
function resetDatabase(){localStorage.removeItem(APP_DATA_KEY);localStorage.removeItem(APP_USERS_KEY);localStorage.removeItem(APP_SESSION_KEY);localStorage.removeItem(APP_SIGNS_KEY);Object.keys(localStorage).forEach(k=>{if(k.startsWith('autoskolaProProgress_')||k.startsWith('autoskolaProWrong_')||k.startsWith('autoskolaProCorrectTrack_'))localStorage.removeItem(k);});initAppData();const users=getUsers();const ceo=users.find(u=>u.isCEO);if(ceo)saveSession({userId:ceo.id,email:ceo.email,name:ceo.name,isCEO:true,loggedInAt:new Date().toISOString()});}

// ==========================================
// ADMIN - DOPRAVNÍ ZNAČKY
// ==========================================
function initAdminSigns() {
    renderSignCategories();
    renderAdminSignsList();
    
    // Přidat kategorii
    document.getElementById('add-sign-category-btn')?.addEventListener('click', function() {
        const name = document.getElementById('sign-category-name').value.trim();
        const icon = document.getElementById('sign-category-icon').value.trim() || 'fa-triangle-exclamation';
        if (!name) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Zadejte název kategorie.', 'OK'); return; }
        const r = addSignCategory(name, icon);
        if (r.success) {
            showInfoModal('fa-check-circle', 'Hotovo', r.message, 'OK');
            document.getElementById('sign-category-name').value = '';
            document.getElementById('sign-category-icon').value = 'fa-triangle-exclamation';
            renderSignCategories();
            renderAdminSignsList();
        } else {
            showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'OK');
        }
    });
    
    // Přidat značku
    document.getElementById('add-sign-form')?.addEventListener('submit', function(e) {
        e.preventDefault();
        const catId = document.getElementById('sign-category-select').value;
        const name = document.getElementById('sign-name').value.trim();
        const imageUrl = document.getElementById('sign-image').value.trim();
        const description = document.getElementById('sign-description').value.trim();
        if (!catId) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyberte kategorii.', 'OK'); return; }
        if (!name) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Zadejte název značky.', 'OK'); return; }
        const r = addSign(catId, name, imageUrl, description);
        if (r.success) {
            showInfoModal('fa-check-circle', 'Hotovo', r.message, 'OK');
            document.getElementById('sign-name').value = '';
            document.getElementById('sign-image').value = '';
            document.getElementById('sign-description').value = '';
            renderAdminSignsList();
        } else {
            showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'OK');
        }
    });
    
    // Filtr značek
    document.getElementById('admin-sign-filter-category')?.addEventListener('change', renderAdminSignsList);
}

function renderSignCategories() {
    const list = document.getElementById('sign-categories-list');
    const select = document.getElementById('sign-category-select');
    const filter = document.getElementById('admin-sign-filter-category');
    if (!list) return;
    const data = getSignsData();
    const cats = data.categories;
    if (cats.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Zatím žádné kategorie značek.</p></div>';
        if (select) select.innerHTML = '<option value="">Nejprve vytvořte kategorii</option>';
        if (filter) filter.innerHTML = '<option value="">Všechny kategorie</option>';
        return;
    }
    list.innerHTML = cats.map(c => {
        const count = data.signs.filter(s => s.categoryId === c.id).length;
        return `<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0.75rem;background:rgba(255,255,255,0.03);border-radius:0.5rem;margin-bottom:0.35rem;border:1px solid rgba(255,255,255,0.05);">
            <div style="display:flex;align-items:center;gap:0.5rem;">
                <i class="fas ${c.icon || 'fa-triangle-exclamation'}" style="color:var(--accent);width:20px;text-align:center;"></i>
                <span style="font-weight:600;font-size:0.9rem;">${c.name}</span>
                <span style="font-size:0.75rem;color:var(--text-muted);">(${count} značek)</span>
            </div>
            <button class="delete-btn" onclick="if(confirm('Smazat kategorii "${c.name}" i se všemi značkami?')){deleteSignCategory('${c.id}');renderSignCategories();renderAdminSignsList();}" style="padding:0.15rem 0.4rem;font-size:0.75rem;">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>`;
    }).join('');
    const opts = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (select) select.innerHTML = '<option value="">Vyberte kategorii</option>' + opts;
    if (filter) filter.innerHTML = '<option value="">Všechny kategorie</option>' + opts;
}

function renderAdminSignsList() {
    const list = document.getElementById('admin-signs-list');
    if (!list) return;
    const data = getSignsData();
    const filterCat = document.getElementById('admin-sign-filter-category')?.value || '';
    let signs = data.signs;
    if (filterCat) signs = signs.filter(s => s.categoryId === filterCat);
    if (signs.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-traffic-light"></i><p>Žádné značky.</p></div>';
        return;
    }
    list.innerHTML = signs.map(s => {
        const cat = data.categories.find(c => c.id === s.categoryId);
        return `<div class="sign-card" style="cursor:default;">
            ${s.imageUrl ? `<img src="${s.imageUrl}" alt="${s.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23333%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ff6b00%22 font-size=%2230%22%3E⚠%3C/text%3E%3C/svg%3E';">` : `<div style="width:60px;height:60px;border-radius:0.5rem;background:rgba(255,107,0,0.1);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--accent);flex-shrink:0;"><i class="fas ${cat?.icon || 'fa-triangle-exclamation'}"></i></div>`}
            <div class="sign-info">
                <div class="sign-title" style="font-size:0.9rem;">${s.name}</div>
                <div class="sign-desc" style="font-size:0.75rem;">${s.description ? s.description.substring(0, 100) + (s.description.length > 100 ? '...' : '') : 'Bez popisu'}</div>
                <div style="font-size:0.65rem;color:var(--text-muted);margin-top:0.2rem;">${cat ? cat.name : 'Bez kategorie'}</div>
            </div>
            <button class="delete-btn" onclick="if(confirm('Smazat značku "${s.name}"?')){deleteSign('${s.id}');renderAdminSignsList();}" style="padding:0.2rem 0.4rem;">
                <i class="fas fa-trash-alt" style="font-size:0.8rem;"></i>
            </button>
        </div>`;
    }).join('');
}

// ==========================================
// ADMIN - UŽIVATELÉ A STATISTIKY
// ==========================================
async function renderAdminUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;
    try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const users = data.users || [];
        tbody.innerHTML = users.map(u => `
            <tr>
                <td><div style="display:flex;align-items:center;gap:0.5rem;">
                    <div class="user-avatar" style="width:28px;height:28px;font-size:0.7rem;">${u.name.charAt(0).toUpperCase()}</div>
                    ${u.name}${u.isCEO ? ' <span style="font-size:0.65rem;color:var(--accent);font-weight:600;">👑 Developer</span>' : ''}
                </div></td>
                <td style="color:var(--text-muted);font-size:0.8rem;">${u.email}</td>
                <td style="color:var(--text-muted);font-size:0.8rem;">${u.registered}</td>
                <td><span style="display:inline-block;padding:0.15rem 0.5rem;border-radius:999px;font-size:0.75rem;font-weight:600;${u.active ? 'background:rgba(34,197,94,0.15);color:#22c55e;' : 'background:rgba(255,255,255,0.05);color:var(--text-muted);'}">${u.active ? `${u.tests} zodpovězeno` : `${u.tests} odpovědí`}</span></td>
                <td style="text-align:right;">
                    <button class="delete-btn" style="padding:0.2rem 0.5rem;font-size:0.75rem;background:rgba(255,107,0,0.12);color:var(--accent);" onclick="adminResetPassword('${u.id}')"><i class="fas fa-key"></i></button>
                    <button class="delete-btn" style="padding:0.2rem 0.5rem;font-size:0.75rem;background:rgba(239,68,68,0.15);" onclick="adminDeleteUser('${u.id}','${u.name}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--error);padding:2rem;">❌ Chyba: ${e.message}</td></tr>`;
    }
}

async function renderAdminProgress() {
    const tbody = document.getElementById('progress-table-body');
    if (!tbody) return;
    try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        const users = (data.users || []).filter(u => !u.isCEO);
        const medals = ['🥇', '🥈', '🥉'];
        tbody.innerHTML = users.map((p, i) => `
            <tr>
                <td><span style="font-size:1.1rem;font-weight:700;">${medals[i] || `#${i+1}`}</span></td>
                <td style="font-weight:500;">${p.name}</td>
                <td style="font-weight:700;color:var(--accent);">${p.xp.toLocaleString()}</td>
                <td>${p.score}%</td>
                <td><div style="max-width:120px;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;"><div style="height:100%;width:${Math.min(p.score,100)}%;background:${p.score >= 80 ? 'var(--success)' : p.score >= 60 ? 'var(--accent)' : 'var(--error)'};border-radius:3px;"></div></div></td>
                <td>${p.tests}</td>
            </tr>
        `).join('');
        const statsContainer = document.getElementById('stats-cards');
        if (statsContainer) {
            const statsRes = await fetch('/api/admin/stats');
            const statsData = await statsRes.json();
            if (statsData.success) {
                const s = statsData.stats;
                statsContainer.innerHTML = `
                    <div class="admin-card" style="text-align:center;"><div class="stat-value" style="font-size:1.5rem;">${s.totalUsers}</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Registrovaných</div></div>
                    <div class="admin-card" style="text-align:center;"><div class="stat-value" style="font-size:1.5rem;">${s.avgScore}%</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Prům. skóre</div></div>
                    <div class="admin-card" style="text-align:center;"><div class="stat-value" style="font-size:1.5rem;">${s.totalTests}</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Dokonč. testů</div></div>
                    <div class="admin-card" style="text-align:center;"><div class="stat-value" style="font-size:1.5rem;">${s.topXp.toLocaleString()}</div><div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.25rem;">Nejvyšší XP</div></div>
                `;
            }
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--error);padding:2rem;">❌ Chyba: ${e.message}</td></tr>`;
    }
}

function adminResetPassword(userId) {
    const newPassword = prompt('Zadejte nové heslo (min. 6 znaků):');
    if (!newPassword || newPassword.length < 6) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Heslo musí mít alespoň 6 znaků.', 'OK'); return; }
    fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) })
        .then(r => r.json()).then(d => { if (d.success) showInfoModal('fa-check-circle', 'Hotovo', 'Heslo bylo změněno.', 'OK'); else showInfoModal('fa-exclamation-circle', 'Chyba', d.message || 'Nepodařilo se změnit heslo.', 'OK'); });
}

async function adminDeleteUser(userId, userName) {
    const result = await Swal.fire({ title: 'Smazat uživatele?', text: `Opravdu chcete smazat uživatele "${userName}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Smazat', cancelButtonText: 'Zrušit', confirmButtonColor: '#ef4444', background: '#1a1a2e', color: '#fff', iconColor: '#ef4444' });
    if (!result.isConfirmed) return;
    try {
        const r = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        const d = await r.json();
        if (d.success) { showInfoModal('fa-check-circle', 'Smazáno', 'Uživatel byl smazán.', 'OK'); renderAdminUsers(); renderAdminProgress(); }
        else showInfoModal('fa-exclamation-circle', 'Chyba', d.message || 'Nepodařilo se smazat uživatele.', 'OK');
    } catch (e) { showInfoModal('fa-exclamation-circle', 'Chyba', e.message, 'OK'); }
}

// ==========================================
// ADMIN RESET MODAL
// ==========================================
function initAdminReset() {
    const resetBtn = document.getElementById('reset-db-btn');
    const modal = document.getElementById('resetModal');
    const modalInput = document.getElementById('modal-reset-input');
    const modalConfirm = document.getElementById('modal-reset-confirm');
    const modalClose = modal?.querySelector('.modal-close-btn');
    const directInput = document.getElementById('reset-confirm-input');
    const errorEl = document.getElementById('reset-error');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            const val = directInput?.value.trim().toUpperCase();
            if (val !== 'SMAZAT') { if (errorEl) errorEl.style.display = 'block'; return; }
            if (errorEl) errorEl.style.display = 'none';
            if (modal) { modal.classList.add('active'); if (modalInput) modalInput.value = ''; }
        });
    }
    if (directInput) { directInput.addEventListener('input', function() { if (errorEl) errorEl.style.display = 'none'; }); }
    if (modalClose) { modalClose.addEventListener('click', function() { modal.classList.remove('active'); }); }
    if (modal) { modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('active'); }); }
    if (modalConfirm) {
        modalConfirm.addEventListener('click', function() {
            const val = modalInput?.value.trim().toUpperCase();
            if (val !== 'SMAZAT') { alert('Pro potvrzení napište SMAZAT'); return; }
            resetDatabase();
            modal.classList.remove('active');
            if (typeof Swal !== 'undefined') Swal.fire({ icon: 'success', title: 'Resetováno', text: 'Databáze byla resetována.', timer: 2000, showConfirmButton: false, background: '#1a1a2e', color: '#fff' });
            else alert('Databáze resetována');
            setTimeout(() => location.reload(), 2000);
        });
    }
}

// ==========================================
// ADMIN EVENTS
// ==========================================
function initializeAdminPanel(){
    if(!checkAdminAccess())return;
    adminLoadGroups();
    initAdminSidebar();
    renderAdminUsers();
    renderAdminProgress();
    initAdminReset();
    initAdminSigns();

    document.getElementById('announcement-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const text = document.getElementById('announcement-text').value.trim();
        const duration = parseInt(document.getElementById('announcement-duration').value, 10) || 10;
        if (!text) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Zpráva nesmí být prázdná.', 'OK'); return; }
        const result = await apiPost('/announcement', { text, duration });
        if (result.success) {
            document.getElementById('announcement-text').value = '';
            document.getElementById('last-announcement-preview').textContent = `"${text}" (${duration}s)`;
            showAnnouncementBanner(text, duration);
            showInfoModal('fa-check-circle', 'Odesláno', 'Oznámení bylo odesláno všem uživatelům.', 'OK');
        } else showInfoModal('fa-exclamation-circle', 'Chyba', result.message || 'Nepodařilo se odeslat oznámení.', 'OK');
    });
    document.getElementById('admin-filter-category')?.addEventListener('change',function(){displayAdminQuestions(document.getElementById('admin-group-select')?.value,this.value);});
    document.getElementById('add-group-form')?.addEventListener('submit',function(e){e.preventDefault();const l=document.getElementById('group-letter').value.trim().toUpperCase();const n=document.getElementById('group-name').value.trim();if(!l||!n){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte všechna pole.','OK');return;}const r=addNewGroup(l,n);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');document.getElementById('group-letter').value='';document.getElementById('group-name').value='';adminLoadGroups();}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');});
    document.getElementById('add-category-form')?.addEventListener('submit',function(e){e.preventDefault();const k=document.getElementById('category-key').value.trim().toLowerCase().replace(/\s+/g,'_');const l=document.getElementById('category-label').value.trim();if(!k||!l){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte obě pole.','OK');return;}const r=addNewCategory(k,l);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');document.getElementById('category-key').value='';document.getElementById('category-label').value='';adminLoadGroups();}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');});
    document.getElementById('add-question-form')?.addEventListener('submit',function(e){e.preventDefault();const gid=document.getElementById('admin-group-select').value;const cat=document.getElementById('admin-category-select').value;const q=document.getElementById('question-text').value.trim();const a=document.getElementById('option-a').value.trim();const b=document.getElementById('option-b').value.trim();const c=document.getElementById('option-c').value.trim();const img=document.getElementById('question-image').value.trim();const expl=document.getElementById('question-explanation').value.trim();const cr=document.querySelector('input[name="correct-answer"]:checked');if(!cr){showInfoModal('fa-exclamation-circle','Chyba','Označte správnou odpověď.','OK');return;}const ci=parseInt(cr.value);if(!gid||!cat){showInfoModal('fa-exclamation-circle','Chyba','Vyberte skupinu a kategorii.','OK');return;}if(!q||!a||!b||!c){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte všechny údaje.','OK');return;}const r=addNewQuestion(gid,cat,q,[a,b,c],ci,img,expl);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');['question-text','option-a','option-b','option-c','question-image','question-explanation'].forEach(id=>document.getElementById(id).value='');const ch=document.querySelector('input[name="correct-answer"]:checked');if(ch)ch.checked=false;}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');});
    document.getElementById('delete-group-btn')?.addEventListener('click',function(){const sel=document.getElementById('admin-delete-group-select');const gid=sel?.value;if(!gid){showInfoModal('fa-exclamation-circle','Chyba','Vyberte skupinu.','OK');return;}if(confirm('Opravdu smazat skupinu i s otázkami?')){const r=deleteGroup(gid);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');adminLoadGroups();}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');}});
    document.getElementById('reset-db-btn')?.addEventListener('click',function(){if(confirm('⚠️ OPRAVDU chcete resetovat celou databázi? Všechna data budou smazána!')){if(confirm('🔴 Toto je nevratná akce! Všechny otázky, uživatelé a pokrok budou ztraceny. Opravdu pokračovat?')){resetDatabase();showInfoModal('fa-check-circle','Databáze resetována','Všechna data byla smazána a nahrána výchozí data. Stránka se obnoví.','OK',()=>location.reload());}}});
}

// ==========================================
// ADMIN SIDEBAR
// ==========================================
function initAdminSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('sidebarToggle');
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.dataset.section;
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById('section-' + section);
            if (target) target.classList.add('active');
            if (window.innerWidth <= 768) sidebar.classList.remove('open');
        });
    });
    if (toggle) { toggle.addEventListener('click', function() { sidebar.classList.toggle('open'); }); }
}

// ==========================================
// ANNOUNCEMENTS
// ==========================================
function showAnnouncementBanner(text, duration) {
    const old = document.querySelector('.announcement-banner');
    if (old) old.remove();
    const banner = document.createElement('div');
    banner.className = 'announcement-banner';
    banner.innerHTML = `
        <div class="announcement-progress"><div class="announcement-progress-fill" style="animation-duration:${duration}s;"></div></div>
        <div class="announcement-banner-inner">
            <div class="announcement-banner-top">
                <div class="announcement-banner-icon"><i class="fas fa-bullhorn"></i></div>
                <div class="announcement-banner-text">${text}</div>
                <button class="announcement-close-btn" title="Zavřít"><i class="fas fa-times"></i></button>
            </div>
            <div class="announcement-banner-bottom">
                <div class="announcement-timer">
                    <span class="announcement-timer-number"><span class="announcement-timer-digit">${duration}</span></span>
                    <span class="announcement-timer-label">s</span>
                </div>
            </div>
        </div>`;
    document.body.prepend(banner);
    requestAnimationFrame(() => banner.classList.add('active'));
    let remaining = duration;
    const timerContainer = banner.querySelector('.announcement-timer-number');
    const interval = setInterval(() => {
        remaining--;
        if (remaining >= 0 && timerContainer) {
            const digit = timerContainer.querySelector('.announcement-timer-digit');
            if (digit) {
                digit.classList.remove('slide-in');
                digit.classList.add('slide-out');
                const newDigit = document.createElement('span');
                newDigit.className = 'announcement-timer-digit slide-in';
                newDigit.textContent = remaining;
                timerContainer.appendChild(newDigit);
                setTimeout(() => { if (digit.parentNode) digit.remove(); }, 350);
            } else { timerContainer.textContent = remaining; }
        }
        if (remaining <= 0) { clearInterval(interval); banner.classList.remove('active'); setTimeout(() => banner.remove(), 400); }
    }, 1000);
    banner.querySelector('.announcement-close-btn').addEventListener('click', () => { clearInterval(interval); banner.classList.remove('active'); setTimeout(() => banner.remove(), 400); });
}

let announcementPollInterval = null;
function startAnnouncementPolling() {
    if (announcementPollInterval) clearInterval(announcementPollInterval);
    announcementPollInterval = setInterval(async () => {
        try {
            const resp = await fetch('/api/announcement');
            const data = await resp.json();
            if (data.success && data.announcement) {
                const existing = document.querySelector('.announcement-banner');
                if (existing) {
                    const timerEl = existing.querySelector('.announcement-timer-number');
                    if (timerEl) timerEl.textContent = data.announcement.remaining;
                } else { showAnnouncementBanner(data.announcement.text, data.announcement.remaining); }
            }
        } catch (e) {}
    }, 3000);
}

// ==========================================
// PAGES
// ==========================================
function initializeIndexPage(){document.getElementById('contact-form')?.addEventListener('submit',function(e){e.preventDefault();showInfoModal('fa-check-circle','Odesláno','Děkujeme za zprávu.','OK');this.reset();});}

async function initializeLoginPage() {
    document.getElementById('login-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const em = document.getElementById('login-email').value.trim();
        const pw = document.getElementById('login-password').value.trim();
        if (!em || !pw) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyplňte všechny údaje.', 'OK'); return; }
        const r = await handleLogin(em, pw);
        if (r.success) { Swal.fire({icon:'success',title:'Přihlášen!',timer:1200,showConfirmButton:false,background:'#1a1a2e',color:'#fff',iconColor:'#22c55e'}).then(()=>window.location.href='app.html'); }
        else { showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'Zkusit znovu'); }
    });
}

async function initializeRegisterPage() {
    document.getElementById('register-form')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const n = document.getElementById('register-name').value.trim();
        const em = document.getElementById('register-email').value.trim();
        const pw = document.getElementById('register-password').value.trim();
        const p2 = document.getElementById('register-password-confirm').value.trim();
        if (!n || !em || !pw || !p2) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Vyplňte všechny údaje.', 'OK'); return; }
        if (pw !== p2) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Hesla se neshodují.', 'OK'); return; }
        if (pw.length < 6) { showInfoModal('fa-exclamation-circle', 'Chyba', 'Heslo min. 6 znaků.', 'OK'); return; }
        const r = await handleRegister(n, em, pw);
        if (r.success) { Swal.fire({icon:'success',title:'Registrován!',timer:1200,showConfirmButton:false,background:'#1a1a2e',color:'#fff',iconColor:'#22c55e'}).then(()=>window.location.href='app.html'); }
        else { showInfoModal('fa-exclamation-circle', 'Chyba', r.message, 'Zkusit znovu'); }
    });
}

async function initializeLeaderboardPage() {
    const o = document.createElement('div'); o.className='loading-overlay active';
    o.innerHTML = `<div style="font-size:5rem;color:#fbbf24;animation:pulse 1.5s ease-in-out infinite;"><i class="fas fa-trophy"></i></div><div class="loading-text" style="font-size:1.2rem;margin-top:0.5rem;">Načítám žebříček...</div><div class="spinner" style="width:40px;height:40px;margin-top:1rem;"></div>`;
    document.body.appendChild(o);
    await syncUsersFromDB();
    setTimeout(() => { o.remove(); renderLeaderboard('leaderboard-container'); const syncText = document.getElementById('sync-text'); if (syncText) syncText.textContent = 'Data načtena ✓'; }, 200);
}

async function initializeAppPage(){
    if(!getCurrentSession()){showLoginRequiredModal();return;}
    await displayGroups('group-cards');
    document.querySelectorAll('[data-tab]').forEach(tab=>{tab.addEventListener('click',function(){const t=this.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('active'));this.classList.add('active');document.querySelectorAll('.tab-content').forEach(c=>c.classList.add('d-none'));document.getElementById(t)?.classList.remove('d-none');if(t==='step-profile')renderProfile();});});
    document.getElementById('exit-test-btn')?.addEventListener('click',function(){const s3=document.getElementById('step-test-interface'),s2=document.getElementById('step-category-selection');if(s3&&s2){s3.classList.add('d-none');s2.classList.remove('d-none');}});
    document.getElementById('prev-question-btn')?.addEventListener('click',previousQuestion);
    document.getElementById('next-question-btn')?.addEventListener('click',function(){if(testState.currentIndex>=testState.questions.length-1)showTestResults();else nextQuestion();});
}

// ==========================================
// PARTICLES
// ==========================================
function createParticles(){if(document.querySelector('.particles'))return;const c=document.createElement('div');c.className='particles';for(let i=0;i<12;i++){const p=document.createElement('div');p.className='particle';p.style.cssText=`left:${Math.random()*100}%;width:${Math.random()*2+2}px;height:${p.style.width};animation-duration:${Math.random()*15+20}s;animation-delay:${Math.random()*15}s;opacity:${Math.random()*0.3+0.1}`;c.appendChild(p);}document.body.appendChild(c);}

// ==========================================
// DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    initTheme();
    initAppData();
    AudioFX.init();
    createParticles();
    initializeNavbar();
    
    let page = window.location.pathname.split('/').pop() || 'index.html';
    if (page.endsWith('/')) page = page.slice(0, -1);
    if (page && !page.includes('.')) page = page + '.html';
    if (!page || page === '.html') page = 'index.html';

    if (page !== 'admin.html') { startAnnouncementPolling(); }

    if (page === 'login.html') initializeLoginPage();
    else if (page === 'register.html') initializeRegisterPage();
    else if (page === 'app.html') await initializeAppPage();
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