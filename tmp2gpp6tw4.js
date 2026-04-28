
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'tr-TR',
  });
  
  // Tüm API çağrılarını yakala — asıl sayfa açıkken
  const allReqs = [];
  context.on('request', req => {
    const url = req.url();
    if (url.includes('app.endeksa.com') && req.method() === 'POST') {
      allReqs.push({ url, post: req.postData() });
    }
  });

  const page = await context.newPage();
  
  // Mahalle sayfasını doğru URL ile aç
  // Endeksa URL: /tr/analiz/turkiye/istanbul/kadikoy/kozyatagi-kiralik-konut
  for (const testUrl of [
    'https://www.endeksa.com/tr/analiz/turkiye/istanbul/kadikoy/kozyatag%C4%B1',
    'https://www.endeksa.com/tr/analiz/turkiye/istanbul/kad%C4%B1k%C3%B6y/kozyata%C4%9F%C4%B1',
  ]) {
    await page.goto(testUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    const t = await page.title();
    const u = page.url();
    console.log('URL:', testUrl.split('endeksa.com')[1], '=> Title:', t, '| Current:', u.split('endeksa.com')[1]);
  }

  const token = await page.evaluate(() => typeof window.ecSec === 'function' ? window.ecSec() : null);
  
  // neighborhoods level 1-10 dene
  for (const level of [1, 2, 3, 4, 6, 7, 8]) {
    const nb = await page.evaluate(async ([t, lvl]) => {
      const res = await fetch('https://app.endeksa.com/neighborhoods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ CountryId: 1, CityId: 34, CountyId: 15, Take: 50, Level: lvl, captchaTokenCustom: t })
      });
      return { status: res.status, body: await res.text() };
    }, [token, level]);
    if (nb.status === 200) {
      console.log('SUCCESS Level:', level, nb.body.substring(0, 600));
      break;
    } else {
      console.log('Level', level, ':', nb.status, nb.body.substring(0, 100));
    }
  }
  
  // Asıl POST request'leri
  console.log('\nYakalanan POST istekleri:', allReqs.length);
  allReqs.forEach(r => console.log(r.url, '|', r.post?.substring(0,200)));

  await browser.close();
})().catch(e => console.error('HATA:', e.message));
