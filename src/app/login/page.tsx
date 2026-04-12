'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [userId, setUserId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. DBから入力されたIDのユーザーを探す
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !user) {
        alert('IDか合言葉が違うみたいだよ🦖');
        return;
      }

      // 2. パスコードが一致するかチェック
      const isMatch = await bcrypt.compare(passcode, user.passcode);

      if (isMatch) {
        // 3. ログイン成功！ブラウザに「ログイン中のID」を保存
        // ※ 本来はCookieがいいですが、まずは一番簡単なLocalStorageで運用しましょう
        localStorage.setItem('voca_user_id', user.id);
        localStorage.setItem('voca_p_name', user.p_name);
        
        alert(`おかえり、${user.p_name}さん！✨`);
        router.push('/mypage'); // マイページへGO
      } else {
        alert('IDか合言葉が違うみたいだよ🦖');
      }
    } catch (error: any) {
      alert('エラーが起きちゃった: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h2>巡ログ：ログイン 🦖</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="text"
          placeholder="ログインID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="合言葉"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
          {loading ? 'チェック中...' : 'ログイン'}
        </button>
      </form>
      <p style={{ marginTop: '15px', fontSize: '0.9rem' }}>
        まだ登録してない？ <a href="/register">新規登録はこちら</a>
      </p>
    </div>
  );
}