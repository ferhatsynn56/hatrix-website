"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
// Firebase
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function KayitSayfasi() {
  const [isim, setIsim] = useState('');
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  
  const router = useRouter();

  const kayitOl = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    if (sifre.length < 6) {
        setHata("Şifreniz en az 6 karakter olmalıdır.");
        setYukleniyor(false);
        return;
    }

    try {
      // 1. Kullanıcıyı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, email, sifre);
      const user = userCredential.user;

      // 2. Kullanıcının ismini (DisplayName) profiline kaydet
      await updateProfile(user, {
        displayName: isim
      });

      // 3. Başarılı ise Ana Sayfaya yönlendir
      alert("Kayıt başarılı! Hoş geldin " + isim);
      router.push('/');

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setHata("Bu e-posta adresi zaten kullanılıyor.");
      } else {
        setHata("Kayıt olurken bir hata oluştu: " + error.message);
      }
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* Başlık */}
        <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-gray-400 hover:text-black mb-6 text-sm font-medium transition">
                <ArrowLeft size={16} className="mr-1"/> Ana Sayfaya Dön
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Aramıza Katıl</h1>
            <p className="text-gray-500">Hatrix dünyasına adım at, tarzını yansıt.</p>
        </div>

        {/* Hata Mesajı */}
        {hata && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-red-100">
                {hata}
            </div>
        )}

        {/* Form */}
        <form onSubmit={kayitOl} className="space-y-4">
          
          {/* İsim */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">AD SOYAD</label>
            <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block pl-10 p-3 outline-none transition" 
                    placeholder="Adınız Soyadınız"
                    value={isim}
                    onChange={(e) => setIsim(e.target.value)}
                />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">E-POSTA</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="email" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block pl-10 p-3 outline-none transition" 
                    placeholder="ornek@mail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">ŞİFRE</label>
            <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="password" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block pl-10 p-3 outline-none transition" 
                    placeholder="En az 6 karakter"
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={yukleniyor}
            className="w-full text-white bg-black hover:bg-gray-800 focus:ring-4 focus:ring-gray-300 font-bold rounded-xl text-sm px-5 py-4 text-center transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mt-4 flex items-center justify-center gap-2"
          >
            {yukleniyor ? 'Kayıt Yapılıyor...' : <><UserPlus size={20}/> Kayıt Ol</>}
          </button>

        </form>

        <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Zaten hesabın var mı?</span>
            <Link href="/giris" className="font-bold text-black hover:underline ml-2">
                Giriş Yap
            </Link>
        </div>

      </div>
    </div>
  );
}