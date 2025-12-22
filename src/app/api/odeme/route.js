import { NextResponse } from 'next/server';

// BURASI SUNUCU TARAFIDIR - GÜVENLİDİR
// Gerçek projede 'iyzipay' veya 'stripe' kütüphaneleri buraya import edilir.

export async function POST(request) {
  try {
    const data = await request.json();
    const { kartBilgileri, sepet, tutar } = data;

    // 1. GÜVENLİK KONTROLÜ: Tutar doğrulaması
    // Gerçek hayatta burada veritabanından ürün fiyatlarını tekrar çekip 
    // frontend'den gelen tutarın doğru olup olmadığını kontrol etmeliyiz.
    // Şimdilik demo olduğu için geçiyoruz.
    if (!kartBilgileri || !sepet || sepet.length === 0) {
      return NextResponse.json({ success: false, message: "Sepet boş veya kart bilgisi eksik." }, { status: 400 });
    }

    // 2. SANAL POS ENTEGRASYONU (Örnek: Iyzico / Stripe)
    // Burası bankaya "Parayı çek" dediğimiz yerdir.
    
    // --- SİMÜLASYON BAŞLANGICI ---
    // Gerçek entegrasyonda buraya Iyzico/Stripe kodu gelir.
    // Örn: await iyzico.payment.create(...)
    
    const bankadanGelenCevap = await new Promise((resolve) => {
      setTimeout(() => {
        // %90 ihtimalle başarılı, %10 bakiye yetersiz hatası simülasyonu
        const basarili = Math.random() > 0.1;
        if (basarili) {
            resolve({ status: 'success', id: 'siparis-' + Date.now() });
        } else {
            resolve({ status: 'failure', errorMessage: 'Yetersiz Bakiye veya Hatalı Kart' });
        }
      }, 2000); // 2 saniye banka gecikmesi
    });
    // --- SİMÜLASYON BİTİŞİ ---

    if (bankadanGelenCevap.status === 'success') {
      return NextResponse.json({ 
        success: true, 
        message: "Ödeme onaylandı.", 
        siparisNo: bankadanGelenCevap.id 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: bankadanGelenCevap.errorMessage 
      }, { status: 400 });
    }

  } catch (error) {
    console.error("Ödeme API Hatası:", error);
    return NextResponse.json({ success: false, message: "Sunucu hatası oluştu." }, { status: 500 });
  }
}