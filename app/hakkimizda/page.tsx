'use client'

import Link from 'next/link'
import { ChevronLeft, Heart, Zap, Users } from 'lucide-react'

export default function HakkimizdaPage() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1a3a3a 100%)' }}>
      <div className="container max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-8 font-medium">
          <ChevronLeft size={20} />
          Geri Dön
        </Link>

        <h1 className="text-5xl font-bold text-gradient mb-8">Hakkımızda</h1>

        <div className="space-y-8">
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-navy-dark mb-4">Vizyon</h2>
            <p className="text-gray-700 leading-relaxed">
              Mahalle Skoru, İstanbul'da yaşamak isteyenlerin bilinçli kararlar vermesini sağlamak için kuruldu. Subjektif görüşler yerine, nesnel veriler ve çok yönlü analizle doğru ilçeyi bulunuz.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 text-center">
              <Zap size={32} className="text-teal-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-navy-dark mb-2">Hızlı Analiz</h3>
              <p className="text-sm text-gray-600">Anlık sonuçlar, kapsamlı veri setleri</p>
            </div>
            <div className="card p-6 text-center">
              <Heart size={32} className="text-teal-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-navy-dark mb-2">Güvenilir Veri</h3>
              <p className="text-sm text-gray-600">Resmi kaynaklardan derlenmiş bilgiler</p>
            </div>
            <div className="card p-6 text-center">
              <Users size={32} className="text-teal-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-navy-dark mb-2">Kullanıcı Odaklı</h3>
              <p className="text-sm text-gray-600">Gerçek sakinlerin deneyimlerini önemsiyoruz</p>
            </div>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-navy-dark mb-4">Metodoloji</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Mahalle Skoru, 8 temel parametre üzerinde kurulu bir sistemle ilçeleri değerlendirir:
            </p>
            <ul className="space-y-2 text-gray-700">
              <li>🚇 <strong>Ulaşım</strong>: Metro, otobüs ve diğer toplu taşıma erişimi</li>
              <li>🏪 <strong>İmkanlar</strong>: Alışveriş merkezi, restoran, kültür merkezi gibi imkanlar</li>
              <li>📚 <strong>Eğitim</strong>: Okul kalitesi ve eğitim kurumlarının yoğunluğu</li>
              <li>💰 <strong>Yaşam Maliyeti</strong>: Kira, gıda ve yaşam giderleri</li>
              <li>🛡️ <strong>Güvenlik</strong>: Güvenlik endeksi ve suç oranları</li>
              <li>⚕️ <strong>Sağlık</strong>: Hastane ve sağlık hizmeti erişimi</li>
              <li>🏗️ <strong>Deprem Direnci</strong>: Yapılar ve imar durumu</li>
              <li>😊 <strong>Sakin Memnuniyeti</strong>: Kullanıcı ve sakin memnuniyeti endeksi</li>
            </ul>
          </div>

          <div className="card p-8 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
            <h2 className="text-2xl font-bold text-navy-dark mb-4">İletişim</h2>
            <p className="text-gray-700 mb-4">
              Sorularınız, önerileriniz veya veri düzeltmeleri için bize ulaşın:
            </p>
            <p className="text-lg font-semibold text-teal-600">
              info@mahalleskoru.com
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
