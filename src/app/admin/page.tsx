'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// 💡 ここに自分のSupabase User IDを貼り付けてください
const ADMIN_USER_ID = "9e756117-fd65-48f9-b6e4-ee1546950dce" 

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
    const payload = { event_name: name, start_date: start, end_date: end, is_active: true }
    
    if (editingId) {
      await supabase.from('active_events').update(payload).eq('id', editingId)
    } else {
      await supabase.from('active_events').insert([payload])
    }
    
    setName(''); setStart(''); setEnd(''); setEditingId(null)
    fetchEvents()
  }

  const toggleActive = async (id: number, current: boolean) => {
    await supabase.from('active_events').update({ is_active: !current }).eq('id', id)
    fetchEvents()
  }

  const deleteEvent = async (id: number) => {
    if (!confirm('本当に削除しますか？紐づく投稿がエラーになる可能性があります')) return
    await supabase.from('active_events').delete().eq('id', id)
    fetchEvents()
  }

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>認証中...</div>

  // 💡 管理者以外がアクセスしたら「お帰りください」を表示
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0 }}>⚙️ イベント管理コンソール</h1>
        <Link href="/" style={{ fontSize: '14px', color: '#0070f3' }}>トップに戻る</Link>
      </div>

      <section style={{ backgroundColor: '#f0f7ff', padding: '20px', borderRadius: '15px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>{editingId ? '📝 イベントを編集' : '✨ 新規イベント登録'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <input type="text" placeholder="祭の名前" value={name} onChange={e => setName(e.target.value)} style={{ flex: '1 1 100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={{ flex: '1', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={{ flex: '1', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} required />
          <button type="submit" style={{ flex: '1 1 100%', padding: '12px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {editingId ? '更新する' : '登録する'}
          </button>
          {editingId && <button onClick={() => {setEditingId(null); setName(''); setStart(''); setEnd('')}} style={{ flex: '1 1 100%', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>キャンセル</button>}
        </form>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', fontSize: '14px', color: '#666' }}>
            <th style={{ padding: '10px' }}>状態</th>
            <th style={{ padding: '10px' }}>イベント名</th>
            <th style={{ padding: '10px' }}>期間</th>
            <th style={{ padding: '10px' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>
                <button onClick={() => toggleActive(e.id, e.is_active)} style={{ backgroundColor: e.is_active ? '#4caf50' : '#ccc', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>
                  {e.is_active ? '公開中' : '非表示'}
                </button>
              </td>
              <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '14px' }}>{e.event_name}</td>
              <td style={{ padding: '10px', fontSize: '12px', color: '#666' }}>{e.start_date} ～ {e.end_date}</td>
              <td style={{ padding: '10px', fontSize: '12px' }}>
                <button onClick={() => {setEditingId(e.id); setName(e.event_name); setStart(e.start_date); setEnd(e.end_date)}} style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', marginRight: '10px' }}>編集</button>
                <button onClick={() => deleteEvent(e.id)} style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer' }}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}