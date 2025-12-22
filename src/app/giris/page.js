"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, ArrowLeft } from 'lucide-react';
// Firebase
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function GirisSayfasi() {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  
  const router = useRouter();

  const girisYap = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      await signInWithEmailAndPassword(auth, email, sifre);
      // Başarılı ise Ana Sayfaya yönlendir
      router.push('/');
    } catch (error) {
      console.error(error);
      setHata("Hatalı e-posta veya şifre girdiniz.");
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
            <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Tekrar Hoş Geldin</h1>
            <p className="text-gray-500">Hesabına giriş yap ve tasarlamaya devam et.</p>
        </div>

        {/* Hata Mesajı */}
        {hata && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-red-100">
                {hata}
            </div>
        )}

        {/* Form */}
        <form onSubmit={girisYap} className="space-y-4">
          
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">E-POSTA</label>
            <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="email" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block pl-10 p-3 outline-none transition" 
                    placeholder="mail@adresin.com"
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
                    placeholder="••••••••"
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
            {yukleniyor ? 'Giriş Yapılıyor...' : <><LogIn size={20}/> Giriş Yap</>}
          </button>

        </form>

        <div className="mt-8 text-center text-sm">
            <span className="text-gray-500">Henüz hesabın yok mu?</span>
            <Link href="/kayit" className="font-bold text-black hover:underline ml-2">
                Kayıt Ol
            </Link>
        </div>

      </div>
    </div>
  );
}