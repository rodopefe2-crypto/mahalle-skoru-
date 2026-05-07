/**
 * Endeksa API — tüm İstanbul mahalleleri için kira verisi.
 * Response CountyId'leri kullanarak ilçe bazlı sorgu yapar.
 */
import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
chromium.use(StealthPlugin());

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function normalize(s) {
  if (!s) return '';
  return s.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s')
    .replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/i̇/g,'i').replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
}

(async () => {
  console.log('Endeksa — tüm İstanbul mahalleleri kira verisi\n');

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'tr-TR',
  });
  const page = await context.newPage();
  await page.goto('https://www.endeksa.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  const token = await page.evaluate(() => typeof window.ecSec === 'function' ? window.ecSec() : null);
  console.log('Token:', !!token);

  // Adım 1: Tüm İstanbul mahalleleri — ilk batch ile CountyId'leri topla
  const fetchNeighborhoods = async (countyId, skip = 0, take = 500) => {
    return page.evaluate(async ([t, cid, s, tk]) => {
      try {
        const res = await fetch('https://app.endeksa.com/neighborhoods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ CountryId: 1, CityId: 34, CountyId: cid, Take: tk, Skip: s, Level: 1, captchaTokenCustom: t })
        });
        if (!res.ok) return null;
        return res.json();
      } catch(e) { return null; }
    }, [token, countyId, skip, take]);
  };

  // Adım 1: CountyId=0 ile CountyId listesini topla
  const allData = new Map(); // DistrictId → properties
  const countyIds = new Set();

  const seed = await fetchNeighborhoods(0, 0, 500);
  seed?.features?.forEach(f => {
    allData.set(f.id, f.properties);
    if (f.properties?.CountyId) countyIds.add(f.properties.CountyId);
  });
  console.log(`Seed: ${allData.size} mahalle, ${countyIds.size} CountyId bulundu`);
  console.log('CountyId\'ler:', [...countyIds].sort((a, b) => a - b).join(', '));

  // Adım 2: Her CountyId için tüm mahalleleri çek (skip ile paginate)
  for (const cid of countyIds) {
    let cidCount = 0;
    for (let skip = 0; skip < 5000; skip += 500) {
      await page.waitForTimeout(300 + Math.random() * 200);
      const result = await fetchNeighborhoods(cid, skip, 500);
      if (!result?.features?.length) break;
      result.features.forEach(f => {
        allData.set(f.id, f.properties); // overwrite — taze veri
        cidCount++;
      });
      if (result.features.length < 500) break;
    }
    process.stdout.write(`\r  CountyId ${cid}: ${cidCount} kayıt, toplam: ${allData.size}   `);
  }
  console.log(`\nToplam: ${allData.size} unique mahalle`);

  await browser.close();

  // Filtrele: sadece PriceForRent > 0
  const withRent = [...allData.values()].filter(n => n.PriceForRent > 0);
  console.log(`PriceForRent > 0: ${withRent.length} mahalle`);

  // Örnek göster
  withRent.sort((a, b) => b.PriceForRent - a.PriceForRent);
  console.log('\nEn pahalı 10:');
  withRent.slice(0, 10).forEach(n => console.log(`  ${n.description?.padEnd(25)} ${n.PriceForRent?.toLocaleString('tr')} TL (${n.County})`));
  console.log('\nEn ucuz 10:');
  withRent.slice(-10).reverse().forEach(n => console.log(`  ${n.description?.padEnd(25)} ${n.PriceForRent?.toLocaleString('tr')} TL (${n.County})`));

  // DB eşleştirme
  const { data: dbMahs } = await supabase.from('mahalleler').select('id, isim, slug, ilce_id');
  const { data: ilceler } = await supabase.from('ilceler').select('id, isim, slug');
  const ilceByNorm = new Map(ilceler?.map(i => [normalize(i.isim), i]) || []);

  let eslesen = 0, eslesmedi = 0;
  const eslesmeyenler = [];

  for (const nb of withRent) {
    const normNb = normalize(nb.description || '');
    const normCounty = normalize(nb.County || '');
    const ilce = ilceByNorm.get(normCounty);
    if (!ilce) { eslesmedi++; continue; }

    const mahalle = dbMahs?.find(m => {
      if (m.ilce_id !== ilce.id) return false;
      const normM = normalize(m.isim);
      return normM === normNb || normM.includes(normNb) || normNb.includes(normM);
    });

    if (mahalle) {
      eslesen++;
      // Ters normalize: ucuz = yüksek skor
      const kiralar = withRent.map(n => n.PriceForRent);
      const maxK = Math.max(...kiralar), minK = Math.min(...kiralar);
      const logK = Math.log(nb.PriceForRent + 1);
      const skor = Math.round((1 - (logK - Math.log(minK + 1)) / (Math.log(maxK + 1) - Math.log(minK + 1))) * 100);

      await supabase.from('mahalleler').update({
        yasam_maliyeti_skoru: skor,
        kira_ortalama: Math.round(nb.PriceForRent),
      }).eq('id', mahalle.id);
    } else {
      eslesmedi++;
      eslesmeyenler.push(`${nb.description} (${nb.County})`);
    }
  }

  console.log(`\nEşleşen: ${eslesen}, eşleşmeyen: ${eslesmedi}`);
  if (eslesmeyenler.length) console.log('Eşleşmeyen örnekler:', eslesmeyenler.slice(0, 10).join(', '));

  writeFileSync('./tmp_endeksa_kira.json', JSON.stringify({
    tarih: new Date().toISOString(),
    toplam: withRent.length,
    mahalleler: withRent.map(n => ({ isim: n.description, ilce: n.County, kira: n.PriceForRent, ilanSayisi: n.TotalRentProperty }))
  }, null, 2));

  console.log(`✅ ${eslesen} mahalle güncellendi | Dosya: ./tmp_endeksa_kira.json`);
})().catch(e => console.error('HATA:', e.message));
