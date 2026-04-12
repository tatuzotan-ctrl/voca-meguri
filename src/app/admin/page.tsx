'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // フォーム用ステート
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const router = useRouter();
  const TARGET_TABLE = 'events';

  useEffect(() => {
    const checkAdmin = async () => {
      const myId = localStorage.getItem('voca_user_id');
      if (!myId) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('is_admin')
        .eq('id', myId)
        .single();

      if (!error && data?.is_admin) {
        setIsAdmin(true);
        await fetchEvents();
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  const fetchEvents = async () => {
    // 💡 テーブル「events」から直接全件取得
    const { data } = await supabase
      .from(TARGET_TABLE)
      .select('*')
      .order('start_date', { ascending: false });
    setEvents(data || []);
  };

  const toggleStatus = async (id: number, currentIsActive: boolean) => {
    const nextStatus = !currentIsActive;
    setEvents(prev => prev.map(e => e.id === id ? { ...e, is_active: nextStatus } : e));

    const { error } = await supabase
      .from(TARGET_TABLE)
      .update({ is_active: nextStatus })
      .eq('id', id);

    if (error) {
      alert("更新エラーニャ...：" + error.message);
      fetchEvents();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    // 💡 IDはDBが自動で振るので、payloadには含めないのが正解ニャ！
    const payload = { event_name: name, start_date: start, end_date: end };

    try {
      if (editingId) {
        const { error } = await supabase.from(TARGET_TABLE).update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        // 新規登録：idを指定せずにinsertするニャ
        const { error } = await supabase.from(TARGET_TABLE).insert([{ ...payload, is_active: true }]);
        if (error) throw error;
      }

      setName(''); setStart(''); setEnd(''); setEditingId(null);
      await fetchEvents();
      alert(editingId ? '修正完了ニャ！🐱' : '登録完了ニャ！🚀');
    } catch (err: any) {
      alert("エラーニャ...：" + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (e: any) => {
    setEditingId(e.id);
    setName(e.event_name);
    setStart(e.start_date);
    setEnd(e.end_date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div style={msgStyle}>認証中ニャ... 🐱</div>;

  if (!isAdmin) {
    return (
      <div style={msgStyle}>
        <h1>403 Forbidden</h1>
        <p>ここはマスター専用の秘密基地ニャ！</p>
        <Link href="/" style={{ color: '#0070f3', fontWeight: 'bold' }}>トップへ戻る</Link>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>⚙️ イベント管理 🐱</h1>
          <Link href="/" style={backLinkStyle}>トップへ戻る</Link>
        </div>

        {/* 登録・修正フォーム */}
        <div style={formCardStyle}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#333' }}>
            {editingId ? '📝 イベント情報を修正する' : '✨ 新しいイベントを登録する'}
          </h2>
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={inputGroup}>
              <label style={labelStyle}>イベント名（投稿祭の名前）</label>
              <input type="text" placeholder="例：ボカロ15秒投稿祭" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>開始日</label>
                <input type="date" value={start} onChange={e => setStart(e.target.value)} required style={inputStyle} />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>終了日</label>
                <input type="date" value={end} onChange={e => setEnd(e.target.value)} required style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={formLoading} style={submitBtnStyle}>
              {formLoading ? '処理中...' : editingId ? 'この内容で修正を保存する' : 'この内容でイベントを登録する'}
            </button>
            {editingId && (
              <button onClick={() => { setEditingId(null); setName(''); setStart(''); setEnd(''); }} style={cancelBtnStyle}>
                キャンセル
              </button>
            )}
          </form>
        </div>

        {/* イベント一覧 */}
        <div style={{ display: 'grid', gap: '15px', marginTop: '40px' }}>
          <h2 style={{ fontSize: '1rem', color: '#666', marginLeft: '5px' }}>登録済みのイベント一覧</h2>
          {events.map(e => (
            <div key={e.id} style={eventCardStyle(e.is_active)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={statusBadge(e.is_active)}>
                    {e.is_active ? '公開中' : '非表示'}
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: e.is_active ? '#333' : '#999' }}>{e.event_name}</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#777' }}>
                  期間：{e.start_date} 〜 {e.end_date}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => toggleStatus(e.id, e.is_active)} style={actionBtnStyle(e.is_active)}>
                  {e.is_active ? '非表示' : '公開'}
                </button>
                <button onClick={() => startEdit(e)} style={editBtnStyle}>
                  編集
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '60px', color: '#bbb', fontSize: '0.8rem' }}>
          © 2026 巡ログ 管理コンソールニャ！🐱
        </div>
      </div>
    </div>
  );
}

// --- スタイル定義（再掲） ---
const containerStyle: React.CSSProperties = { backgroundColor: '#f9f9f9', minHeight: '100vh', padding: '40px 20px', fontFamily: 'sans-serif' };
const formCardStyle: React.CSSProperties = { backgroundColor: '#fff', padding: '30px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1px solid #eee' };
const formStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '15px' };
const inputGroup: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 };
const labelStyle: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 'bold', color: '#666', marginLeft: '5px' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 15px', borderRadius: '12px', border: '2px solid #ddd', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };
const submitBtnStyle: React.CSSProperties = { backgroundColor: '#0070f3', color: '#fff', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' };
const cancelBtnStyle: React.CSSProperties = { backgroundColor: 'transparent', color: '#666', border: 'none', padding: '10px', cursor: 'pointer', fontSize: '0.9rem' };
const eventCardStyle = (isActive: boolean): React.CSSProperties => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', backgroundColor: isActive ? '#fff' : '#f0f0f0', borderRadius: '15px', border: isActive ? '1px solid #eee' : '1px solid #ddd', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', opacity: isActive ? 1 : 0.8, transition: 'all 0.2s' });
const statusBadge = (isActive: boolean): React.CSSProperties => ({ backgroundColor: isActive ? '#28a745' : '#ff4d4f', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px' });
const actionBtnStyle = (isActive: boolean): React.CSSProperties => ({ backgroundColor: isActive ? '#f8f9fa' : '#28a745', color: isActive ? '#666' : '#fff', border: isActive ? '1px solid #ddd' : 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' });
const editBtnStyle: React.CSSProperties = { backgroundColor: '#0070f3', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' };
const backLinkStyle: React.CSSProperties = { color: '#0070f3', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' };
const msgStyle: React.CSSProperties = { padding: '100px', textAlign: 'center', fontFamily: 'sans-serif' };