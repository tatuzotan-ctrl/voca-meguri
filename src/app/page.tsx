'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('list');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null); // DBの user_id (text)
  const [pName, setPName] = useState('');
  
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [myChecks, setMyChecks] = useState<string[]>([]); 
  const [visitedIds, setVisitedIds] = useState<string[]>([]);

  const [eventList, setEventList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(''); 
  const [isEventLoading, setIsEventLoading] = useState(true);
  
  const [inputPName, setInputPName] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [repostUrl, setRepostUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const thumbRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);

  const DEFAULT_THUMB = '/images/listen-me.png'; 
  const DEFAULT_ICON = '/images/default-cat-p.png';

  useEffect(() => {
    const init = async () => {
      const uId = localStorage.getItem('voca_user_id'); // これがDBの user_id (text)
      const name = localStorage.getItem('voca_p_name');
      
      if (!uId) {
        router.push('/login');
        return;
      }

      setIsLoggedIn(true);
      setMyId(uId);
      setPName(name || 'ボカロP');
      setInputPName(name || '');

      await Promise.all([
        fetchActiveEvents(),
        fetchAllPosts(),
        fetchMyStatus(uId), 
      ]);
    };
    init();
  }, [router]);

  // 💡 patrol_status テーブルから「お気に入り」と「巡回済」を一気に取るニャ
  const fetchMyStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from('patrol_status')
      .select('promotion_id, is_favorite, is_visited')
      .eq('user_id', userId);

    if (!error && data) {
      setMyChecks(data.filter(d => d.is_favorite).map(d => d.promotion_id.toString()));
      setVisitedIds(data.filter(d => d.is_visited).map(d => d.promotion_id.toString()));
    }
  };

  const fetchActiveEvents = async () => {
    setIsEventLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });
    if (!error && data) {
      setEventList(data);
      if (data.length > 0) setSelectedEventId(data[0].id.toString());
    }
    setIsEventLoading(false);
  };

  const fetchAllPosts = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*, app_users ( p_name ), events!left ( event_name )')
      .order('created_at', { ascending: false });
    if (!error) setAllPosts(data || []);
  };

  const handleLogout = () => {
    localStorage.removeItem('voca_user_id');
    localStorage.removeItem('voca_p_name');
    setIsLoggedIn(false);
    router.push('/login');
  };

  // 💡 マイリスト登録 (is_favorite) をDBに刻むニャ！
  const toggleCheck = async (postId: string) => {
    if (!myId) return;
    const isChecked = myChecks.includes(postId);
    const newChecks = isChecked ? myChecks.filter(id => id !== postId) : [...myChecks, postId];
    setMyChecks(newChecks);

    await supabase.from('patrol_status').upsert({
      user_id: myId,
      promotion_id: Number(postId),
      is_favorite: !isChecked
    }, { onConflict: 'user_id,promotion_id' });
  };

  // 💡 巡回済登録 (is_visited) をDBに刻むニャ！
  const toggleVisited = async (postId: string) => {
    if (!myId) return;
    const isVisited = visitedIds.includes(postId);
    const newVisited = isVisited ? visitedIds.filter(id => id !== postId) : [...visitedIds, postId];
    setVisitedIds(newVisited);

    await supabase.from('patrol_status').upsert({
      user_id: myId,
      promotion_id: Number(postId),
      is_visited: !isVisited
    }, { onConflict: 'user_id,promotion_id' });
  };

  // ...（uploadImage、handlePostSubmit、PostCard等の共通部分は維持）...
  // ※紙面の都合上、変更のないUI部分は省略するニャ！

  return (
    // UI部分は前回のものをそのまま使ってニャ！
    // toggleCheck と toggleVisited の呼び出し先が DB 対応になったので、
    // これでログアウトしてもデータがガブッと残るようになります。
    <div>（前述の最新UIコードと同じニャß）</div>
  );
}