# Mahalle — Proje Briefing

## Skor Sistemi (Nisan 2026)

### Genel Skor Ağırlıkları
| Parametre      | Ağırlık | Açıklama                    |
|----------------|---------|-----------------------------|
| Ulaşım         | %25     | Puan bazlı + metrobüs bonus |
| Sağlık         | %20     | OSM tesis yoğunluğu         |
| Eğitim         | %20     | URAP + okul tipi puan sistemi |
| İmkanlar       | %15     | Alan bazlı yoğunluk         |
| Yeşil Alan     | %10     | Park/spor/sahil             |
| Kültür & Sanat | %7      | Sinema/tiyatro/müze         |
| Deprem         | %3      | Gösterge                    |

### Yaşam Maliyeti
Genel skorda YOK — ayrı filtre ve parametre olarak gösteriliyor.  
Kaynak: Endeksa Mart 2025.

### Güncelleme Sırası
1. `npm run veri:ulasim-skor`
2. `npm run veri:egitim-skor`
3. `npm run veri:yasam-maliyet`
4. `npm run veri:deprem`
5. SQL: imkanlar/yesil/kultur normalizasyonu
6. `npm run veri:genel-skor`
