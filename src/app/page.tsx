'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [myChecks, setMyChecks] = useState<string[]>([]); // チェックした投稿IDを保存

  // フォーム用
  const [inputPName, setInputPName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const thumbRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userId = localStorage.getItem('voca_user_id');
    const name = localStorage.getItem('voca_p_name');
    if (userId) {
      setIsLoggedIn(true);
      setMyId(userId);
      setPName(name || 'ボカロP');
      setInputPName(name || '');
    }
    fetchAllPosts();
    // ローカルストレージからチェック情報を復元
    const savedChecks = localStorage.getItem('voca_my_checks');
    if (savedChecks) setMyChecks(JSON.parse(savedChecks));
  }, []);

  const fetchAllPosts = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, app_users ( p_name )')
      .order('created_at', { ascending: false });
    if (!error) setAllPosts(data || []);
  };

  // チェックボタンの切り替え
  const toggleCheck = (postId: string) => {
    let newChecks;
    if (myChecks.includes(postId)) {
      newChecks = myChecks.filter(id => id !== postId);
    } else {
      newChecks = [...myChecks, postId];
    }
    setMyChecks(newChecks);
    localStorage.setItem('voca_my_checks', JSON.stringify(newChecks));
  };

  const uploadImage = async (file: File, bucketPath: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${bucketPath}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalThumb = '';
      let finalIcon = '';
      if (thumbRef.current?.files?.[0]) finalThumb = await uploadImage(thumbRef.current.files[0], 'thumbnails');
      if (iconRef.current?.files?.[0]) finalIcon = await uploadImage(iconRef.current.files[0], 'icons');

      const { error } = await supabase.from('promotions').insert([{ 
        song_title: songTitle, 
        video_url: songUrl, // ここを video_url に修正済み
        comment: comment,
        author_id: myId,
        thumbnail_url: finalThumb,
        icon_url: finalIcon,
        // contributor_name: inputPName 
      }]);

      if (error) throw error;
      alert('宣伝完了！✨');
      setSongTitle(''); setSongUrl(''); setComment('');
      fetchAllPosts();
      setActiveTab('list');
    } catch (error: any) {
      alert('エラー： ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('削除するよ？🦖')) return;
    await supabase.from('promotions').delete().eq('id', postId);
    fetchAllPosts();
  };

  if (!isLoggedIn) return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h1>巡回ログ 🦖</h1>
      <button onClick={() => router.push('/login')} style={btnStyle('#0070f3', true)}>ログイン</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', fontSize: '1.5rem' }}>巡回ログ 2.0 🦖</h1>

      {/* --- タブ --- */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button onClick={() => setActiveTab('list')} style={tabStyle(activeTab === 'list')}>投稿作品一覧</button>
        <button onClick={() => setActiveTab('mypage')} style={tabStyle(activeTab === 'mypage')}>マイページ</button>
        <button onClick={() => setActiveTab('post')} style={tabStyle(activeTab === 'post')}>作品登録</button>
      </div>

      {/* --- 一覧表示 --- */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gap: '15px' }}>
          {allPosts.map(post => (
            <div key={post.id} style={cardStyle}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <img 
                  src={post.thumbnail_url || 'https://via.placeholder.com/150x90?text=No+Image'} 
                  style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '8px' }} 
                  alt="thumb" 
                />
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                    <img src={post.icon_url || 'https://via.placeholder.com/24'} style={{ width: '20px', height: '20px', borderRadius: '50%' }} alt="icon" />
                    <span style={{ fontSize: '0.8rem', color: '#0070f3', fontWeight: 'bold' }}>{post.app_users?.p_name || '不明なP'}</span>
                  </div>
                  <h3 style={{ margin: '0', fontSize: '1rem' }}>{post.song_title}</h3>
                  <p style={{ fontSize: '0.85rem', color: '#555', margin: '3px 0' }}>{post.comment}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                    {/* 修正ポイント：hrefを video_url に */}
                    <a href={post.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: '#333', fontWeight: 'bold', textDecoration: 'none' }}>
                      聴きにいく 🔗
                    </a>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {/* マイページ登録チェックボタン */}
                      <button 
                        onClick={() => toggleCheck(post.id)}
                        style={{ 
                          background: 'none', border: '1px solid #ccc', borderRadius: '5px', padding: '3px 8px', cursor: 'pointer',
                          backgroundColor: myChecks.includes(post.id) ? '#ffd700' : 'transparent',
                          fontSize: '0.8rem'
                        }}
                      >
                        {myChecks.includes(post.id) ? '✅ チェック済み' : '📌 マイページ登録'}
                      </button>

                      {post.author_id === myId && (
                        <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🗑️</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- 作品登録 --- */}
      {activeTab === 'post' && (
        <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={labelStyle}>ボカロP名</label>
          <input type="text" value={inputPName} onChange={(e) => setInputPName(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="曲のタイトル" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} required style={inputStyle} />
          <input type="url" placeholder="動画URL (YouTube/niconico)" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} required style={inputStyle} />
          <label style={labelStyle}>サムネイル</label>
          <input type="file" ref={thumbRef} style={inputStyle} />
          <label style={labelStyle}>アイコン</label>
          <input type="file" ref={iconRef} style={inputStyle} />
          <textarea placeholder="一言コメント" value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...inputStyle, minHeight: '80px' }} />
          <button type="submit" disabled={loading} style={btnStyle('#0070f3', true)}>
            {loading ? '送信中...' : 'この内容で宣伝する！'}
          </button>
        </form>
      )}

      {/* --- マイページ（簡易版：チェックした曲だけ表示） --- */}
      {activeTab === 'mypage' && (
        <div>
          <h2>チェックした作品一覧 📌</h2>
          {allPosts.filter(p => myChecks.includes(p.id)).length > 0 ? (
            allPosts.filter(p => myChecks.includes(p.id)).map(post => (
              <div key={post.id} style={{ ...cardStyle, marginBottom: '10px' }}>
                <strong>{post.song_title}</strong>
                <p><a href={post.video_url} target="_blank">聴きにいく</a></p>
              </div>
            ))
          ) : <p>まだチェックした作品はありません。</p>}
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ marginTop: '30px', color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>ログアウト</button>
        </div>
      )}
    </div>
  );
}

// スタイル
const tabStyle = (isActive: boolean) => ({ padding: '10px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', borderBottom: isActive ? '3px solid #0070f3' : 'none', color: isActive ? '#0070f3' : '#666', fontWeight: isActive ? 'bold' : 'normal' });
const cardStyle = { padding: '15px', border: '1px solid #f0f0f0', borderRadius: '12px', backgroundColor: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' };
const labelStyle = { fontSize: '0.8rem', color: '#666', marginBottom: '-8px' };
const btnStyle = (color: string, full: boolean) => ({ width: full ? '100%' : 'auto', padding: '12px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' });