'use client';

// 【BLOCK 1: インポートと基本設定】
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
  const [visitedIds, setVisitedIds] = useState<string[]>([]);

  const [eventList, setEventList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(''); 
  const [isEventLoading, setIsEventLoading] = useState(true);
  
  const [inputPName, setInputPName] = useState(''); // 💡 ボカロP名（app_users.p_name用）
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [repostUrl, setRepostUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const thumbRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const DEFAULT_THUMB = '/images/listen-me.png'; 
  const DEFAULT_ICON = '/images/default-cat-p.png';

  // 【BLOCK 2: 初期化処理 (useEffect)】
  useEffect(() => {
    const init = async () => {
      const uId = localStorage.getItem('voca_user_id');
      const name = localStorage.getItem('voca_p_name');
      
      if (!uId) {
        router.push('/login');
        return;
      }

      setIsLoggedIn(true);
      setMyId(uId);
      setPName(name || 'ボカロP');
      setInputPName(name || ''); // 💡 初期値としてP名をセット

      await Promise.all([
        fetchActiveEvents(),
        fetchAllPosts(),
        fetchUserStatus(uId)
      ]);
    };
    init();
  }, [router]);

  // 【BLOCK 3: データ取得関数 (Fetch系)】
  const fetchUserStatus = async (userId: string) => {
    const { data: listData, error: listError } = await supabase
      .from('mylists')
      .select('id, promotion_id')
      .eq('user_id', userId);

    if (!listError && listData) {
      const pIds = listData.map(d => d.promotion_id.toString());
      setMyChecks(pIds);

      const mylistIds = listData.map(d => d.id);
      const { data: statusData, error: statusError } = await supabase
        .from('patrol_status')
        .select('mylists(promotion_id)')
        .eq('is_visited', true)
        .in('mylist_id', mylistIds);

      if (!statusError && statusData) {
        const vIds = statusData
          .map((d: any) => d.mylists?.promotion_id?.toString())
          .filter(Boolean);
        setVisitedIds(vIds);
      }
    }
  };

  const fetchActiveEvents = async () => {
    setIsEventLoading(true);
    // 💡 修正：開始日が早い順にソートして取得
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true }); 

    if (!error && data) {
      setEventList(data);
      if (data.length > 0) setSelectedEventId(data[0].id.toString());
    }
    setIsEventLoading(false);
  };

  const fetchAllPosts = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, app_users ( p_name ), events!left ( event_name )')
      .order('created_at', { ascending: false });
    if (!error) setAllPosts(data || []);
  };

  // 【BLOCK 4: アクション関数 (Toggle/Submit系)】
  const handleLogout = () => {
    localStorage.removeItem('voca_user_id');
    localStorage.removeItem('voca_p_name');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const toggleCheck = async (postId: string) => {
    if (!myId) return;
    const isChecked = myChecks.includes(postId);
    if (!isChecked) {
      setMyChecks([...myChecks, postId]);
      const { data: newList, error: listError } = await supabase
        .from('mylists')
        .insert([{ user_id: myId, promotion_id: Number(postId) }])
        .select().single();

      if (!listError && newList) {
        await supabase.from('patrol_status').insert([{ mylist_id: newList.id, is_visited: false }]);
      }
    } else {
      setMyChecks(myChecks.filter(id => id !== postId));
      setVisitedIds(prev => prev.filter(id => id !== postId));
      await supabase.from('mylists').delete().eq('user_id', myId).eq('promotion_id', Number(postId));
    }
  };

  const toggleVisited = async (postId: string) => {
    if (!myId) return;
    const isVisited = visitedIds.includes(postId);
    const newVisited = isVisited ? visitedIds.filter(id => id !== postId) : [...visitedIds, postId];
    setVisitedIds(newVisited);

    const { data: mylist } = await supabase
      .from('mylists')
      .select('id').eq('user_id', myId).eq('promotion_id', Number(postId)).single();

    if (mylist) {
      await supabase.from('patrol_status').upsert({
        mylist_id: mylist.id,
        is_visited: !isVisited
      }, { onConflict: 'mylist_id' });
    }
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
    if (!selectedEventId) { alert("イベントを選択してニャ！"); return; }
    setLoading(true);
    try {
      // 💡 修正：P名が更新されている可能性があるので、必要ならDBのapp_usersを更新する処理も将来的に入れられるニャ
      let finalThumb = '';
      let finalIcon = '';
      if (thumbRef.current?.files?.[0]) finalThumb = await uploadImage(thumbRef.current.files[0], 'thumbnails');
      if (iconRef.current?.files?.[0]) finalIcon = await uploadImage(iconRef.current.files[0], 'icons');

      const { error } = await supabase.from('promotions').insert([{ 
        song_title: songTitle, video_url: songUrl, repost_url: repostUrl,
        comment: comment, author_id: myId, thumbnail_url: finalThumb, icon_url: finalIcon,
        event_id: Number(selectedEventId) 
      }]);

      if (error) throw error;
      alert('投稿完了！🐱');
      setSongTitle(''); setSongUrl(''); setRepostUrl(''); setComment('');
      await fetchAllPosts(); setActiveTab('list');
    } catch (error: any) { alert(error.message); } finally { setLoading(false); }
  };

// 【BLOCK 5: 表示用コンポーネント (PostCard) - ⭐完全再現版⭐】
  const PostCard = ({ post, isMyPage = false }: { post: any, isMyPage?: boolean }) => {
    const generateXUrl = () => {
      const text = `${post.song_title} / ${post.app_users?.p_name} さんを視聴したニャ！\n\n#巡ログ #ボカロ`;
      const targetUrl = post.repost_url || post.video_url;
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(targetUrl)}`;
    };

    const isChecked = myChecks.includes(post.id.toString());
    const isVisited = visitedIds.includes(post.id.toString());

    return (
      <div style={cardStyle}>
        {/* 上段：サムネと基本情報 */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '15px' }}>
          {/* 左：サムネイル */}
          <div style={{ flexShrink: 0 }}>
            <img src={post.thumbnail_url || DEFAULT_THUMB} style={thumbImgStyle} alt="thumb" />
          </div>
          
          {/* 右：投稿祭・タイトル・P名 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={tagStyle}>{post.events?.event_name || 'イベント名なし'}</span>
              {post.author_id === myId && (
                <button onClick={() => { if(confirm('削除する？')) supabase.from('promotions').delete().eq('id', post.id).then(fetchAllPosts); }} style={deleteStyle}>削除</button>
              )}
            </div>
            <h3 style={{ ...titleStyle, marginTop: '8px' }}>{post.song_title}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <img src={post.icon_url || DEFAULT_ICON} style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #eee' }} alt="icon" />
              <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>{post.app_users?.p_name}</span>
            </div>
          </div>
        </div>

        {/* 中段：💡 デザイン案通りの「コメント枠」ニャ！ */}
        <div style={{ 
          border: '1px solid #333', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          minHeight: '50px',
          fontSize: '0.9rem',
          color: '#444',
          lineHeight: '1.4'
        }}>
          {post.comment || '（コメントはありません）'}
        </div>

        {/* 下段：アクションボタン */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '10px' }}>
          <a href={post.video_url} target="_blank" rel="noopener noreferrer" style={iconLinkStyle}>📺 視聴</a>
          <a href={generateXUrl()} target="_blank" rel="noopener noreferrer" style={xBtnStyle}>📢 引用RT</a>
          {isMyPage ? (
            <button onClick={() => toggleVisited(post.id.toString())} style={visitBtnStyle(isVisited)}>
              {isVisited ? '巡回済 ✅' : '未巡回 ⚪'}
            </button>
          ) : (
            <button onClick={() => toggleCheck(post.id.toString())} style={checkBtnStyle(isChecked)}>
              {isChecked ? '💖 リスト済' : '🤍 リストに追加'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // 【BLOCK 6: メインレイアウト (Return)】
  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px', backgroundColor: '#fff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#0056b3', fontSize: '2.2rem', fontWeight: 'bold', margin: 0 }}>巡ログ <span style={{ fontSize: '1.2rem', fontWeight: 'normal' }}>β</span></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '1rem', color: '#333', fontWeight: 'bold' }}>{pName} さん</div>
          <button onClick={handleLogout} style={logoutBtnStyle}>ログアウト</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
        <button onClick={() => setActiveTab('list')} style={navBtnStyle(activeTab === 'list')}>投稿作品</button>
        <button onClick={() => setActiveTab('mypage')} style={navBtnStyle(activeTab === 'mypage')}>マイリスト</button>
        <button onClick={() => setActiveTab('post')} style={postAddBtnStyle(activeTab === 'post')}>＋ 作品を登録</button>
      </div>

      {activeTab === 'list' && (
        <div style={{ display: 'grid', gap: '20px', marginTop: '25px' }}>
          {allPosts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}

      {activeTab === 'mypage' && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
            <div style={counterBoxStyle('#f8f9fa', '#666')}>登録数 <span style={{color: '#0056b3'}}>{myChecks.length}</span></div>
            <div style={counterBoxStyle('#f0fff4', '#28a745')}>巡回済 {visitedIds.length}</div>
          </div>
          {allPosts.filter(p => myChecks.includes(p.id.toString())).map(post => <PostCard key={post.id} post={post} isMyPage={true} />)}
        </div>
      )}

      {activeTab === 'post' && (
        <div style={{ width: '100%', marginTop: '25px' }}>
          {/* <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.2rem' }}>新曲を登録する 🚀</h2> */}
          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            {/* 💡 修正：期間表示付きの昇順ソート済みプルダウン */}
            <label style={labelStyle}>投稿祭を選択</label>
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} style={classicInput}>
              {isEventLoading ? <option>イベントをロード中...</option> : eventList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.event_name} （{ev.start_date} 〜 {ev.end_date}）
                </option>
              ))}
            </select>

            <label style={labelStyle}>作品名</label>
            <input type="text" placeholder="曲のタイトル" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} required style={classicInput} />
            
            {/* 💡 修正：ボカロP名入力欄 */}
            <label style={labelStyle}>ボカロP名</label>
            <input type="text" placeholder="ボカロP名" value={inputPName} onChange={(e) => setInputPName(e.target.value)} style={classicInput} />
            
            <label style={labelStyle}>URL情報</label>
            <input type="url" placeholder="動画URL" value={songUrl} onChange={(e) => setSongUrl(e.target.value)} required style={classicInput} />
            <input type="url" placeholder="リポストURL" value={repostUrl} onChange={(e) => setRepostUrl(e.target.value)} style={classicInput} />
            
            <label style={labelStyle}>コメント</label>
            <textarea placeholder="一言" value={comment} onChange={(e) => setComment(e.target.value)} style={{ ...classicInput, minHeight: '120px' }} />
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>サムネ</label><input type="file" ref={thumbRef} style={fileInputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>アイコン</label><input type="file" ref={iconRef} style={fileInputStyle} /></div>
            </div>
            
            <button type="submit" disabled={loading} style={btnStyle('#0d6efd', true)}>{loading ? '送信中...' : '投稿する！'}</button>
          </form>
        </div>
      )}
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#bbb', fontSize: '0.8rem' }}>© 2026 巡ログ Project / Nekogaoka Gaburi</div>
    </div>
  );
}

// --- スタイル定義 (省略せず維持) ---
const counterBoxStyle = (bgColor: string, textColor: string) => ({ flex: 1, padding: '15px', borderRadius: '12px', backgroundColor: bgColor, color: textColor, textAlign: 'center' as const, fontSize: '0.9rem', fontWeight: 'bold' as const, border: '1px solid #eee' });
const visitBtnStyle = (isVisited: boolean) => ({ background: isVisited ? '#e6fffa' : '#f8f9fa', border: isVisited ? '1px solid #38b2ac' : '1px solid #ddd', color: isVisited ? '#38b2ac' : '#666', borderRadius: '8px', padding: '6px 15px', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '0.9rem' });
const navBtnStyle = (isActive: boolean) => ({ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #ddd', cursor: 'pointer', backgroundColor: isActive ? '#0d6efd' : '#fff', color: isActive ? '#fff' : '#333', fontWeight: 'bold' as const });
const postAddBtnStyle = (isActive: boolean) => ({ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #0d6efd', cursor: 'pointer', backgroundColor: '#fff', color: '#0d6efd', fontWeight: 'bold' as const });
const cardStyle = { width: '100%', border: '1px solid #eee', padding: '25px', borderRadius: '20px', backgroundColor: '#fff', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const thumbImgStyle = { width: '180px', height: '110px', objectFit: 'cover' as const, borderRadius: '12px', backgroundColor: '#f9f9f9' };
const titleStyle = { fontSize: '1.25rem', margin: '5px 0', color: '#333', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const };
const commentStyle = { fontSize: '0.95rem', color: '#555', lineHeight: '1.5', margin: '0', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' };
const tagStyle = { backgroundColor: '#eef4ff', color: '#0d6efd', padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' };
const iconLinkStyle = { textDecoration: 'none', color: '#333', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' };
const checkBtnStyle = (isCheck: boolean) => ({ background: 'none', border: 'none', color: isCheck ? '#e91e63' : '#999', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '5px' });
const deleteStyle = { color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' };
const logoutBtnStyle = { padding: '8px 18px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#f8f9fa', cursor: 'pointer', fontSize: '0.9rem' };
const classicInput = { width: '100%', padding: '16px', borderRadius: '12px', border: '2px solid #ddd', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' as const };
const fileInputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', fontSize: '0.85rem' };
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#666', marginBottom: '6px', fontWeight: 'bold' as const };
const btnStyle = (color: string, full: boolean) => ({ width: full ? '100%' : 'auto', padding: '16px', backgroundColor: color, color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '10px' });
const xBtnStyle = { textDecoration: 'none', backgroundColor: '#000', color: '#fff', padding: '6px 15px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold' as const, display: 'flex', alignItems: 'center', gap: '5px' };