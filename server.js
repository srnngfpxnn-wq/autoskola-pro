const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const REMOTE_FETCH_TIMEOUT_MS = 20000;
const REMOTE_FETCH_RETRIES = 0;
const MAX_REMOTE_FETCH_CONCURRENCY = 40;
const MAX_REMOTE_QUESTION_COUNT = 1200;
const remoteTopicQuestionIdsCache = new Map();

// ==========================================
// LOKÁLNÍ OTÁZKY (z questions.json)
// ==========================================
let localQuestions = null;
let localTotalByTopic = {};
let localTotalAll = 0;

function loadLocalQuestions() {
    const questionsPath = path.join(__dirname, 'questions.json');
    if (fs.existsSync(questionsPath)) {
        try {
            const data = fs.readFileSync(questionsPath, 'utf8');
            const parsed = JSON.parse(data);
            if (parsed && parsed.all && Array.isArray(parsed.all) && parsed.all.length > 0) {
                localQuestions = parsed;
                for (const q of parsed.all) {
                    const t = q.topic || 0;
                    if (!localTotalByTopic[t]) localTotalByTopic[t] = 0;
                    localTotalByTopic[t]++;
                    localTotalAll++;
                }
                console.log(`[Server] Načteno ${localTotalAll} lokálních otázek z questions.json`);
                console.log(`[Server] Počty podle témat:`, localTotalByTopic);
                return true;
            }
        } catch (e) {
            console.error('[Server] Chyba při načítání questions.json:', e.message);
        }
    }
    console.log('[Server] questions.json nenalezen - budu používat online scrapování');
    return false;
}

loadLocalQuestions();

// ==========================================
// OTÁZKY SKUPINY C (z questions-c.json)
// ==========================================
let localQuestionsC = null;
let localTotalByTopicC = {};
let localTotalAllC = 0;

function loadLocalQuestionsC() {
    const questionsPath = path.join(__dirname, 'questions-c.json');
    if (fs.existsSync(questionsPath)) {
        try {
            const data = fs.readFileSync(questionsPath, 'utf8');
            const parsed = JSON.parse(data);
            if (parsed && parsed.all && Array.isArray(parsed.all) && parsed.all.length > 0) {
                localQuestionsC = parsed;
                for (const q of parsed.all) {
                    const t = q.topic || 0;
                    if (!localTotalByTopicC[t]) localTotalByTopicC[t] = 0;
                    localTotalByTopicC[t]++;
                    localTotalAllC++;
                }
                console.log(`[Server] Načteno ${localTotalAllC} otázek skupiny C z questions-c.json`);
                console.log(`[Server] Počty podle témat C:`, localTotalByTopicC);
                return true;
            }
        } catch (e) {
            console.error('[Server] Chyba při načítání questions-c.json:', e.message);
        }
    }
    console.log('[Server] questions-c.json nenalezen');
    return false;
}

loadLocalQuestionsC();

const remoteQuestionsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

const remoteTopicInfoCache = new Map();
const TOPIC_INFO_CACHE_TTL = 10 * 60 * 1000;

app.use(express.static(path.join(__dirname)));

// ==========================================
// DATABÁZE
// ==========================================
const db = new Database(path.join(__dirname, 'leaderboard.db'));
db.pragma('journal_mode = WAL');

// Přidání sloupce duels_won do tabulky users (pokud ještě neexistuje)
try {
  db.exec(`ALTER TABLE users ADD COLUMN duels_won INTEGER DEFAULT 0`);
} catch (e) {
  // Sloupec již existuje - ignorujeme
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    isCEO INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    bestScore INTEGER DEFAULT 0,
    achievements TEXT DEFAULT '[]',
    streak INTEGER DEFAULT 0,
    bestStreak INTEGER DEFAULT 0,
    totalAnswered INTEGER DEFAULT 0,
    avatar TEXT DEFAULT '',
    registeredAt TEXT DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS test_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT NOT NULL,
    date TEXT NOT NULL DEFAULT (datetime('now')),
    score INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    percentage INTEGER DEFAULT 0,
    passed INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    category TEXT DEFAULT '',
    wrongAnswers TEXT DEFAULT '[]'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sign_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT DEFAULT 'fa-triangle-exclamation'
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS signs (
    id TEXT PRIMARY KEY,
    categoryId TEXT NOT NULL,
    name TEXT NOT NULL,
    imageUrl TEXT DEFAULT '',
    description TEXT DEFAULT ''
  )
`);

// ==========================================
// TABULKA PRO DUEL INVITATIONS (DB-based)
// ==========================================
db.exec(`
  CREATE TABLE IF NOT EXISTS duel_invitations (
    id TEXT PRIMARY KEY,
    challengerId TEXT NOT NULL,
    challengerName TEXT NOT NULL,
    challengedId TEXT NOT NULL,
    questionCount INTEGER DEFAULT 25,
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    expiresAt TEXT DEFAULT (datetime('now', '+10 minutes'))
  )
`);

const ceo = db.prepare('SELECT id FROM users WHERE id = ?').get('ceo_001');
if (!ceo) {
  db.prepare(`INSERT INTO users (id, email, password, name, isCEO) VALUES (?, ?, ?, ?, 1)`)
    .run('ceo_001', 'scale.czsklol@gmail.com', 'kokotko123', 'CEO Majitel');
  console.log('[DB] Vytvořen CEO účet');
}

function generateId() { return 'id_'+Date.now()+'_'+Math.random().toString(36).substr(2,9); }

// ==========================================
// DUEL SYSTEM - Socket.IO + File Database
// ==========================================

// Sledování online uživatelů: socket.id -> { userId, userName, userEmail }
const onlineUsers = new Map();

const DUEL_DB_PATH = path.join(__dirname, 'duel-databaze');

// Zajistíme, že složka existuje
if (!fs.existsSync(DUEL_DB_PATH)) {
  fs.mkdirSync(DUEL_DB_PATH, { recursive: true });
}

// Pomocné funkce pro file-based duel databázi
function duelFilePath(duelId) {
  return path.join(DUEL_DB_PATH, `duel_${duelId}.json`);
}

function loadDuelFromFile(duelId) {
  try {
    const filePath = duelFilePath(duelId);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error(`[DuelDB] Chyba načítání ${duelId}:`, e.message);
  }
  return null;
}

function saveDuelToFile(duel) {
  try {
    const filePath = duelFilePath(duel.id);
    // Uložíme jen data bez socket referencí
    const data = {
      id: duel.id,
      challengerId: duel.challengerId,
      challengerName: duel.challengerName,
      challengedId: duel.challengedId,
      challengedName: duel.challengedName,
      questionCount: duel.questionCount,
      questions: duel.questions,
      status: duel.status,
      startTime: duel.startTime,
      challengerAnswers: duel.challengerAnswers,
      challengedAnswers: duel.challengedAnswers
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error(`[DuelDB] Chyba ukládání ${duel.id}:`, e.message);
    return false;
  }
}

function deleteDuelFile(duelId) {
  try {
    const filePath = duelFilePath(duelId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error(`[DuelDB] Chyba mazání ${duelId}:`, e.message);
  }
}

// Aktivní duely v paměti: duelId -> { full data }
const activeDuels = new Map();

// Odeslání progress oběma hráčům
function broadcastDuelProgress(duelId) {
  const duel = activeDuels.get(duelId);
  if (!duel) return;

  // Spočítáme správné odpovědi
  let challengerCorrect = 0;
  for (const a of duel.challengerAnswers) {
    const q = duel.questions[a.questionIndex];
    if (q && a.selectedIndex === q.correctIndex) challengerCorrect++;
  }
  let challengedCorrect = 0;
  for (const a of duel.challengedAnswers) {
    const q = duel.questions[a.questionIndex];
    if (q && a.selectedIndex === q.correctIndex) challengedCorrect++;
  }

  const progressData = {
    duelId: duel.id,
    challengerScore: challengerCorrect,
    challengedScore: challengedCorrect,
    challengerAnswered: duel.challengerAnswers.length,
    challengedAnswered: duel.challengedAnswers.length,
    totalQuestions: duel.questionCount,
    challengerDone: duel.challengerAnswers.length >= duel.questionCount,
    challengedDone: duel.challengedAnswers.length >= duel.questionCount,
    challengerName: duel.challengerName,
    challengedName: duel.challengedName
  };

  // Pošleme progress na všechny sockety obou hráčů
  for (const [sid, u] of onlineUsers) {
    if (u.userId === duel.challengerId || u.userId === duel.challengedId) {
      io.to(sid).emit('duel_progress', progressData);
    }
  }
}

io.on('connection', (socket) => {
  console.log(`[Socket] Nové připojení: ${socket.id}`);

  // Uživatel se přihlásil do socketu
  socket.on('user_online', (data) => {
    const { userId, userName, userEmail } = data;
    onlineUsers.set(socket.id, { userId, userName, userEmail, socketId: socket.id });
    console.log(`[Socket] Uživatel online: ${userName} (${userId})`);

    // Pošleme všem aktualizovaný seznam online
    io.emit('online_users_update', getOnlineUsersList());
  });

  // Vyhledání uživatele podle ID nebo username
  socket.on('find_user', (query) => {
    try {
      const user = db.prepare(
        'SELECT id, name, email, duels_won FROM users WHERE id = ? OR name = ? OR email = ?'
      ).get(query, query, query);

      if (user) {
        // Zjistíme, zda je online
        let isOnline = false;
        for (const [sid, u] of onlineUsers) {
          if (u.userId === user.id) { isOnline = true; break; }
        }
        socket.emit('user_found', { success: true, user, isOnline });
      } else {
        socket.emit('user_found', { success: false, message: 'Uživatel nenalezen.' });
      }
    } catch (e) {
      socket.emit('user_found', { success: false, message: e.message });
    }
  });

  // Odeslání výzvy k duelu
  socket.on('duel_challenge', (data) => {
    const { challengerId, challengerName, challengedId, questionCount } = data;
    
    // Najdeme VŠECHNY sockety vyzvaného
    let challengedSockets = [];
    for (const [sid, u] of onlineUsers) {
      if (u.userId === challengedId) {
        challengedSockets.push(sid);
      }
    }

    if (challengedSockets.length === 0) {
      socket.emit('duel_error', { message: 'Uživatel není online.' });
      return;
    }

    // Vygenerujeme ID duelu
    const duelId = 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    // Pošleme výzvu na VŠECHNY sockety vyzvaného (kvůli cross-device)
    const invitationData = {
      duelId,
      challengerId,
      challengerName,
      questionCount,
      expiresAt: Date.now() + 10000 // 10 sekund na přijetí
    };
    challengedSockets.forEach(sid => {
      io.to(sid).emit('duel_invitation', invitationData);
    });

    // Uložíme pending duel s prvním socketem
    activeDuels.set(duelId, {
      id: duelId,
      challengerId,
      challengerName,
      challengedId,
      challengedName: null,
      questionCount,
      status: 'pending',
      challengerSocket: socket.id,
      challengedSocket: challengedSockets[0],
      startTime: null,
      challengerAnswers: [],
      challengedAnswers: [],
      questions: [],
      challengerFinished: false,
      challengedFinished: false
    });

    socket.emit('duel_challenge_sent', { duelId, message: 'Výzva odeslána!' });
    console.log(`[Duel] Výzva: ${challengerName} -> ${challengedId} (${questionCount} otázek)`);
  });

  // Přijetí duelu
  socket.on('duel_accept', async (data) => {
    const { duelId } = data;
    
    // Aktualizujeme socket ID vyzvaného na aktuální socket
    const duel2 = activeDuels.get(duelId);
    if (duel2) {
      duel2.challengedSocket = socket.id;
    }
    const duel = activeDuels.get(duelId);
    if (!duel || duel.status !== 'pending') {
      socket.emit('duel_error', { message: 'Duet již není platný.' });
      return;
    }

    // Zjistíme jméno vyzvaného
    const challengedUser = db.prepare('SELECT name FROM users WHERE id = ?').get(duel.challengedId);
    duel.challengedName = challengedUser ? challengedUser.name : 'Neznámý';
    duel.status = 'accepted';
    duel.startTime = Date.now();

    // Vygenerujeme otázky - stejnou sadu pro oba hráče
    try {
      let questions = [];
      // Použijeme lokální otázky
      if (localQuestions && localQuestions.all && localQuestions.all.length > 0) {
        const shuffled = [...localQuestions.all].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(duel.questionCount, shuffled.length));
        questions = selected.map(q => {
          // Vytvoříme odpovědi a zamícháme je
          const answers = [
            { text: q.correct, correct: true },
            { text: q.wrong1, correct: false },
            { text: q.wrong2, correct: false }
          ].sort(() => Math.random() - 0.5);
          const correctIndex = answers.findIndex(a => a.correct);
          return {
            question_id: q.id || `q_${Math.random().toString(36).slice(2,8)}`,
            question_text: q.text,
            question_media: q.imageUrl || '',
            options: answers.map(a => a.text),
            correctIndex: correctIndex,
            points: q.points || 1
          };
        });
      } else if (localQuestionsC && localQuestionsC.all && localQuestionsC.all.length > 0) {
        const shuffled = [...localQuestionsC.all].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, Math.min(duel.questionCount, shuffled.length));
        questions = selected.map(q => {
          const answers = [
            { text: q.correct, correct: true },
            { text: q.wrong1, correct: false },
            { text: q.wrong2, correct: false }
          ].sort(() => Math.random() - 0.5);
          const correctIndex = answers.findIndex(a => a.correct);
          return {
            question_id: `c_${q.id}`,
            question_text: q.text,
            question_media: q.imageUrl || '',
            options: answers.map(a => a.text),
            correctIndex: correctIndex,
            points: q.points || 1
          };
        });
      }

      if (questions.length === 0) {
        // Fallback na API
        try {
          const resp = await fetch(`http://localhost:${PORT}/api/remote-test?topic=0&count=${duel.questionCount}`);
          const json = await resp.json();
          if (json.success && json.questions) {
            questions = json.questions.map(q => {
              const answers = [
                { text: q.correct_text, correct: true },
                { text: q.wrong1_text, correct: false },
                { text: q.wrong2_text, correct: false }
              ].sort(() => Math.random() - 0.5);
              const correctIndex = answers.findIndex(a => a.correct);
              return {
                question_id: q.question_id || `q_${Math.random().toString(36).slice(2,8)}`,
                question_text: q.question_text,
                question_media: q.question_media || '',
                options: answers.map(a => a.text),
                correctIndex: correctIndex,
                points: q.points || 1
              };
            });
          }
        } catch (e) {
          socket.emit('duel_error', { message: 'Nepodařilo se vygenerovat otázky.' });
          return;
        }
      }

      duel.questions = questions;

      // Oznámíme oběma hráčům, že duel začíná
      // Vyhledáme aktuální socket z onlineUsers (ne ze stále reference)
      const duelData = {
        duelId: duel.id,
        questionCount: duel.questionCount,
        questions: duel.questions,
        opponentName: duel.challengedName,
        challengerName: duel.challengerName,
        startTime: duel.startTime,
        timeLimit: 60 * 60 * 1000 // 60 minut
      };

      // Pošleme challengerovi
      for (const [sid, u] of onlineUsers) {
        if (u.userId === duel.challengerId) {
          io.to(sid).emit('duel_start', duelData);
          duel.challengerSocket = sid; // aktualizujeme
        }
        if (u.userId === duel.challengedId) {
          io.to(sid).emit('duel_start', {
            ...duelData,
            opponentName: duel.challengerName
          });
          duel.challengedSocket = sid; // aktualizujeme
        }
      }

      console.log(`[Duel] Přijat: ${duel.challengerName} vs ${duel.challengedName}`);
    } catch (e) {
      console.error('[Duel] Chyba:', e.message);
      socket.emit('duel_error', { message: 'Chyba při vytváření duelu: ' + e.message });
    }
  });

  // Odmítnutí duelu
  socket.on('duel_decline', (data) => {
    const { duelId } = data;
    const duel = activeDuels.get(duelId);
    if (duel) {
      io.to(duel.challengerSocket).emit('duel_declined', { message: 'Protihráč odmítl výzvu.' });
      activeDuels.delete(duelId);
      console.log(`[Duel] Odmítnut: ${duelId}`);
    }
  });

  // Odeslání odpovědi v duelu
  socket.on('duel_answer', (data) => {
    const { duelId, questionIndex, selectedIndex, timeSpent } = data;
    const duel = activeDuels.get(duelId);
    if (!duel) return;

    // Zjistíme, jestli je to challenger nebo challenged
    let isChallenger = false;
    if (onlineUsers.get(socket.id)?.userId === duel.challengerId) {
      isChallenger = true;
    }

    const answer = { questionIndex, selectedIndex, timeSpent };
    if (isChallenger) {
      // Přidáme jen pokud tam ještě není
      if (!duel.challengerAnswers.find(a => a.questionIndex === questionIndex)) {
        duel.challengerAnswers.push(answer);
      }
    } else {
      if (!duel.challengedAnswers.find(a => a.questionIndex === questionIndex)) {
        duel.challengedAnswers.push(answer);
      }
    }

    // Uložit do souboru
    saveDuelToFile(duel);

    // Odeslat progress oběma hráčům v reálném čase
    broadcastDuelProgress(duelId);

    // Nespouštíme finish automaticky - hráč musí kliknout na "Dokončit"
    // finish se spustí až když oba kliknou na finishDuel
  });

  // Hráč dokončil všechny otázky (klikl na Dokončit)
  socket.on('duel_finish', (data) => {
    const { duelId } = data;
    const duel = activeDuels.get(duelId);
    if (!duel) return;

    // Označíme hráče jako hotového
    const user = onlineUsers.get(socket.id);
    if (!user) return;

    if (user.userId === duel.challengerId) {
      duel.challengerFinished = true;
    } else if (user.userId === duel.challengedId) {
      duel.challengedFinished = true;
    }

    // Uložit
    saveDuelToFile(duel);

    // Odeslat progress (aktualizuje "dokončeno" status)
    broadcastDuelProgress(duelId);

    // Pokud oba dokončili, vyhodnotit
    if (duel.challengerFinished && duel.challengedFinished) {
      finishDuel(duelId);
    }
  });

  // Odeslání emote (smajlíka)
  socket.on('duel_emote', (data) => {
    const { duelId, emote } = data;
    const duel = activeDuels.get(duelId);
    if (!duel) return;

    const user = onlineUsers.get(socket.id);
    if (!user) return;

    // Pošleme emote soupeři
    const targetId = user.userId === duel.challengerId ? duel.challengedId : duel.challengerId;
    for (const [sid, u] of onlineUsers) {
      if (u.userId === targetId) {
        io.to(sid).emit('duel_emote_received', {
          fromName: user.userName,
          emote: emote
        });
        break;
      }
    }
  });

  // Upozornění na timeout duelu (vypršení 60 minut)
  socket.on('duel_timeout', (data) => {
    const { duelId } = data;
    finishDuel(duelId);
  });

  // Znovupřipojení k existujícímu duelu (po přesměrování na duel.html)
  socket.on('duel_rejoin', (data) => {
    const { duelId, userId } = data;
    const duel = activeDuels.get(duelId);
    if (!duel) {
      socket.emit('duel_error', { message: 'Duet již není aktivní.' });
      return;
    }

    // Aktualizujeme socket ID pro tohoto hráče
    if (duel.challengerId === userId) {
      duel.challengerSocket = socket.id;
    } else if (duel.challengedId === userId) {
      duel.challengedSocket = socket.id;
    } else {
      socket.emit('duel_error', { message: 'Nejste účastníkem tohoto duelu.' });
      return;
    }

    // Znovu odešleme data o duelu
    const isChallenger = duel.challengerId === userId;
    socket.emit('duel_start', {
      duelId: duel.id,
      questionCount: duel.questionCount,
      questions: duel.questions,
      opponentName: isChallenger ? duel.challengedName : duel.challengerName,
      challengerName: duel.challengerName,
      startTime: duel.startTime,
      timeLimit: 60 * 60 * 1000
    });
  });

  // Žádost o stav duelu
  socket.on('duel_get_state', (data) => {
    const { duelId } = data;
    const duel = activeDuels.get(duelId);
    if (duel) {
      socket.emit('duel_state', {
        duelId: duel.id,
        status: duel.status,
        challengerAnswers: duel.challengerAnswers.length,
        challengedAnswers: duel.challengedAnswers.length,
        questionCount: duel.questionCount
      });
    }
  });

  // Žádost o výsledek
  socket.on('duel_get_result', (data) => {
    const { duelId } = data;
    const duel = activeDuels.get(duelId);
    if (duel && duel.status === 'accepted') {
      finishDuel(duelId);
    }
  });

  // Odpojení uživatele
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id);
    if (user) {
      console.log(`[Socket] Uživatel offline: ${user.userName}`);
      onlineUsers.delete(socket.id);
      io.emit('online_users_update', getOnlineUsersList());

      // Zrušíme pouze PENDING duely (čekající výzvy)
      for (const [duelId, duel] of activeDuels) {
        if (duel.status === 'pending' && (duel.challengerId === user.userId || duel.challengedId === user.userId)) {
          const otherSocket = duel.challengerId === user.userId ? duel.challengedSocket : duel.challengerSocket;
          io.to(otherSocket).emit('duel_cancelled', { message: 'Protihráč se odpojil.' });
          activeDuels.delete(duelId);
        }
        // Pro již přijaté duely NENECHÁME disconnect zrušit duel - 
        // hráč se může znovu připojit přes duel_rejoin
      }
    }
  });
});

function getOnlineUsersList() {
  const list = [];
  for (const [sid, u] of onlineUsers) {
    list.push({ userId: u.userId, userName: u.userName, socketId: sid });
  }
  return list;
}

function finishDuel(duelId) {
  const duel = activeDuels.get(duelId);
  if (!duel) return;

  // Vyhodnotíme výsledky
  let challengerCorrect = 0;
  let challengedCorrect = 0;
  let challengerTime = 0;
  let challengedTime = 0;

  for (let i = 0; i < duel.questionCount; i++) {
    const q = duel.questions[i];
    const ca = duel.challengerAnswers.find(a => a.questionIndex === i);
    const da = duel.challengedAnswers.find(a => a.questionIndex === i);

    if (ca) {
      if (ca.selectedIndex === q.correctIndex) challengerCorrect++;
      challengerTime += ca.timeSpent || 0;
    }
    if (da) {
      if (da.selectedIndex === q.correctIndex) challengedCorrect++;
      challengedTime += da.timeSpent || 0;
    }
  }

  // Určíme vítěze
  let winnerId = null;
  let winnerName = '';
  let loserName = '';
  let challengerResult = { correct: challengerCorrect, total: duel.questionCount, time: Math.round(challengerTime) };
  let challengedResult = { correct: challengedCorrect, total: duel.questionCount, time: Math.round(challengedTime) };

  if (challengerCorrect > challengedCorrect) {
    winnerId = duel.challengerId;
    winnerName = duel.challengerName;
    loserName = duel.challengedName;
  } else if (challengedCorrect > challengerCorrect) {
    winnerId = duel.challengedId;
    winnerName = duel.challengedName;
    loserName = duel.challengerName;
  } else {
    // Remíza - rozhoduje čas
    if (challengerTime < challengedTime) {
      winnerId = duel.challengerId;
      winnerName = duel.challengerName;
      loserName = duel.challengedName;
    } else if (challengedTime < challengerTime) {
      winnerId = duel.challengedId;
      winnerName = duel.challengedName;
      loserName = duel.challengerName;
    } else {
      winnerId = null; // Naprostá remíza
    }
  }

  // Přičteme výhru vítězi
  if (winnerId) {
    db.prepare('UPDATE users SET duels_won = COALESCE(duels_won, 0) + 1 WHERE id = ?').run(winnerId);
  }

  // Pošleme výsledky oběma hráčům
  const resultData = {
    duelId: duel.id,
    challengerName: duel.challengerName,
    challengedName: duel.challengedName,
    challengerResult,
    challengedResult,
    winnerId,
    winnerName: winnerName || '',
    loserName: loserName || '',
    isDraw: !winnerId
  };

  console.log(`[Duel] Výsledek: ${duel.challengerName} ${challengerResult.correct}/${challengerResult.total} | ${duel.challengedName} ${challengedResult.correct}/${challengedResult.total} | Vítěz: ${winnerName || 'Remíza'}`);

  // Pošleme každému hráči jeho výsledek
  io.to(duel.challengerSocket).emit('duel_result', {
    ...resultData,
    isWinner: winnerId === duel.challengerId
  });
  io.to(duel.challengedSocket).emit('duel_result', {
    ...resultData,
    isWinner: winnerId === duel.challengedId
  });

  activeDuels.delete(duelId);
}

// ==========================================
// DUEL API ENDPOINTY
// ==========================================

app.get('/api/duel/online-users', (req, res) => {
  res.json({ success: true, users: getOnlineUsersList() });
});

app.get('/api/duel/search-user', (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ success: false, message: 'Zadejte jméno nebo ID.' });
  try {
    const users = db.prepare(
      'SELECT id, name, email, duels_won FROM users WHERE id LIKE ? OR name LIKE ? OR email LIKE ? LIMIT 20'
    ).all(`%${q}%`, `%${q}%`, `%${q}%`);
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// DUEL INVITATIONS API (DB-based)
// ==========================================

// Vytvořit výzvu
app.post('/api/duel/invitation', (req, res) => {
  try {
    const { challengerId, challengerName, challengedId, questionCount } = req.body;
    if (!challengerId || !challengedId) {
      return res.status(400).json({ success: false, message: 'Chybí ID hráčů.' });
    }
    // Ověřit, zda vyzvaný existuje
    const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(challengedId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Soupeř nenalezen.' });
    }

    const id = 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minut
    db.prepare(`
      INSERT INTO duel_invitations (id, challengerId, challengerName, challengedId, questionCount, expiresAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, challengerId, challengerName, challengedId, questionCount || 25, expiresAt);

    // Pokud je soupeř online, pošleme mu socket notifikaci
    let notified = false;
    for (const [sid, u] of onlineUsers) {
      if (u.userId === challengedId) {
        io.to(sid).emit('duel_invitation', {
          duelId: id,
          challengerId,
          challengerName,
          questionCount: questionCount || 25,
          fromDB: true
        });
        notified = true;
        break;
      }
    }

    res.json({
      success: true,
      message: 'Výzva odeslána.',
      invitationId: id,
      notified
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Získat nevyřízené výzvy pro uživatele
app.get('/api/duel/invitations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const now = new Date().toISOString();
    const invitations = db.prepare(`
      SELECT * FROM duel_invitations
      WHERE challengedId = ? AND status = 'pending' AND expiresAt > ?
      ORDER BY createdAt DESC
    `).all(userId, now);
    res.json({ success: true, invitations });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Přijmout výzvu
app.post('/api/duel/invitation/accept', (req, res) => {
  try {
    const { invitationId } = req.body;
    if (!invitationId) {
      return res.status(400).json({ success: false, message: 'Chybí ID výzvy.' });
    }

    const inv = db.prepare('SELECT * FROM duel_invitations WHERE id = ? AND status = "pending"').get(invitationId);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Výzva neexistuje nebo již byla zpracována.' });
    }

    // Aktualizovat status
    db.prepare('UPDATE duel_invitations SET status = "accepted" WHERE id = ?').run(invitationId);

    // Vygenerovat otázky
    const questionCount = inv.questionCount || 25;
    let questions = [];
    if (localQuestions && localQuestions.all && localQuestions.all.length > 0) {
      const shuffled = [...localQuestions.all].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
      questions = selected.map(q => {
        const answers = [
          { text: q.correct, correct: true },
          { text: q.wrong1, correct: false },
          { text: q.wrong2, correct: false }
        ].sort(() => Math.random() - 0.5);
        const correctIndex = answers.findIndex(a => a.correct);
        return {
          question_id: q.id || `q_${Math.random().toString(36).slice(2,8)}`,
          question_text: q.text,
          question_media: q.imageUrl || '',
          options: answers.map(a => a.text),
          correctIndex,
          points: q.points || 1
        };
      });
    } else if (localQuestionsC && localQuestionsC.all && localQuestionsC.all.length > 0) {
      const shuffled = [...localQuestionsC.all].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));
      questions = selected.map(q => {
        const answers = [
          { text: q.correct, correct: true },
          { text: q.wrong1, correct: false },
          { text: q.wrong2, correct: false }
        ].sort(() => Math.random() - 0.5);
        const correctIndex = answers.findIndex(a => a.correct);
        return {
          question_id: `c_${q.id}`,
          question_text: q.text,
          question_media: q.imageUrl || '',
          options: answers.map(a => a.text),
          correctIndex,
          points: q.points || 1
        };
      });
    }

    if (questions.length === 0) {
      return res.status(500).json({ success: false, message: 'Nepodařilo se vygenerovat otázky.' });
    }

    const duelId = 'duel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    const duel = {
      id: duelId,
      challengerId: inv.challengerId,
      challengerName: inv.challengerName,
      challengedId: inv.challengedId,
      challengedName: db.prepare('SELECT name FROM users WHERE id = ?').get(inv.challengedId)?.name || 'Neznámý',
      questionCount: questionCount,
      questions: questions,
      status: 'active',
      startTime: Date.now(),
      challengerAnswers: [],
      challengedAnswers: [],
      challengerSocket: null,
      challengedSocket: null
    };
    activeDuels.set(duelId, duel);

    // Najít socket hráčů
    for (const [sid, u] of onlineUsers) {
      if (u.userId === inv.challengerId) {
        duel.challengerSocket = sid;
      } else if (u.userId === inv.challengedId) {
        duel.challengedSocket = sid;
      }
    }

    const duelData = {
      duelId: duel.id,
      questionCount: duel.questionCount,
      questions: duel.questions,
      opponentName: duel.challengedName,
      challengerName: duel.challengerName,
      startTime: duel.startTime,
      timeLimit: 60 * 60 * 1000
    };

    // Poslat start oběma (pokud jsou online)
    if (duel.challengerSocket) {
      io.to(duel.challengerSocket).emit('duel_start', {
        ...duelData,
        opponentName: duel.challengedName
      });
    }
    if (duel.challengedSocket) {
      io.to(duel.challengedSocket).emit('duel_start', {
        ...duelData,
        opponentName: duel.challengerName
      });
    }

    res.json({ success: true, message: 'Duel spuštěn.', duelId });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// Odmítnout výzvu
app.post('/api/duel/invitation/decline', (req, res) => {
  try {
    const { invitationId } = req.body;
    if (!invitationId) {
      return res.status(400).json({ success: false, message: 'Chybí ID výzvy.' });
    }
    db.prepare('UPDATE duel_invitations SET status = "declined" WHERE id = ?').run(invitationId);
    res.json({ success: true, message: 'Výzva odmítnuta.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// API ENDPOINTY
// ==========================================

app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, xp, bestScore, achievements, streak, bestStreak, totalAnswered, avatar, isCEO, COALESCE(duels_won, 0) as duels_won FROM users ORDER BY xp DESC').all();
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
    delete user.password;
    user.achievements = JSON.parse(user.achievements || '[]');
    user.duels_won = user.duels_won || 0;
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
    if (!user) return res.status(401).json({ success: false, message: 'Nesprávný email nebo heslo.' });
    delete user.password;
    user.achievements = JSON.parse(user.achievements || '[]');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ success: false, message: 'Účet s tímto emailem již existuje.' });
    
    const id = 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    db.prepare(`INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)`)
      .run(id, email, password, name);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    delete user.password;
    user.achievements = JSON.parse(user.achievements || '[]');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowed = ['name', 'email', 'password', 'xp', 'bestScore', 'achievements', 'streak', 'bestStreak', 'totalAnswered', 'avatar'];
    
    const sets = [];
    const values = [];
    
    allowed.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'achievements') {
          sets.push(`${field} = ?`);
          values.push(JSON.stringify(updates[field]));
        } else {
          sets.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }
    });
    
    if (sets.length === 0) return res.status(400).json({ success: false, message: 'Žádná data k aktualizaci' });
    
    values.push(id);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...values);
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    delete user.password;
    user.achievements = JSON.parse(user.achievements || '[]');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// TEST HISTORY API
// ==========================================

app.post('/api/test-history', (req, res) => {
  try {
    const { userId, score, total, percentage, passed, points, category, wrongAnswers } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId je povinný' });
    
    const result = db.prepare(`
      INSERT INTO test_history (userId, score, total, percentage, passed, points, category, wrongAnswers)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, score || 0, total || 0, percentage || 0, passed ? 1 : 0, points || 0, category || '', JSON.stringify(wrongAnswers || []));
    
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/test-history/:userId', (req, res) => {
  try {
    const history = db.prepare(`
      SELECT * FROM test_history WHERE userId = ? ORDER BY id DESC LIMIT 50
    `).all(req.params.userId);
    
    const parsed = history.map(h => ({
      ...h,
      passed: !!h.passed,
      wrongAnswers: JSON.parse(h.wrongAnswers || '[]')
    }));
    
    res.json({ success: true, history: parsed });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// DOPRAVNÍ ZNAČKY API (serverové)
// ==========================================

app.get('/api/signs/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM sign_categories ORDER BY name').all();
    res.json({ success: true, categories });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/signs/categories', (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Název kategorie je povinný' });
    
    const existing = db.prepare('SELECT id FROM sign_categories WHERE name = ?').get(name);
    if (existing) return res.status(400).json({ success: false, message: 'Kategorie již existuje' });
    
    const id = generateId();
    db.prepare('INSERT INTO sign_categories (id, name, icon) VALUES (?, ?, ?)').run(id, name, icon || 'fa-triangle-exclamation');
    
    res.json({ success: true, message: `Kategorie "${name}" přidána`, category: { id, name, icon: icon || 'fa-triangle-exclamation' } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete('/api/signs/categories/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM signs WHERE categoryId = ?').run(req.params.id);
    db.prepare('DELETE FROM sign_categories WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Kategorie smazána' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/signs', (req, res) => {
  try {
    const { categoryId } = req.query;
    let signs;
    if (categoryId) {
      signs = db.prepare('SELECT * FROM signs WHERE categoryId = ? ORDER BY name').all(categoryId);
    } else {
      signs = db.prepare('SELECT * FROM signs ORDER BY name').all();
    }
    res.json({ success: true, signs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post('/api/signs', (req, res) => {
  try {
    const { categoryId, name, imageUrl, description } = req.body;
    if (!categoryId || !name) return res.status(400).json({ success: false, message: 'Kategorie a název jsou povinné' });
    
    const cat = db.prepare('SELECT id FROM sign_categories WHERE id = ?').get(categoryId);
    if (!cat) return res.status(400).json({ success: false, message: 'Kategorie neexistuje' });
    
    const id = generateId();
    db.prepare('INSERT INTO signs (id, categoryId, name, imageUrl, description) VALUES (?, ?, ?, ?, ?)')
      .run(id, categoryId, name, imageUrl || '', description || '');
    
    res.json({ success: true, message: `Značka "${name}" přidána`, sign: { id, categoryId, name, imageUrl: imageUrl || '', description: description || '' } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete('/api/signs/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM signs WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Značka smazána' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// ADMIN API ENDPOINTY
// ==========================================

app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, xp, bestScore, totalAnswered, streak, bestStreak, achievements, isCEO,
             datetime(registeredAt) as registeredAt,
             COALESCE(duels_won, 0) as duels_won
      FROM users ORDER BY xp DESC
    `).all();
    const result = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      registered: u.registeredAt ? u.registeredAt.split(' ')[0] : '—',
      tests: u.totalAnswered || 0,
      active: u.xp > 0,
      xp: u.xp || 0,
      score: u.bestScore || 0,
      isCEO: u.isCEO,
      duels_won: u.duels_won
    }));
    res.json({ success: true, users: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalTests = db.prepare('SELECT COALESCE(SUM(totalAnswered), 0) as sum FROM users').get().sum;
    const topXp = db.prepare('SELECT COALESCE(MAX(xp), 0) as max FROM users').get().max;
    const avgScore = db.prepare("SELECT COALESCE(ROUND(AVG(bestScore)), 0) as avg FROM users WHERE bestScore > 0").get().avg;
    res.json({ success: true, stats: { totalUsers, avgScore, totalTests, topXp } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT isCEO FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ success: false, message: 'Uživatel nenalezen.' });
    if (user.isCEO) return res.status(403).json({ success: false, message: 'CEO účet nelze smazat.' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    db.prepare('DELETE FROM test_history WHERE userId = ?').run(id);
    res.json({ success: true, message: 'Uživatel smazán.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// OTÁZKY - LOKÁLNÍ / EXTERNÍ
// ==========================================

app.get('/api/remote-test', async (req, res) => {
  const topic = parseInt(req.query.topic, 10);
  const requestedCount = Math.max(1, Math.min(MAX_REMOTE_QUESTION_COUNT, parseInt(req.query.count, 10) || 5));
  if (topic !== 0 && (topic < 1 || topic > 7)) {
    return res.status(400).json({ success: false, message: 'topic musí být číslo 0-7.' });
  }

  if (localQuestions && localQuestions.all) {
    let pool;
    if (topic === 0) {
      pool = localQuestions.all;
    } else {
      pool = localQuestions.all.filter(q => q.topic === topic);
    }
    
    if (pool.length === 0) {
      return res.json({ success: true, questions: [] });
    }
    
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(requestedCount, shuffled.length));
    
    const questions = selected.map((q, i) => {
      let points = 1;
      if (q.imageUrl) points = 2;
      if (q.topic === 2) points = 2;
      
      return {
        question_id: q.id || `local_${q.topic}_${Math.random().toString(36).slice(2,8)}`,
        question_text: q.text,
        question_media: q.imageUrl || '',
        correct_text: q.correct,
        wrong1_text: q.wrong1,
        wrong2_text: q.wrong2,
        topic_id: q.topic,
        points: points
      };
    });
    
    return res.json({ success: true, questions, totalPoints: questions.reduce((sum, q) => sum + q.points, 0) });
  }

  try {
    if (requestedCount <= 30) {
      const questions = [];
      const seenIds = new Set();
      const topics = topic === 0 ? [1,2,3,4,5,6,7] : [topic];
      const maxBatches = Math.ceil(requestedCount * 3 / MAX_REMOTE_FETCH_CONCURRENCY) + 5;

      for (let batch = 0; batch < maxBatches && questions.length < requestedCount; batch++) {
        const batchSize = Math.min(MAX_REMOTE_FETCH_CONCURRENCY * 2, (requestedCount - questions.length) * 2);
        const promises = [];
        for (let i = 0; i < batchSize; i++) {
          const randomTopic = topics[Math.floor(Math.random() * topics.length)];
          promises.push(
            fetchExternalQuestion(randomTopic)
              .then(q => ({ success: true, q }))
              .catch(() => ({ success: false }))
          );
        }
        const results = await Promise.all(promises);
        for (const result of results) {
          if (result.success && result.q && !seenIds.has(result.q.question_id)) {
            seenIds.add(result.q.question_id);
            result.q.points = result.q.question_media ? 2 : 1;
            questions.push(result.q);
            if (questions.length >= requestedCount) break;
          }
        }
      }

      if (!questions.length) {
        return res.status(500).json({ success: false, message: 'Nepodařilo se načíst žádné otázky z externího zdroje.' });
      }
      return res.json({ success: true, questions: questions.slice(0, requestedCount) });
    }

    const cacheKey = `topic:${topic}:count:${requestedCount}`;
    const cached = remoteQuestionsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return res.json({ success: true, questions: cached.data });
    }

    const topics = topic === 0 ? [1,2,3,4,5,6,7] : [topic];
    const topicIds = await Promise.all(topics.map(t => fetchRemoteTopicQuestionIds(t)));
    const allIds = Array.from(new Set(topicIds.flat()));
    const desiredCount = Math.min(requestedCount, allIds.length);
    const idQueue = shuffleArray(allIds);
    const questions = [];

    while (idQueue.length > 0 && questions.length < desiredCount) {
      const batch = idQueue.splice(0, Math.min(MAX_REMOTE_FETCH_CONCURRENCY, desiredCount - questions.length));
      const results = await Promise.all(batch.map(id =>
        fetchExternalQuestionByQuery(`otazka=${id}`)
          .then(q => ({ success: true, q }))
          .catch(() => ({ success: false }))
      ));
      for (const result of results) {
        if (result.success && result.q) {
          result.q.points = result.q.question_media ? 2 : 1;
          questions.push(result.q);
        }
      }
    }

    if (questions.length > 0) {
      const finalQuestions = questions.slice(0, desiredCount).map(q => ({ ...q, points: q.points || 1 }));
      remoteQuestionsCache.set(cacheKey, { data: finalQuestions, timestamp: Date.now() });
    }

    if (!questions.length) {
      return res.status(500).json({ success: false, message: 'Nepodařilo se načíst žádné otázky z externího zdroje.' });
    }

    res.json({ success: true, questions: questions.slice(0, desiredCount) });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/remote-group-info', async (req, res) => {
  const topic = parseInt(req.query.topic, 10);
  if (!topic || topic < 1 || topic > 7) {
    return res.status(400).json({ success: false, message: 'topic musí být číslo 1-7.' });
  }

  if (localQuestions) {
    const count = localTotalByTopic[topic] || 0;
    const topicInfo = TOPICS_EXTERNAL.find(t => t.topic === topic);
    return res.json({ success: true, topic, total_questions: count, title: topicInfo?.name || '' });
  }

  const cached = remoteTopicInfoCache.get(topic);
  if (cached && Date.now() - cached.timestamp < TOPIC_INFO_CACHE_TTL) {
    return res.json(cached.data);
  }

  try {
    const html = await fetchRemoteTopicListingHtml(topic);
    const ids = parseRemoteTopicQuestionIds(html);
    const totalQuestions = ids.length;
    const title = extractMatch(html, /Otázky ve skupině\s*([^<\n]+)/i) || extractMatch(html, /Skupina\s+<strong>([\s\S]*?)<\/strong> obsahuje/i) || '';
    const data = { success: true, topic, total_questions: totalQuestions, title };
    remoteTopicInfoCache.set(topic, { data, timestamp: Date.now() });
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

const TOPICS_EXTERNAL = [
  { topic: 1, name: 'Pravidla provozu' },
  { topic: 2, name: 'Dopravní značky' },
  { topic: 3, name: 'Bezpečná jízda' },
  { topic: 4, name: 'Dopravní situace' },
  { topic: 5, name: 'Podmínky provozu vozidel' },
  { topic: 6, name: 'Předpisy o provozu' },
  { topic: 7, name: 'Zdravotnická příprava' }
];

const EXTERNAL_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';

function extractMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function decodeHtmlEntities(text) {
  return text.replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function parseExternalQuestion(html) {
  const question_text = decodeHtmlEntities(extractMatch(html, /"question-text"[^>]*>([\s\S]*?)<\/p>/i));
  const question_media_match = html.match(/src="(\/img\/[A-Za-z0-9\/_.-]+\.(?:jpg|jpeg|png|gif))"/i);
  const question_media = question_media_match ? `https://www.autoskola-testy.cz${question_media_match[1]}` : '';
  const correct_text = decodeHtmlEntities(extractMatch(html, /"answer otazka_spravne"[\s\S]*?<p>([\s\S]*?)<\/p>/i));
  const wrongMatches = [...html.matchAll(/"answer otazka_spatne"[\s\S]*?<p>([\s\S]*?)<\/p>/gi)].map(m => decodeHtmlEntities(m[1].trim()));
  const wrong1_text = wrongMatches[0] || '';
  const wrong2_text = wrongMatches[1] || '';
  const question_id = extractMatch(html, /kód\s+(\d+)/i);
  const topic_id = parseInt(extractMatch(html, /Tato otázka ze skupiny.+?\?okruh=(\d+)/i), 10) || null;

  return {
    question_text,
    question_media,
    correct_text,
    wrong1_text,
    wrong2_text,
    question_id,
    topic_id,
    points: question_media ? 2 : 1
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function fetchWithTimeout(url, options = {}, timeout = REMOTE_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchRemoteTopicListingHtml(topicId) {
  const url = `https://www.autoskola-testy.cz/prohlizeni_otazek.php?okruh=${topicId}`;
  const response = await fetchWithTimeout(url, {
    headers: {
      'User-Agent': EXTERNAL_USER_AGENT,
      'Referer': `https://www.autoskola-testy.cz/prohlizeni_otazek.php?okruh=${topicId}`
    }
  });
  if (!response.ok) {
    throw new Error(`Externí API neodpovědělo správně (${response.status})`);
  }
  return await response.text();
}

function parseRemoteTopicQuestionIds(html) {
  const ids = new Set();
  const regex = /<a\s+href="\?otazka=(\d+(?:-[^"]*)?)"[^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    ids.add(match[1]);
  }
  return Array.from(ids);
}

async function fetchRemoteTopicQuestionIds(topicId) {
  if (remoteTopicQuestionIdsCache.has(topicId)) {
    return remoteTopicQuestionIdsCache.get(topicId);
  }

  const html = await fetchRemoteTopicListingHtml(topicId);
  const ids = parseRemoteTopicQuestionIds(html);
  if (!ids.length) {
    throw new Error('Nepodařilo se načíst seznam otázek z externího tématu.');
  }

  remoteTopicQuestionIdsCache.set(topicId, ids);
  return ids;
}

async function fetchExternalQuestionByQuery(query) {
  let lastError = null;
  const maxAttempts = Math.max(1, REMOTE_FETCH_RETRIES);
  const queryString = query.startsWith('?') ? query.slice(1) : query;
  const url = `https://www.autoskola-testy.cz/prohlizeni_otazek.php?${queryString}`;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': EXTERNAL_USER_AGENT,
          'Referer': `https://www.autoskola-testy.cz/prohlizeni_otazek.php?${queryString}`
        }
      });

      if (!response.ok) {
        throw new Error(`Externí API neodpovědělo správně (${response.status})`);
      }

      const html = await response.text();
      const question = parseExternalQuestion(html);

      if (!question.question_text || !question.correct_text || !question.wrong1_text || !question.wrong2_text) {
        throw new Error('Nepodařilo se načíst externí otázku.');
      }

      return question;
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        await delay(500 * attempt);
      }
    }
  }
  throw lastError || new Error('Nepodařilo se načíst externí otázku.');
}

async function fetchExternalQuestion(topicId) {
  let lastError = null;
  const maxAttempts = Math.max(1, REMOTE_FETCH_RETRIES);
  const url = `https://www.autoskola-testy.cz/prohlizeni_otazek.php?random=${topicId}`;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': EXTERNAL_USER_AGENT,
          'Referer': `https://www.autoskola-testy.cz/prohlizeni_otazek.php?random=${topicId}`
        }
      });

      if (!response.ok) {
        throw new Error(`Externí API neodpovědělo správně (${response.status})`);
      }

      const html = await response.text();
      const question = parseExternalQuestion(html);

      if (!question.question_text || !question.correct_text || !question.wrong1_text || !question.wrong2_text) {
        throw new Error('Nepodařilo se načíst externí otázku.');
      }

      return question;
    } catch (e) {
      lastError = e;
      if (attempt < maxAttempts) {
        await delay(500 * attempt);
      }
    }
  }
  throw lastError || new Error('Nepodařilo se načíst externí otázku.');
}

// ==========================================
// ANNOUNCEMENTS (LIVE OZNÁMENÍ)
// ==========================================
let currentAnnouncement = null;

app.post('/api/announcement', (req, res) => {
  try {
    const { text, duration } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Zpráva nesmí být prázdná.' });
    }
    const dur = Math.max(3, Math.min(60, parseInt(duration, 10) || 10));
    const announcement = {
      text: text.trim(),
      duration: dur,
      expiresAt: Date.now() + (dur * 1000),
      timestamp: Date.now()
    };
    currentAnnouncement = announcement;
    console.log(`[Oznámení] Odesláno: "${announcement.text}" (${dur}s)`);
    res.json({ success: true, message: 'Oznámení odesláno.', announcement });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/announcement', (req, res) => {
  try {
    if (!currentAnnouncement) {
      return res.json({ success: true, announcement: null });
    }
    if (Date.now() > currentAnnouncement.expiresAt) {
      currentAnnouncement = null;
      return res.json({ success: true, announcement: null });
    }
    const remaining = Math.ceil((currentAnnouncement.expiresAt - Date.now()) / 1000);
    res.json({
      success: true,
      announcement: {
        ...currentAnnouncement,
        remaining
      }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// OTÁZKY SKUPINY C - ENDPOINT
// ==========================================
app.get('/api/remote-test-c', async (req, res) => {
  const requestedCount = Math.max(1, Math.min(50, parseInt(req.query.count, 10) || 25));
  
  if (!localQuestionsC || !localQuestionsC.all || localQuestionsC.all.length === 0) {
    return res.status(500).json({ success: false, message: 'Otázky skupiny C nejsou k dispozici.' });
  }
  
  try {
    const pool = localQuestionsC.all;
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(requestedCount, shuffled.length));
    
    const questions = selected.map(q => {
      let points = q.points || 1;
      
      return {
        question_id: `c_${q.id}`,
        question_text: q.text,
        question_media: q.imageUrl || '',
        correct_text: q.correct,
        wrong1_text: q.wrong1,
        wrong2_text: q.wrong2,
        topic_id: q.topic,
        points: points,
        hasVideo: q.hasVideo || false,
        code: q.code || ''
      };
    });
    
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    
    res.json({ 
      success: true, 
      questions, 
      totalPoints,
      testType: 'C',
      passThreshold: 43,
      maxPoints: 50,
      timeMinutes: 30
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/remote-group-info-c', (req, res) => {
  if (!localQuestionsC || !localQuestionsC.all) {
    return res.json({ success: true, total_questions: 0, title: 'Skupina C - Nákladní vozidla' });
  }
  
  const byTopic = {};
  for (const q of localQuestionsC.all) {
    const t = q.topic || 0;
    if (!byTopic[t]) byTopic[t] = 0;
    byTopic[t]++;
  }
  
  res.json({ 
    success: true, 
    total_questions: localQuestionsC.all.length,
    title: 'Skupina C - Nákladní vozidla',
    passThreshold: 43,
    maxPoints: 50,
    timeMinutes: 30,
    byTopic
  });
});

// ==========================================
// ADMIN RESET (bez duplicity)
// ==========================================
app.post('/api/admin/reset', (req, res) => {
  try {
    db.exec('DELETE FROM users WHERE isCEO = 0');
    db.exec('DELETE FROM test_history');
    db.exec('DELETE FROM sign_categories');
    db.exec('DELETE FROM signs');
    const ceoCheck = db.prepare('SELECT id FROM users WHERE id = ?').get('ceo_001');
    if (!ceoCheck) {
      db.prepare(`INSERT INTO users (id, email, password, name, isCEO) VALUES (?, ?, ?, ?, 1)`)
        .run('ceo_001', 'scale.czsklol@gmail.com', 'kokotko123', 'CEO Majitel');
    }
    res.json({ success: true, message: 'Databáze byla resetována.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// SPUŠTĚNÍ SERVERU
// ==========================================
server.listen(PORT, () => {
  console.log(`[Server] Běží na http://localhost:${PORT}`);
  console.log(`[Server] API: http://localhost:${PORT}/api/users`);
  console.log(`[Server] WebSocket ready`);
});