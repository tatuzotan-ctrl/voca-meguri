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

  // 💡 マスター、SupabaseのTable Editorで「本当のテーブル名」を再確認してニャ！
  // もし違っていたらここを書き換えるだけでOKニャ
  const TARGET_TABLE = 'events';

  useEffect(() => {
    const checkAdminStatus = async () => {
      const myId = localStorage.getItem('voca_user_id');
      if (!myId) { setLoading(false); return; }
      
      const { data } = await supabase.from('app_users').select('is_admin').eq('id', myId).single();
      if (data?.is_admin) {
        setIsAdmin(true);
        await fetchEvents();
      }
      setLoading(false);
    };
    checkAdminStatus();
  }, []);

  const fetchEvents = async () => {
    // 💡 念のため、全件取得を試みるニャ
    const { data, error } = await supabase.from(TARGET_TABLE).select('*');
    if (error) {
      console.error("取得エラー:", error);
      // エラーが出ても、既存の events があればそれを維持するニャ
    } else {
      setEvents(data || []);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    // 💡 1. まず画面上の表示を即座に切り替える（DBの結果を待たない！）
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: !currentStatus } : e));

    // 💡 2. その後、裏でDBを更新する。失敗しても画面からは消さない。
    const { error } = await supabase.from(TARGET_TABLE).update({ is_active: !currentStatus }).eq('id', id);
    if (error) alert("DB更新に失敗したニャ...でも画面からは消さないニャ！");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { event_name: name, start_date: start, end_date: end, is_active: true };
    
    if (editingId) {
      await supabase.from(TARGET_TABLE).update(payload).eq('id', editingId);
    } else {
      await supabase.from(TARGET_TABLE).insert([payload]);
    }
    
    setName(''); setStart(''); setEnd(''); setEditingId(null);
    fetchEvents();
  };

  if (loading) return <div style={centerStyle}>認証中ニャ...</div>;
  if (!isAdmin) return <div style={centerStyle}>403 Forbidden: 管理者設定を確認してニャ</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.4rem', borderLeft: '5px solid #0070f3', paddingLeft: '15px' }}>
        投稿祭管理：絶対消えないコンソール 🐱
      </h1>

      {/* 登録・編集エリア */}
      <section style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '15px', margin: '30px 0' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input type="text" placeholder="祭りの名前" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} style={inputStyle} required />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inputStyle} required />
          <button type="submit" style={mainBtnStyle}>{editingId ? '保存' : '登録'}</button>
        </form>
      </section>

      {/* 💡 データがない場合に「何もないニャ」と表示して原因を切り分けるニャ */}
      {events.length === 0 && <div style={centerStyle}>データが1件も取得できていないニャ。テーブル名「{TARGET_TABLE}」は合ってるかニャ？</div>}

      <div style={{ display: 'grid', gap: '10px' }}>
        {events.map(e => (
          <div key={e.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '15px 20px', borderRadius: '10px', border: '1px solid #ddd',
            backgroundColor: e.is_active ? '#fff' : '#eee', // 非表示はグレーにするだけ
            opacity: e.is_active ? 1 : 0.6
          }}>
            <div>
              <strong style={{ fontSize: '1.1rem' }}>{e.event_name}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>{e.start_date} 〜 {e.end_date}</div>
              <span style={{ fontSize: '11px', color: e.is_active ? '#28a745' : '#ff4d4f', fontWeight: 'bold' }}>
                {e.is_active ? '● 公開中' : '○ 非表示中'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => toggleStatus(e.id, e.is_active)} style={subBtnStyle}>
                {e.is_active ? '非表示にする' : '公開する'}
              </button>
              <button onClick={() => {setEditingId(e.id); setName(e.event_name); setStart(e.start_date); setEnd(e.end_date)}} style={subBtnStyle}>編集</button>
            </div>
          </div>
        ))}
      </div>
      
      <Link href="/" style={{ display: 'block', marginTop: '40px', textAlign: 'center', color: '#666' }}>トップへ戻る</Link>
    </div>
  );
}

const centerStyle = { padding: '50px', textAlign: 'center' as const };
const inputStyle = { flex: '1 1 150px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' };
const mainBtnStyle = { padding: '10px 25px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };
const subBtnStyle = { padding: '6px 12px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' };