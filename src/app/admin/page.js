"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = (e) => {
    e.preventDefault();
    // Basit Güvenlik (Demo İçin)
    // Gerçek projede bunlar veritabanından kontrol edilir.
    if (username === 'admin' && password === '123456') {
      // Başarılıysa Panele Yönlendir
      router.push('/admin/panel');
    } else {
      alert('Hatalı kullanıcı adı veya şifre!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter">HATRIX</h1>
          <p className="text-gray-500 text-sm font-medium mt-2">Yönetici Paneli Girişi</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Kullanıcı Adı</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Şifre</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black transition"
                placeholder="••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-black text-white py-4 rounded-lg font-bold hover:bg-gray-800 transition shadow-lg transform active:scale-95">
            Giriş Yap
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Demo Giriş: admin / 123456
        </p>

      </div>
    </div>
  );
}