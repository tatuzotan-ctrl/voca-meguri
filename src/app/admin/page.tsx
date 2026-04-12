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

  // 💡 ボタン押下時のステータス更新（画面のリフレッシュのみ行い、行は残す）
  const setStatus = async (id: number, targetStatus: boolean) => {
    await supabase.from('active_events').update({ is_active: targetStatus }).eq('id', id);
    // 状態だけ反映させるために再フェッチ
    fetchEvents();
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('削除していいかニャ？')) return;
    await supabase.from('active_events').delete().eq('id', id);
    fetchEvents();
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>認証中ニャ... 🐱</div>;
  if (!isAdmin) return <div style={{ padding: '100px', textAlign: 'center' }}>403 Forbidden 🐱</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.5rem' }}>⚙️ 投稿祭管理コンソール</h1>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← トップに戻る</Link>
      </div>

      <section style={{ backgroundColor: '#f0f7ff', padding: '25px', borderRadius: '20px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0070f3' }}>投稿祭の登録・編集</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <input type="text" placeholder="投稿祭の名前" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} required />
          <button type="submit" style={btnStyle}>{editingId ? '変更を保存' : '登録'}</button>
        </form>
      </section>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', color: '#888' }}>
            <th style={{ padding: '15px 10px' }}>公開設定</th>
            <th>イベント名</th>
            <th>開催期間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '15px 10px' }}>
                {/* 💡 修正：公開・非表示スイッチ */}
                <div style={{ display: 'flex', backgroundColor: '#eee', borderRadius: '10px', padding: '3px', width: 'fit-content' }}>
                  <button 
                    onClick={() => setStatus(e.id, true)} 
                    style={getPublicBtnStyle(e.is_active)}
                  >
                    公開
                  </button>
                  <button 
                    onClick={() => setStatus(e.id, false)} 
                    style={getPrivateBtnStyle(e.is_active)}
                  >
                    非表示
                  </button>
                </div>
              </td>
              <td style={{ fontWeight: 'bold' }}>{e.event_name}</td>
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

// --- スタイル・ロジック関数 ---

const getPublicBtnStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '6px 15px',
  borderRadius: '7px',
  border: 'none',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: isActive ? '#4caf50' : '#ccc', // 公開時は緑、非表示時はグレー
  color: 'white',
});

const getPrivateBtnStyle = (isActive: boolean): React.CSSProperties => ({
  padding: '6px 15px',
  borderRadius: '7px',
  border: 'none',
  fontSize: '12px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 0.2s',
  backgroundColor: isActive ? '#ccc' : '#ff4d4f', // 公開時はグレー、非表示時は赤
  color: 'white',
});

const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #ddd' };
const btnStyle = { padding: '12px 25px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, cursor: 'pointer' };