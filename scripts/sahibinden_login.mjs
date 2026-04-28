/**
 * Adım 1: Sahibinden'e giriş yap, session'ı kaydet.
 * Çalıştır: node scripts/sahibinden_login.mjs
 * Tarayıcı açılır, giriş yapınca Enter'a bas.
 */
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { writeFileSync } from 'fs';
import * as readline from 'readline';

chromium.use(StealthPlugin());

const SESSION_FILE = './scripts/sahibinden_session.json';

async function bekle(mesaj) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(mesaj, () => { rl.close(); r(); }));
}

(async () => {
  console.log('Tarayıcı açılıyor...');
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--start-maximized'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: null,
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
  });

  const page = await context.newPage();
  await page.goto('https://www.sahibinden.com/giris', { waitUntil: 'domcontentloaded' });

  console.log('\n✅ Sahibinden giriş sayfası açıldı.');
  console.log('👉 Tarayıcıda e-posta + şifreni gir ve giriş yap.');
  console.log('   Giriş tamamlandıktan sonra terminale dön ve Enter\'a bas.\n');

  // Giriş tamamlanana kadar bekle (otomatik detect)
  console.log('⏳ Otomatik bekleniyor (max 120 sn)...');
  try {
    await page.waitForURL(url => !url.includes('/giris') && !url.includes('tloading'), {
      timeout: 120000
    });
    console.log('✅ Giriş başarılı! Session kaydediliyor...');
  } catch {
    console.log('⚠️  Otomatik tespit çalışmadı, manuel devam:');
    await bekle('Giriş yapınca Enter\'a bas: ');
  }

  // Session state kaydet
  const storageState = await context.storageState();
  writeFileSync(SESSION_FILE, JSON.stringify(storageState, null, 2));
  console.log(`\n✅ Session kaydedildi: ${SESSION_FILE}`);
  console.log('Şimdi: node scripts/sahibindenKiraVerisiCek.mjs');

  await browser.close();
})().catch(e => console.error('HATA:', e.message));
