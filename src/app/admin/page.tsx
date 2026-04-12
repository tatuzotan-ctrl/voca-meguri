'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  
  // フォーム用
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      // 1. ローカルストレージからログイン中のID（UUID）を取得
      const myId = localStorage.getItem('voca_user_id');
      
      if (!myId) {
        setLoading(false);
        return;
      }

      // 2. DBのapp_usersテーブルに管理者か聞きに行くニャ！
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

  const setStatus = async (id: number, targetStatus: boolean) => {
    await supabase.from('active_events').update({ is_active: targetStatus }).eq('id', id);
    fetchEvents();
  };

  const deleteEvent = async (id: number) => {
    if (!confirm('削除していいかニャ？')) return;
    await supabase.from('active_events').delete().eq('id', id);
    fetchEvents();
  };

  if (loading) return <div style={msgStyle}>認証中ニャ... 🐱</div>;

  // 管理者じゃない場合は追い返すニャ！
  if (!isAdmin) {
    return (
      <div style={msgStyle}>
        <h1>403 Forbidden</h1>
        <p>ここはマスター専用の秘密基地ニャ！ガブッとしないでね🐱</p>
        <Link href="/" style={{color: '#0070f3'}}>トップへ戻る</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.5rem' }}>⚙️ 投稿祭管理コンソール</h1>
        <Link href="/" style={backLinkStyle}>← トップに戻る</Link>
      </div>

      {/* 入力フォーム */}
      <section style={formSectionStyle}>
        <h2 style={{ fontSize: '1.1rem', marginTop: 0, color: '#0070f3' }}>
          {editingId ? '📝 情報を修正中ニャ' : '✨ 新しい祭りを登録するニャ！'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <input type="text" placeholder="投稿祭の名前（例：ボカロ15秒投稿祭）" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <div style={dateBoxStyle}>
            <span style={labelStyle}>開始日</span>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} required />
          </div>
          <div style={dateBoxStyle}>
            <span style={labelStyle}>終了日</span>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} required />
          </div>
          <button type="submit" style={btnStyle}>
            {editingId ? '変更を保存' : 'この内容で登録'}
          </button>
        </form>
      </section>

      {/* 一覧テーブル */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={thStyle}>
            <th>公開設定</th>
            <th>イベント名</th>
            <th>開催期間</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {events.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee', backgroundColor: e.is_active ? '#fff' : '#f9f9f9' }}>
              <td style={{ padding: '15px 0' }}>
                <div style={switchContainer}>
                  <button onClick={() => setStatus(e.id, true)} style={swBtn(e.is_active, true)}>公開</button>
                  <button onClick={() => setStatus(e.id, false)} style={swBtn(!e.is_active, false)}>非表示</button>
                </div>
              </td>
              <td style={{ fontWeight: 'bold' }}>{e.event_name}</td>
              <td style={{ fontSize: '13px', color: '#666' }}>{e.start_date} 〜 {e.end_date}</td>
              <td>
                <button onClick={() => {setEditingId(e.id); setName(e.event_name); setStart(e.start_date); setEnd(e.end_date)}} style={editBtn}>編集</button>
                <button onClick={() => deleteEvent(e.id)} style={delBtn}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- スタイル定義ニャ！ ---
const msgStyle = { padding: '100px', textAlign: 'center' as const };
const formSectionStyle = { backgroundColor: '#f0f7ff', padding: '25px', borderRadius: '20px', marginBottom: '40px' };
const inputStyle = { flex: '1 1 100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd' };
const dateBoxStyle = { flex: '1', display: 'flex', flexDirection: 'column' as const, gap: '5px' };
const labelStyle = { fontSize: '11px', color: '#666' };
const btnStyle = { flex: '1 1 100%', padding: '15px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer' };
const backLinkStyle = { fontSize: '14px', color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' as const };
const thStyle = { borderBottom: '2px solid #eee', textAlign: 'left' as const, fontSize: '14px', color: '#888' };
const switchContainer = { display: 'flex', backgroundColor: '#eee', borderRadius: '10px', padding: '3px', width: 'fit-content' };
const swBtn = (active: boolean, isGreen: boolean) => ({ padding: '6px 15px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 'bold' as const, cursor: 'pointer', backgroundColor: active ? (isGreen ? '#4caf50' : '#888') : 'transparent', color: active ? 'white' : '#888' });
const editBtn = { background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer', marginRight: '15px', fontWeight: 'bold' as const };
const delBtn = { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontWeight: 'bold' as const };