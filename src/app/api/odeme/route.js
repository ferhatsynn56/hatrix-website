import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Frontend'den gelen veriyi okuyalım (Göstermelik)
    const body = await request.json();
    const { urunAdi, fiyat } = body;

    console.log(`DEMO MODU: ${urunAdi} için ${fiyat} TL'lik sipariş isteği geldi.`);

    // --- BURASI DEMO ALANI ---
    // Gerçek iyzico bağlantısı yerine, başarılı olmuş gibi cevap dönüyoruz.
    
    // 2 saniye gecikme ekleyelim ki "İşleniyor..." yazısı görünsün (Gerçekçi olsun)
    await new Promise(resolve => setTimeout(resolve, 2000));

    return NextResponse.json({ 
        status: 'success', 
        message: 'Demo ödeme linki oluşturuldu.',
        // Müşteriye göstermek için iyzico'nun sandbox sayfasına yönlendiriyoruz
        paymentPageUrl: 'https://sandbox-ppg.iyzipay.com/' 
    });

  } catch (error) {
    console.error("Demo Hatası:", error);
    return NextResponse.json({ status: 'error', message: 'Sunucu hatası' }, { status: 500 });
  }
}