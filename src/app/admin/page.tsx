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

  // 💡 全件取得（フィルターなし）を徹底するニャ！
  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('active_events')
      .select('*')
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error("データ取得エラー:", error);
    } else {
      setEvents(data || []);
    }
  };

  // 💡 ボタン1つで状態を反転させるシンプルな関数
  const toggleStatus = async (id: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from('active_events')
      .update({ is_active: !currentStatus }) // 今と逆の状態にする
      .eq('id', id);
    
    if (!error) {
      await fetchEvents(); // 確実に再読み込み
    }
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
    if (!confirm('本当に削除するニャ？')) return;
    await supabase.from('active_events').delete().eq('id', id);
    fetchEvents();
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>認証中...</div>;
  if (!isAdmin) return <div style={{ padding: '100px', textAlign: 'center' }}>管理者のみアクセス可能です</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.5rem' }}>⚙️ 投稿祭管理コンソール</h1>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>← トップへ戻る</Link>
      </div>

      <section style={{ backgroundColor: '#f0f7ff', padding: '25px', borderRadius: '20px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1rem', color: '#0070f3' }}>新規登録 / 編集</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="名前" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} required />
          <button type="submit" style={btnStyle}>{editingId ? '保存' : '登録'}</button>
        </form>
      </section>

      <div style={{ borderTop: '1px solid #eee' }}>
        {events.map(e => (
          <div key={e.id} style={{
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '20px', 
            borderBottom: '1px solid #eee',
            backgroundColor: e.is_active ? '#fff' : '#f0f0f0', // 非表示は背景を変える
            opacity: e.is_active ? 1 : 0.7
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: 'bold', 
                padding: '4px 8px', 
                borderRadius: '4px',
                marginRight: '10px',
                backgroundColor: e.is_active ? '#4caf50' : '#ff4d4f',
                color: '#fff'
              }}>
                {e.is_active ? '公開中' : '非表示'}
              </span>
              <strong style={{ fontSize: '1.1rem' }}>{e.event_name}</strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{e.start_date} 〜 {e.end_date}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* 💡 このボタン1つで状態を確実に切り替えるニャ！ */}
              <button onClick={() => toggleStatus(e.id, e.is_active)} style={actionBtnStyle('#666')}>
                {e.is_active ? '非表示にする' : '公開する'}
              </button>
              <button onClick={() => {setEditingId(e.id); setName(e.event_name); setStart(e.start_date); setEnd(e.end_date)}} style={actionBtnStyle('#0070f3')}>
                編集
              </button>
              <button onClick={() => deleteEvent(e.id)} style={actionBtnStyle('#ff4d4f')}>
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 };
const btnStyle = { padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };
const actionBtnStyle = (color: string) => ({ padding: '8px 12px', backgroundColor: '#fff', border: `1px solid ${color}`, color: color, borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' as const, cursor: 'pointer' });