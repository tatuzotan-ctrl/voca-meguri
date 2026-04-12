'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  
  // 投稿一覧
  const [allPosts, setAllPosts] = useState<any[]>([]);
  
  // 投稿フォーム用
  const [inputPName, setInputPName] = useState(''); // 修正可能なP名
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [comment, setComment] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [iconUrl, setIconUrl] = useState('');
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
      setInputPName(name || ''); // 初期値として登録名をセット
    }
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, app_users ( p_name )')
      .order('created_at', { ascending: false });
    if (!error) setAllPosts(data || []);
  };

  // --- 画像アップロード処理 ---
  const uploadImage = async (file: File, bucketPath: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${bucketPath}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('images') // さっき作ったバケット名
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalThumb = thumbnailUrl;
      let finalIcon = iconUrl;

      // ファイルが選択されていればアップロード実行
      if (thumbRef.current?.files?.[0]) {
        finalThumb = await uploadImage(thumbRef.current.files[0], 'thumbnails');
      }
      if (iconRef.current?.files?.[0]) {
        finalIcon = await uploadImage(iconRef.current.files[0], 'icons');
      }

      const { error } = await supabase
        .from('promotions')
        .insert([{ 
          song_title: songTitle, 
          video_url: songUrl, 
          comment: comment,
          author_id: myId,
          thumbnail_url: finalThumb,
          icon_url: finalIcon,
          // contributor_name: inputPName // 必要に応じてカラム追加してください
        }]);

      if (error) throw error;

      alert('宣伝の投稿に成功したよ！✨');
      setSongTitle(''); setSongUrl(''); setComment('');
      setThumbnailUrl(''); setIconUrl('');
      fetchAllPosts();
      setActiveTab('list');
    } catch (error: any) {
      alert('エラー： ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('本当に削除していい？🦖')) return;
    const { error } = await supabase.from('promotions').delete().eq('id', postId);
    if (!error) fetchAllPosts();
  };

  if (!isLoggedIn) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>巡回ログ 🦖</h1>
        <button onClick={() => router.push('/login')} style={btnStyle('#0070f3', true)}>ログインして始める</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>巡回ログ 2.0 🦖</h1>

      {/* --- タブメニュー --- */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
        <button onClick={() => setActiveTab('list')} style={tabStyle(activeTab === 'list')}>投稿作品一覧</button>
        <button onClick={() => setActiveTab('mypage')} style={tabStyle(activeTab === 'mypage')}>マイページ</button>
        <button onClick={() => setActiveTab('post')} style={tabStyle(activeTab === 'post')}>作品登録</button>
      </div>

      {/* --- コンテンツ --- */}
      {activeTab === 'list' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          {allPosts.map(post => (
            <div key={post.id} style={cardStyle}>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                <img src={post.thumbnail_url || 'https://via.placeholder.com/120x70?text=No+Image'} alt="thumb" style={{ width: '120px', height: '70px', objectFit: 'cover', borderRadius: '5px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                    <img src={post.icon_url || 'https://via.placeholder.com/24'} alt="icon" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.85rem', color: '#0070f3', fontWeight: 'bold' }}>{post.app_users?.p_name}</span>
                  </div>
                  <h3 style={{ margin: '0' }}>{post.song_title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#444' }}>{post.comment}</p>
                  <a href={post.song_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>聴きにいく 🔗</a>
                </div>
                {post.author_id === myId && (
                  <button onClick={() => handleDelete(post.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'post' && (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center' }}>新曲を登録する 🚀</h2>
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <label style={labelStyle}>ボカロP名（変更可能）</label>
            <input type="text" value={inputPName} onChange={(e) => setInputPName(e.target.value)} style={inputStyle} />
            
            <label style={labelStyle}>曲のタイトル</label>
            <input type="text" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} required style={inputStyle} />
            
            <label style={labelStyle}>動画URL</label>
            <input type="url" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} required style={inputStyle} />
            
            <label style={labelStyle}>サムネイル画像を選択</label>
            <input type="file" accept="image/*" ref={thumbRef} style={inputStyle} />
            
            <label style={labelStyle}>アイコン画像を選択</label>
            <input type="file" accept="image/*" ref={iconRef} style={inputStyle} />
            
            <label style={labelStyle}>一言コメント</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...inputStyle, minHeight: '80px' }} />
            
            <button type="submit" disabled={loading} style={btnStyle('#0070f3', true)}>
              {loading ? 'アップロード中...' : 'この内容で宣伝する！'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'mypage' && (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <h2>{pName} さんの管理室</h2>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ color: 'red', border: '1px solid red', padding: '10px 20px', cursor: 'pointer', backgroundColor: 'transparent' }}>ログアウト</button>
        </div>
      )}
    </div>
  );
}

// --- スタイル定義（簡略化） ---
const tabStyle = (isActive: boolean) => ({ padding: '12px 20px', cursor: 'pointer', border: 'none', backgroundColor: 'transparent', borderBottom: isActive ? '3px solid #0070f3' : 'none', fontWeight: isActive ? 'bold' : 'normal', color: isActive ? '#0070f3' : '#666' });
const cardStyle = { border: '1px solid #eee', padding: '15px', borderRadius: '10px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' };
const labelStyle = { fontSize: '0.8rem', fontWeight: 'bold', color: '#666', marginBottom: '-10px' };
const btnStyle = (color: string, full: boolean) => ({ width: full ? '100%' : 'auto', padding: '12px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' });