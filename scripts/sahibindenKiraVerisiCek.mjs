/**
 * Adım 2: Kaydedilen session ile 20 mahalle kira verisi çek.
 * Önce: node scripts/sahibinden_login.mjs
 * Sonra: node scripts/sahibindenKiraVerisiCek.mjs
 */
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: '.env.local' });
chromium.use(StealthPlugin());

const __dir = dirname(fileURLToPath(import.meta.url));
const SESSION_FILE   = join(__dir, 'sahibinden_session.json');
const COOKIES_FILE   = join(__dir, 'sahibinden_cookies.json');
const SONUC_FILE   = join(__dir, '../tmp_kira_sonuclari.json');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test için 20 mahalle — farklı ilçelerden çeşitli
const TEST_MAHALLELER = [
  { ilce: 'kadikoy',      mahalle: 'kozyatagi',       slug: 'kozyatagi'      },
  { ilce: 'kadikoy',      mahalle: 'moda',             slug: 'moda'           },
  { ilce: 'kadikoy',      mahalle: 'goztepe',          slug: 'goztepe'        },
  { ilce: 'besiktas',     mahalle: 'levent',            slug: 'levent'         },
  { ilce: 'besiktas',     mahalle: 'etiler',            slug: 'etiler'         },
  { ilce: 'sisli',        mahalle: 'nisantasi',         slug: 'nisantasi'      },
  { ilce: 'sisli',        mahalle: 'mecidiyekoy',       slug: 'mecidiyekoy'    },
  { ilce: 'uskudar',      mahalle: 'baglarbaşi',        slug: 'baglarbasi'     },
  { ilce: 'uskudar',      mahalle: 'kuzguncuk',         slug: 'kuzguncuk'      },
  { ilce: 'beyoglu',      mahalle: 'cihangir',          slug: 'cihangir'       },
  { ilce: 'beyoglu',      mahalle: 'galata',            slug: 'galata'         },
  { ilce: 'bakirkoy',     mahalle: 'atakoy',            slug: 'atakoy'         },
  { ilce: 'maltepe',      mahalle: 'cevizli',           slug: 'cevizli'        },
  { ilce: 'kagithane',    mahalle: 'gultepe',           slug: 'gultepe'        },
  { ilce: 'kagithane',    mahalle: 'caglayan',          slug: 'caglayan'       },
  { ilce: 'sariyer',      mahalle: 'maslak',            slug: 'maslak'         },
  { ilce: 'sariyer',      mahalle: 'istinye',           slug: 'istinye'        },
  { ilce: 'umraniye',     mahalle: 'esatpasa',          slug: 'esatpasa'       },
  { ilce: 'atasehir',     mahalle: 'kozyatagi',         slug: 'kozyatagi-2'    },
  { ilce: 'esenyurt',     mahalle: 'fatih',             slug: 'fatih-esenyurt' },
];

function medyan(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

async function kiraVerisiCek(page, ilce, mahalle) {
  const url = `https://www.sahibinden.com/kiralik-daire/istanbul-${ilce}-${mahalle}?pagingSize=50`;

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(1500 + Math.random() * 1000);

    // Redirect kontrolü
    const currentUrl = page.url();
    if (currentUrl.includes('giris') || currentUrl.includes('tloading')) {
      console.log(`  ⚠️  ${ilce}/${mahalle}: Challenge/Login sayfasına yönlendirildi`);
      return null;
    }

    // Fiyatları çek
    const fiyatlar = await page.$$eval(
      '.searchResultsPriceValue, [class*="price-value"], td.searchResultsPriceValue',
      els => els.map(el => {
        const txt = el.textContent?.replace(/[^\d]/g, '') || '';
        const n = parseInt(txt);
        return n >= 2000 && n <= 500000 ? n : null;
      }).filter(Boolean)
    );

    // Alternatif selector
    let fiyatlarAlt = [];
    if (fiyatlar.length === 0) {
      fiyatlarAlt = await page.evaluate(() => {
        const allText = document.body.innerText;
        const matches = allText.match(/(\d{1,3}(?:\.\d{3})*)\s*TL/g) || [];
        return matches.map(m => {
          const n = parseInt(m.replace(/\D/g,''));
          return n >= 2000 && n <= 500000 ? n : null;
        }).filter(Boolean);
      });
    }

    const tumFiyatlar = [...fiyatlar, ...fiyatlarAlt];
    const med = medyan(tumFiyatlar);

    // İlan sayısı
    const ilanSayisi = await page.$eval(
      '[class*="searchResultsCount"], [class*="result-count"], .listing-info span',
      el => parseInt(el.textContent?.replace(/\D/g,'') || '0')
    ).catch(() => tumFiyatlar.length);

    return { fiyatlar: tumFiyatlar, medyan: med, ilanSayisi };

  } catch (e) {
    console.log(`  ✗ ${ilce}/${mahalle}: ${e.message.substring(0,60)}`);
    return null;
  }
}

(async () => {
  // Cookie kaynağını belirle
  let contextOptions = {};
  if (existsSync(SESSION_FILE)) {
    console.log('Session dosyası kullanılıyor:', SESSION_FILE);
    contextOptions.storageState = SESSION_FILE;
  } else if (existsSync(COOKIES_FILE)) {
    console.log('Cookie dosyası kullanılıyor:', COOKIES_FILE);
    const rawCookies = JSON.parse(readFileSync(COOKIES_FILE, 'utf8'));
    // EditThisCookie → Playwright formatına çevir
    const sameSiteMap = { 'no_restriction': 'None', 'lax': 'Lax', 'strict': 'Strict', 'unspecified': 'Lax' };
    contextOptions.cookies = rawCookies.map(c => ({
      name:     c.name,
      value:    c.value,
      domain:   c.domain,
      path:     c.path || '/',
      expires:  c.expirationDate ? Math.floor(c.expirationDate) : -1,
      httpOnly: c.httpOnly || false,
      secure:   c.secure || false,
      sameSite: sameSiteMap[c.sameSite] || 'Lax',
    }));
  } else {
    console.error('Ne session ne de cookie dosyası bulunamadı.');
    process.exit(1);
  }

  console.log('Sahibinden kira verisi çekiliyor (20 mahalle)...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const context = await browser.newContext({
    ...contextOptions,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  });

  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  const sonuclar = [];

  for (let i = 0; i < TEST_MAHALLELER.length; i++) {
    const { ilce, mahalle, slug } = TEST_MAHALLELER[i];
    process.stdout.write(`[${i+1}/20] ${ilce}/${mahalle}... `);

    const veri = await kiraVerisiCek(page, ilce, mahalle);

    if (veri) {
      const { fiyatlar, medyan: med, ilanSayisi } = veri;
      console.log(`${fiyatlar.length} ilan, medyan: ${med ? med.toLocaleString('tr') + ' TL' : 'yok'}`);
      sonuclar.push({ ilce, mahalle, slug, medyan: med, ilanSayisi, fiyatlar: fiyatlar.slice(0,10) });
    } else {
      console.log('veri alınamadı');
      sonuclar.push({ ilce, mahalle, slug, medyan: null, ilanSayisi: 0 });
    }

    // Rate limit: 2-4 saniye arası
    if (i < TEST_MAHALLELER.length - 1) {
      await page.waitForTimeout(2000 + Math.random() * 2000);
    }
  }

  await browser.close();

  // Sonuçları kaydet
  writeFileSync(SONUC_FILE, JSON.stringify(sonuclar, null, 2));

  // Özet
  console.log('\n── Sonuçlar ─────────────────────────────────────────');
  console.log('  MAH/İLÇE                            MEDYAN   İLAN');
  console.log('─'.repeat(55));
  for (const s of sonuclar) {
    const label = `${s.mahalle} (${s.ilce})`.substring(0, 34);
    console.log(`${label.padEnd(35)} ${s.medyan ? (s.medyan.toLocaleString('tr') + ' TL').padStart(10) : '      yok'} ${String(s.ilanSayisi).padStart(6)}`);
  }

  const basarili = sonuclar.filter(s => s.medyan).length;
  console.log(`\n✅ ${basarili}/20 mahalleden veri alındı`);
  console.log(`Dosya: ${SONUC_FILE}`);

})().catch(e => console.error('HATA:', e.message));
