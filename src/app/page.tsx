'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'mypage', 'post'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const router = useRouter();

  // 1. ログインチェック & データ取得
  useEffect(() => {
    const userId = localStorage.getItem('voca_user_id');
    if (userId) {
      setIsLoggedIn(true);
      setMyId(userId);
    }
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select(`
        *,
        app_users ( p_name )
      `) // 投稿者名も一緒に取得
      .order('created_at', { ascending: false });
    
    if (!error) setAllPosts(data || []);
  };

  // 2. 削除機能
  const handleDelete = async (postId: string) => {
    if (!confirm('本当に削除していい？🦖')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', postId);
    if (!error) fetchAllPosts();
  };

  // 未ログイン時のガード（ログイン画面へ誘導）
  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1>巡回ログ 🦖</h1>
        <button onClick={() => router.push('/login')} style={btnStyle('#0070f3')}>ログインして始める</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* --- 上部タブメニュー --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('list')} style={tabStyle(activeTab === 'list')}>投稿作品一覧</button>
        <button onClick={() => setActiveTab('mypage')} style={tabStyle(activeTab === 'mypage')}>マイページ</button>
        <button onClick={() => setActiveTab('post')} style={tabStyle(activeTab === 'post')}>作品登録</button>
      </div>

      {/* --- コンテンツ表示エリア --- */}
      {activeTab === 'list' && (
        <div>
          <h2>みんなの投稿 🎵</h2>
          <div style={{ display: 'grid', gap: '20px' }}>
            {allPosts.map(post => (
              <div key={post.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {/* サムネ代わりのBOX */}
                  <div style={{ width: '100px', height: '60px', backgroundColor: '#eee', borderRadius: '5px' }}>🎬</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0' }}>{post.song_title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#666' }}>P名: {post.app_users?.p_name}</p>
                    <p>{post.comment}</p>
                    <a href={post.song_url} target="_blank">聴きにいく 🔗</a>
                  </div>
                  {/* 自分の投稿なら削除ボタンを出す */}
                  {post.author_id === myId && (
                    <button onClick={() => handleDelete(post.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️削除</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'mypage' && (
        <div>
          <h2>自分の管理 🏠</h2>
          <p>（ここにマイページ専用の統計や設定を置く予定）</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ color: 'red' }}>ログアウト</button>
        </div>
      )}

      {activeTab === 'post' && (
        <div>
          <h2>新曲を登録する 🚀</h2>
          <p>※以前作った post 画面のフォームをここに移植すればOK！</p>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 ---
const tabStyle = (isActive: boolean) => ({
  padding: '10px 20px',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
  borderBottom: isActive ? '3px solid #0070f3' : 'none',
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#0070f3' : '#666'
});

const cardStyle = {
  border: '1px solid #ddd',
  padding: '15px',
  borderRadius: '10px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
};

const btnStyle = (color: string) => ({
  padding: '10px 20px',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
});