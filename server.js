const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const REMOTE_FETCH_TIMEOUT_MS = 15000;
const REMOTE_FETCH_RETRIES = 1;
const MAX_REMOTE_FETCH_CONCURRENCY = 40;
const MAX_REMOTE_QUESTION_COUNT = 1200;
const remoteTopicQuestionIdsCache = new Map();

// Jednoduchá cache na otázky - klíč: "topic:count", hodnota: { data, timestamp }
const remoteQuestionsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minut

// Statické soubory (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// ==========================================
// DATABÁZE
// ==========================================
const db = new Database(path.join(__dirname, 'leaderboard.db'));
db.pragma('journal_mode = WAL');

// Vytvoření tabulek
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

// Výchozí CEO účet
const ceo = db.prepare('SELECT id FROM users WHERE id = ?').get('ceo_001');
if (!ceo) {
  db.prepare(`INSERT INTO users (id, email, password, name, isCEO) VALUES (?, ?, ?, ?, 1)`)
    .run('ceo_001', 'scale.czsklol@gmail.com', 'kokotko123', 'CEO Majitel');
  console.log('[DB] Vytvořen CEO účet');
}

// ==========================================
// API ENDPOINTY
// ==========================================

// GET /api/users - vrátí všechny uživatele (pro leaderboard)
app.get('/api/users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, xp, bestScore, achievements, streak, bestStreak, totalAnswered, avatar, isCEO FROM users ORDER BY xp DESC').all();
    res.json({ success: true, users });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/users/:id - vrátí jednoho uživatele
app.get('/api/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Uživatel nenalezen' });
    delete user.password;
    user.achievements = JSON.parse(user.achievements || '[]');
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// POST /api/login
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

// POST /api/register
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

// PUT /api/users/:id - aktualizace uživatele (XP, skóre, atd.)
app.put('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Povolená pole k aktualizaci
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
// ADMIN API ENDPOINTY
// ==========================================

// GET /api/admin/users - seznam uživatelů pro admin panel
app.get('/api/admin/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, xp, bestScore, totalAnswered, streak, bestStreak, achievements, isCEO,
             datetime(registeredAt) as registeredAt
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
      isCEO: u.isCEO
    }));
    res.json({ success: true, users: result });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// GET /api/admin/stats - statistiky pro admin panel
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

// DELETE /api/admin/users/:id - smazat uživatele (pouze admin)
app.delete('/api/admin/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    // Nesmazat CEO
    const user = db.prepare('SELECT isCEO FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ success: false, message: 'Uživatel nenalezen.' });
    if (user.isCEO) return res.status(403).json({ success: false, message: 'CEO účet nelze smazat.' });
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    res.json({ success: true, message: 'Uživatel smazán.' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// EXTERNÍ OTÁZKY Z autoskola-testy.cz
// ==========================================
const EXTERNAL_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';

function extractMatch(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function decodeHtmlEntities(text) {
  return text.replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
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
  const points = extractMatch(html, /za její správné zodpovězení v testech se získá.+?(\d)/i);
  const topic_id = parseInt(extractMatch(html, /Tato otázka ze skupiny.+?\?okruh=(\d+)/i), 10) || null;

  return {
    question_text,
    question_media,
    correct_text,
    wrong1_text,
    wrong2_text,
    question_id,
    topic_id,
    points
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
  const queryString = query.startsWith('?') ? query.slice(1) : query;
  const url = `https://www.autoskola-testy.cz/prohlizeni_otazek.php?${queryString}`;
  for (let attempt = 1; attempt <= REMOTE_FETCH_RETRIES; attempt++) {
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
      if (attempt < REMOTE_FETCH_RETRIES) {
        await delay(500 * attempt);
      }
    }
  }
  throw lastError || new Error('Nepodařilo se načíst externí otázku.');
}

async function fetchExternalQuestion(topicId) {
  let lastError = null;
  const url = `https://www.autoskola-testy.cz/prohlizeni_otazek.php?random=${topicId}`;
  for (let attempt = 1; attempt <= REMOTE_FETCH_RETRIES; attempt++) {
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
      if (attempt < REMOTE_FETCH_RETRIES) {
        await delay(500 * attempt);
      }
    }
  }
  throw lastError || new Error('Nepodařilo se načíst externí otázku.');
}

app.get('/api/remote-question', async (req, res) => {
  const topic = parseInt(req.query.topic, 10);
  if (!topic || topic < 1 || topic > 7) {
    return res.status(400).json({ success: false, message: 'topic musí být číslo 1-7.' });
  }

  try {
    const question = await fetchExternalQuestion(topic);
    res.json({ success: true, question });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/remote-test', async (req, res) => {
  const topic = parseInt(req.query.topic, 10);
  const requestedCount = Math.max(1, Math.min(MAX_REMOTE_QUESTION_COUNT, parseInt(req.query.count, 10) || 5));
  if (topic !== 0 && (topic < 1 || topic > 7)) {
    return res.status(400).json({ success: false, message: 'topic musí být číslo 0-7.' });
  }

  try {
    // Pro menší počty použijeme random endpoint (rychlý, jednoduchý)
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

    // Velké počty - zkusíme cache, nebo stáhneme a uložíme do cache
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
          questions.push(result.q);
        }
      }
    }

    // Uložit do cache pro příště
    if (questions.length > 0) {
      remoteQuestionsCache.set(cacheKey, { data: questions.slice(0, desiredCount), timestamp: Date.now() });
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

  try {
    const html = await fetchRemoteTopicListingHtml(topic);
    const ids = parseRemoteTopicQuestionIds(html);
    const totalQuestions = ids.length;
    const title = extractMatch(html, /Otázky ve skupině\s*([^<\n]+)/i) || extractMatch(html, /Skupina\s+<strong>([\s\S]*?)<\/strong> obsahuje/i) || '';
    res.json({ success: true, topic, total_questions: totalQuestions, title });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// ==========================================
// ANNOUNCEMENTS (LIVE OZNÁMENÍ)
// ==========================================
let currentAnnouncement = null; // { text, duration, expiresAt, timestamp }

// POST /api/announcement - CEO odešle oznámení
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

// GET /api/announcement - klienti si vyzvednou aktuální oznámení
app.get('/api/announcement', (req, res) => {
  try {
    if (!currentAnnouncement) {
      return res.json({ success: true, announcement: null });
    }
    // Pokud už vypršelo, smažeme
    if (Date.now() > currentAnnouncement.expiresAt) {
      currentAnnouncement = null;
      return res.json({ success: true, announcement: null });
    }
    // Vrátíme zbývající čas
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
// SPUŠTĚNÍ
// ==========================================
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`[Server] Běží na http://localhost:${port}`);
    console.log(`[Server] API: http://localhost:${port}/api/users`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === 3000) {
      const nextPort = 3001;
      console.warn(`[Server] Port ${port} je obsazený, zkouším port ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}

startServer(PORT);