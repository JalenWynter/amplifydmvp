'use client';

import { useAuth } from '@/context/AuthContext';

export default function AuthDebugger() {
  const { currentUser, loading, error, firebaseUser, isAdmin, isReviewer } = useAuth();

  return (
    <div style={{
      backgroundColor: 'black',
      color: 'white',
      padding: '20px',
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
      maxHeight: '200px',
      overflowY: 'auto',
    }}>
      <h3 style={{ color: 'lime' }}>Auth Debugger</h3>
      <p><strong>Loading:</strong> {loading.toString()}</p>
      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}
      <p><strong>Firebase User:</strong> {firebaseUser ? firebaseUser.uid : 'null'}</p>
      <p><strong>Is Admin:</strong> {isAdmin.toString()}</p>
      <p><strong>Is Reviewer:</strong> {isReviewer.toString()}</p>
      <pre><strong>Current User Info:</strong>
{JSON.stringify(currentUser, null, 2)}</pre>
    </div>
  );
}
