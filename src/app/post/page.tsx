'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function PostPage() {
  const [songTitle, setSongTitle] = useState('');
  const [songUrl, setSongUrl] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [pName, setPName] = useState('');
  const router = useRouter();

  // 1. ページ読み込み時にログインチェック
  useEffect(() => {
    const authorId = localStorage.getItem('voca_user_id');
    const name = localStorage.getItem('voca_p_name');
    
    if (!authorId) {
      alert('投稿するにはログインが必要だよ！🦖');
      router.push('/login');
    } else {
      setPName(name || '');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 2. ブラウザから自分のUUID（指紋）を取得
      const authorId = localStorage.getItem('voca_user_id');

      if (!authorId) {
        throw new Error('ログインセッションが切れちゃったみたい🦖');
      }

      // 3. promotionsテーブルに author_id を添えてインサート
      const { error } = await supabase
        .from('promotions')
        .insert([
          { 
            song_title: songTitle, 
            song_url: songUrl, 
            comment: comment,
            author_id: authorId // これで誰の曲か紐付く！
          }
        ]);

      if (error) throw error;

      alert('宣伝の投稿に成功したよ！✨');
      router.push('/mypage'); // 投稿が終わったらマイページへ

    } catch (error: any) {
      alert('エラーが発生したよ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '10px', backgroundColor: '#fff' }}>
      <h2 style={{ textAlign: 'center' }}>新曲を宣伝する 🦖</h2>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
        現在は {pName} さんとしてログイン中
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>曲のタイトル</label>
          <input
            type="text"
            placeholder="例：巡るガブリのメロディ"
            value={songTitle}
            onChange={(e) => setSongTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>動画URL (YouTube/niconicoなど)</label>
          <input
            type="url"
            placeholder="https://..."
            value={songUrl}
            onChange={(e) => setSongUrl(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>一言コメント</label>
          <textarea
            placeholder="曲の聴きどころを教えて！"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '100px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '送信中...' : '宣伝を投稿する！'}
        </button>

        <button 
          type="button" 
          onClick={() => router.push('/mypage')}
          style={{ background: 'none', border: 'none', color: '#0070f3', cursor: 'pointer' }}
        >
          マイページに戻る
        </button>
      </form>
    </div>
  );
}