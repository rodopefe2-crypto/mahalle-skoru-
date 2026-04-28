-- Mahalleler tablosu
CREATE TABLE IF NOT EXISTS mahalleler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ilce_id uuid REFERENCES ilceler(id) ON DELETE CASCADE,
  isim text NOT NULL,
  slug text UNIQUE NOT NULL,
  aciklama text,
  koordinat_lat double precision,
  koordinat_lng double precision,
  nufus integer,
  alan_km2 double precision,
  osm_id bigint,
  ulasim_skoru integer DEFAULT 0,
  imkanlar_skoru integer DEFAULT 0,
  egitim_skoru integer DEFAULT 0,
  saglik_skoru integer DEFAULT 0,
  guvenlik_skoru integer DEFAULT 0,
  deprem_skoru integer DEFAULT 0,
  yasam_maliyeti_skoru integer DEFAULT 0,
  sakin_memnuniyeti_skoru integer DEFAULT 0,
  genel_skor integer DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- Mahalle tesisleri tablosu
CREATE TABLE IF NOT EXISTS mahalle_tesisler (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mahalle_id uuid REFERENCES mahalleler(id) ON DELETE CASCADE,
  kategori text NOT NULL,
  alt_kategori text,
  isim text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  osm_id bigint,
  kaynak text DEFAULT 'osm',
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mahalleler_ilce
  ON mahalleler(ilce_id);
CREATE INDEX IF NOT EXISTS idx_mahalle_tesisler_mahalle
  ON mahalle_tesisler(mahalle_id, kategori);
