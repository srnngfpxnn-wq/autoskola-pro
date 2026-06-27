// ==========================================
// FETCH C QUESTIONS from etesty.md.gov.cz
// ==========================================
// Stahuje otázky pro skupinu C z oficiálního eTesty Ministerstva dopravy ČR
// a ukládá je do questions-c.json

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'questions-c.json');
const SAMPLE_TEST_URL = '/co/DLTest/SampleTest/C';
const HOSTNAME = 'etesty.md.gov.cz';
const FETCH_COUNT = 50; // Počet volání pro získání různých otázek
const CONCURRENCY = 5;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Základní témata/očekávané počty pro skupinu C
const BASKET_SCOPES = [
    { id: 9, name: 'Znalost pravidel provozu na pozemních komunikacích' },
    { id: 10, name: 'Znalost zásad bezpečné jízdy a ovládání vozidla' },
    { id: 11, name: 'Znalost dopravních značek, světelných a akustických signálů' },
    { id: 12, name: 'Schopnost řešení dopravních situací' },
    { id: 13, name: 'Znalost předpisů o podmínkách provozu vozidel' },
    { id: 14, name: 'Znalost předpisů souvisejících s provozem' },
    { id: 15, name: 'Znalost zdravotnické přípravy' }
];

async function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: HOSTNAME,
            port: 443,
            path: url,
            method: 'GET',
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'cs,en-US;q=0.7,en;q=0.3',
                'Referer': 'https://etesty.md.gov.cz/ro/Home'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        });

        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
    });
}

function extractQuestionData(html) {
    try {
        // Find the JSON data between new SampleTest( and , 'TestEvaluationModalId'
        const match = html.match(/new\s+SampleTest\(\s*(\{[\s\S]*?\})\s*,\s*'TestEvaluationModalId'/);
        if (!match) {
            console.error('Could not find SampleTest JSON in HTML');
            return null;
        }

        let jsonStr = match[1];
        
        // Clean up control characters and escape sequences
        jsonStr = jsonStr.replace(/\\r/g, ' ').replace(/\\n/g, ' ').replace(/\\t/g, ' ');
        
        // Fix double-escaped quotes
        jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\\u/g, '\\u');
        
        // Parse the JSON
        const data = JSON.parse(jsonStr);
        
        // Extract questions from basketScopes
        const questions = [];
        const seenIds = new Set();
        
        for (const basket of data.basketScopes || []) {
            for (const q of basket.questions || []) {
                if (seenIds.has(q.id)) continue;
                seenIds.add(q.id);
                
                const answers = q.questionAnswers || [];
                const correctAnswer = answers.find(a => a.isCorrect);
                const wrongAnswers = answers.filter(a => !a.isCorrect);
                
                // Get media URL
                let imageUrl = '';
                if (q.mediaContent && q.mediaContent.mediaUrl) {
                    imageUrl = `https://${HOSTNAME}${q.mediaContent.mediaUrl}`;
                }
                
                questions.push({
                    id: q.id,
                    code: q.questionCode || '',
                    text: q.questionText || '',
                    imageUrl: imageUrl,
                    explanation: q.explanationNote || '',
                    points: q.pointsCount || 1,
                    topic: basket.basketScopeId || 0,
                    topicName: basket.basketScopeName || '',
                    correct: correctAnswer ? correctAnswer.answerText : '',
                    wrong1: wrongAnswers[0] ? wrongAnswers[0].answerText : '',
                    wrong2: wrongAnswers[1] ? wrongAnswers[1].answerText : '',
                    hasVideo: q.mediaContent && q.mediaContent.mediaFormatCode && q.mediaContent.mediaFormatCode.startsWith('video'),
                    templateId: q.questionTemplateId || 1
                });
            }
        }
        
        return questions;
    } catch (e) {
        console.error('Error parsing question data:', e.message);
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchQuestionsBatch() {
    const allQuestions = [];
    const seenIds = new Set();
    let attempts = 0;
    let maxAttempts = FETCH_COUNT;
    
    console.log(`Stahuji otázky skupiny C z https://${HOSTNAME}${SAMPLE_TEST_URL}...`);
    console.log(`Počet pokusů: ${maxAttempts}, Concurrency: ${CONCURRENCY}`);
    console.log('----------------------------------------');
    
    while (attempts < maxAttempts && seenIds.size < 500) {
        const batch = [];
        const batchSize = Math.min(CONCURRENCY, maxAttempts - attempts);
        
        for (let i = 0; i < batchSize; i++) {
            batch.push(
                (async () => {
                    try {
                        const html = await fetchUrl(SAMPLE_TEST_URL);
                        const questions = extractQuestionData(html);
                        if (questions && questions.length > 0) {
                            return questions;
                        }
                    } catch (e) {
                        // Silently fail
                    }
                    return [];
                })()
            );
        }
        
        const results = await Promise.all(batch);
        let newCount = 0;
        
        for (const questions of results) {
            for (const q of questions) {
                if (!seenIds.has(q.id)) {
                    seenIds.add(q.id);
                    allQuestions.push(q);
                    newCount++;
                }
            }
        }
        
        attempts += batchSize;
        
        if (newCount > 0) {
            console.log(`[${attempts}/${maxAttempts}] Získáno ${seenIds.size} unikátních otázek...`);
        }
        
        // Delay between batches
        await delay(500);
    }
    
    return allQuestions;
}

async function main() {
    console.log('');
    console.log('==========================================');
    console.log('  FETCH C QUESTIONS - eTesty MD ČR');
    console.log('==========================================');
    console.log('');
    
    const questions = await fetchQuestionsBatch();
    
    if (questions.length === 0) {
        console.error('');
        console.error('❌ Nepodařilo se získat žádné otázky!');
        console.error('   Zkontrolujte připojení k internetu.');
        process.exit(1);
    }
    
    // Group by topic
    const byTopic = {};
    for (const q of questions) {
        if (!byTopic[q.topic]) byTopic[q.topic] = [];
        byTopic[q.topic].push(q);
    }
    
    console.log('');
    console.log('==========================================');
    console.log('  SHRNUTÍ');
    console.log('==========================================');
    console.log(`  Celkem otázek: ${questions.length}`);
    console.log('');
    
    for (const [topicId, qs] of Object.entries(byTopic)) {
        const scope = BASKET_SCOPES.find(s => s.id === parseInt(topicId));
        const name = scope ? scope.name : 'Neznámé téma';
        console.log(`  Téma ${topicId}: ${qs.length} otázek - ${name}`);
    }
    
    // Save to file
    const output = {
        generatedAt: new Date().toISOString(),
        source: `https://${HOSTNAME}${SAMPLE_TEST_URL}`,
        total: questions.length,
        byTopic: Object.fromEntries(
            Object.entries(byTopic).map(([k, v]) => [k, { count: v.length, name: (BASKET_SCOPES.find(s => s.id === parseInt(k)) || {}).name || '' }])
        ),
        all: questions
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log('');
    console.log(`✅ Uloženo do: ${OUTPUT_FILE}`);
    console.log(`   Velikost: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
    console.log('');
}

main().catch(e => {
    console.error('Chyba:', e.message);
    process.exit(1);
});