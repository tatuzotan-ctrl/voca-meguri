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
  const [myChecks, setMyChecks] = useState<string[]>([]);

  // フォーム用ステート
  const [selectedTag, setSelectedTag] = useState('ボカロ15秒投稿祭 (2026.04.18 ~ 2026.04.18)'); 
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

  if (!isLoggedIn) return null;

  // 投稿カードの共通コンポーネント（幅を統一するため）
  const PostCard = ({ post }: { post: any }) => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', gap: '25px', alignItems: 'flex-start' }}>
        {/* サムネイル画像（サイズを180x110に固定） */}
        <div style={{ flexShrink: 0 }}>
          <img 
            src={post.thumbnail_url || 'https://via.placeholder.com/180x110?text=No+Image'} 
            style={thumbImgStyle} 
            alt="thumb" 
          />
        </div>
        
        {/* テキストコンテンツエリア */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={tagStyle}>ボカロ15秒投稿祭</span>
            {post.author_id === myId && (
              <button 
                onClick={() => { if(confirm('削除する？')) supabase.from('promotions').delete().eq('id', post.id).then(fetchAllPosts); }} 
                style={deleteStyle}
              >
                削除
              </button>
            )}
          </div>
          
          <h3 style={titleStyle}>{post.song_title}</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <img 
              src={post.icon_url || 'https://via.placeholder.com/24'} 
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
              alt="icon" 
            />
            <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>{post.app_users?.p_name}</span>
          </div>
          
          <p style={commentStyle}>{post.comment}</p>
          
          <div style={{ display: 'flex', gap: '25px', alignItems: 'center', marginTop: '15px' }}>
            <a href={post.video_url} target="_blank" rel="noopener noreferrer" style={iconLinkStyle}>
              📺 視聴
            </a>
            <button onClick={() => toggleCheck(post.id)} style={checkBtnStyle(myChecks.includes(post.id))}>
              {myChecks.includes(post.id) ? '💖 リスト済' : '🤍 リストに追加'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- ヘッダー領域 --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#0056b3', fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>
          巡ログ <span style={{ fontSize: '1.2rem', fontWeight: 'normal' }}>β</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', lineHeight: '1.3' }}>
            <div style={{ fontSize: '0.7rem', color: '#aaa', fontWeight: 'bold' }}>ID: {myId?.substring(0, 8)}</div>
            <div style={{ fontSize: '0.95rem', color: '#333', fontWeight: 'bold' }}>{pName} さん</div>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={logoutBtnStyle}>ログアウト</button>
        </div>
      </div>

      {/* --- メインタブ --- */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <button onClick={() => setActiveTab('list')} style={navBtnStyle(activeTab === 'list')}>全員の作品</button>
        <button onClick={() => setActiveTab('mypage')} style={navBtnStyle(activeTab === 'mypage')}>マイリスト</button>
        <button onClick={() => setActiveTab('post')} style={postAddBtnStyle(activeTab === 'post')}>＋ 作品を登録</button>
      </div>

      {/* --- 全員の作品タブ --- */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {allPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {/* --- マイリストタブ --- */}
      {activeTab === 'mypage' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#333' }}>マイリスト 💖</h2>
          {allPosts.filter(p => myChecks.includes(p.id)).length > 0 ? (
            allPosts.filter(p => myChecks.includes(p.id)).map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>リストに登録された作品はありません。</p>
          )}
        </div>
      )}

      {/* --- 作品登録タブ --- */}
      {activeTab === 'post' && (
        <div style={{ width: '100%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.2rem', color: '#333' }}>新曲を登録する 🚀</h2>
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} style={classicInput}>
              <option value="ボカロ15秒投稿祭 (2026.04.18 ~ 2026.04.18)">ボカロ15秒投稿祭 (2026.04.18 ~ 2026.04.18)</option>
              <option value="無色透名祭 (2026.11.20 ~ 2026.11.23)">無色透名祭 (2026.11.20 ~ 2026.11.23)</option>
              <option value="その他">その他 (随時)</option>
            </select>
            <input type="text" placeholder="曲のタイトル" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} required style={classicInput} />
            <input type="text" placeholder="ボカロP名" value={inputPName} onChange={(e) => setInputPName(e.target.value)} style={classicInput} />
            <input type="url" placeholder="動画URL (YouTube/niconico)" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} required style={classicInput} />
            <textarea placeholder="一言コメント" value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...classicInput, minHeight: '120px' }} />
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>サムネイル画像</label><input type="file" accept="image/*" ref={thumbRef} style={fileInputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>アイコン画像</label><input type="file" accept="image/*" ref={iconRef} style={fileInputStyle} /></div>
            </div>
            <button type="submit" disabled={loading} style={btnStyle('#0d6efd', true)}>{loading ? '送信中...' : 'この内容で宣伝する！'}</button>
          </form>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '60px', color: '#bbb', fontSize: '0.8rem' }}>
        © 2026 巡ログ Project / {pName}
      </div>
    </div>
  );
}

// --- スタイル定義（幅を 100% = 700px に統一） ---
const navBtnStyle = (isActive: boolean) => ({ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: isActive ? '#0d6efd' : '#fff', color: isActive ? '#fff' : '#333', fontWeight: 'bold' as const });
const postAddBtnStyle = (isActive: boolean) => ({ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #0d6efd', cursor: 'pointer', backgroundColor: '#fff', color: '#0d6efd', fontWeight: 'bold' as const });

const cardStyle = { 
  width: '100%', // 入力ボックスと同じ幅に
  border: '1px solid #eee', 
  padding: '25px', 
  borderRadius: '20px', 
  backgroundColor: '#fff', 
  marginBottom: '20px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.03)' 
};

const thumbImgStyle = { width: '180px', height: '110px', objectFit: 'cover' as const, borderRadius: '12px', backgroundColor: '#f9f9f9' };
const titleStyle = { fontSize: '1.25rem', margin: '5px 0', color: '#333', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const };
const commentStyle = { fontSize: '0.95rem', color: '#555', lineHeight: '1.5', margin: '0', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' };
const tagStyle = { backgroundColor: '#eef4ff', color: '#0d6efd', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' };
const iconLinkStyle = { textDecoration: 'none', color: '#333', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' };
const checkBtnStyle = (isCheck: boolean) => ({ background: 'none', border: 'none', color: isCheck ? '#e91e63' : '#999', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' });
const deleteStyle = { color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' };
const logoutBtnStyle = { padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: '0.9rem' };
const classicInput = { width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #ccc', fontSize: '1rem', outline: 'none' };
const fileInputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', fontSize: '0.85rem' };
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '6px', fontWeight: 'bold' as const };
const btnStyle = (color: string, full: boolean) => ({ width: full ? '100%' : 'auto', padding: '16px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px' });