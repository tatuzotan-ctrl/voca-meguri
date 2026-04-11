'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeEvents, setActiveEvents] = useState<any[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [myListData, setMyListData] = useState<any[]>([])
  const [view, setView] = useState<'all' | 'mine'>('all')
  const [showForm, setShowForm] = useState(false)

  const [eventId, setEventId] = useState('')
  const [songTitle, setSongTitle] = useState('')
  const [creatorName, setCreatorName] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [repostUrl, setRepostUrl] = useState('')
  const [comment, setComment] = useState('')
  const [workImageFile, setWorkImageFile] = useState<File | null>(null)
  const [iconImageFile, setIconImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const formatDate = (dateString: string) => dateString?.replace(/-/g, '/') || ''

  const fetchData = async () => {
    const { data: promoList } = await supabase
      .from('promotions')
      .select(`
        *,
        active_events (
          event_name,
          end_date
        )
      `)
      .order('created_at', { ascending: false })
    
    setPromotions(promoList || [])

    const { data: myLists } = await supabase.from('my_lists').select('*')
    setMyListData(myLists || [])

    const { data: events } = await supabase.from('active_events').select('*')
    setActiveEvents(events || [])
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) setCreatorName(user.user_metadata?.full_name || user.user_metadata?.user_name || '')
      await fetchData()
      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const toggleMyList = async (promoId: number) => {
    const existing = myListData.find(m => m.promotion_id === promoId)
    if (existing) {
      await supabase.from('my_lists').delete().eq('id', existing.id)
    } else {
      await supabase.from('my_lists').insert([{ user_id: user.id, promotion_id: promoId }])
    }
    fetchData()
  }

  const toggleWatched = async (promoId: number, currentStatus: boolean) => {
    await supabase.from('my_lists').update({ is_watched: !currentStatus }).eq('promotion_id', promoId).eq('user_id', user.id)
    fetchData()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('この投稿を削除しますか？')) return
    const { error } = await supabase.from('promotions').delete().eq('id', id)
    if (error) alert('削除に失敗しました')
    else fetchData()
  }

  const uploadImage = async (file: File, folder: string) => {
    const filePath = `${user.id}/${folder}/${window.crypto.randomUUID()}`
    await supabase.storage.from('promotion_thumbs').upload(filePath, file)
    return supabase.storage.from('promotion_thumbs').getPublicUrl(filePath).data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventId || !videoUrl || !songTitle || !creatorName) return alert('必須項目を確認してください')
    setIsSubmitting(true)
    try {
      let workImageUrl = null
      let creatorIconUrl = null
      if (workImageFile) workImageUrl = await uploadImage(workImageFile, 'works')
      if (iconImageFile) creatorIconUrl = await uploadImage(iconImageFile, 'icons')

      await supabase.from('promotions').insert([{
        user_id: user.id, event_id: parseInt(eventId), song_title: songTitle, creator_name: creatorName,
        video_url: videoUrl, repost_url: repostUrl, comment: comment,
        image_url: workImageUrl, creator_icon_url: creatorIconUrl,
      }])
      setSongTitle(''); setVideoUrl(''); setRepostUrl(''); setComment(''); setWorkImageFile(null); setIconImageFile(null);
      setShowForm(false)
      fetchData()
      alert('登録完了！')
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  const now = new Date()

  const selectableEvents = activeEvents.filter(e => {
    const limitForSelect = new Date(e.end_date)
    limitForSelect.setDate(limitForSelect.getDate() + 3)
    return limitForSelect > now
  })

  const filteredPromos = promotions.filter(p => {
    const endDateStr = (p as any).active_events?.end_date
    if (!endDateStr) return true 
    const limitForDisplay = new Date(endDateStr)
    limitForDisplay.setDate(limitForDisplay.getDate() + 30)
    return limitForDisplay > now
  })

  const displayedPromos = view === 'mine' 
    ? filteredPromos.filter(p => myListData.some(m => m.promotion_id === p.id))
    : filteredPromos

  const totalInList = myListData.length
  const totalWatched = myListData.filter(m => m.is_watched).length

  const DEFAULT_THUMB = '/default_thumb.png'
  const DEFAULT_ICON = '/user_thumb.png'

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>読み込み中...</div>

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', color: '#333', fontFamily: 'sans-serif', backgroundColor: '#fcfdff', minHeight: '100vh' }}>
      
      <header style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h1 style={{ color: '#0070f3', fontSize: '1.8rem', fontWeight: '900', margin: 0 }}>巡ログ <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>β</span></h1>
          {user && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <img src={user.user_metadata?.avatar_url} style={{ width: '35px', height: '35px', borderRadius: '50%', border: '1px solid #ddd' }} />
              <button onClick={handleLogout} style={{ background: '#f5f5f5', border: '1px solid #ddd', color: '#666', cursor: 'pointer', fontSize: '11px', padding: '4px 8px', borderRadius: '6px' }}>ログアウト</button>
            </div>
          )}
        </div>

        {user && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => {setView('all'); setShowForm(false)}} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #ddd', backgroundColor: view === 'all' && !showForm ? '#0070f3' : 'white', color: view === 'all' && !showForm ? 'white' : '#333', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>全員の作品</button>
            <button onClick={() => {setView('mine'); setShowForm(false)}} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '1px solid #ddd', backgroundColor: view === 'mine' ? '#0070f3' : 'white', color: view === 'mine' ? 'white' : '#333', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>マイリスト</button>
            <button onClick={() => setShowForm(!showForm)} style={{ flex: 1, padding: '10px', borderRadius: '12px', border: '2px solid #0070f3', backgroundColor: showForm ? '#0070f3' : 'white', color: showForm ? 'white' : '#0070f3', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>＋ 作品を登録</button>
          </div>
        )}
      </header>

      {user ? (
        <main>
          {showForm && (
            <section style={{ backgroundColor: '#fff', border: '2px solid #0070f3', padding: '25px', borderRadius: '24px', marginBottom: '30px', boxShadow: '0 8px 30px rgba(0,112,243,0.1)' }}>
              <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0070f3', marginBottom: '15px' }}>🚀 新しい作品をログに登録</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }}>
                  <option value="">対象の祭を選択...</option>
                  {/* 💡 期間（開始日 〜 終了日）を表示するように修正 */}
                  {selectableEvents.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.event_name} ({formatDate(e.start_date)} 〜 {formatDate(e.end_date)})
                    </option>
                  ))}
                </select>
                <input type="text" placeholder="曲名 (必須)" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }} />
                <input type="text" placeholder="名前 (必須)" value={creatorName} onChange={(e) => setCreatorName(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{ flex: 1, fontSize: '11px', border: '1px dashed #ccc', padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center' }}>
                    作品サムネ選択 <input type="file" onChange={(e) => setWorkImageFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <div style={{ color: '#0070f3', fontWeight: 'bold', marginTop: '4px' }}>{workImageFile ? '✅ 選択済' : 'クリックして選択'}</div>
                  </label>
                  <label style={{ flex: 1, fontSize: '11px', border: '1px dashed #ccc', padding: '10px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center' }}>
                    アイコン選択 <input type="file" onChange={(e) => setIconImageFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <div style={{ color: '#0070f3', fontWeight: 'bold', marginTop: '4px' }}>{iconImageFile ? '✅ 選択済' : 'クリックして選択'}</div>
                  </label>
                </div>
                <input type="text" placeholder="動画URL" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }} />
                <input type="text" placeholder="リポスト用URL (任意)" value={repostUrl} onChange={(e) => setRepostUrl(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px' }} />
                <textarea placeholder="一言コメント" value={comment} onChange={(e) => setComment(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd', minHeight: '60px', fontSize: '14px', resize: 'none' }} />
                <button type="submit" disabled={isSubmitting} style={{ padding: '15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
                  {isSubmitting ? '登録中...' : '登録する'}
                </button>
              </form>
            </section>
          )}

          {view === 'mine' && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', backgroundColor: '#f0f7ff', padding: '15px', borderRadius: '15px', border: '1px solid #cce4ff' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>マイリスト登録</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#0070f3' }}>{totalInList} <span style={{ fontSize: '11px' }}>作品</span></div>
              </div>
              <div style={{ width: '1px', backgroundColor: '#cce4ff' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>巡回済み (完了)</div>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#4caf50' }}>{totalWatched} <span style={{ fontSize: '11px' }}>作品</span></div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {displayedPromos.map(p => {
              const myListItem = myListData.find(m => m.promotion_id === p.id)
              const isInMyList = !!myListItem
              const isWatched = myListItem?.is_watched || false
              const eventName = (p as any).active_events?.event_name || '不明なイベント'

              return (
                <div key={p.id} style={{ display: 'flex', gap: '15px', padding: '15px', backgroundColor: isWatched ? '#f9f9f9' : '#fff', borderRadius: '18px', border: '1px solid #eee', opacity: isWatched ? 0.7 : 1 }}>
                  <div style={{ flexShrink: 0 }}>
                    <img src={p.image_url || DEFAULT_THUMB} style={{ width: '120px', height: '80px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f0f0f0' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '10px', backgroundColor: '#eef4ff', color: '#0070f3', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px', fontWeight: 'bold' }}>
                          {eventName}
                        </div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.song_title || '作品名なし'}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <img src={p.creator_icon_url || DEFAULT_ICON} style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }} />
                          <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>{p.creator_name}</span>
                        </div>
                      </div>
                      {user.id === p.user_id && (
                        <button onClick={() => handleDelete(p.id)} style={{ color: '#ff4d4f', border: 'none', background: 'none', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold', padding: '0 0 0 10px' }}>削除</button>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', margin: '8px 0', color: '#555', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.comment}</p>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <a href={p.video_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>📺 視聴</a>
                      {p.repost_url && <a href={p.repost_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#1d9bf0', textDecoration: 'none', fontWeight: 'bold' }}>🔁 RP</a>}
                      {view === 'all' ? (
                        <button onClick={() => toggleMyList(p.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: isInMyList ? '#e91e63' : '#888', fontWeight: 'bold', padding: 0 }}>
                          {isInMyList ? '💖 リスト済' : '➕ リスト登録'}
                        </button>
                      ) : (
                        <button onClick={() => toggleWatched(p.id, isWatched)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: isWatched ? '#4caf50' : '#ff9800', fontWeight: 'bold', padding: 0 }}>
                          {isWatched ? '✅ 巡回済み' : '⏳ 未巡回'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </main>
      ) : (
        <div style={{ textAlign: 'center', marginTop: '100px', padding: '0 20px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#0070f3', fontWeight: '900' }}>巡ログ <span style={{fontSize: '1rem'}}>β</span></h2>
          <p style={{ color: '#666', marginBottom: '40px' }}>作品との出会いを記録する、巡回ログツール</p>
<button 
  onClick={() => supabase.auth.signInWithOAuth({ 
    provider: 'x', // 💡 Provider名は 'twitter' のままが安定します
    options: {
      // 💡 ここで「メールアドレス」や「非公開情報」を要求リストから除外！
      scopes: 'users.read tweet.read',
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  })} 
  style={{ 
    padding: '20px 50px', 
    backgroundColor: '#000', 
    color: 'white', 
    border: 'none', 
    borderRadius: '40px', 
    fontWeight: 'bold', 
    cursor: 'pointer', 
    fontSize: '18px', 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)' 
  }}
>
  Xアカウントでログイン
</button>
        </div>
      )}
      
      <footer style={{ marginTop: '50px', textAlign: 'center', padding: '20px', color: '#bbb', fontSize: '11px' }}>
        &copy; 2026 巡ログ Project / 猫ヶ丘ガブリ
      </footer>
    </div>
  )
}