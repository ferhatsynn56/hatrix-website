"use client";

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { useCart } from '@/context/CartContext';
import { ArrowLeft, ShoppingBag, ChevronDown, ChevronUp, Ruler, Truck, RotateCcw, ShieldCheck, Star, Share2, Heart } from 'lucide-react';
import Link from 'next/link';

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
    apiKey: "AIzaSyDcTJHnK55GBqOuxUNtb7toIOpPffjiyc4",
    authDomain: "hatrix-db.firebaseapp.com",
    projectId: "hatrix-db",
    storageBucket: "hatrix-db.firebasestorage.app",
    messagingSenderId: "903710965804",
    appId: "1:903710965804:web:5dc754a337a1d9d7951189",
    measurementId: "G-C03LWY68K7"
};

let db = null;
try {
    if (Object.keys(firebaseConfig).length > 0) {
        const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
        db = getFirestore(app);
    }
} catch (e) { console.error(e); }

// --- YÜKLENİYOR BİLEŞENİ ---
function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-black pt-[100px] pb-20 px-4 md:px-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="aspect-[3/4] bg-zinc-900 animate-pulse rounded-lg"></div>
                <div className="flex flex-col gap-6 pt-10">
                    <div className="h-4 w-1/3 bg-zinc-900 animate-pulse rounded"></div>
                    <div className="h-10 w-3/4 bg-zinc-900 animate-pulse rounded"></div>
                    <div className="h-8 w-1/4 bg-zinc-900 animate-pulse rounded"></div>
                    <div className="flex gap-4 mt-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-12 w-12 bg-zinc-900 animate-pulse rounded-full"></div>)}
                    </div>
                    <div className="h-14 w-full bg-zinc-900 animate-pulse rounded-full mt-8"></div>
                </div>
            </div>
        </div>
    );
}

// --- AKORDİYON BİLEŞENİ ---
function AccordionItem({ title, children, isOpen, onClick, icon: Icon }) {
    return (
        <div className="border-b border-zinc-800">
            <button
                className="w-full flex justify-between items-center py-5 text-left group"
                onClick={onClick}
            >
                <span className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-3 group-hover:text-zinc-300 transition">
                    {Icon && <Icon size={16} />} {title}
                </span>
                <span className="text-zinc-500 group-hover:text-white transition">
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </span>
            </button>
            <div
                className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="pb-6 text-sm text-zinc-400 leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function UrunDetayPage() {
    const { id } = useParams();
    const router = useRouter();
    const { addToCart } = useCart();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    
    // Akordiyon State'leri
    const [openAccordion, setOpenAccordion] = useState('description');

    // Zoom Efekti State'leri
    const [bgPos, setBgPos] = useState('0% 0%');
    const [showZoom, setShowZoom] = useState(false);
    const imageContainerRef = useRef(null);

    // Veri Çekme
    useEffect(() => {
        if (!db || !id) return;
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, 'urunler', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProduct({ id: docSnap.id, ...data });
                    // Varsayılan seçimler (Eğer veri varsa)
                    if (data.bedenler && data.bedenler.length > 0) setSelectedSize(data.bedenler[0]);
                    if (data.renkler && data.renkler.length > 0) setSelectedColor(data.renkler[0]);
                } else {
                    router.push('/404');
                }
            } catch (error) {
                console.error("Ürün çekme hatası:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, router]);

    // Zoom Efekti Fonksiyonu
    const handleMouseMove = (e) => {
        if (!imageContainerRef.current) return;
        const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setBgPos(`${x}% ${y}%`);
    };

    // Sepete Ekleme
    const handleAddToCart = async () => {
        if (!product) return;
        
        // Beden/Renk zorunluluğu kontrolü (Eğer ürünün bu özellikleri varsa)
        const hasSizes = product.bedenler && product.bedenler.length > 0;
        const hasColors = product.renkler && product.renkler.length > 0;

        if ((hasSizes && !selectedSize) || (hasColors && !selectedColor)) {
            alert("Lütfen beden ve renk seçimi yapınız."); // Gerçek projede toast mesajı daha şık olur
            return;
        }

        setAddingToCart(true);
        await addToCart(product, selectedSize, selectedColor);
        setAddingToCart(false);
        // Burada bir "Sepete Eklendi" bildirimi gösterilebilir.
    };

    if (loading) return <LoadingSkeleton />;
    if (!product) return null;

    // Mock Veriler (Firebase'de yoksa diye)
    const bedenler = product.bedenler || ['S', 'M', 'L', 'XL'];
    const renkler = product.renkler || [{hex: '#000000', name: 'Siyah'}, {hex: '#FFFFFF', name: 'Beyaz'}];
    // Renk verisi string array gelirse diye kontrol:
    const normalizeRenkler = Array.isArray(renkler) && typeof renkler[0] === 'string' 
        ? renkler.map(r => ({ hex: r.toLowerCase() === 'beyaz' ? '#ffffff' : r.toLowerCase() === 'siyah' ? '#000000' : r, name: r })) 
        : renkler;


    return (
        <div className="min-h-screen bg-black font-sans text-white pt-[88px] pb-20 selection:bg-red-600 selection:text-white">
            
            {/* Breadcrumb & Geri Dön */}
            <div className="px-4 md:px-8 py-4 border-b border-zinc-900 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <Link href="/tum-urunler" className="hover:text-white flex items-center gap-1 transition"><ArrowLeft size={14} /> Mağaza</Link>
                <span>/</span>
                <span className="text-white line-clamp-1">{product.isim}</span>
            </div>

            <main className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 md:mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-start">
                    
                    {/* --- SOL SÜTUN: GÖRSEL & ZOOM --- */}
                    <div className="relative sticky top-24">
                        <div 
                            ref={imageContainerRef}
                            className="aspect-[3/4] md:aspect-[4/5] w-full bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-900 group cursor-crosshair"
                            onMouseEnter={() => setShowZoom(true)}
                            onMouseLeave={() => setShowZoom(false)}
                            onMouseMove={handleMouseMove}
                        >
                            {/* Ana Görsel */}
                            <img 
                                src={product.resim} 
                                alt={product.isim} 
                                className={`w-full h-full object-cover transition-opacity duration-300 ${showZoom ? 'opacity-0' : 'opacity-100'}`}
                                onError={(e) => { e.target.src = 'https://placehold.co/600x800/111/fff?text=No+Image' }}
                            />
                            {/* Zoom Görseli (Arkaplan olarak) */}
                            <div 
                                className={`absolute inset-0 bg-no-repeat transition-opacity duration-300 pointer-events-none ${showZoom ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    backgroundImage: `url(${product.resim})`,
                                    backgroundPosition: bgPos,
                                    backgroundSize: '200%', // Büyütme oranı
                                }}
                            ></div>
                        </div>
                        
                        {/* İkonlar (Favori/Paylaş - İşlevsiz) */}
                        <div className="absolute top-4 right-4 flex flex-col gap-3 z-10">
                            <button className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white hover:text-black transition shadow-lg"><Heart size={18} /></button>
                            <button className="bg-black/50 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white hover:text-black transition shadow-lg"><Share2 size={18} /></button>
                        </div>
                    </div>

                    {/* --- SAĞ SÜTUN: DETAYLAR --- */}
                    <div className="flex flex-col pt-4 md:pt-8">
                        
                        {/* Başlık & Fiyat */}
                        <div className="mb-10">
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-4 leading-none">{product.isim}</h1>
                            <div className="flex items-center gap-4">
                                <span className="text-2xl md:text-3xl font-black tracking-wide">₺{product.fiyat}</span>
                                {product.eskiFiyat && <span className="text-lg text-zinc-500 line-through">₺{product.eskiFiyat}</span>}
                            </div>
                            <p className="text-zinc-400 text-sm mt-4 leading-relaxed max-w-md">{product.aciklama || "Bu ürün için henüz kısa bir açıklama eklenmemiştir. Stenist kalitesiyle üretilmiştir."}</p>
                        </div>

                        <div className="space-y-8 mb-10">
                            {/* Renk Seçimi (Varsa) */}
                            {normalizeRenkler.length > 0 && (
                                <div>
                                    <div className="flex justify-between mb-3">
                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Renk: <span className="text-white">{selectedColor?.name}</span></span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {normalizeRenkler.map((renk, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setSelectedColor(renk)}
                                                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${selectedColor?.name === renk.name ? 'border-white p-0.5' : 'border-transparent hover:border-zinc-700'}`}
                                            >
                                                <div className="w-full h-full rounded-full border border-zinc-800" style={{ backgroundColor: renk.hex }}></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Beden Seçimi (Varsa) */}
                            {bedenler.length > 0 && (
                                <div>
                                    <div className="flex justify-between mb-3 items-center">
                                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Beden: <span className="text-white">{selectedSize}</span></span>
                                        <button className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white transition">
                                            <Ruler size={12} /> Beden Tablosu
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {bedenler.map((beden) => (
                                            <button
                                                key={beden}
                                                onClick={() => setSelectedSize(beden)}
                                                className={`py-3 text-xs font-black uppercase tracking-widest border rounded-md transition-all ${
                                                    selectedSize === beden 
                                                    ? 'bg-white text-black border-white' 
                                                    : 'text-zinc-400 border-zinc-800 hover:border-white hover:text-white'
                                                }`}
                                            >
                                                {beden}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sepete Ekle Butonu */}
                        <button 
                            onClick={handleAddToCart}
                            disabled={addingToCart}
                            className={`w-full py-5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] rounded-full transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.3)] mb-10 ${addingToCart ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {addingToCart ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <ShoppingBag size={20} /> SEPETE EKLE
                                </>
                            )}
                        </button>
                        
                        {/* Güvenlik Rozetleri */}
                        <div className="grid grid-cols-3 gap-4 mb-10 py-6 border-t border-b border-zinc-900">
                            <div className="flex flex-col items-center text-center gap-2">
                                <Truck size={20} className="text-zinc-400" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Hızlı<br/>Kargo</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <RotateCcw size={20} className="text-zinc-400" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Kolay<br/>İade</span>
                            </div>
                            <div className="flex flex-col items-center text-center gap-2">
                                <ShieldCheck size={20} className="text-zinc-400" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Güvenli<br/>Ödeme</span>
                            </div>
                        </div>

                        {/* Akordiyonlar (Bilgi Alanları) */}
                        <div className="border-t border-zinc-900">
                            <AccordionItem 
                                title="Ürün Açıklaması" 
                                isOpen={openAccordion === 'description'} 
                                onClick={() => setOpenAccordion(openAccordion === 'description' ? null : 'description')}
                            >
                                <p>{product.detayliAciklama || "Bu ürün, yüksek kaliteli malzemeler kullanılarak Stenist tasarım stüdyosunda özenle üretilmiştir. Modern kesimi ve dayanıklı yapısı ile günlük kullanım için idealdir. Sokak modasının ruhunu yansıtan detaylara sahiptir."}</p>
                            </AccordionItem>
                            <AccordionItem 
                                title="Materyal ve Bakım" 
                                isOpen={openAccordion === 'material'} 
                                onClick={() => setOpenAccordion(openAccordion === 'material' ? null : 'material')}
                            >
                                <ul className="list-disc list-inside space-y-1">
                                    <li>%100 Pamuk (veya ürün içeriğine göre değişir).</li>
                                    <li>30°C'de makinede yıkanabilir.</li>
                                    <li>Ağartıcı kullanmayınız.</li>
                                    <li>Düşük ısıda ütüleyiniz.</li>
                                    <li>Kuru temizleme yapılabilir.</li>
                                </ul>
                            </AccordionItem>
                             <AccordionItem 
                                title="Teslimat ve İade" 
                                isOpen={openAccordion === 'shipping'} 
                                onClick={() => setOpenAccordion(openAccordion === 'shipping' ? null : 'shipping')}
                                icon={Truck}
                            >
                                <p>Siparişleriniz 1-3 iş günü içerisinde kargoya verilir. Teslimat süresi bulunduğunuz bölgeye göre değişiklik gösterebilir. Ürünü teslim aldığınız tarihten itibaren 14 gün içinde ücretsiz olarak iade edebilirsiniz.</p>
                            </AccordionItem>
                        </div>

                    </div>
                </div>
            </main>

            {/* --- FOOTER (Diğer sayfalardaki ile aynı) --- */}
            <footer className="bg-zinc-950 text-white py-20 px-8 border-t border-zinc-900 mt-24">
                <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="flex flex-col space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Müşteri Hizmetleri</h4>
                        <ul className="space-y-4 text-sm font-medium text-zinc-300">
                            <li><a href="#" className="hover:text-white hover:underline transition">Bize Ulaşın</a></li>
                            <li><a href="#" className="hover:text-white hover:underline transition">İade ve Değişim</a></li>
                        </ul>
                    </div>
                    <div className="flex flex-col space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Şirket</h4>
                        <ul className="space-y-4 text-sm font-medium text-zinc-300">
                            <li><a href="#" className="hover:text-white hover:underline transition">Hakkımızda</a></li>
                            <li><a href="#" className="hover:text-white hover:underline transition">Kariyer</a></li>
                        </ul>
                    </div>
                    <div className="flex flex-col space-y-6">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Bülten</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed">Yeni koleksiyonlardan ilk siz haberdar olun.</p>
                        <form className="flex border-b border-zinc-700 pb-2">
                            <input type="email" placeholder="E-posta" className="bg-transparent border-none outline-none text-white w-full text-sm placeholder-zinc-600" />
                            <button type="button" className="text-white hover:text-zinc-400 transition font-bold uppercase text-xs">KAYIT OL</button>
                        </form>
                    </div>
                </div>
                <div className="max-w-[1400px] mx-auto mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center text-zinc-600 text-[10px] font-bold uppercase tracking-wider">
                    <p>© 2025 STENIST. Tüm hakları saklıdır.</p>
                </div>
            </footer>
        </div>
    );
}