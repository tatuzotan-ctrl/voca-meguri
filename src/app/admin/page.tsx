'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const myId = localStorage.getItem('voca_user_id');
      if (!myId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('app_users')
        .select('is_admin')
        .eq('id', myId)
        .single();

      if (!error && data?.is_admin === true) {
        setIsAdmin(true);
        await fetchEvents();
      }
      setLoading(false);
    };
    checkAdminStatus();
  }, []);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('active_events')
      .select('*')
      .order('start_date', { ascending: false });
    setEvents(data || []);
  };

  const setStatus = async (id: number, targetStatus: boolean) => {
    // 💡 ここでDBを更新しても、fetchEvents() で全件取り直すので行は消えません！
    await supabase.from('active_events').update({ is_active: targetStatus }).eq('id', id);
    fetchEvents();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { event_name: name, start_date: start, end_date: end };
    if (editingId) {
      await supabase.from('active_events').update(payload).eq('id', editingId);
    } else {
      await supabase.from('active_events').insert([{ ...payload, is_active: true }]);
    }
    setName(''); setStart(''); setEnd(''); setEditingId(null);
    fetchEvents();
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('本当に削除していいかニャ？')) return;
    await supabase.from('active_events').delete().eq('id', id);
    fetchEvents();
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>認証中ニャ... 🐱</div>;
  if (!isAdmin) return <div style={{ padding: '100px', textAlign: 'center' }}>403 Forbidden</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.5rem' }}>⚙️ 投稿祭管理コンソール</h1>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← トップに戻る</Link>
      </div>

      <section style={{ backgroundColor: '#f0f7ff', padding: '25px', borderRadius: '20px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0070f3' }}>
          {editingId ? '📝 イベントを編集' : '✨ 新規イベント登録'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <input type="text" placeholder="投稿祭の名前" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} required />
          <button type="submit" style={btnStyle}>{editingId ? '変更を保存' : '登録する'}</button>
        </form>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', color: '#888', fontSize: '14px' }}>
            <th style={{ padding: '15px 10px' }}>公開設定</th>
            <th>イベント名</th>
            <th>開催期間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee', backgroundColor: e.is_active ? '#fff' : '#fafafa' }}>
              <td style={{ padding: '15px 10px' }}>
                <div style={{ display: 'flex', backgroundColor: '#eee', borderRadius: '10px', padding: '3px', width: 'fit-content' }}>
                  <button 
                    onClick={() => setStatus(e.id, true)} 
                    style={{
                      padding: '6px 15px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      backgroundColor: e.is_active ? '#4caf50' : '#ccc', color: 'white'
                    }}
                  >
                    公開
                  </button>
                  <button 
                    onClick={() => setStatus(e.id, false)} 
                    style={{
                      padding: '6px 15px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                      backgroundColor: !e.is_active ? '#ff4d4f' : '#ccc', color: 'white'
                    }}
                  >
                    非表示
                  </button>
                </div>
              </td>
              <td style={{ fontWeight: 'bold', color: e.is_active ? '#333' : '#999' }}>{e.event_name}</td>
              <td style={{ fontSize: '13px', color: '#666' }}>{e.start_date} 〜 {e.end_date}</td>
              <td>
                <button onClick={() => {setEditingId(e.id); setName(e.event_name); setStart(e.start_date); setEnd(e.end_date)}} style={{ color: '#0070f3', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' }}>編集</button>
                <button onClick={() => deleteEvent(e.id)} style={{ color: '#ff4d4f', background: 'none', border: 'none', cursor: 'pointer' }}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', flex: '1' };
const btnStyle = { padding: '12px 25px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, cursor: 'pointer' };