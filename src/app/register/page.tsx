'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [pName, setPName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. app_users テーブルに新規ユーザーを登録ニャ！
      const { data, error } = await supabase
        .from('app_users')
        .insert([{ 
          login_id: loginId, 
          password: password, 
          p_name: pName 
        }])
        .select();

      if (error) throw error;

      alert('登録完了ニャ！さっそくログインしてみるニャ🐱');
      router.push('/login'); // ログイン画面へ誘導
    } catch (error: any) {
      alert('エラーニャ...： ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        
        {/* デザイン統一：猫印のタイトルニャ！ */}
        <h1 style={titleStyle}>巡ログ：新規登録 🐱</h1>
        
        <form onSubmit={handleRegister} style={formStyle}>
          
          {/* デザイン統一：くっきり枠線の入力欄ニャ！ */}
          <div style={{ textAlign: 'left' }}>
            <label style={labelStyle}>ログインID</label>
            <input
              type="text"
              placeholder="例: gaburi_cat"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={labelStyle}>パスワード</label>
            <input
              type="password"
              placeholder="合言葉を決めてニャ"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={labelStyle}>ボカロP名 (表示用)</label>
            <input
              type="text"
              placeholder="例: 猫ヶ丘ガブリ"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? '登録中ニャ...' : 'この内容で登録するニャ！'}
          </button>
        </form>
        
        {/* ログイン画面への誘導もわかりやすくニャ！ */}
        <p style={loginTextStyle}>
          もう登録してる？ 
          <Link href="/login" style={loginLinkStyle}>
            ログインはこちらニャ！
          </Link>
        </p>

      </div>
    </div>
  );
}

// --- ログイン画面と完全統一のスタイル定義ニャ！ ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f9f9f9',
  fontFamily: 'sans-serif',
};

const formCardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '20px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
  width: '100%',
  maxWidth: '400px',
  textAlign: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  color: '#333',
  marginBottom: '30px',
  fontWeight: 'bold',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: '#666',
  marginBottom: '5px',
  display: 'block',
  fontWeight: 'bold',
  marginLeft: '5px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  borderRadius: '12px',
  border: '2px solid #ddd', // デザイン統一：くっきり枠線
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  backgroundColor: '#0070f3', // 登録は「青」でログインと差別化するニャ！
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px',
};

const loginTextStyle: React.CSSProperties = {
  marginTop: '25px',
  fontSize: '0.9rem',
  color: '#666',
};

const loginLinkStyle: React.CSSProperties = {
  color: '#0070f3',
  fontWeight: 'bold',
  textDecoration: 'none',
  marginLeft: '5px',
};