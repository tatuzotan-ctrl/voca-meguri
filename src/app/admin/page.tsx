'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // 💡 テーブル名を「events」に修正ニャ！
  const TARGET_TABLE = 'events';

  useEffect(() => {
    const checkAdminStatus = async () => {
      const myId = localStorage.getItem('voca_user_id');
      if (!myId) { setLoading(false); return; }
      
      const { data } = await supabase
        .from('app_users')
        .select('is_admin')
        .eq('id', myId)
        .single();

      if (data?.is_admin === true) {
        setIsAdmin(true);
        await fetchEvents();
      }
      setLoading(false);
    };
    checkAdminStatus();
  }, []);

  const fetchEvents = async () => {
    // 💡 ビューではなく events テーブルから全件取得するから消えないニャ！
    const { data } = await supabase
      .from(TARGET_TABLE)
      .select('*')
      .order('start_date', { ascending: false });
    setEvents(data || []);
  };

  const toggleStatus = async (id: number, currentIsActive: boolean) => {
    // 💡 DB側の値を更新
    const { error } = await supabase
      .from(TARGET_TABLE)
      .update({ is_active: !currentIsActive })
      .eq('id', id);

    if (!error) {
      // 💡 画面上の表示を即座に書き換えて、消えないことを保証するニャ！
      setEvents(events.map(e => 
        e.id === id ? { ...e, is_active: !currentIsActive } : e
      ));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { event_name: name, start_date: start, end_date: end };
    
    if (editingId) {
      await supabase.from(TARGET_TABLE).update(payload).eq('id', editingId);
    } else {
      await supabase.from(TARGET_TABLE).insert([{ ...payload, is_active: true }]);
    }
    
    setName(''); setStart(''); setEnd(''); setEditingId(null);
    fetchEvents();
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('本当に削除していいかニャ？')) return;
    await supabase.from(TARGET_TABLE).delete().eq('id', id);
    fetchEvents();
  };

  if (loading) return <div style={{ padding: '100px', textAlign: 'center' }}>認証中ニャ... 🐱</div>;
  if (!isAdmin) return <div style={{ padding: '100px', textAlign: 'center' }}>403 Forbidden 🐱</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>⚙️ 投稿祭管理コンソール</h1>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← トップに戻る</Link>
      </div>

      <section style={{ backgroundColor: '#f0f7ff', padding: '25px', borderRadius: '20px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0070f3' }}>
          {editingId ? '📝 イベントを編集中ニャ' : '✨ 新規イベントを登録するニャ！'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <input type="text" placeholder="名前" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} required />
          <button type="submit" style={btnStyle}>{editingId ? '変更を保存' : '登録する'}</button>
          {editingId && <button onClick={() => {setEditingId(null); setName(''); setStart(''); setEnd('')}} style={{background: 'none', border: 'none', color: '#666', cursor: 'pointer', flex: '1 1 100%'}}>キャンセル</button>}
        </form>
      </section>

      <div style={{ display: 'grid', gap: '15px' }}>
        {events.map(e => (
          <div key={e.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '20px', borderRadius: '15px', border: '1px solid #eee',
            backgroundColor: e.is_active ? '#fff' : '#f5f5f5',
            opacity: e.is_active ? 1 : 0.8,
            transition: 'all 0.3s'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <span style={{ 
                  fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px',
                  backgroundColor: e.is_active ? '#4caf50' : '#888', color: '#fff' 
                }}>
                  {e.is_active ? '公開中' : '非表示'}
                </span>
                <strong style={{ fontSize: '1.1rem', color: e.is_active ? '#333' : '#999' }}>{e.event_name}</strong>
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>{e.start_date} 〜 {e.end_date}</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => toggleStatus(e.id, e.is_active)} style={actionBtnStyle(e.is_active ? '#666' : '#4caf50')}>
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

// スタイル定義
const inputStyle = { flex: '1 1 150px', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' };
const btnStyle = { flex: '1 1 100%', padding: '15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer' };
const actionBtnStyle = (color: string) => ({ padding: '8px 12px', backgroundColor: '#fff', border: `1px solid ${color}`, color: color, borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' as const, cursor: 'pointer' });