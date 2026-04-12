'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: user, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('user_id', loginId) 
        .eq('passcode', password)
        .single();

      if (error || !user) {
        throw new Error('ログインIDかパスワードが違うニャ...');
      }

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
      <div style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* ログインカード */}
        <div style={formCardStyle}>
          <h1 style={titleStyle}>巡ログ：ログイン 🐱</h1>
          
          <form onSubmit={handleLogin} style={formStyle}>
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

        {/* 💡 追加：利用規約・免責事項セクション */}
        <div style={termsSectionStyle}>
          <h3 style={termsTitleStyle}>巡ログ β版 利用規約とお願い 📝</h3>
          <ul style={termsListStyle}>
            <li>本サービスは個人開発による<strong>β版テスト運用</strong>です。予告なく仕様変更やデータリセットを行う場合があります</li>
            <li>投稿された宣伝内容や画像に関する権利は各投稿者に帰属します。公序良俗に反する内容はガブッと削除します🐱</li>
            <li>本ツールの利用により生じたいかなる損害についても、開発者は責任を負いかねます</li>
            <li>収集したデータ（ログインID等）は本サービスの認証・運用目的以外には使用しません</li>
          </ul>
          <p style={footerCopyrightStyle}>© 2026 巡ログ Project / Nekogaoka Gaburi</p>
        </div>

      </div>
    </div>
  );
}

// --- スタイル定義 ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f9f9f9',
  padding: '20px',
  fontFamily: 'sans-serif',
};

const formCardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '24px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  textAlign: 'center',
  marginBottom: '25px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.6rem',
  color: '#333',
  marginBottom: '30px',
  fontWeight: 'bold',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  borderRadius: '12px',
  border: '2px solid #eee',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '16px',
  backgroundColor: '#28a745',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px',
};

const registerTextStyle: React.CSSProperties = {
  marginTop: '25px',
  fontSize: '0.9rem',
  color: '#666',
};

const registerLinkStyle: React.CSSProperties = {
  color: '#0070f3',
  fontWeight: 'bold',
  textDecoration: 'none',
  marginLeft: '5px',
};

// 規約セクションのスタイル
const termsSectionStyle: React.CSSProperties = {
  padding: '0 10px',
  color: '#888',
};

const termsTitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 'bold',
  marginBottom: '10px',
  color: '#666',
  textAlign: 'center',
};

const termsListStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  lineHeight: '1.6',
  paddingLeft: '18px',
  margin: '0 0 20px 0',
};

const footerCopyrightStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  textAlign: 'center',
  color: '#bbb',
};