'use client'

import Link from 'next/link'
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react'

export default function Hakkinda() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} />
          <span>Geri Dön</span>
        </Link>

        <div className="max-w-3xl mx-auto">
          <h1 className="h1 mb-8">Mahalle Skoru Hakkında</h1>

          <div className="space-y-8">
            {/* Misyon */}
            <section className="card p-8">
              <h2 className="h2 mb-4">🎯 Misyonumuz</h2>
              <p className="text-gray-700 leading-relaxed">
                İstanbul'da yaşamak isteyenler için, mahalle seçimi kararını nesnel veriler ve gerçek kullanıcı deneyimleriyle desteklemek. Ulaşımdan deprem riskine, eğitimden güvenliğe kadar 8 parametrede kapsamlı analiz sunmak.
              </p>
            </section>

            {/* Parametreler */}
            <section className="card p-8">
              <h2 className="h2 mb-4">📊 Parametreler</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold text-primary-600 mb-2">🚇 Ulaşım</p>
                  <p className="text-gray-700 text-sm">
                    Toplu taşıma ağı yoğunluğu, metro/metrobüs/tramvay yakınlığı
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-primary-600 mb-2">🏪 Imkanlar</p>
                  <p className="text-gray-700 text-sm">
                    AVM, restoran, kafe, market gibi tesislerin yoğunluğu
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-primary-600 mb-2">🎓 Eğitim</p>
                  <p className="text-gray-700 text-sm">
                    Okul sayı ve kalitesi, üniversiteye yakınlık
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-primary-600 mb-2">💰 Yaşam Maliyeti</p>
                  <p className="text-gray-700 text-sm">
                    Ortalama kira ve emlak fiyatları
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-primary-600 mb-2">🛡️ Güvenlik</p>
                  <p className="text-gray-700 text-sm">
                    Suç istatistikleri, huzur hissi göstergeleri
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-primary-600 mb-2">🏥 Sağlık</p>
                  <p className="text-gray-700 text-sm">
                    Hastane, klinik ve doktor sayısı
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-primary-600 mb-2">⚠️ Deprem</p>
                  <p className="text-gray-700 text-sm">
                    Deprem risk haritaları ve bina yaşı ortalaması
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-primary-600 mb-2">😊 Sakin Memnuniyeti</p>
                  <p className="text-gray-700 text-sm">
                    Kullanıcı yorumlarından hesaplanan memnuniyet
                  </p>
                </div>
              </div>
            </section>

            {/* Veri Kaynakları */}
            <section className="card p-8">
              <h2 className="h2 mb-4">📚 Veri Kaynakları</h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold">✓</span>
                  <span><strong>OpenStreetMap:</strong> Toplu taşıma, işletmeler, okullar</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold">✓</span>
                  <span><strong>AFAD:</strong> Deprem risk haritaları</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold">✓</span>
                  <span><strong>İBB Verileri:</strong> Resmi İstanbul istatistikleri</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary-600 font-bold">✓</span>
                  <span><strong>Kullanıcı Yorumları:</strong> Gerçek deneyimler ve puanlamalar</span>
                </li>
              </ul>
            </section>

            {/* Metodoloji */}
            <section className="card p-8">
              <h2 className="h2 mb-4">🔬 Metodoloji</h2>
              <p className="text-gray-700 mb-4 leading-relaxed">
                Her parametre 0-100 puan arasında değerlendirilir. Genel skor hesaplaması, kullanıcının ağırlıklı arama sisteminde belirlediği tercihlere göre yapılır. Bu sayede her kişinin öncelikleri doğrultusunda en uygun ilçe önerisi sunulur.
              </p>
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <p className="text-sm text-primary-900">
                  <strong>Örnek:</strong> Eğitim ve güvenliği öncelik alan birisi, bu parametrelere daha yüksek ağırlık atayarak arama yapabilir.
                </p>
              </div>
            </section>

            {/* İletişim */}
            <section className="card p-8">
              <h2 className="h2 mb-4">📞 İletişim</h2>
              <p className="text-gray-700 mb-6">
                Geri bildirimi, önerini veya sorununu bizimle paylaş.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="mailto:info@mahalleskoru.com"
                  className="btn-primary flex items-center gap-2"
                >
                  <Mail size={20} />
                  E-posta Gönder
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <ExternalLink size={20} />
                  GitHub
                </a>
              </div>
            </section>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
              <p>&copy; 2026 Mahalle Skoru. Tüm hakları saklıdır.</p>
              <p className="mt-2">Bu proje açık kaynak projedir ve geliştirmeye açıktır.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
