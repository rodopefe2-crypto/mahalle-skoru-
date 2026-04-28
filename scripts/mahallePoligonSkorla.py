#!/usr/bin/env python3
"""
Mahalle poligonlarını Overpass'tan çekip,
tesisleri gerçek sınırlara göre atar,
global normalizasyonla skor hesaplar.
"""
import json, math, time, os, re, urllib.request, urllib.parse, urllib.error
from collections import defaultdict

# ── CONFIG ────────────────────────────────────────
CACHE_FILE   = '/tmp/osm_mahalle_poligonlar.json'
TESIS_FILE   = '/tmp/tum_tesisler.json'
SUPABASE_URL = None
SUPABASE_KEY = None

# .env.local oku
env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line.startswith('NEXT_PUBLIC_SUPABASE_URL='):
            SUPABASE_URL = line.split('=', 1)[1].strip()
        elif line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
            SUPABASE_KEY = line.split('=', 1)[1].strip()

BASE = SUPABASE_URL + '/rest/v1'

def supabase_fetch(url, method='GET', data=None):
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, headers=headers, data=body, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return json.loads(txt) if txt else []
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:200]}")
        return []

def overpass_post(q, timeout=45):
    data = urllib.parse.urlencode({'data': q}).encode()
    req = urllib.request.Request(
        'https://overpass-api.de/api/interpreter',
        data=data, method='POST',
        headers={'Content-Type':'application/x-www-form-urlencoded','User-Agent':'MahalleApp/1.0'}
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())

# ── YERDEĞİŞTİRME ADIMLARI ───────────────────────

def normalize_isim(s):
    """Mahalle adını normalize et: küçük harf, Türkçe → ASCII, "mahallesi" sil."""
    if not s: return ''
    s = s.lower().strip()
    s = re.sub(r'\s*(mahallesi?|mah\.?)\s*$', '', s).strip()
    for a, b in [('ğ','g'),('ü','u'),('ş','s'),('ı','i'),('ö','o'),('ç','c'),('i̇','i')]:
        s = s.replace(a, b)
    return s.strip()

def ray_cast(lat, lng, polygon):
    """Ray casting: point (lat,lng) polygon içinde mi?"""
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        yi, xi = polygon[i]   # lat, lng
        yj, xj = polygon[j]
        if ((xi > lng) != (xj > lng)) and \
           (lat < (yj - yi) * (lng - xi) / (xj - xi) + yi):
            inside = not inside
        j = i
    return inside

def ilce_osm_ismi(slug):
    """İlçe slug → Türkçe OSM ismi."""
    MAP = {
        'adalar':'Adalar','arnavutkoy':'Arnavutköy','atasehir':'Ataşehir',
        'avcilar':'Avcılar','bagcilar':'Bağcılar','bahcelievler':'Bahçelievler',
        'bakirkoy':'Bakırköy','basaksehir':'Başakşehir','bayrampasa':'Bayrampaşa',
        'besiktas':'Beşiktaş','beykoz':'Beykoz','beylikduzu':'Beylikdüzü',
        'beyoglu':'Beyoğlu','buyukcekmece':'Büyükçekmece','catalca':'Çatalca',
        'cekmekoy':'Çekmeköy','esenler':'Esenler','esenyurt':'Esenyurt',
        'eyupsultan':'Eyüpsultan','fatih':'Fatih','gaziosmanpasa':'Gaziosmanpaşa',
        'gungoren':'Güngören','kadikoy':'Kadıköy','kagithane':'Kağıthane',
        'kartal':'Kartal','kucukcekmece':'Küçükçekmece','maltepe':'Maltepe',
        'pendik':'Pendik','sancaktepe':'Sancaktepe','sariyer':'Sarıyer',
        'sile':'Şile','sisli':'Şişli','sultanbeyli':'Sultanbeyli',
        'sultangazi':'Sultangazi','tuzla':'Tuzla','umraniye':'Ümraniye',
        'uskudar':'Üsküdar','zeytinburnu':'Zeytinburnu','beykoz':'Beykoz',
    }
    return MAP.get(slug, slug)

# ── PUAN TABLOSU ──────────────────────────────────
PUAN = {
    'bus_stop':1,'subway_entrance':10,'tram_stop':5,'ferry_terminal':10,'metrobus':10,
    'pharmacy':3,'hospital':15,'clinic':8,'doctors':5,'dentist':3,'eczane':3,'hastane':15,'klinik':8,
    'school':7,'university':20,'college':10,'kindergarten':5,'library':5,
    'cafe':2,'restoran':2,'market':3,'bar':1,'firin':1,
    'park':5,'spor':3,'garden':2,'playground':2,'sports_centre':4,
    'sinema':5,'tiyatro':5,'muze':5,'galeri':3,'arts_centre':4,'cinema':5,'theatre':5,'museum':5,'gallery':3,
}
KAT_MAP = {'ulasim':[],'saglik':[],'egitim':[],'imkanlar':[]}

# ── PHASE 1: OSM POLİGONLARI ─────────────────────
def poligonlari_cek(ilceler):
    """Her ilçe için admin_level=8 mahalle poligonlarını çek."""
    if os.path.exists(CACHE_FILE):
        print(f"Cache bulundu: {CACHE_FILE}")
        with open(CACHE_FILE) as f:
            return json.load(f)

    print("OSM poligonlar çekiliyor...")
    tum_poligonlar = {}  # osm_id → {name, ilce_slug, rings: [[lat,lng],...]}

    for ilce in ilceler:
        osm_isim = ilce_osm_ismi(ilce['slug'])
        q = f"""
[out:json][timeout:35];
area["name"="{osm_isim}"]["admin_level"="6"]["boundary"="administrative"]->.ilce;
relation["admin_level"="8"]["boundary"="administrative"](area.ilce);
out geom;
"""
        for attempt in range(3):
            try:
                result = overpass_post(q, timeout=40)
                rels = result.get('elements', [])
                for rel in rels:
                    osm_id = str(rel['id'])
                    name   = rel.get('tags',{}).get('name','')
                    # Outer ring koordinatları
                    outer_nodes = []
                    for member in rel.get('members', []):
                        if member.get('role') == 'outer':
                            for g in member.get('geometry', []):
                                outer_nodes.append([g['lat'], g['lon']])
                    if outer_nodes:
                        tum_poligonlar[osm_id] = {
                            'name':     name,
                            'norm':     normalize_isim(name),
                            'ilce_slug': ilce['slug'],
                            'coords':   outer_nodes,
                        }
                print(f"  {ilce['isim']}: {len(rels)} mahalle poligonu")
                time.sleep(1.2)
                break
            except Exception as e:
                print(f"  HATA {ilce['isim']} (deneme {attempt+1}): {e}")
                if attempt < 2:
                    time.sleep(5)

    with open(CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(tum_poligonlar, f, ensure_ascii=False)
    print(f"\nToplam {len(tum_poligonlar)} poligon kaydedildi → {CACHE_FILE}\n")
    return tum_poligonlar

# ── PHASE 2: TESİS VERİSİ ─────────────────────────
def tesisleri_cek():
    if os.path.exists(TESIS_FILE):
        print(f"Tesis cache: {TESIS_FILE}")
        with open(TESIS_FILE) as f:
            return json.load(f)

    print("Tesisler Supabase'den çekiliyor...")
    tesisler = []
    offset   = 0
    while True:
        batch = supabase_fetch(
            f"{BASE}/ilce_tesisler?select=ilce_id,kategori,alt_kategori,lat,lng"
            f"&lat=not.is.null&limit=1000&offset={offset}"
        )
        if not batch: break
        tesisler.extend(batch)
        print(f"\r  {len(tesisler)} tesis", end='', flush=True)
        if len(batch) < 1000: break
        offset += 1000
    print(f"\r  {len(tesisler)} tesis yüklendi")

    with open(TESIS_FILE, 'w') as f:
        json.dump(tesisler, f)
    return tesisler

# ── PHASE 3: POLIGON MAÇLAMA ──────────────────────
def poligon_mahalle_esle(poligonlar, mahalleler):
    """OSM poligon → DB mahalle eşleştirmesi."""
    # DB mahallelerini index'le: ilce_slug + norm_isim → id
    db_index = {}
    for m in mahalleler:
        # mahalle.slug formatı: {ilce_slug}-{mahalle_slug}
        ilce_slug  = m['ilce_slug']
        norm       = normalize_isim(m['isim'])
        key        = (ilce_slug, norm)
        db_index[key] = m['id']

    eslesme   = {}  # osm_id → mahalle_id
    eslesemez = []
    for osm_id, pol in poligonlar.items():
        key = (pol['ilce_slug'], pol['norm'])
        if key in db_index:
            eslesme[osm_id] = db_index[key]
        else:
            # Kısmi eşleşme: norm içinde mi?
            found = False
            for (is_, nm), mid in db_index.items():
                if is_ == pol['ilce_slug'] and (
                    pol['norm'] in nm or nm in pol['norm'] or
                    pol['norm'][:6] == nm[:6]  # ilk 6 harf
                ):
                    eslesme[osm_id] = mid
                    found = True
                    break
            if not found:
                eslesemez.append(f"{pol['ilce_slug']} / {pol['name']}")

    print(f"Eşleşen: {len(eslesme)}, eşleşemeyen: {len(eslesemez)}")
    if eslesemez[:5]:
        print("  Örnek eşleşemeyenler:", eslesemez[:5])
    return eslesme

# ── PHASE 4: POINT-IN-POLYGON ────────────────────
def tesisleri_ata(poligonlar, eslesme, tesisler, ilceler):
    """Her tesisi polygon içine düşen mahalleye ata."""
    # İlçe slug → poligon listesi
    ilce_pols = defaultdict(list)
    for osm_id, pol in poligonlar.items():
        if osm_id in eslesme:
            ilce_pols[pol['ilce_slug']].append({
                'mahalle_id': eslesme[osm_id],
                'coords':     pol['coords'],
            })

    # İlçe id → slug map
    ilce_id_to_slug = {i['id']: i['slug'] for i in ilceler}

    mah_puan = defaultdict(lambda: {'ulasim':0,'saglik':0,'egitim':0,'imkanlar':0})
    atanan = eslesemedi = disarida = 0

    for i, tesis in enumerate(tesisler):
        if i % 5000 == 0:
            print(f"\r  {i}/{len(tesisler)} tesis işlendi  atanan:{atanan}", end='', flush=True)

        puan = PUAN.get(tesis.get('alt_kategori',''), 0)
        if puan == 0:
            continue

        kat = tesis.get('kategori','')
        if kat not in mah_puan[None].__class__.__new__(dict) if False else True:
            pass
        if kat not in ('ulasim','saglik','egitim','imkanlar'):
            continue

        ilce_slug = ilce_id_to_slug.get(tesis.get('ilce_id',''), '')
        if not ilce_slug:
            eslesemedi += 1
            continue

        pols = ilce_pols.get(ilce_slug, [])
        if not pols:
            eslesemedi += 1
            continue

        lat = tesis.get('lat')
        lng = tesis.get('lng')
        if not lat or not lng:
            continue

        assigned = False
        for pol in pols:
            if ray_cast(lat, lng, pol['coords']):
                mah_puan[pol['mahalle_id']][kat] += puan
                atanan += 1
                assigned = True
                break

        if not assigned:
            # En yakın poligona ata (fallback)
            best_id = None
            best_d  = float('inf')
            for pol in pols:
                # Centroid hesapla
                lats = [c[0] for c in pol['coords']]
                lngs = [c[1] for c in pol['coords']]
                clat = sum(lats) / len(lats)
                clng = sum(lngs) / len(lngs)
                d = (lat - clat)**2 + (lng - clng)**2
                if d < best_d:
                    best_d = d
                    best_id = pol['mahalle_id']
            if best_id and best_d < 0.001:  # ~1km
                mah_puan[best_id][kat] += puan
                atanan += 1
            else:
                disarida += 1

    print(f"\n  Atanan: {atanan}, ilçe yok: {eslesemedi}, dışarıda: {disarida}")
    return dict(mah_puan)

# ── PHASE 5: GLOBAL SKOR HESAPLA ─────────────────
def log_norm_global(puan_dict, kat):
    """Tüm mahalleleri global olarak normalize et."""
    vals = [v.get(kat, 0) for v in puan_dict.values()]
    max_v = max(vals) if vals else 1
    min_v = min(v for v in vals if v > 0) if any(v > 0 for v in vals) else 1

    result = {}
    for mid, puanlar in puan_dict.items():
        v = puanlar.get(kat, 0)
        if v == 0:
            result[mid] = 0
        else:
            log_v   = math.log(v + 1)
            log_max = math.log(max_v + 1)
            log_min = math.log(min_v + 1)
            if log_max == log_min:
                result[mid] = 50
            else:
                result[mid] = round(((log_v - log_min) / (log_max - log_min)) * 100)
    return result

def ana():
    # DB'den verileri çek
    print("=" * 55)
    print("MAHALLE POLİGON SKORU — Overpass + Point-in-Polygon")
    print("=" * 55)

    ilceler   = supabase_fetch(f"{BASE}/ilceler?select=id,isim,slug,nufus_yogunlugu_skoru,ulasim_skoru")
    mahalleler_raw = supabase_fetch(
        f"{BASE}/mahalleler?select=id,isim,slug,ilce_id,deprem_skoru&limit=1000"
    )
    # İkinci sayfa
    if len(mahalleler_raw) == 1000:
        sayfa2 = supabase_fetch(f"{BASE}/mahalleler?select=id,isim,slug,ilce_id,deprem_skoru&limit=1000&offset=1000")
        mahalleler_raw.extend(sayfa2)

    # mahalle → ilce_slug
    ilce_id_to_slug = {i['id']: i['slug'] for i in ilceler}
    mahalleler = []
    for m in mahalleler_raw:
        ilce_slug = ilce_id_to_slug.get(m['ilce_id'], '')
        mahalleler.append({**m, 'ilce_slug': ilce_slug})

    print(f"İlçe: {len(ilceler)}, Mahalle: {len(mahalleler)}\n")

    # Phase 1: Poligonlar
    poligonlar = poligonlari_cek(ilceler)
    print(f"Toplam poligon: {len(poligonlar)}\n")

    # Phase 2: Tesisler
    tesisler = tesisleri_cek()
    print(f"Toplam tesis: {len(tesisler)}\n")

    # Phase 3: Eşleştir
    print("Poligon ↔ DB mahalle eşleştiriliyor...")
    eslesme = poligon_mahalle_esle(poligonlar, mahalleler)
    print()

    # Phase 4: Point-in-polygon
    print("Point-in-polygon ataması yapılıyor...")
    mah_puan = tesisleri_ata(poligonlar, eslesme, tesisler, ilceler)
    print()

    # Phase 5: Global normalize
    print("Global normalizasyon uygulanıyor...")
    norm_ulasim   = log_norm_global(mah_puan, 'ulasim')
    norm_saglik   = log_norm_global(mah_puan, 'saglik')
    norm_egitim   = log_norm_global(mah_puan, 'egitim')
    norm_imkanlar = log_norm_global(mah_puan, 'imkanlar')

    # İlçe skor map
    ilce_map = {i['id']: i for i in ilceler}
    ilce_slug_to_id = {i['slug']: i['id'] for i in ilceler}

    # Genel skor hesapla
    print("DB güncelleniyor...")
    guncellenen = 0
    for mah in mahalleler:
        ilce_id    = mah['ilce_id']
        ilce       = ilce_map.get(ilce_id, {})
        nufus_yog  = ilce.get('nufus_yogunlugu_skoru') or 0
        deprem_sk  = mah.get('deprem_skoru') or (ilce.get('deprem_skoru') or 50)
        mid        = mah['id']

        ulasim   = norm_ulasim.get(mid, 0)
        saglik   = norm_saglik.get(mid, 0)
        egitim   = norm_egitim.get(mid, 0)
        imkanlar = norm_imkanlar.get(mid, 0)

        genel = round(
            ulasim   * 0.22 +
            saglik   * 0.17 +
            egitim   * 0.17 +
            imkanlar * 0.13 +
            deprem_sk * 0.10 +
            nufus_yog * 0.07
        )

        supabase_fetch(
            f"{BASE}/mahalleler?id=eq.{mid}",
            method='PATCH',
            data={
                'ulasim_skoru':   ulasim,
                'saglik_skoru':   saglik,
                'egitim_skoru':   egitim,
                'imkanlar_skoru': imkanlar,
                'genel_skor':     genel,
            }
        )
        guncellenen += 1
        if guncellenen % 100 == 0:
            print(f"\r  {guncellenen}/{len(mahalleler)}", end='', flush=True)

    print(f"\r✅ {guncellenen} mahalle güncellendi")

    # TOP 10
    top = supabase_fetch(
        f"{BASE}/mahalleler?select=isim,ulasim_skoru,saglik_skoru,egitim_skoru,imkanlar_skoru,deprem_skoru,genel_skor"
        f"&order=genel_skor.desc&limit=10"
    )
    print("\n── TOP 10 Mahalle ────────────────────────────────────────────────")
    print(f"  {'MAH':<22} {'ULAŞ':>5} {'SAĞL':>5} {'EĞT':>5} {'İMKN':>5} {'DEP':>5} {'GENEL':>6}")
    print("  " + "─" * 54)
    for i, m in enumerate(top):
        print(f"  {str(i+1)+'.':>3} {m['isim']:<19} "
              f"{m['ulasim_skoru'] or 0:>5} "
              f"{m['saglik_skoru'] or 0:>5} "
              f"{m['egitim_skoru'] or 0:>5} "
              f"{m['imkanlar_skoru'] or 0:>5} "
              f"{m['deprem_skoru'] or 0:>5} "
              f"{m['genel_skor'] or 0:>6}")

if __name__ == '__main__':
    ana()
