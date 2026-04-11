'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// 💡 特定したマスターの UUID をここに貼り付けてください
const ADMIN_USER_ID = "ここに自分のUUIDをペースト" 

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  
  // フォーム用
  const [name, setName] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchEvents = async () => {
    const { data } = await supabase.from('active_events').select('*').order('start_date', { ascending: false })
    setEvents(data || [])
  }

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user?.id === ADMIN_USER_ID) {
        await fetchEvents()
      }
      setLoading(false)
    }
    checkUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 💡 新規登録時は is_active: true 固定、編集時は今の状態を維持
    const payload: any = { event_name: name, start_date: start, end_date: end }
    if (!editingId) payload.is_active = true
    
    if (editingId) {
      await supabase.from('active_events').update(payload).eq('id', editingId)
    } else {
      await supabase.from('active_events').insert([payload])
    }
    
    setName(''); setStart(''); setEnd(''); setEditingId(null)
    fetchEvents()
  }

  // 💡 公開中 ⇄ 非表示 を切り替えるトグル関数
  const toggleActive = async (id: number, currentStatus: boolean) => {
    await supabase.from('active_events').update({ is_active: !currentStatus }).eq('id', id)
    fetchEvents()
  }

  const deleteEvent = async (id: number) => {
    if (!confirm('本当に削除しますか？紐づく投稿がエラーになる可能性があります')) return
    await supabase.from('active_events').delete().eq('id', id)
    fetchEvents()
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>認証中...</div>

  if (user?.id !== ADMIN_USER_ID) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <h1>403 Forbidden</h1>
        <p>ここは管理者専用エリアです。ガブッとしないでね🦖</p>
        <Link href="/">トップへ戻る</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>⚙️ イベント管理コンソール</h1>
        <Link href="/" style={{ fontSize: '14px', color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← トップに戻る</Link>
      </div>

      {/* 入力エリア */}
      <section style={{ backgroundColor: '#f0f7ff', padding: '25px', borderRadius: '20px', marginBottom: '40px', boxShadow: '0 4px 15px rgba(0,112,243,0.05)' }}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '20px', color: '#0070f3' }}>
          {editingId ? '📝 イベント情報を編集' : '✨ 新規イベントを登録'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <input type="text" placeholder="投稿祭の名前を入力" value={name} onChange={e => setName(e.target.value)} style={{ flex: '1 1 100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} required />
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>開始日</span>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} required />
          </div>
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '11px', color: '#666', marginLeft: '5px' }}>終了日</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ddd' }} required />
          </div>
          <button type="submit" style={{ flex: '1 1 100%', padding: '15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}>
            {editingId ? '変更を保存する' : 'この内容で登録する'}
          </button>
          {editingId && (
            <button onClick={() => {setEditingId(null); setName(''); setStart(''); setEnd('')}} style={{ flex: '1 1 100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '14px' }}>
              キャンセルして新規登録に戻る
            </button>
          )}
        </form>
      </section>

      {/* 一覧エリア */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', fontSize: '14px', color: '#888' }}>
              <th style={{ padding: '15px 10px' }}>状態</th>
              <th style={{ padding: '15px 10px' }}>イベント名</th>
              <th style={{ padding: '15px 10px' }}>開催期間</th>
              <th style={{ padding: '15px 10px' }}>アクション</th>
            </tr>
          </thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f5f5f5', backgroundColor: e.is_active ? 'transparent' : '#fafafa' }}>
                <td style={{ padding: '15px 10px' }}>
                  <button 
                    onClick={() => toggleActive(e.id, e.is_active)} 
                    style={{ 
                      backgroundColor: e.is_active ? '#4caf50' : '#888', 
                      color: 'white', 
                      border: 'none', 
                      padding: '6px 12px', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontSize: '12px',
                      fontWeight: 'bold',
                      minWidth: '70px',
                      transition: 'all 0.2s'
                    }}
                  >
                    {e.is_active ? '公開中' : '非表示'}
                  </button>
                </td>
                <td style={{ padding: '15px 10px', fontWeight: 'bold', color: e.is_active ? '#333' : '#999' }}>
                  {e.event_name}
                </td>
                <td style={{ padding: '15px 10px', fontSize: '13px', color: '#666' }}>
                  {e.start_date.replace(/-/g, '/')} 〜 {e.end_date.replace(/-/g, '/')}
                </td>
                <td style={{ padding: '15px 10px', fontSize: '13px' }}>
                  <button 
                    onClick={() => {setEditingId(e.id); setName(e.event_name); setStart(e.start_date); setEnd(e.end_date)}} 
                    style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', marginRight: '15px', fontWeight: 'bold' }}
                  >
                    編集
                  </button>
                  <button 
                    onClick={() => deleteEvent(e.id)} 
                    style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}