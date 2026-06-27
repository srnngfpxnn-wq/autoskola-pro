/**
 * Script pro stažení všech otázek z autoskola-testy.cz
 * a uložení do lokálního JSON souboru pro okamžité načítání.
 * Spuštění: node fetch-all-questions.js
 * 
 * Tento script stáhne všechny otázky (1000+) a uloží je do questions.json
 * Poté server bude otázky načítat z tohoto souboru místo scrapování webu.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CONCURRENCY = 15;
const REQUEST_DELAY = 100;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';

const TOPICS = [
    { topic: 1, name: 'Pravidla provozu' },
    { topic: 2, name: 'Dopravní značky' },
    { topic: 3, name: 'Bezpečná jízda' },
    { topic: 4, name: 'Dopravní situace' },
    { topic: 5, name: 'Podmínky provozu vozidel' },
    { topic: 6, name: 'Předpisy o provozu' },
    { topic: 7, name: 'Zdravotnická příprava' }
];

const OUTPUT_FILE = path.join(__dirname, 'questions.json');

function fetchWithTimeout(url, timeout = 20000) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(timeout, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

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
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x27;/g, "'");
}

function parseQuestionIds(html) {
    const ids = [];
    const regex = /<a\s+href="\?otazka=(\d+(?:-[^"]*)?)"[^>]*>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}

function parseQuestion(html, topicId) {
    const questionText = decodeHtmlEntities(extractMatch(html, /"question-text"[^>]*>([\s\S]*?)<\/p>/i));
    const mediaMatch = html.match(/src="(\/img\/[A-Za-z0-9\/_.-]+\.(?:jpg|jpeg|png|gif))"/i);
    const questionMedia = mediaMatch ? `https://www.autoskola-testy.cz${mediaMatch[1]}` : '';
    const correctText = decodeHtmlEntities(extractMatch(html, /"answer otazka_spravne"[\s\S]*?<p>([\s\S]*?)<\/p>/i));
    const wrongMatches = [...html.matchAll(/"answer otazka_spatne"[\s\S]*?<p>([\s\S]*?)<\/p>/gi)].map(m => decodeHtmlEntities(m[1].trim()));
    const questionId = extractMatch(html, /kód\s+(\d+)/i);
    
    if (!questionText || !correctText || wrongMatches.length < 2) return null;
    
    return {
        id: questionId,
        text: questionText,
        imageUrl: questionMedia,
        correct: correctText,
        wrong1: wrongMatches[0],
        wrong2: wrongMatches[1],
        topic: topicId
    };
}

async function fetchTopicQuestionIds(topicId) {
    const url = `https://www.autoskola-testy.cz/prohlizeni_otazek.php?okruh=${topicId}`;
    console.log(`  [Topic ${topicId}] Načítám seznam otázek...`);
    const html = await fetchWithTimeout(url);
    const ids = parseQuestionIds(html);
    console.log(`  [Topic ${topicId}] Nalezeno ${ids.length} otázek`);
    return ids;
}

async function fetchQuestionById(questionId, topicId) {
    const url = `https://www.autoskola-testy.cz/prohlizeni_otazek.php?otazka=${questionId}`;
    const html = await fetchWithTimeout(url);
    return parseQuestion(html, topicId);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('============================================');
    console.log('  Autoškola Pro - Stahování všech otázek');
    console.log('============================================\n');
    
    const allQuestions = [];
    let totalQuestions = 0;
    let failed = 0;
    const failedIds = [];
    
    for (const topic of TOPICS) {
        console.log(`📚 Téma ${topic.topic}: ${topic.name}`);
        console.log(`   Načítám seznam...`);
        
        const ids = await fetchTopicQuestionIds(topic.topic);
        topic.count = ids.length;
        
        for (let i = 0; i < ids.length; i += CONCURRENCY) {
            const batch = ids.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(
                batch.map(id => fetchQuestionById(id, topic.topic))
            );
            
            for (let j = 0; j < results.length; j++) {
                const r = results[j];
                if (r.status === 'fulfilled' && r.value) {
                    allQuestions.push(r.value);
                    totalQuestions++;
                } else {
                    failed++;
                    if (failed <= 10) {
                        const qid = batch[j];
                        failedIds.push({ topic: topic.topic, id: qid });
                        process.stdout.write(`\n      [!] Chyba u otázky ${qid}: ${r.reason?.message || 'nepodařilo se parsovat'}`);
                    }
                }
            }
            
            const pct = Math.round(Math.min(i + batch.length, ids.length) / ids.length * 100);
            const dots = Math.round(pct / 2);
            process.stdout.write(`\r   [${'='.repeat(dots)}${' '.repeat(50 - dots)}] ${pct}% (${Math.min(i + batch.length, ids.length)}/${ids.length}) - celkem ${totalQuestions} otázek`);
            await delay(REQUEST_DELAY);
        }
        
        console.log(`\n   ✅ ${topic.name}: ${allQuestions.filter(q => q.topic === topic.topic).length} otázek\n`);
    }
    
    console.log('============================================');
    console.log(`   ✅ Hotovo!`);
    console.log(`   📊 Celkem otázek: ${totalQuestions}`);
    console.log(`   ❌ Nepodařilo se: ${failed}`);
    console.log('============================================\n');
    
    // Seskupit podle témat
    const byTopic = {};
    for (const q of allQuestions) {
        if (!byTopic[q.topic]) byTopic[q.topic] = [];
        byTopic[q.topic].push(q);
    }
    
    const output = {
        fetchedAt: new Date().toISOString(),
        total: totalQuestions,
        failed: failed,
        // Pro rychlé načítání - všechny otázky v jednom poli, každá s topic
        all: allQuestions,
        // Podle témat
        byTopic: byTopic
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output), 'utf8');
    
    const stats = fs.statSync(OUTPUT_FILE);
    console.log(`💾 Uloženo do: ${OUTPUT_FILE}`);
    console.log(`📦 Velikost: ${(stats.size / 1024 / 1024).toFixed(1)} MB\n`);
    console.log('   Nyní spusťte server a otázky se načtou z tohoto souboru!');
    console.log('   => node server.js\n');
}

main().catch(err => {
    console.error('\n❌ FATAL:', err);
    process.exit(1);
});