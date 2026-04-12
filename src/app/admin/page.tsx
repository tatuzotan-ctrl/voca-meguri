'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // フォーム用
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  // 💡 スクショで確認した「events」テーブルを直接使います
  const DB_TABLE = 'events';

  useEffect(() => {
    const checkAdmin = async () => {
      const myId = localStorage.getItem('voca_user_id');
      if (!myId) { setLoading(false); return; }
      const { data } = await supabase.from('app_users').select('is_admin').eq('id', myId).single();
      if (data?.is_admin) {
        setIsAdmin(true);
        await fetchEvents();
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  const fetchEvents = async () => {
    // 💡 Viewではないので is_active が FALSE でも全件取得できます！
    const { data } = await supabase.from(DB_TABLE).select('*').order('start_date', { ascending: false });
    setEvents(data || []);
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    // 1. まず画面上の表示を即座に更新（消えないことを保証）
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e));
    // 2. 裏でDBを更新
    await supabase.from(DB_TABLE).update({ is_active: !currentStatus }).eq('id', id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { event_name: name, start_date: start, end_date: end, is_active: true };
    if (editingId) {
      await supabase.from(DB_TABLE).update(payload).eq('id', editingId);
    } else {
      await supabase.from(DB_TABLE).insert([payload]);
    }
    setName(''); setStart(''); setEnd(''); setEditingId(null);
    fetchEvents();
  };

  if (loading) return <div style={{textAlign:'center', padding:'50px'}}>認証中...🐱</div>;
  if (!isAdmin) return <div style={{textAlign:'center', padding:'50px'}}>403 Forbidden: 管理者設定を確認してニャ</div>;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.4rem' }}>⚙️ 投稿祭管理コンソール</h1>
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>← トップへ戻る</Link>
      </div>

      {/* 登録・編集フォーム */}
      <section style={{ backgroundColor: '#f0f7ff', padding: '25px', borderRadius: '15px', marginBottom: '40px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="名前" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} required />
          <button type="submit" style={btnStyle}>{editingId ? '保存' : '登録'}</button>
        </form>
      </section>

      {/* イベント一覧：テーブル形式 */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', color: '#888', fontSize: '14px' }}>
            <th style={{ padding: '10px' }}>公開設定</th>
            <th>イベント名</th>
            <th>開催期間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee', backgroundColor: e.is_active ? '#fff' : '#f9f9f9' }}>
              <td style={{ padding: '15px 10px' }}>
                <div style={{ display: 'flex', backgroundColor: '#eee', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
                  <button onClick={() => toggleStatus(e.id, false)} style={swBtn(e.is_active, true)}>公開</button>
                  <button onClick={() => toggleStatus(e.id, true)} style={swBtn(!e.is_active, false)}>非表示</button>
                </div>
              </td>
              <td style={{ fontWeight: 'bold', color: e.is_active ? '#333' : '#999' }}>{e.event_name}</td>
              <td style={{ fontSize: '13px', color: '#666' }}>{e.start_date} 〜 {e.end_date}</td>
              <td>
                <button onClick={() => {setEditingId(e.id); setName(e.event_name); setStart(e.start_date); setEnd(e.end_date)}} style={textBtn('#0070f3')}>編集</button>
                <button onClick={async () => {if(confirm('削除？')) {await supabase.from(DB_TABLE).delete().eq('id', e.id); fetchEvents();}}} style={textBtn('#ff4d4f')}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// スタイル
const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', flex: 1 };
const btnStyle = { padding: '12px 30px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, cursor: 'pointer' };
const textBtn = (color: string) => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontWeight: 'bold' as const, marginRight: '10px' });
const swBtn = (active: boolean, isGreen: boolean) => ({
  padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 'bold' as const, cursor: 'pointer',
  backgroundColor: active ? (isGreen ? '#4caf50' : '#ff4d4f') : 'transparent',
  color: active ? 'white' : '#888'
});