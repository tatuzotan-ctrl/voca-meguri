'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pName, setPName] = useState('');
  const router = useRouter();

  useEffect(() => {
    // ブラウザの保存領域からログイン情報をチェック
    const authorId = localStorage.getItem('voca_user_id');
    const name = localStorage.getItem('voca_p_name');
    
    if (authorId) {
      setIsLoggedIn(true);
      setPName(name || 'ボカロP');
    }
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f8f9fa',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>巡回ログ 🦖</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>ボカロPのための、安心・安全な宣伝管理ツール</p>

      {!isLoggedIn ? (
        /* --- 未ログイン時の表示 --- */
        <div style={{ textAlign: 'center' }}>
          <button 
            onClick={() => router.push('/login')}
            style={{ 
              padding: '15px 40px', 
              fontSize: '1.1rem', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '30px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
            }}
          >
            ログインして始める
          </button>
          <p style={{ marginTop: '20px' }}>
            はじめての方は <a href="/register" style={{ color: '#0070f3' }}>新規登録</a>
          </p>
        </div>
      ) : (
        /* --- ログイン済みの表示（コントロールパネル） --- */
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <p style={{ textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' }}>
            おかえりなさい、{pName} さん！
          </p>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            <button 
              onClick={() => router.push('/list')} // ※後で投稿一覧画面を作ります
              style={menuButtonStyle('#28a745')}
            >
              🎵 みんなの投稿を見る
            </button>

            <button 
              onClick={() => router.push('/post')}
              style={menuButtonStyle('#0070f3')}
            >
              🚀 新曲を宣伝する
            </button>

            <button 
              onClick={() => router.push('/mypage')}
              style={menuButtonStyle('#6c757d')}
            >
              🏠 マイページ（自分の管理）
            </button>
          </div>

          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ 
              marginTop: '40px', 
              width: '100%',
              background: 'none', 
              border: 'none', 
              color: '#dc3545', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}

// 共通のボタン用スタイル
function menuButtonStyle(color: string) {
  return {
    padding: '18px',
    fontSize: '1.1rem',
    backgroundColor: color,
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'transform 0.2s',
    textAlign: 'left' as const,
  };
}