import { useEffect, useState, useCallback } from 'react';
import { api } from '../../context/AuthContext';

export default function AdminRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/rooms');
      setRooms(r.data.rooms || r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  async function handleForceClose(roomId) {
    if (!window.confirm(`Force close room "${roomId}"?`)) return;
    await api.delete(`/admin/rooms/${roomId}`);
    fetchRooms();
  }

  const th = { padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#8b949e', fontWeight: 600, borderBottom: '1px solid #30363d', textTransform: 'uppercase' };
  const td = { padding: '12px 12px', borderBottom: '1px solid #21262d', fontSize: 14, color: '#e6edf3' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6edf3' }}>Active Rooms</h1>
        <button
          onClick={fetchRooms}
          style={{ padding: '8px 16px', background: '#1f2937', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', cursor: 'pointer', fontSize: 14 }}
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <div style={{ color: '#8b949e' }}>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={th}>Room ID</th>
              <th style={th}>Members</th>
              <th style={th}>Usernames</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => (
              <tr key={room.roomId}>
                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{room.roomId}</td>
                <td style={td}>{room.memberCount ?? room.members?.length ?? 0}</td>
                <td style={{ ...td, color: '#8b949e' }}>{(room.members || []).map(m => m.username || m.socketId).join(', ') || '—'}</td>
                <td style={td}>
                  <button
                    onClick={() => handleForceClose(room.roomId)}
                    style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #f85149', borderRadius: 4, color: '#f85149', cursor: 'pointer', fontSize: 13 }}
                  >
                    Force Close
                  </button>
                </td>
              </tr>
            ))}
            {rooms.length === 0 && (
              <tr><td colSpan={4} style={{ ...td, color: '#8b949e', textAlign: 'center' }}>No active rooms.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
