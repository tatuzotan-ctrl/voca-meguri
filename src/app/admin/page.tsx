'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [debugMsg, setDebugMsg] = useState(''); // 💡 デバッグ用

  useEffect(() => {
    const init = async () => {
      const myId = localStorage.getItem('voca_user_id');
      if (!myId) {
        setDebugMsg("localStorageにIDがないニャ。ログインし直してニャ。");
        setLoading(false);
        return;
      }

      // 管理者チェック
      const { data, error } = await supabase.from('app_users').select('is_admin').eq('id', myId).single();
      
      if (error) {
        setDebugMsg("app_usersの読み込み失敗ニャ：" + error.message);
      } else if (data?.is_admin) {
        setIsAdmin(true);
        await fetchEvents();
      } else {
        setDebugMsg("is_admin が true になっていないニャ。");
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchEvents = async () => {
    // 💡 ターゲットを 'events' に固定
    const { data, error } = await supabase.from('events').select('*');
    if (error) {
      setDebugMsg("eventsテーブルの取得失敗ニャ（RLSの可能性大）：" + error.message);
    } else {
      setEvents(data || []);
      if (data?.length === 0) setDebugMsg("テーブルは読み込めたけど、中身が0件ニャ。");
    }
  };

  if (loading) return <div style={{padding: '50px', textAlign: 'center'}}>認証中... 🐱</div>;

  if (!isAdmin) {
    return (
      <div style={{padding: '50px', textAlign: 'center'}}>
        <h1>アクセス拒否 🚫</h1>
        <p style={{color: 'red'}}>{debugMsg}</p>
        <Link href="/">トップへ戻る</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>⚙️ イベント管理（デバッグ版）</h1>
      {debugMsg && <p style={{backgroundColor: '#fff3cd', padding: '10px'}}>{debugMsg}</p>}
      
      <div style={{ display: 'grid', gap: '10px', marginTop: '20px' }}>
        {events.map(e => (
          <div key={e.id} style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '10px', backgroundColor: e.is_active ? '#fff' : '#eee' }}>
            <strong>{e.event_name}</strong> - {e.is_active ? '✅公開' : '❌非表示'}
            <button onClick={async () => {
              const next = !e.is_active;
              // 画面を先に書き換える（執念）
              setEvents(events.map(item => item.id === e.id ? {...item, is_active: next} : item));
              // 裏で更新
              await supabase.from('events').update({ is_active: next }).eq('id', e.id);
            }} style={{marginLeft: '20px'}}>切り替え</button>
          </div>
        ))}
      </div>
      <Link href="/" style={{display: 'block', marginTop: '20px'}}>トップへ戻る</Link>
    </div>
  );
}