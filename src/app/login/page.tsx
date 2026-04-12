'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  // ステート名を loginId に変更ニャ！
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. app_usersテーブルから login_id と password が一致するユーザーを探すニャ
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('login_id', loginId)
        .eq('password', password) // 本来はハッシュ化すべきですが、現状の仕様に合わせます
        .single();

      if (error || !user) {
        throw new Error('ログインIDかパスワードが違うニャ...');
      }

      // 2. ログイン成功：情報をローカルストレージに保存
      localStorage.setItem('voca_user_id', user.id);
      localStorage.setItem('voca_p_name', user.p_name);
      
      alert('ログイン成功ニャ！🐱');
      router.push('/');
    } catch (error: any) {
      alert('エラーニャ： ' + error.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <h1 style={titleStyle}>巡ログ：ログイン 🐱</h1>
        
        <form onSubmit={handleLogin} style={formStyle}>
          {/* type を text に、value を loginId に修正したニャ！ */}
          <input
            type="text"
            placeholder="ログインID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            style={inputStyle}
          />
          
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={inputStyle}
          />
          
          <button type="submit" style={buttonStyle}>
            ログイン
          </button>
        </form>
        
        <p style={registerTextStyle}>
          まだ登録してない？ 
          <Link href="/register" style={registerLinkStyle}>
            新規登録はこちらニャ！
          </Link>
        </p>
      </div>
    </div>
  );
}

// --- 以下、スタイル定義は前回と同じニャ！ ---
const containerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9f9f9', fontFamily: 'sans-serif' };
const formCardStyle: React.CSSProperties = { backgroundColor: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '400px', textAlign: 'center' };
const titleStyle: React.CSSProperties = { fontSize: '1.5rem', color: '#333', marginBottom: '30px', fontWeight: 'bold' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #ddd', fontSize: '1rem', outline: 'none' };
const buttonStyle: React.CSSProperties = { width: '100%', padding: '15px', backgroundColor: '#28a745', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const registerTextStyle: React.CSSProperties = { marginTop: '25px', fontSize: '0.9rem', color: '#666' };
const registerLinkStyle: React.CSSProperties = { color: '#0070f3', fontWeight: 'bold', textDecoration: 'none', marginLeft: '5px' };