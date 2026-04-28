'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Mail, Phone, MapPin, Send } from 'lucide-react'

export default function IletisimPage() {
  const [formData, setFormData] = useState({
    ad: '',
    email: '',
    mesaj: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ ad: '', email: '', mesaj: '' })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1a3a3a 100%)' }}>
      <div className="container max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-8 font-medium">
          <ChevronLeft size={20} />
          Geri Dön
        </Link>

        <h1 className="text-5xl font-bold text-gradient mb-8">İletişim</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card p-6 text-center">
            <Mail size={32} className="text-teal-600 mx-auto mb-3" />
            <h3 className="font-bold text-navy-dark mb-2">Email</h3>
            <p className="text-gray-600">info@mahalleskoru.com</p>
          </div>
          <div className="card p-6 text-center">
            <Phone size={32} className="text-teal-600 mx-auto mb-3" />
            <h3 className="font-bold text-navy-dark mb-2">Telefon</h3>
            <p className="text-gray-600">+90 (212) 555-0000</p>
          </div>
          <div className="card p-6 text-center">
            <MapPin size={32} className="text-teal-600 mx-auto mb-3" />
            <h3 className="font-bold text-navy-dark mb-2">Adres</h3>
            <p className="text-gray-600">İstanbul, Türkiye</p>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-navy-dark mb-6">Bize Mesaj Gönderin</h2>

          {submitted ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">✓</div>
              <h3 className="text-2xl font-bold text-teal-600 mb-2">Mesaj Gönderildi!</h3>
              <p className="text-gray-600">Teşekkür ederiz. En kısa sürede sizinle iletişime geçeceğiz.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-navy-dark mb-2">
                  Adınız
                </label>
                <input
                  type="text"
                  name="ad"
                  value={formData.ad}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                  placeholder="Ad Soyadınız"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-dark mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-dark mb-2">
                  Mesaj
                </label>
                <textarea
                  name="mesaj"
                  value={formData.mesaj}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-teal-600 transition-colors resize-none"
                  placeholder="Mesajınızı yazınız..."
                />
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary justify-center"
              >
                <Send size={20} />
                Mesaj Gönder
              </button>
            </form>
          )}
        </div>

        <div className="mt-12 card p-8 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
          <h2 className="text-2xl font-bold text-navy-dark mb-4">Sık Sorulan Sorular</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-navy-dark mb-2">Veriler ne sıklıkta güncelleniyor?</h3>
              <p className="text-gray-700">Verilerimiz ayda bir güncellenmektedir. En son kaynaklardan derlenmiş bilgiler sunuyoruz.</p>
            </div>
            <div>
              <h3 className="font-bold text-navy-dark mb-2">Kendi verilerimi ekleyebilir miyim?</h3>
              <p className="text-gray-700">Evet! Yorum ve deneyimlerinizi bize göndererek projeye katkıda bulunabilirsiniz.</p>
            </div>
            <div>
              <h3 className="font-bold text-navy-dark mb-2">Verileriniz ne kadar doğru?</h3>
              <p className="text-gray-700">Tüm verilerimiz resmi kaynaklardan derlenmektedir. Hata bulursanız lütfen bildirin.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
