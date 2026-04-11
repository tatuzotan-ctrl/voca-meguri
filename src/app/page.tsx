import React from 'react';

export default function MaintenancePage() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0f0f0'
    }}>
      <h1 style={{ fontSize: '2rem', color: '#333' }}>
        現在メンテナンス中です。
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        最強ガブリになって戻ってきますので少々お待ちください🐱      
      </p>
    </div>
  );
}