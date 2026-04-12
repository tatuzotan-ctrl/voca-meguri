'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [myIcon, setMyIcon] = useState('');
  
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [myChecks, setMyChecks] = useState<string[]>([]);

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

  const toggleCheck = (postId: string) => {
    let newChecks = myChecks.includes(postId) ? myChecks.filter(id => id !== postId) : [...myChecks, postId];
    setMyChecks(newChecks);
    localStorage.setItem('voca_my_checks', JSON.stringify(newChecks));
  };

  const uploadImage = async (file: File, bucketPath: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${bucketPath}/${fileName}`;
    await supabase.storage.from('images').upload(filePath, file);
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
        song_title: songTitle, video_url: songUrl, comment: comment,
        author_id: myId, thumbnail_url: finalThumb, icon_url: finalIcon,
      }]);
      if (error) throw error;
      alert('宣伝完了！✨');
      setSongTitle(''); setSongUrl(''); setComment('');
      fetchAllPosts(); setActiveTab('list');
    } catch (error: any) { alert(error.message); } finally { setLoading(false); }
  };

  if (!isLoggedIn) return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <button onClick={() => router.push('/login')} style={btnStyle('#0070f3', true)}>ログイン</button>
    </div>
  );

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', minHeight: '100vh' }}>
      
      {/* --- ヘッダー領域 --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#0056b3', fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>巡ログ <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>β</span></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={myIcon || 'https://via.placeholder.com/40'} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #ddd' }} />
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={logoutBtnStyle}>ログアウト</button>
        </div>
      </div>

      {/* --- メインナビゲーション（丸角ボタン型） --- */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
        <button onClick={() => setActiveTab('list')} style={navBtnStyle(activeTab === 'list')}>全員の作品</button>
        <button onClick={() => setActiveTab('mypage')} style={navBtnStyle(activeTab === 'mypage')}>マイリスト</button>
        <button onClick={() => setActiveTab('post')} style={postAddBtnStyle(activeTab === 'post')}>＋ 作品を登録</button>
      </div>

      {/* --- コンテンツエリア --- */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {allPosts.map(post => (
            <div key={post.id} style={cardStyle}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <img src={post.thumbnail_url || 'https://via.placeholder.com/180x100'} style={thumbImgStyle} />
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={tagStyle}>ボカロ15秒投稿祭</span>
                    {post.author_id === myId && <button onClick={() => handleDelete(post.id)} style={deleteStyle}>削除</button>}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', margin: '5px 0' }}>{post.song_title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <img src={post.icon_url || 'https://via.placeholder.com/24'} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>{post.app_users?.p_name}</span>
                  </div>
                  <p style={{ fontSize: '0.95rem', color: '#444', marginBottom: '15px' }}>{post.comment}</p>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <a href={post.video_url} target="_blank" style={iconLinkStyle}>📺 視聴</a>
                    <button onClick={() => toggleCheck(post.id)} style={checkBtnStyle(myChecks.includes(post.id))}>
                      {myChecks.includes(post.id) ? '💖 リスト済' : '🤍 リストに追加'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- 作品登録フォーム（昨日のイメージに合わせた余白と色） --- */}
      {activeTab === 'post' && (
        <div style={{ padding: '20px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>新曲を登録する 🚀</h2>
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="text" placeholder="曲のタイトル" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} required style={classicInput} />
            <input type="url" placeholder="動画URL (YouTube/niconico)" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} required style={classicInput} />
            <textarea placeholder="一言コメント" value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...classicInput, minHeight: '120px' }} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>サムネイル画像</label>
                <input type="file" ref={thumbRef} style={classicInput} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>アイコン画像</label>
                <input type="file" ref={iconRef} style={classicInput} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={btnStyle('#0d6efd', true)}>
              {loading ? '送信中...' : 'この内容で宣伝する！'}
            </button>
          </form>
        </div>
      )}

      {/* --- フッター --- */}
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#999', fontSize: '0.8rem' }}>
        © 2026 巡ログ Project / {pName}
      </div>
    </div>
  );
}

// --- スタイル定義（昨日のイメージを再現） ---
const navBtnStyle = (isActive: boolean) => ({
  flex: 1, padding: '15px', borderRadius: '12px', border: '1px solid #ddd', cursor: 'pointer',
  backgroundColor: isActive ? '#0d6efd' : '#fff', color: isActive ? '#fff' : '#333',
  fontWeight: 'bold', fontSize: '1rem', transition: '0.2s'
});

const postAddBtnStyle = (isActive: boolean) => ({
  flex: 1, padding: '15px', borderRadius: '12px', border: isActive ? '2px solid #0d6efd' : '1px solid #0d6efd',
  cursor: 'pointer', backgroundColor: '#fff', color: '#0d6efd', fontWeight: 'bold', fontSize: '1rem'
});

const cardStyle = {
  border: '1px solid #eee', padding: '25px', borderRadius: '20px', backgroundColor: '#fff',
  boxShadow: '0 10px 20px rgba(0,0,0,0.02)'
};

const thumbImgStyle = { width: '180px', height: '110px', objectFit: 'cover' as const, borderRadius: '12px' };
const tagStyle = { backgroundColor: '#eef4ff', color: '#0d6efd', padding: '4px 12px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 'bold' };
const iconLinkStyle = { textDecoration: 'none', color: '#0d6efd', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' };
const checkBtnStyle = (isCheck: boolean) => ({
  background: 'none', border: 'none', color: isCheck ? '#e91e63' : '#666', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'
});
const deleteStyle = { color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' };
const logoutBtnStyle = { padding: '5px 15px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', cursor: 'pointer' };
const classicInput = { width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #ccc', fontSize: '1rem' };
const labelStyle = { display: 'block', fontSize: '0.8rem', color: '#666', marginBottom: '5px' };
const btnStyle = (color: string, full: boolean) => ({ width: full ? '100%' : 'auto', padding: '15px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' });