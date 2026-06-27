/**
 * Skript pro stažení všech dopravních značek z bezpecnecesty.cz
 * a jejich uložení do databáze přes API.
 * Spuštění: node fetch-signs.js
 */

const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3000/api';
const BASE_URL = 'https://www.bezpecnecesty.cz/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36';

const CATEGORIES = [
    { name: 'Výstražné', slug: 'vystrazne-dopravni-znacky', icon: 'fa-triangle-exclamation' },
    { name: 'Upravující přednost', slug: 'znacky-upravujici-prednost', icon: 'fa-arrow-right-arrow-left' },
    { name: 'Zákazové', slug: 'zakazove-znacky', icon: 'fa-ban' },
    { name: 'Příkazové', slug: 'prikazove-znacky', icon: 'fa-arrow-circle-right' },
    { name: 'Informativní', slug: 'informativni-dopravni-znacky', icon: 'fa-info-circle' },
    { name: 'Dodatkové tabulky', slug: 'dodatkove-tabulky', icon: 'fa-table' },
    { name: 'Vodorovné', slug: 'vodorovne-dopravni-znacky', icon: 'fa-road' },
    { name: 'Dopravní zařízení', slug: 'dopravni-zarizeni', icon: 'fa-cone' },
    { name: 'Světelné signály', slug: 'svetelne-signaly', icon: 'fa-lightbulb' }
];

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const req = protocol.get(url, { 
            headers: { 
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'cs,en;q=0.9'
            } 
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const redirectUrl = res.headers.location.startsWith('http') ? 
                    res.headers.location : BASE_URL + res.headers.location;
                return fetchUrl(redirectUrl).then(resolve).catch(reject);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function apiPost(endpoint, data) {
    return new Promise((resolve, reject) => {
        const json = JSON.stringify(data);
        const url = new URL(API_BASE + endpoint);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(json)
            }
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve({ success: false, message: body }); }
            });
        });
        req.on('error', reject);
        req.write(json);
        req.end();
    });
}

function apiDelete(endpoint) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + endpoint);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'DELETE'
        };
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve({ success: false, message: body }); }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function extractMatch(text, regex, group = 1) {
    const match = text.match(regex);
    return match ? match[group].trim() : '';
}

// ========== ČIŠTĚNÍ TEXTU ==========

function cleanText(text) {
    return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/"/g, '')          // odstraní uvozovky
        .trim();
}

// ========== EXTRAKTOR POPISU – BERE POUZE PRVNÍ ČÁST ==========

function extractDescription(html) {
    // 1. Najdi kontejner traffic-sign-detail__text
    const detailMatch = html.match(/<div[^>]*class=["'][^"']*traffic-sign-detail__text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (detailMatch) {
        let inner = detailMatch[1];
        
        // Rozděl podle <br><br> a vezmi POUZE PRVNÍ ČÁST
        const parts = inner.split(/<br\s*\/?>\s*<br\s*\/?>/i);
        if (parts.length > 0) {
            let firstPart = parts[0];
            // Odstraníme HTML tagy
            firstPart = firstPart.replace(/<[^>]*>/g, ' ');
            const cleaned = cleanText(firstPart);
            if (cleaned.length > 10 && !/copyright|simopt|pravidla|správa cookies/i.test(cleaned)) {
                return cleaned;
            }
        }
        
        // Kdyby selhal split, zkus celý text
        inner = inner.replace(/<br\s*\/?>/gi, ' ');
        inner = inner.replace(/<[^>]*>/g, ' ');
        const cleaned = cleanText(inner);
        if (cleaned.length > 10 && !/copyright|simopt|pravidla|správa cookies/i.test(cleaned)) {
            return cleaned;
        }
    }

    // 2. Zkus alternativní kontejner traffic-sign-detail__content
    const contentMatch = html.match(/<div[^>]*class=["'][^"']*traffic-sign-detail__content[^"']*["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
    if (contentMatch) {
        let inner = contentMatch[1];
        const parts = inner.split(/<br\s*\/?>\s*<br\s*\/?>/i);
        if (parts.length > 0) {
            let firstPart = parts[0];
            firstPart = firstPart.replace(/<[^>]*>/g, ' ');
            const cleaned = cleanText(firstPart);
            if (cleaned.length > 10 && !/copyright|simopt|pravidla|správa cookies/i.test(cleaned)) {
                return cleaned;
            }
        }
        inner = inner.replace(/<br\s*\/?>/gi, ' ');
        inner = inner.replace(/<[^>]*>/g, ' ');
        const cleaned = cleanText(inner);
        if (cleaned.length > 10 && !/copyright|simopt|pravidla|správa cookies/i.test(cleaned)) {
            return cleaned;
        }
    }

    // 3. Zkus meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    if (metaMatch) {
        let desc = metaMatch[1].replace(/^[^-]+-\s*/, '').trim();
        if (desc.length > 10 && !/copyright|simopt|pravidla|správa cookies/i.test(desc)) {
            return cleanText(desc);
        }
    }

    // 4. Poslední záchrana – projdi všechny odstavce
    const allParagraphs = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (allParagraphs) {
        let best = '';
        for (const p of allParagraphs) {
            const text = cleanText(p.replace(/<[^>]*>/g, ''));
            if (text.length > best.length && 
                text.length > 30 && 
                !/copyright|simopt|pravidla|správa cookies|zpět|přehled|vysvětlení|klikněte/i.test(text)) {
                best = text;
            }
        }
        if (best.length > 30) return best;
    }

    return '';
}

// ========== DETAIL ZNAČKY ==========

async function fetchSignDetail(url, listName) {
    try {
        const html = await fetchUrl(url);
        const name = listName || '';

        let description = extractDescription(html);
        
        if (!description) {
            console.log(`    ⚠️  Nepodařilo se získat popis pro: ${name}`);
            description = `Značka: ${name}`;
        } else {
            console.log(`    ✅ Popis (${description.length} znaků): ${description.substring(0, 80)}...`);
        }

        // Obrázek
        let imageUrl = '';
        const imgDetail = html.match(/<div[^>]*class=["'][^"']*traffic-sign-detail__image[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (imgDetail) {
            const imgSrc = imgDetail[1].match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
            if (imgSrc) {
                let src = imgSrc[1];
                if (src.startsWith('/')) src = BASE_URL + src;
                imageUrl = src;
            }
        }

        return { name, description, imageUrl };
    } catch (e) {
        console.error(`    ❌ Chyba při načítání detailu ${url}:`, e.message);
        return { name: listName || '', description: '', imageUrl: '' };
    }
}

// ========== ZBYTEK PŮVODNÍHO KÓDU ==========

async function fetchCategorySigns(slug) {
    const url = `${BASE_URL}/cz/autoskola/vyuka/dopravni-znacky/${slug}`;
    console.log(`  📥 Načítám kategorii: ${slug}...`);
    const html = await fetchUrl(url);
    
    const signLinks = [...html.matchAll(/<a class="traffic-sign-list__link"\s*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];
    const signs = [];
    
    for (const match of signLinks) {
        const href = match[1];
        const innerHtml = match[2];
        
        const imgMatch = innerHtml.match(/<img[^>]*src="([^"]+)"[^>]*>/i);
        let imageUrl = '';
        if (imgMatch) {
            let src = imgMatch[1];
            if (src.startsWith('/')) src = BASE_URL + src;
            imageUrl = src;
        }
        
        const altText = imgMatch ? imgMatch[2] : '';
        let name = altText || '';
        if (!name) {
            name = innerHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        name = name.replace(/^(Výstražné|Zákazové|Příkazové|Informativní|Vodorovné)\s+dopravní\s+značky\s*/i, '').trim();
        name = name.replace(/^(Značky\s+upravující\s+přednost|Dodatkové\s+tabulky|Dopravní\s+zařízení|Světelné\s+signály)\s*/i, '').trim();
        
        if (href && !href.includes('#')) {
            signs.push({
                href: href.startsWith('/') ? BASE_URL + href : href,
                imageUrl,
                name: name
            });
        }
    }
    
    console.log(`  📊 Nalezeno ${signs.length} značek v kategorii`);
    return signs;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('============================================');
    console.log('  Stahování dopravních značek z bezpecnecesty.cz');
    console.log('============================================\n');
    
    // 1. Vyčistit existující kategorie a značky
    console.log('🗑️  Vymazávám existující kategorie a značky...');
    try {
        const existingCats = await new Promise((resolve, reject) => {
            const url = new URL(API_BASE + '/signs/categories');
            http.get(url, (res) => {
                let d = '';
                res.on('data', c => d += c);
                res.on('end', () => {
                    try { resolve(JSON.parse(d)); }
                    catch { resolve({ success: false }); }
                });
            }).on('error', reject);
        });
        
        if (existingCats.success && existingCats.categories) {
            for (const cat of existingCats.categories) {
                await apiDelete('/signs/categories/' + cat.id);
                console.log(`  Smazána kategorie: ${cat.name}`);
            }
        }
    } catch (e) {
        console.log('  (žádné existující kategorie)');
    }
    
    let totalSigns = 0;
    let failedSigns = 0;
    
    for (const cat of CATEGORIES) {
        console.log(`\n📁 Kategorie: ${cat.name}`);
        
        const catResult = await apiPost('/signs/categories', {
            name: cat.name,
            icon: cat.icon
        });
        
        if (!catResult.success) {
            console.log(`  ❌ Chyba při vytváření kategorie: ${catResult.message}`);
            continue;
        }
        
        const categoryId = catResult.category.id;
        console.log(`  ✅ Kategorie vytvořena (ID: ${categoryId})`);
        
        const signs = await fetchCategorySigns(cat.slug);
        
        if (signs.length === 0) {
            console.log('  ⚠️  Žádné značky nenalezeny');
            continue;
        }
        
        let count = 0;
        for (let i = 0; i < signs.length; i++) {
            const sign = signs[i];
            
            try {
                const detail = await fetchSignDetail(sign.href, sign.name);
                const name = detail.name || `Značka ${i + 1}`;
                const description = detail.description || '';
                const imageUrl = detail.imageUrl || sign.imageUrl;
                
                const result = await apiPost('/signs', {
                    categoryId: categoryId,
                    name: name,
                    imageUrl: imageUrl,
                    description: description
                });
                
                if (result.success) {
                    count++;
                    totalSigns++;
                    process.stdout.write(`\r     ✅ [${i + 1}/${signs.length}] ${name.substring(0, 50)}`);
                } else {
                    failedSigns++;
                    process.stdout.write(`\r     ❌ [${i + 1}/${signs.length}] Chyba: ${result.message}`);
                }
            } catch (e) {
                failedSigns++;
                process.stdout.write(`\r     ❌ [${i + 1}/${signs.length}] Chyba připojení`);
            }
            
            await delay(200);
        }
        
        console.log(`\n  ✅ Přidáno ${count} značek`);
    }
    
    console.log('\n============================================');
    console.log(`  ✅ Hotovo!`);
    console.log(`  📊 Celkem značek: ${totalSigns}`);
    console.log(`  ❌ Chyby: ${failedSigns}`);
    console.log('============================================\n');
}

main().catch(err => {
    console.error('\n❌ FATAL:', err);
    process.exit(1);
});