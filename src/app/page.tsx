'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'mypage', 'post'
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  
  // 投稿一覧用
  const [allPosts, setAllPosts] = useState<any[]>([]);
  
  // 投稿フォーム用
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  // 1. ログインチェック & データ取得
  useEffect(() => {
    const userId = localStorage.getItem('voca_user_id');
    const name = localStorage.getItem('voca_p_name');
    if (userId) {
      setIsLoggedIn(true);
      setMyId(userId);
      setPName(name || 'ボカロP');
    }
    fetchAllPosts();
  }, []);

  // 全投稿取得
  const fetchAllPosts = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, app_users ( p_name )')
      .order('created_at', { ascending: false });
    
    if (!error) setAllPosts(data || []);
  };

  // 2. 新規投稿処理
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('promotions')
        .insert([{ 
          song_title: songTitle, 
          song_url: songUrl, 
          comment: comment,
          author_id: myId 
        }]);

      if (error) throw error;

      alert('宣伝の投稿に成功したよ！✨');
      // フォームを空にして一覧に戻る
      setSongTitle('');
      setSongUrl('');
      setComment('');
      fetchAllPosts();
      setActiveTab('list');

    } catch (error: any) {
      alert('エラーが発生したよ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. 削除処理
  const handleDelete = async (postId: string) => {
    if (!confirm('本当にこの宣伝を削除していい？🦖')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', postId);
    if (!error) fetchAllPosts();
    else alert('削除に失敗したよ... 🦖');
  };

  // 未ログイン時の表示
  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>巡回ログ 🦖</h1>
        <p>ボカロP専用・安心宣伝ツール</p>
        <button onClick={() => router.push('/login')} style={btnStyle('#0070f3', true)}>ログインして始める</button>
        <p><a href="/register" style={{ color: '#0070f3' }}>新規登録はこちら</a></p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>巡回ログ 🦖</h1>

      {/* --- 上部タブメニュー --- */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
        <button onClick={() => setActiveTab('list')} style={tabStyle(activeTab === 'list')}>投稿作品一覧</button>
        <button onClick={() => setActiveTab('mypage')} style={tabStyle(activeTab === 'mypage')}>マイページ</button>
        <button onClick={() => setActiveTab('post')} style={tabStyle(activeTab === 'post')}>作品登録</button>
      </div>

      {/* --- コンテンツ表示エリア --- */}
      {activeTab === 'list' && (
        <div>
          <div style={{ display: 'grid', gap: '20px' }}>
            {allPosts.length > 0 ? allPosts.map(post => (
              <div key={post.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                  {/* サムネイル（仮） */}
                  <div style={{ width: '120px', height: '70px', backgroundColor: '#333', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '5px', fontSize: '1.5rem' }}>🎬</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{post.song_title}</h3>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#0070f3', fontWeight: 'bold' }}>👤 {post.app_users?.p_name || '不明なP'}</p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#444' }}>{post.comment}</p>
                    <a href={post.song_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>曲を聴きにいく 🔗</a>
                  </div>
                  {/* 削除ボタン（自分の投稿のみ） */}
                  {post.author_id === myId && (
                    <button onClick={() => handleDelete(post.id)} style={{ backgroundColor: 'transparent', border: '1px solid red', color: 'red', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>削除</button>
                  )}
                </div>
              </div>
            )) : <p>現在、投稿はありません。</p>}
          </div>
        </div>
      )}

      {activeTab === 'mypage' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <h2>{pName} さんのマイページ 🏠</h2>
          <p>ここでは自分の情報の確認や設定が行えます（開発中）</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ ...btnStyle('red', false), marginTop: '20px' }}>ログアウト</button>
        </div>
      )}

      {activeTab === 'post' && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center' }}>新曲を登録する 🚀</h2>
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="text" placeholder="曲のタイトル" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} required style={inputStyle} />
            <input type="url" placeholder="動画URL (YouTube/niconico)" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} required style={inputStyle} />
            <textarea placeholder="一言コメント" value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...inputStyle, minHeight: '100px' }} />
            <button type="submit" disabled={loading} style={btnStyle('#0070f3', true)}>{loading ? '送信中...' : 'この内容で宣伝する！'}</button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義 ---
const tabStyle = (isActive: boolean) => ({
  padding: '15px 25px',
  cursor: 'pointer',
  border: 'none',
  backgroundColor: 'transparent',
  borderBottom: isActive ? '4px solid #0070f3' : 'none',
  fontWeight: isActive ? 'bold' : 'normal',
  color: isActive ? '#0070f3' : '#666',
  fontSize: '1rem'
});

const cardStyle = {
  border: '1px solid #eee',
  padding: '20px',
  borderRadius: '12px',
  backgroundColor: '#fff',
  boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  fontSize: '1rem'
};

const btnStyle = (color: string, fullWidth: boolean) => ({
  width: fullWidth ? '100%' : 'auto',
  padding: '12px 24px',
  backgroundColor: color,
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem'
});