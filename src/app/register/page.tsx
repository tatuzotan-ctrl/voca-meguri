'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [userId, setUserId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [pName, setPName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. パスコードをハッシュ化（ソルトを10回まわす）
      const hashedPassword = await bcrypt.hash(passcode, 10);

      // 2. Supabaseの app_users テーブルに保存
      const { error } = await supabase
        .from('app_users')
        .insert([
          { 
            user_id: userId, 
            passcode: hashedPassword, 
            p_name: pName 
          }
        ]);

      if (error) {
        if (error.code === '23505') {
          alert('そのIDは既に使われているよ！別のIDにしてね🦖');
        } else {
          throw error;
        }
      } else {
        alert('登録完了！ログインしてね✨');
        router.push('/login'); // ログイン画面へ
      }
    } catch (error: any) {
      alert('エラーが起きちゃった: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>巡ログ：新規登録 🦖</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="ログインID (例: gaburi_01)"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="合言葉 (パスコード)"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="ボカロP名 (表示用)"
          value={pName}
          onChange={(e) => setPName(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px' }}>
          {loading ? '登録中...' : 'この内容で登録する'}
        </button>
      </form>
    </div>
  );
}