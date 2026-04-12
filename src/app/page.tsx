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
  const [myChecks, setMyChecks] = useState<string[]>([]); // チェックした投稿IDリスト

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
    // ローカルストレージからチェック情報を復元
    const savedChecks = localStorage.getItem('voca_my_checks');
    if (savedChecks) {
      setMyChecks(JSON.parse(savedChecks));
    }
  }, []);

  const fetchAllPosts = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, app_users ( p_name )')
      .order('created_at', { ascending: false });
    if (!error) setAllPosts(data || []);
  };

  // チェックボタンの切り替えロジック
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
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* --- ヘッダー領域（画像を削除してスッキリ） --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#0056b3', fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>巡ログ <span style={{ fontSize: '1.2rem', fontWeight: 'normal' }}>β</span></h1>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={logoutBtnStyle}>ログアウト</button>
      </div>

      {/* --- メインタブ：全ボタンを flex:1 で均等幅に --- */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px' }}>
        <button onClick={() => setActiveTab('list')} style={navBtnStyle(activeTab === 'list')}>全員の作品</button>
        <button onClick={() => setActiveTab('mypage')} style={navBtnStyle(activeTab === 'mypage')}>マイリスト</button>
        <button onClick={() => setActiveTab('post')} style={postAddBtnStyle(activeTab === 'post')}>＋ 作品を登録</button>
      </div>

      {/* --- 全員の作品タブ --- */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {allPosts.map(post => (
            <div key={post.id} style={cardStyle}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <img src={post.thumbnail_url || 'https://via.placeholder.com/180x110'} style={thumbImgStyle} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={tagStyle}>ボカロ15秒投稿祭</span>
                    {post.author_id === myId && <button onClick={() => {if(confirm('削除する？')) supabase.from('promotions').delete().eq('id', post.id).then(fetchAllPosts)}} style={deleteStyle}>削除</button>}
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

      {/* --- マイリストタブ（修正：確実に表示されるように抽出） --- */}
      {activeTab === 'mypage' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>マイリスト 💖</h2>
          {allPosts.filter(p => myChecks.includes(p.id)).length > 0 ? (
            allPosts.filter(p => myChecks.includes(p.id)).map(post => (
              <div key={post.id} style={cardStyle}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <img src={post.thumbnail_url || 'https://via.placeholder.com/180x110'} style={thumbImgStyle} />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', margin: '5px 0' }}>{post.song_title}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <img src={post.icon_url || 'https://via.placeholder.com/24'} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>{post.app_users?.p_name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <a href={post.video_url} target="_blank" style={iconLinkStyle}>📺 視聴</a>
                      <button onClick={() => toggleCheck(post.id)} style={checkBtnStyle(true)}>
                        💖 リスト済（解除）
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>リストに登録された作品はありません。🤍をタップして追加してね！</p>
          )}
        </div>
      )}

      {/* --- 作品登録タブ --- */}
      {activeTab === 'post' && (
        <div style={{ padding: '0 10px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.2rem' }}>新曲を登録する 🚀</h2>
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} style={classicInput}>
              <option value="ボカロ15秒投稿祭 (2026.04.18 ~ 2026.04.18)">ボカロ15秒投稿祭 (2026.04.18 ~ 2026.04.18)</option>
              <option value="無色透名祭 (2026.11.20 ~ 2026.11.23)">無色透名祭 (2026.11.20 ~ 2026.11.23)</option>
              <option value="ボカコレ2026冬 (2026.02.19 ~ 2026.02.23)">ボカコレ2026冬 (2026.02.19 ~ 2026.02.23)</option>
              <option value="ボカコレ2026夏 (2026.08.20 ~ 2026.08.24)">ボカコレ2026夏 (2026.08.20 ~ 2026.08.24)</option>
              <option value="その他 (随時)">その他 (随時)</option>
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

      {/* --- フッター --- */}
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#999', fontSize: '0.85rem' }}>
        © 2026 巡ログ Project / 猫ヶ丘ガブリ
      </div>
    </div>
  );
}

// --- スタイル定義 ---
const navBtnStyle = (isActive: boolean) => ({ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: isActive ? '#0d6efd' : '#fff', color: isActive ? '#fff' : '#333', fontWeight: 'bold' as const, fontSize: '1rem' });
const postAddBtnStyle = (isActive: boolean) => ({ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #0d6efd', cursor: 'pointer', backgroundColor: '#fff', color: '#0d6efd', fontWeight: 'bold' as const, fontSize: '1rem' });
const cardStyle = { border: '1px solid #eee', padding: '25px', borderRadius: '20px', backgroundColor: '#fff', marginBottom: '20px' };
const thumbImgStyle = { width: '180px', height: '110px', objectFit: 'cover' as const, borderRadius: '12px' };
const tagStyle = { backgroundColor: '#eef4ff', color: '#0d6efd', padding: '4px 12px', borderRadius: '5px', fontSize: '0.75rem', fontWeight: 'bold' };
const iconLinkStyle = { textDecoration: 'none', color: '#0d6efd', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' };
const checkBtnStyle = (isCheck: boolean) => ({ background: 'none', border: 'none', color: isCheck ? '#e91e63' : '#666', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' });
const deleteStyle = { color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' };
const logoutBtnStyle = { padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: '0.95rem' };
const classicInput = { width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #ccc', fontSize: '1.05rem', outline: 'none' };
const fileInputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', fontSize: '0.85rem' };
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '6px', fontWeight: 'bold' as const };
const btnStyle = (color: string, full: boolean) => ({ width: full ? '100%' : 'auto', padding: '16px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '15px' });