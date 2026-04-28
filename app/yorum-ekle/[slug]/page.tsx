'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { Parametreler } from '@/lib/types'

const KULLANICI_TIPI_OPTIONS = ['Kiracı', 'Ev Sahibi', 'Çalışan', 'Öğrenci', 'Emekli']
const IKAMET_SURESI_OPTIONS = ['1 yıldan az', '1-3 yıl', '3-5 yıl', '5-10 yıl', '10 yıldan fazla']

export default function YorumEkle({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    kullanici_tipi: '',
    ikamet_suresi: '',
    guvenlik_puani: 3,
    memnuniyet_puani: 3,
    yorum_metni: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3)
      return
    }

    if (!formData.kullanici_tipi || !formData.ikamet_suresi || !formData.yorum_metni) {
      alert('Lütfen tüm alanları doldurunuz')
      return
    }

    setLoading(true)
    try {
      // Mock submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSuccess(true)
      setTimeout(() => {
        window.location.href = `/ilce/${slug}`
      }, 1500)
    } catch (error) {
      console.error('Hata:', error)
      alert('Yorum gönderilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Link
          href={`/ilce/${slug}`}
          className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-8"
        >
          <ArrowLeft size={20} />
          <span>Geri Dön</span>
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="h1 text-center mb-2">Mahallede Yaşadığın Tecrübeleri Paylaş</h1>
          <p className="text-center text-gray-600 mb-8">
            Senin deneyimin diğer insanlara yardımcı olabilir
          </p>

          {success ? (
            <div className="card p-8 text-center bg-green-50 border border-green-200">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="h2 mb-2">Yorumun Gönderildi!</h2>
              <p className="text-gray-600">
                Yöneticiler tarafından incelendikten sonra yayınlanacak.
              </p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="flex gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2 flex-1 rounded transition-colors ${
                      s <= step ? 'bg-primary-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              <form onSubmit={handleSubmit} className="card p-8">
                {/* Step 1: Kişisel Bilgiler */}
                {step === 1 && (
                  <div className="space-y-6 animate-adimGiris">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Kullanıcı Tipi
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {KULLANICI_TIPI_OPTIONS.map((tip) => (
                          <button
                            key={tip}
                            type="button"
                            onClick={() => setFormData({ ...formData, kullanici_tipi: tip.toLowerCase() })}
                            className={`p-3 rounded-lg border-2 transition-all font-medium text-sm ${
                              formData.kullanici_tipi === tip.toLowerCase()
                                ? 'border-primary-600 bg-primary-50 text-primary-600'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {tip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Ne Kadar Zamandır Orada Oturuyorsun?
                      </label>
                      <select
                        value={formData.ikamet_suresi}
                        onChange={(e) => setFormData({ ...formData, ikamet_suresi: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none"
                      >
                        <option value="">Seç</option>
                        {IKAMET_SURESI_OPTIONS.map((sure) => (
                          <option key={sure} value={sure}>
                            {sure}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 2: Puanlandırma */}
                {step === 2 && (
                  <div className="space-y-8 animate-adimGiris">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-4">
                        🛡️ Güvenlik Puanı: <span className="text-primary-600">{formData.guvenlik_puani}/5</span>
                      </label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((puanValue) => (
                          <button
                            key={puanValue}
                            type="button"
                            onClick={() => setFormData({ ...formData, guvenlik_puani: puanValue })}
                            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                              puanValue === formData.guvenlik_puani
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {puanValue}⭐
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-4">
                        😊 Memnuniyet Puanı: <span className="text-primary-600">{formData.memnuniyet_puani}/5</span>
                      </label>
                      <div className="flex gap-3">
                        {[1, 2, 3, 4, 5].map((puanValue) => (
                          <button
                            key={puanValue}
                            type="button"
                            onClick={() => setFormData({ ...formData, memnuniyet_puani: puanValue })}
                            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                              puanValue === formData.memnuniyet_puani
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {puanValue}⭐
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Yorum */}
                {step === 3 && (
                  <div className="space-y-4 animate-adimGiris">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Detaylı Görüşün
                      </label>
                      <textarea
                        value={formData.yorum_metni}
                        onChange={(e) => setFormData({ ...formData, yorum_metni: e.target.value })}
                        placeholder="Mahalle hakkında düşündüklerini paylaş... (min 20 karakter)"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary-600 focus:outline-none h-32 resize-none"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.yorum_metni.length} karakter
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setStep((step - 1) as any)}
                    disabled={step === 1}
                    className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {step === 3 ? (
                      <>
                        <Send size={20} />
                        {loading ? 'Gönderiliyor...' : 'Gönder'}
                      </>
                    ) : (
                      'İleri'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
