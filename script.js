/* ========================================
   AUTOSKOLA PRO - Final v3
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
// AUDIO
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
    play(s) { try { if (this[s]) { this[s].currentTime = 0; this[s].play().catch(()=>{}); } } catch(e) {} }
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
function updateCurrentUser(upd) {
    const s = getCurrentSession(); if (!s) return;
    const users = getUsers(); const idx = users.findIndex(u => u.id === s.userId); if (idx === -1) return;
    Object.assign(users[idx], upd); saveUsers(users);
    if (upd.name) { s.name = upd.name; saveSession(s); }
    if (upd.email) { s.email = upd.email; saveSession(s); }
}

// ==========================================
// XP & LEVELS
// ==========================================
function addXP(amount) {
    const u = getCurrentUser(); if (!u) return null;
    const nx = (u.xp||0)+amount; const ol = getLevel(u.xp||0); const nl = getLevel(nx);
    updateCurrentUser({xp:nx});
    if (nl.level > ol.level) { showLevelUpNotification(nl); AudioFX.play('fanfare'); }
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
    a.push(id); updateCurrentUser({achievements:a}); addXP(ach.xpReward); AudioFX.play('achievement');
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
// LEADERBOARD
// ==========================================
async function renderLeaderboard(containerId) {
    const c = document.getElementById(containerId); if (!c) return;
    const users = getUsers(); let players = [];
    if (users && users.length > 0 && users.some(u=>(u.xp||0) > 0)) {
        players = users.map(u=>({name:u.name, xp:u.xp||0, avatar:u.avatar||'', isCEO:u.isCEO||false})).sort((a,b)=>b.xp-a.xp).slice(0,10);
    }
    if (players.length === 0) players = MOCK_LEADERBOARD;
    const ln = ['','Chodec','Žák','Řidič','Závodník','Profesionál','Mistr silnic','Legenda','Bůh volantu'];
    c.innerHTML = `<div class="table-responsive"><table class="leaderboard-table"><thead><tr><th style="width:50px;">#</th><th>Hráč</th><th style="width:120px;">Level</th><th style="width:100px;">XP</th></tr></thead><tbody>${
        players.map((p,i)=>{
            const r=i+1; const lv=getLevel(p.xp||0); const lvName=ln[lv.level]||'Chodec';
            let rc='rank-default',m=''; if(r===1){rc='rank-1';m='🥇'}else if(r===2){rc='rank-2';m='🥈'}else if(r===3){rc='rank-3';m='🥉'}
            const ah=p.avatar?`<img src="${p.avatar}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;margin-right:0.5rem;">`
                :`<div style="width:28px;height:28px;border-radius:50%;background:rgba(255,107,0,0.15);display:inline-flex;align-items:center;justify-content:center;margin-right:0.5rem;font-size:0.75rem;color:#ff6b00;font-weight:700;flex-shrink:0;">${(p.name||'?').charAt(0)}</div>`;
            const crown=p.isCEO?'<i class="fas fa-crown" style="color:#fbbf24;margin-right:0.3rem;"></i>':'';
            return `<tr class="animate__animated animate__fadeIn" style="animation-delay:${i*0.05}s;"><td><span class="leaderboard-rank ${rc}" style="width:36px;height:36px;font-size:0.9rem;">${m||r}</span></td><td><div style="display:flex;align-items:center;">${ah}<div><div style="font-weight:600;font-size:0.9rem;color:var(--text-primary);">${crown}${p.name||'Neznámý'}</div></div></div></td><td><span style="color:var(--accent);font-weight:700;font-size:0.85rem;">${lvName}</span></td><td><span style="font-weight:700;font-size:0.95rem;color:var(--text-primary);">${(p.xp||0).toLocaleString()}</span><span style="font-size:0.65rem;color:var(--text-muted);display:block;">XP</span></td></tr>`;
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
function showLoadingScreen(cb) {
    const o=document.createElement('div');o.className='loading-overlay active';
    o.innerHTML=`<div class="loading-spinner-wheel"><i class="fas fa-car-side"></i></div><div class="loading-text">Generuji tvůj test...</div><div class="loading-spinner"></div>`;
    document.body.appendChild(o); setTimeout(()=>{o.remove();if(cb)cb();},1500);
}

// ==========================================
// NAVBAR
// ==========================================
function initializeNavbar() {
    const p = document.getElementById('navbar-placeholder'); if (!p) return;
    const session = getCurrentSession(); const user = getCurrentUser();
    const page = window.location.pathname.split('/').pop() || 'index.html';

    let right = '';
    if (session) {
        const lv = getLevel(user?.xp||0); const prog = getXPProgress(user?.xp||0);
        right = `
            <li class="nav-item" style="position:relative;">
                <a class="nav-link user-menu-toggle" href="#" style="color:#22c55e;padding:0.3rem 0.6rem;font-size:0.85rem;cursor:pointer;">
                    <i class="fas fa-user-circle me-1"></i>${session.name||session.email} <span class="badge" style="background:rgba(255,107,0,0.2);color:#ff6b00;font-size:0.65rem;">Lv.${lv.level}</span> <i class="fas fa-chevron-down" style="font-size:0.6rem;"></i>
                </a>
                <div class="user-dropdown-menu" style="display:none;position:absolute;top:100%;right:0;min-width:220px;background:var(--navbar-bg);border:1px solid var(--border-color);border-radius:0.75rem;padding:0.5rem;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,0.3);">
                    <div class="px-3 py-2" style="border-bottom:1px solid var(--border-color);margin-bottom:0.5rem;">
                        <div class="xp-bar" style="width:100%;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
                            <div class="xp-bar-fill" style="height:100%;width:${prog.progress}%;background:linear-gradient(90deg,var(--accent),#fbbf24);border-radius:2px;transition:width 0.5s;"></div>
                        </div>
                        <span style="font-size:0.65rem;color:var(--text-muted);margin-top:0.2rem;display:block;">Lv.${lv.level} ${lv.title}</span>
                    </div>
                    ${session.isCEO?'<a href="admin.html" class="user-dropdown-item" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:0.5rem;transition:background 0.2s;"><i class="fas fa-shield-alt" style="color:var(--accent);width:20px;"></i>Admin panel</a>':''}
                    <a href="#" class="user-dropdown-item" id="logoutBtn" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0.75rem;color:#ef4444;text-decoration:none;border-radius:0.5rem;transition:background 0.2s;"><i class="fas fa-sign-out-alt" style="width:20px;"></i>Odhlásit</a>
                </div>
            </li>`;
    } else {
        right = `
            <li class="nav-item"><a class="nav-link ${page==='login.html'?'active':''}" href="login.html" style="font-size:0.85rem;padding:0.3rem 0.8rem;"><i class="fas fa-sign-in-alt me-1"></i>Přihlásit</a></li>
            <li class="nav-item"><a class="nav-link ${page==='register.html'?'active':''}" href="register.html" style="font-size:0.85rem;padding:0.3rem 0.8rem;"><i class="fas fa-user-plus me-1"></i>Registrovat</a></li>`;
    }

    p.innerHTML = `
        <nav class="navbar fixed-top">
            <div class="container">
                <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
                    <i class="fas fa-graduation-cap" style="color:#ff6b00;font-size:1.3rem;"></i>
                    <span style="font-weight:800;font-size:1.1rem;background:linear-gradient(135deg,#fff,#ff6b00);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">Autoškola Pro</span>
                </a>
                <div class="d-flex align-items-center gap-1">
                    <button class="theme-toggle" id="themeToggleBtn" title="Přepnout režim" style="width:34px;height:34px;font-size:0.9rem;">
                        ${localStorage.getItem(APP_THEME_KEY)==='light'?'<i class="fas fa-moon"></i>':'<i class="fas fa-sun"></i>'}
                    </button>
                    <button class="mobile-menu-btn border-0" id="mobileMenuToggle" style="width:34px;height:34px;background:rgba(255,107,0,0.1);border-radius:50%;color:#fff;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.3s;">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
                <!-- Mobile dropdown menu -->
                <div class="mobile-menu-panel" id="mobileMenuPanel" style="display:none;position:absolute;top:100%;right:10px;min-width:200px;background:var(--navbar-bg);border:1px solid var(--border-color);border-radius:0.75rem;padding:0.5rem;z-index:9999;box-shadow:0 10px 40px rgba(0,0,0,0.3);opacity:0;transform:translateY(-10px);transition:all 0.3s ease;">
                    <div style="display:flex;flex-direction:column;gap:0.25rem;">
                        <a class="mobile-menu-item ${page==='index.html'?'active':''}" href="index.html" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:0.5rem;font-size:0.9rem;transition:background 0.2s;"><i class="fas fa-home" style="width:20px;color:var(--accent);"></i>Domů</a>
                        <a class="mobile-menu-item app-link ${page==='app.html'?'active':''}" href="#" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:0.5rem;font-size:0.9rem;transition:background 0.2s;"><i class="fas fa-car" style="width:20px;color:var(--accent);"></i>Aplikace</a>
                        <a class="mobile-menu-item ${page==='leaderboard.html'?'active':''}" href="leaderboard.html" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:0.5rem;font-size:0.9rem;transition:background 0.2s;"><i class="fas fa-trophy" style="width:20px;color:var(--accent);"></i>Žebříček</a>
                        <hr style="border-color:var(--border-color);margin:0.25rem 0;">
                        ${!session ? `
                        <a class="mobile-menu-item" href="login.html" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:0.5rem;font-size:0.9rem;transition:background 0.2s;"><i class="fas fa-sign-in-alt" style="width:20px;color:var(--accent);"></i>Přihlásit</a>
                        <a class="mobile-menu-item" href="register.html" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:0.5rem;font-size:0.9rem;transition:background 0.2s;"><i class="fas fa-user-plus" style="width:20px;color:var(--accent);"></i>Registrovat</a>
                        ` : `
                        <div style="padding:0.5rem 0.75rem;border-radius:0.5rem;background:rgba(34,197,94,0.05);">
                            <div style="font-size:0.8rem;color:#22c55e;font-weight:600;"><i class="fas fa-user-circle me-1"></i>${session.name||session.email}</div>
                            <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.2rem;">Lv.${lv.level} ${lv.title}</div>
                            <div class="xp-bar" style="width:100%;height:3px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;margin-top:0.3rem;"><div class="xp-bar-fill" style="height:100%;width:${prog.progress}%;background:linear-gradient(90deg,var(--accent),#fbbf24);border-radius:2px;"></div></div>
                        </div>
                        ${session.isCEO?`<a class="mobile-menu-item" href="admin.html" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;color:var(--text-primary);text-decoration:none;border-radius:0.5rem;font-size:0.9rem;transition:background 0.2s;"><i class="fas fa-shield-alt" style="width:20px;color:var(--accent);"></i>Admin panel</a>`:''}
                        <a class="mobile-menu-item" href="#" id="logoutBtnMobile" style="display:flex;align-items:center;gap:0.5rem;padding:0.6rem 0.75rem;color:#ef4444;text-decoration:none;border-radius:0.5rem;font-size:0.9rem;transition:background 0.2s;"><i class="fas fa-sign-out-alt" style="width:20px;"></i>Odhlásit</a>
                        `}
                    </div>
                </div>
                <!-- Desktop inline nav (hidden on mobile) -->
                <div class="desktop-nav" id="desktopNav" style="display:none;">
                    <a href="index.html" style="color:var(--text-secondary);text-decoration:none;padding:0.3rem 0.8rem;font-size:0.85rem;border-radius:0.5rem;transition:all 0.3s;"><i class="fas fa-home me-1"></i>Domů</a>
                    <a class="app-link" href="#" style="color:var(--text-secondary);text-decoration:none;padding:0.3rem 0.8rem;font-size:0.85rem;border-radius:0.5rem;transition:all 0.3s;"><i class="fas fa-car me-1"></i>Aplikace</a>
                    <a href="leaderboard.html" style="color:var(--text-secondary);text-decoration:none;padding:0.3rem 0.8rem;font-size:0.85rem;border-radius:0.5rem;transition:all 0.3s;"><i class="fas fa-trophy me-1"></i>Žebříček</a>
                    ${right.includes('Přihlásit')||right.includes('Registrovat')||right.includes('Odhlásit')?right.replace(/<li[^>]*>|<\/li>/g,'').replace(/class="nav-link/g,'style="color:var(--text-secondary);text-decoration:none;padding:0.3rem 0.8rem;font-size:0.85rem;border-radius:0.5rem;transition:all 0.3s;" class=""'):''}
                </div>
            </div>
        </nav>
        <style>
            .mobile-menu-item:hover { background:rgba(255,107,0,0.1); }
            .mobile-menu-item.active { background:rgba(255,107,0,0.15); color:#ff6b00 !important; }
            .mobile-menu-item.active i { color:#ff6b00 !important; }
            .mobile-menu-panel.show { display:block !important; opacity:1 !important; transform:translateY(0) !important; }
            @media (min-width: 992px) {
                .mobile-menu-btn { display:none !important; }
                .mobile-menu-panel { display:none !important; }
                .desktop-nav { display:flex !important; align-items:center; gap:0.25rem; }
            }
            @media (max-width: 991.98px) {
                .desktop-nav { display:none !important; }
                .user-menu-toggle { display:none !important; }
                .user-dropdown-menu { display:none !important; }
            }
        </style>`;

    document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);
    const nav = document.querySelector('.navbar');
    if (nav) window.addEventListener('scroll', ()=>nav.classList.toggle('scrolled',window.scrollY>50), {passive:true});

    document.querySelectorAll('.app-link').forEach(l=>{
        l.addEventListener('click',function(e){e.preventDefault();if(!getCurrentSession())showLoginRequiredModal();else window.location.href='app.html';});
    });
    document.getElementById('logoutBtn')?.addEventListener('click',function(e){e.preventDefault();saveSession(null);window.location.href='index.html';});

    // Custom dropdown toggle (works on ALL devices - no Bootstrap dropdown dependency)
    const userToggle = document.querySelector('.user-menu-toggle');
    const userMenu = document.querySelector('.user-dropdown-menu');
    if (userToggle && userMenu) {
        userToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = userMenu.style.display === 'block';
            // Close all other dropdowns first
            document.querySelectorAll('.user-dropdown-menu').forEach(m => m.style.display = 'none');
            userMenu.style.display = isOpen ? 'none' : 'block';
            // Rotate chevron
            const chevron = this.querySelector('.fa-chevron-down');
            if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.user-menu-toggle') && !e.target.closest('.user-dropdown-menu')) {
                userMenu.style.display = 'none';
                const chevron = document.querySelector('.user-menu-toggle .fa-chevron-down');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
        });
    }

    // Close mobile collapse menu when ANY nav link is clicked
    document.querySelectorAll('#navbarMain .nav-link').forEach(l=>{
        l.addEventListener('click', function() {
            const c = document.getElementById('navbarMain');
            if (c && c.classList.contains('show')) {
                const bs = bootstrap.Collapse.getInstance(c);
                if (bs) bs.hide();
            }
        });
    });
}

function updateNavbarXP() {
    const u=getCurrentUser();if(!u)return;
    const lv=getLevel(u.xp||0);const prog=getXPProgress(u.xp||0);
    const fill=document.querySelector('.xp-bar-fill');const text=document.querySelector('.xp-text');
    if(fill)fill.style.width=prog.progress+'%';
    if(text)text.textContent=`Lv.${lv.level} ${lv.title}`;
}

// ==========================================
// AUTH
// ==========================================
function handleLogin(email,password) {
    const u=getUsers().find(x=>x.email===email&&x.password===password);
    if(!u)return{success:false,message:'Nesprávný email nebo heslo.'};
    saveSession({userId:u.id,email:u.email,name:u.name,isCEO:u.isCEO||false,loggedInAt:new Date().toISOString()});
    return{success:true,message:'Přihlášení proběhlo úspěšně!',isCEO:u.isCEO};
}
function handleRegister(name,email,password) {
    const users=getUsers();
    if(users.find(u=>u.email===email))return{success:false,message:'Účet s tímto emailem již existuje.'};
    if(email===CEO_EMAIL)return{success:false,message:'Tento email je již registrován.'};
    const nu={id:generateId(),email,password,name,isCEO:false,registeredAt:new Date().toISOString(),xp:0,bestScore:0,achievements:[],streak:0,bestStreak:0,totalAnswered:0,avatar:''};
    users.push(nu);saveUsers(users);
    saveSession({userId:nu.id,email:nu.email,name:nu.name,isCEO:false,loggedInAt:new Date().toISOString()});
    return{success:true,message:'Registrace proběhla úspěšně!',isCEO:false};
}

// ==========================================
// PROFILE
// ==========================================
function renderProfile() {
    const u=getCurrentUser();if(!u)return;const c=document.getElementById('profile-content');if(!c)return;
    const ach=u.achievements||[];const ta=u.totalAnswered||0;
    if(ta>=10)checkAchievement('zelenac');if(ta>=15)checkAchievement('vytrvalec');
    const badges=[
        {id:'zelenac',icon:'fa-seedling',label:'Zelenáč',desc:'10 otázek',unlocked:ach.includes('zelenac')},
        {id:'vytrvalec',icon:'fa-person-running',label:'Vytrvalec',desc:'15 otázek',unlocked:ach.includes('vytrvalec')},
        {id:'first_blood',icon:'fa-droplet',label:'První krev',desc:'1. správná',unlocked:ach.includes('first_blood')},
        {id:'streak_5',icon:'fa-fire',label:'Pán Plamene',desc:'Streak 5',unlocked:ach.includes('streak_5')},
        {id:'genius',icon:'fa-brain',label:'Génius',desc:'100% test',unlocked:ach.includes('genius')},
        {id:'clean_slate',icon:'fa-shield-halved',label:'Čistý štít',desc:'Opraveno vše',unlocked:ach.includes('clean_slate')},
        {id:'speedster',icon:'fa-bolt',label:'Rychlík',desc:'<3s odpověď',unlocked:ach.includes('speedster')}
    ];
    const lv=getLevel(u.xp||0);const prog=getXPProgress(u.xp||0);
    c.innerHTML=`<div class="row g-3"><div class="col-md-5"><div class="admin-card"><h3><i class="fas fa-user-cog me-2"></i>Upravit profil</h3>
        <form id="profile-form"><div class="mb-2"><label class="text-white-50 small mb-1">Avatar (URL)</label><input type="url" class="admin-input" id="profile-avatar" value="${u.avatar||''}"></div>
        <div class="mb-2"><label class="text-white-50 small mb-1">Jméno</label><input type="text" class="admin-input" id="profile-name" value="${u.name||''}"></div>
        <div class="mb-2"><label class="text-white-50 small mb-1">Email</label><input type="email" class="admin-input" id="profile-email" value="${u.email||''}"></div>
        <div class="mb-2"><label class="text-white-50 small mb-1">Nové heslo</label><input type="password" class="admin-input" id="profile-password" placeholder="Nové heslo"></div>
        <button type="submit" class="btn-autoskola w-100" style="font-size:0.85rem;"><i class="fas fa-save me-2"></i>Uložit</button></form></div></div>
        <div class="col-md-7"><div class="admin-card"><h3><i class="fas fa-medal me-2"></i>Odznaky</h3>
        <p class="text-white-50 small mb-3">Zodpovězeno: <strong style="color:#ff6b00;">${ta}</strong> otázek</p>
        <div class="row g-2">${badges.map(b=>`<div class="col-4 col-md-3 text-center"><div style="width:100%;aspect-ratio:1;border-radius:1rem;background:${b.unlocked?'rgba(255,107,0,0.2)':'rgba(255,255,255,0.05)'};border:2px solid ${b.unlocked?'rgba(255,107,0,0.4)':'rgba(255,255,255,0.06)'};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0.5rem;${b.unlocked?'':'filter:grayscale(1);opacity:0.4;'}" title="${b.desc}"><i class="fas ${b.icon}" style="font-size:1.5rem;color:${b.unlocked?'#ff6b00':'rgba(255,255,255,0.3)'};"></i><span style="font-size:0.6rem;margin-top:0.3rem;color:${b.unlocked?'#ff6b00':'rgba(255,255,255,0.3)'};font-weight:600;">${b.label}</span></div></div>`).join('')}</div></div>
        <div class="admin-card"><h3><i class="fas fa-chart-simple me-2"></i>Statistiky</h3>
        <div class="row g-2 text-center"><div class="col-4"><div style="font-size:1.3rem;font-weight:900;color:#ff6b00;">${u.xp||0}</div><div class="text-white-50 small">XP</div></div>
        <div class="col-4"><div style="font-size:1.3rem;font-weight:900;color:#22c55e;">${lv.title}</div><div class="text-white-50 small">Level ${lv.level}</div></div>
        <div class="col-4"><div style="font-size:1.3rem;font-weight:900;color:#fbbf24;">${u.bestScore||0}%</div><div class="text-white-50 small">Nejlepší</div></div></div>
        <div class="mt-2"><div class="progress-bar-custom" style="height:4px;"><div class="progress-fill" style="width:${prog.progress}%"></div></div><div class="text-white-50 small mt-1 text-center">${prog.xpInLevel} / ${prog.xpNeeded} XP do dalšího levelu</div></div></div></div></div>`;

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
function getGroupProgress(gid){
    const s=getCurrentSession();if(!s)return{total:0,answered:0,percentage:0};
    const a=getAllQuestionsForGroup(gid);if(a.length===0)return{total:0,answered:0,percentage:0};
    const p=JSON.parse(localStorage.getItem('autoskolaProProgress_'+s.userId)||'{}');const ids=p[gid]||[];
    return{total:a.length,answered:ids.length,percentage:Math.round((ids.length/a.length)*100)};
}
function markQuestionAnswered(gid,qid){const s=getCurrentSession();if(!s)return;const k='autoskolaProProgress_'+s.userId;const d=JSON.parse(localStorage.getItem(k)||'{}');if(!d[gid])d[gid]=[];if(!d[gid].includes(qid))d[gid].push(qid);localStorage.setItem(k,JSON.stringify(d));}
function addWrongQuestion(gid,qid){const s=getCurrentSession();if(!s)return;const k='autoskolaProWrong_'+s.userId;const d=JSON.parse(localStorage.getItem(k)||'{}');if(!d[gid])d[gid]=[];if(!d[gid].includes(qid))d[gid].push(qid);localStorage.setItem(k,JSON.stringify(d));}
function getWrongQuestionIds(gid){const s=getCurrentSession();if(!s)return[];const d=JSON.parse(localStorage.getItem('autoskolaProWrong_'+s.userId)||'{}');return d[gid]||[];}

function renderProgressCircle(pct,size=36){const r=(size/2)-4;const c=2*Math.PI*r;const o=c-(pct/100)*c;return`<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${pct>0?'#22c55e':'rgba(255,255,255,0.08)'}" stroke-width="3" stroke-dasharray="${c}" stroke-dashoffset="${o}" transform="rotate(-90 ${size/2} ${size/2})" style="transition:stroke-dashoffset 0.5s ease;"/></svg>`;}

function displayGroups(containerId) {
    const c=document.getElementById(containerId);if(!c)return;const groups=loadGroups();
    if(groups.length===0){c.innerHTML='<div class="empty-state"><i class="fas fa-folder-open"></i><p>Zatím žádné skupiny.</p></div>';return;}
    c.innerHTML=groups.map(g=>{const p=getGroupProgress(g.id);return`<div class="group-card" data-group-id="${g.id}" style="padding:1rem;"><div style="display:flex;align-items:center;justify-content:space-between;"><div class="group-letter" style="font-size:1.5rem;">${g.letter}</div><div style="flex-shrink:0;">${renderProgressCircle(p.percentage,32)}</div></div><div class="group-name" style="font-size:0.8rem;">${g.name}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.3rem;"><span style="color:rgba(255,255,255,0.3);font-size:0.65rem;"><i class="fas fa-question-circle me-1"></i>${p.total} ot.</span><span style="color:${p.percentage>0?'#22c55e':'rgba(255,255,255,0.3)'};font-size:0.65rem;font-weight:600;">${p.percentage}%</span></div></div>`;}).join('');
    c.querySelectorAll('.group-card').forEach(card=>{card.addEventListener('click',function(){testState.groupId=this.dataset.groupId;showCategorySelection(this.dataset.groupId);});});
}

function showCategorySelection(gid) {
    const g=getAppData().groups.find(x=>x.id===gid);if(!g)return;
    const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface'),s4=document.getElementById('step-test-results'),s5=document.getElementById('step-profile');
    if(s1&&s2){s1.classList.add('d-none');s2.classList.remove('d-none');if(s3)s3.classList.add('d-none');if(s4)s4.classList.add('d-none');if(s5)s5.classList.add('d-none');}
    const con=document.getElementById('category-cards');if(!con)return;
    let cats=[];Object.keys(g.categories).forEach(key=>{const cnt=(g.categories[key]||[]).length;let icon='fa-folder',label=key;if(key==='znacky'){icon='fa-traffic-light';label='Dopravní značky'}else if(key==='situace'){icon='fa-car-crash';label='Dopravní situace'}else{icon='fa-tag';label=key.charAt(0).toUpperCase()+key.slice(1)}cats.push({key,icon,name:label,count:cnt});});
    cats.push({key:'all',icon:'fa-layer-group',name:'Všechny otázky',count:getAllQuestionsForGroup(gid).length});
    const wc=getWrongQuestionIds(gid).length;if(wc>0)cats.push({key:'wrong',icon:'fa-exclamation-triangle',name:'Otázky, které neumím',count:wc});
    con.innerHTML=cats.map(cat=>`<div class="category-card" data-category="${cat.key}" style="padding:1rem;"><div class="category-icon" style="font-size:1.5rem;margin-bottom:0.4rem;"><i class="fas ${cat.icon}"></i></div><h6 style="font-weight:700;font-size:0.8rem;margin-bottom:0.2rem;">${cat.name}</h6><span style="color:rgba(255,255,255,0.4);font-size:0.7rem;">${cat.count} ot.</span></div>`).join('');
    con.querySelectorAll('.category-card').forEach(card=>{card.addEventListener('click',function(){testState.category=this.dataset.category;startTest(gid,this.dataset.category);});});
    document.getElementById('back-to-groups')?.addEventListener('click',function(){s1.classList.remove('d-none');s2.classList.add('d-none');testState.groupId=null;},{once:true});
}

function startTest(gid,cat){
    let qs=loadQuestions(gid,cat);if(cat==='wrong'){const ids=getWrongQuestionIds(gid);qs=getAllQuestionsForGroup(gid).filter(q=>ids.includes(q.id));}
    if(qs.length===0){showInfoModal('fa-info-circle','Žádné otázky','V této kategorii zatím nejsou žádné otázky.','Zpět',()=>{const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection');if(s1&&s2){s2.classList.add('d-none');s1.classList.remove('d-none');}});return;}
    const shuffled=[...qs].sort(()=>Math.random()-0.5);
    testState={groupId:gid,category:cat,questions:shuffled,currentIndex:0,score:0,totalAnswered:0,wrongQuestions:[],isReviewMode:false,answerTimestamps:[],answered:false};
    showLoadingScreen(()=>{const s1=document.getElementById('step-group-selection'),s2=document.getElementById('step-category-selection'),s3=document.getElementById('step-test-interface');if(s1&&s2&&s3){s1.classList.add('d-none');s2.classList.add('d-none');s3.classList.remove('d-none');}displayCurrentQuestion();});
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
    if(correct){
        testState.score++;markQuestionAnswered(testState.groupId,q.id);addXP(10);updateStreak(true);AudioFX.play('correct');
        if(testState.totalAnswered===1)checkAchievement('first_blood');if(elapsed<3)checkAchievement('speedster');
        const xi=document.getElementById('xp-info');if(xi){const s=getStreakDisplay();let h='<div class="d-flex align-items-center gap-2 flex-wrap" style="font-size:0.8rem;">';h+='<span style="color:#22c55e;"><i class="fas fa-check-circle me-1"></i>Správně! +10 XP</span>';if(s)h+=`<span class="streak-badge" style="font-size:0.75rem;">🔥 ${s.count}x ${s.text}</span>`;h+='</div>';xi.innerHTML=h;}
    }else{
        addWrongQuestion(testState.groupId,q.id);updateStreak(false);AudioFX.play('wrong');
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
    const user=getCurrentUser();if(user&&pct>(user.bestScore||0))updateCurrentUser({bestScore:pct});if(pct===100&&totalAnswered>0)checkAchievement('genius');if(passed)AudioFX.play('fanfare');
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
function resetDatabase(){localStorage.removeItem(APP_DATA_KEY);localStorage.removeItem(APP_USERS_KEY);localStorage.removeItem(APP_SESSION_KEY);Object.keys(localStorage).forEach(k=>{if(k.startsWith('autoskolaProProgress_')||k.startsWith('autoskolaProWrong_')||k.startsWith('autoskolaProCorrectTrack_'))localStorage.removeItem(k);});initAppData();const users=getUsers();const ceo=users.find(u=>u.isCEO);if(ceo)saveSession({userId:ceo.id,email:ceo.email,name:ceo.name,isCEO:true,loggedInAt:new Date().toISOString()});}

// ==========================================
// ADMIN EVENTS
// ==========================================
function initializeAdminPanel(){
    if(!checkAdminAccess())return;adminLoadGroups();
    document.getElementById('admin-filter-category')?.addEventListener('change',function(){displayAdminQuestions(document.getElementById('admin-group-select')?.value,this.value);});
    document.getElementById('add-group-form')?.addEventListener('submit',function(e){e.preventDefault();const l=document.getElementById('group-letter').value.trim().toUpperCase();const n=document.getElementById('group-name').value.trim();if(!l||!n){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte všechna pole.','OK');return;}const r=addNewGroup(l,n);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');document.getElementById('group-letter').value='';document.getElementById('group-name').value='';adminLoadGroups();}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');});
    document.getElementById('add-category-form')?.addEventListener('submit',function(e){e.preventDefault();const k=document.getElementById('category-key').value.trim().toLowerCase().replace(/\s+/g,'_');const l=document.getElementById('category-label').value.trim();if(!k||!l){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte obě pole.','OK');return;}const r=addNewCategory(k,l);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');document.getElementById('category-key').value='';document.getElementById('category-label').value='';adminLoadGroups();}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');});
    document.getElementById('add-question-form')?.addEventListener('submit',function(e){e.preventDefault();const gid=document.getElementById('admin-group-select').value;const cat=document.getElementById('admin-category-select').value;const q=document.getElementById('question-text').value.trim();const a=document.getElementById('option-a').value.trim();const b=document.getElementById('option-b').value.trim();const c=document.getElementById('option-c').value.trim();const img=document.getElementById('question-image').value.trim();const expl=document.getElementById('question-explanation').value.trim();const cr=document.querySelector('input[name="correct-answer"]:checked');if(!cr){showInfoModal('fa-exclamation-circle','Chyba','Označte správnou odpověď.','OK');return;}const ci=parseInt(cr.value);if(!gid||!cat){showInfoModal('fa-exclamation-circle','Chyba','Vyberte skupinu a kategorii.','OK');return;}if(!q||!a||!b||!c){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte všechny údaje.','OK');return;}const r=addNewQuestion(gid,cat,q,[a,b,c],ci,img,expl);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');['question-text','option-a','option-b','option-c','question-image','question-explanation'].forEach(id=>document.getElementById(id).value='');const ch=document.querySelector('input[name="correct-answer"]:checked');if(ch)ch.checked=false;}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');});
    document.getElementById('delete-group-btn')?.addEventListener('click',function(){const sel=document.getElementById('admin-delete-group-select');const gid=sel?.value;if(!gid){showInfoModal('fa-exclamation-circle','Chyba','Vyberte skupinu.','OK');return;}if(confirm('Opravdu smazat skupinu i s otázkami?')){const r=deleteGroup(gid);if(r.success){showInfoModal('fa-check-circle','Hotovo',r.message,'OK');adminLoadGroups();}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'OK');}});
    document.getElementById('reset-db-btn')?.addEventListener('click',function(){if(confirm('⚠️ OPRAVDU chcete resetovat celou databázi? Všechna data budou smazána!')){if(confirm('🔴 Toto je nevratná akce! Všechny otázky, uživatelé a pokrok budou ztraceny. Opravdu pokračovat?')){resetDatabase();showInfoModal('fa-check-circle','Databáze resetována','Všechna data byla smazána a nahrána výchozí data. Stránka se obnoví.','OK',()=>location.reload());}}});
}

// ==========================================
// PAGES
// ==========================================
function initializeIndexPage(){document.getElementById('contact-form')?.addEventListener('submit',function(e){e.preventDefault();showInfoModal('fa-check-circle','Odesláno','Děkujeme za zprávu.','OK');this.reset();});}
function initializeLoginPage(){document.getElementById('login-form')?.addEventListener('submit',function(e){e.preventDefault();const em=document.getElementById('login-email').value.trim();const pw=document.getElementById('login-password').value.trim();if(!em||!pw){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte všechny údaje.','OK');return;}const r=handleLogin(em,pw);if(r.success){Swal.fire({icon:'success',title:'Přihlášen!',timer:1200,showConfirmButton:false,background:'#1a1a2e',color:'#fff',iconColor:'#22c55e'}).then(()=>window.location.href='app.html');}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'Zkusit znovu');});}
function initializeRegisterPage(){document.getElementById('register-form')?.addEventListener('submit',function(e){e.preventDefault();const n=document.getElementById('register-name').value.trim();const em=document.getElementById('register-email').value.trim();const pw=document.getElementById('register-password').value.trim();const p2=document.getElementById('register-password-confirm').value.trim();if(!n||!em||!pw||!p2){showInfoModal('fa-exclamation-circle','Chyba','Vyplňte všechny údaje.','OK');return;}if(pw!==p2){showInfoModal('fa-exclamation-circle','Chyba','Hesla se neshodují.','OK');return;}if(pw.length<6){showInfoModal('fa-exclamation-circle','Chyba','Heslo min. 6 znaků.','OK');return;}const r=handleRegister(n,em,pw);if(r.success){Swal.fire({icon:'success',title:'Registrován!',timer:1200,showConfirmButton:false,background:'#1a1a2e',color:'#fff',iconColor:'#22c55e'}).then(()=>window.location.href='app.html');}else showInfoModal('fa-exclamation-circle','Chyba',r.message,'Zkusit znovu');});}

function initializeLeaderboardPage() {
    // Loading overlay with trophy
    const o = document.createElement('div'); o.className='loading-overlay active';
    o.innerHTML = `<div style="font-size:5rem;color:#fbbf24;animation:pulse 1.5s ease-in-out infinite;"><i class="fas fa-trophy"></i></div><div class="loading-text" style="font-size:1.2rem;margin-top:0.5rem;">Načítám žebříček...</div><div class="spinner" style="width:40px;height:40px;margin-top:1rem;"></div>`;
    document.body.appendChild(o);
    setTimeout(() => { o.remove(); renderLeaderboard('leaderboard-container'); }, 1500);
}

function initializeAppPage(){
    if(!getCurrentSession()){showLoginRequiredModal();return;}
    displayGroups('group-cards');
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
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initAppData();
    AudioFX.init();
    createParticles();
    initializeNavbar();
    
    let page = window.location.pathname.split('/').pop() || 'index.html';
    if (page.endsWith('/')) page = page.slice(0, -1);
    if (page && !page.includes('.')) page = page + '.html';
    if (!page || page === '.html') page = 'index.html';

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