# Mahalle Skoru — İstanbul İlçe Rehberi

İstanbul ilçelerini 8 parametre üzerinden puanlayan, kullanıcı yorumlarıyla beslenen bir mahalle yaşanabilirlik platformu.

## Özellikler

- **8 Parametre Analizi**: Ulaşım, İmkanlar, Eğitim, Yaşam Maliyeti, Güvenlik, Sağlık, Deprem Riski, Sakin Memnuniyeti
- **Ağırlıklı Arama**: Kullanıcıların parametrelere önem verme oranını slider'larla ayarlaması
- **Kullanıcı Yorumları**: İlçe deneyimleri paylaşımı ve moderasyon sistemi
- **İnteraktif Harita**: Leaflet.js ile OSM haritası
- **Radar Grafikler**: Recharts ile parametre karşılaştırmaları

## Teknoloji Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Harita**: Leaflet.js + OpenStreetMap
- **Veritabanı**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Deploy**: Vercel

## Kurulum

1. **Repository'yi klonlayın**
   ```bash
   git clone <repo-url>
   cd mahalle
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   npm install
   ```

3. **Supabase Kurulumu**
   - [Supabase](https://supabase.com) hesabınız yoksa oluşturun
   - Yeni bir proje oluşturun
   - SQL Editor'da aşağıdaki tabloları oluşturun:

   ```sql
   -- ilceler tablosu
   create table ilceler (
     id uuid primary key default gen_random_uuid(),
     isim text not null,
     slug text unique not null,
     aciklama text,
     koordinat_lat float,
     koordinat_lng float,
     ulasim_skoru integer check (ulasim_skoru between 0 and 100),
     imkanlar_skoru integer check (imkanlar_skoru between 0 and 100),
     egitim_skoru integer check (egitim_skoru between 0 and 100),
     yasam_maliyeti_skoru integer check (yasam_maliyeti_skoru between 0 and 100),
     guvenlik_skoru integer check (guvenlik_skoru between 0 and 100),
     saglik_skoru integer check (saglik_skoru between 0 and 100),
     deprem_skoru integer check (deprem_skoru between 0 and 100),
     sakin_memnuniyeti_skoru integer check (sakin_memnuniyeti_skoru between 0 and 100),
     genel_skor integer,
     created_at timestamp default now(),
     updated_at timestamp default now()
   );

   -- yorumlar tablosu
   create table yorumlar (
     id uuid primary key default gen_random_uuid(),
     ilce_id uuid references ilceler(id),
     kullanici_tipi text check (kullanici_tipi in ('kiracı', 'ev sahibi', 'çalışan', 'öğrenci', 'emekli')),
     ikamet_suresi text,
     yorum_metni text not null,
     guvenlik_puani integer check (guvenlik_puani between 1 and 5),
     memnuniyet_puani integer check (memnuniyet_puani between 1 and 5),
     onaylandi boolean default false,
     created_at timestamp default now()
   );
   ```

4. **Environment Variables**
   ```bash
   cp .env.local.example .env.local
   ```

   `.env.local` dosyasını düzenleyin:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Veritabanını Doldurun**
   ```bash
   npx tsx scripts/veritabaniDoldur.ts
   ```

6. **Overpass Verilerini Çekin**
   ```bash
   npx tsx scripts/veriCek.ts
   ```

## Çalıştırma

```bash
npm run dev
```

Uygulama [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

## Deploy

### Vercel

1. [Vercel](https://vercel.com) hesabınız yoksa oluşturun
2. Projeyi import edin
3. Environment variables'ları ayarlayın
4. Deploy edin

## Veri Kaynakları

- **Overpass API**: Ulaşım, İmkanlar, Eğitim, Sağlık verileri
- **Numbeo**: Yaşam maliyeti endeksi
- **AFAD**: Deprem riski verileri
- **Kullanıcı Yorumları**: Güvenlik ve memnuniyet puanları

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
