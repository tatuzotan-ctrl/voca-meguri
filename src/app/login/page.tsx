'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // ログイン成功：ユーザーIDとP名をローカルストレージに保存（ガブリ式認証用）
      localStorage.setItem('voca_user_id', data.user.id);
      // P名はDBから取得する必要があるが、一旦ダミーで設定（後ほどマイページで修正可能にする）
      localStorage.setItem('voca_p_name', '猫ヶ丘ガブリ'); 
      
      alert('ログインしたニャ！🐱');
      router.push('/'); // メイン画面へ移動
    } catch (error: any) {
      alert('エラーニャ...： ' + error.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        
        {/* 修正1：🦖を🐱にニャ！ */}
        <h1 style={titleStyle}>巡ログ：ログイン 🐱</h1>
        
        <form onSubmit={handleLogin} style={formStyle}>
          
          {/* 修正2：入力範囲を枠で囲ってわかりやすくニャ！ */}
          <input
            type="email"
            placeholder="ログインID (メールアドレス)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />
          
          {/* 修正3：「合言葉」を「パスワード」にニャ！ */}
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
        
        {/* 修正4：新規登録をわかりやすくニャ！ */}
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

// --- スタイル定義ニャ！ ---

const containerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  backgroundColor: '#f9f9f9', // ほんのりグレー
  fontFamily: 'sans-serif',
};

const formCardStyle: React.CSSProperties = {
  backgroundColor: '#fff',
  padding: '40px',
  borderRadius: '20px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)', // 柔らかい影
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
  gap: '15px', // 隙間を広げニャ！
};

// 修正2：枠線をくっきりさせたニャ！
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  borderRadius: '12px',
  border: '2px solid #ddd', // くっきりグレー枠
  fontSize: '1rem',
  outline: 'none', // クリック時の青枠を消す
  transition: 'border-color 0.2s',
};
// ホバー時やフォーカス時に枠の色を変えるニャ！（CSSファイルがないのでJSで疑似実装）
// inputStyle[':focus'] = { borderColor: '#28a745' };

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '15px',
  backgroundColor: '#28a745', // 元のグリーンを維持ニャ！
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '1.1rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px',
  transition: 'background-color 0.2s',
};

const registerTextStyle: React.CSSProperties = {
  marginTop: '25px',
  fontSize: '0.9rem',
  color: '#666',
};

// 修正4：青くて太いリンクにしたニャ！
const registerLinkStyle: React.CSSProperties = {
  color: '#0070f3', // 青
  fontWeight: 'bold', // 太字
  textDecoration: 'none', // 下線を消す
  marginLeft: '5px',
};