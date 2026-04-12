'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MyPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchMyPosts = async () => {
      const authorId = localStorage.getItem('voca_user_id');
      const pName = localStorage.getItem('voca_p_name');

      if (!authorId) {
        router.push('/login'); // ログインしてなきゃ追い返す
        return;
      }

      setUserName(pName || '名無しP');

      // 自分の author_id と一致する投稿だけをゲット！
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setPosts(data || []);
    };

    fetchMyPosts();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>{userName} さんのマイページ 🦖</h1>
      <p>あなたがこれまでに宣伝した曲のリストです。</p>
      
      <div style={{ display: 'grid', gap: '20px', marginTop: '30px' }}>
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h3 style={{ margin: '0 0 10px 0' }}>{post.song_title}</h3>
              <a href={post.song_url} target="_blank" rel="noopener noreferrer">曲を聴く 🔗</a>
              <p style={{ color: '#666', fontSize: '0.9rem' }}>{post.comment}</p>
            </div>
          ))
        ) : (
          <p>まだ投稿がありません。どんどん宣伝しよう！</p>
        )}
      </div>
      
      <button 
        onClick={() => { localStorage.clear(); router.push('/login'); }}
        style={{ marginTop: '50px', color: 'red', cursor: 'pointer', background: 'none', border: 'none' }}
      >
        ログアウト
      </button>
    </div>
  );
}