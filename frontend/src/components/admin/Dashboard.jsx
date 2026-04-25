import { useEffect, useState } from 'react';
import { api } from '../../context/AuthContext';

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 20, minWidth: 180 }}>
      <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#e6edf3' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => setError('Failed to load stats'));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e6edf3' }}>Dashboard</h1>
      {error && <div style={{ color: '#f85149', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
        <StatCard label="Total Users" value={stats?.totalUsers} />
        <StatCard
          label="Total Problems"
          value={stats?.totalProblems}
          sub={stats ? `Easy: ${stats.byDifficulty?.easy ?? 0} · Med: ${stats.byDifficulty?.medium ?? 0} · Hard: ${stats.byDifficulty?.hard ?? 0}` : ''}
        />
        <StatCard label="Total Submissions" value={stats?.totalSubmissions} />
        <StatCard label="Active Rooms" value={stats?.activeRooms} />
      </div>
      <a
        href="/admin/queues"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'inline-block', padding: '8px 16px', background: '#1f2937', border: '1px solid #30363d', borderRadius: 6, color: '#58a6ff', textDecoration: 'none', fontSize: 14 }}
      >
        Open BullBoard Queue Monitor ↗
      </a>
    </div>
  );
}
