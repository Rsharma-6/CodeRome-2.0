import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../context/AuthContext';

const diffColor = { easy: '#3fb950', medium: '#d29922', hard: '#f85149' };

export default function AdminProblems() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchProblems() {
    setLoading(true);
    try {
      const r = await api.get('/admin/problems');
      setProblems(r.data.problems || r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProblems(); }, []);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.delete(`/admin/problems/${id}`);
    fetchProblems();
  }

  const th = { padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#8b949e', fontWeight: 600, borderBottom: '1px solid #30363d', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const td = { padding: '12px 12px', borderBottom: '1px solid #21262d', fontSize: 14, color: '#e6edf3' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e6edf3' }}>Problems</h1>
        <button
          onClick={() => navigate('/admin/problems/new')}
          style={{ padding: '8px 16px', background: '#238636', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          + New Problem
        </button>
      </div>
      {loading ? (
        <div style={{ color: '#8b949e' }}>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={th}>Title</th>
              <th style={th}>Difficulty</th>
              <th style={th}>Test Cases</th>
              <th style={th}>Created</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {problems.map(p => {
              const visible = p.testCases?.filter(t => !t.isHidden).length ?? 0;
              const hidden = p.testCases?.filter(t => t.isHidden).length ?? 0;
              return (
                <tr key={p._id}>
                  <td style={td}>{p.title}</td>
                  <td style={td}>
                    <span style={{ color: diffColor[p.difficulty] || '#e6edf3', fontWeight: 600 }}>
                      {p.difficulty}
                    </span>
                  </td>
                  <td style={td}>{visible} visible / {hidden} hidden</td>
                  <td style={td}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={td}>
                    <button
                      onClick={() => navigate(`/admin/problems/${p._id}/edit`)}
                      style={{ marginRight: 8, padding: '4px 10px', background: '#1f2937', border: '1px solid #30363d', borderRadius: 4, color: '#58a6ff', cursor: 'pointer', fontSize: 13 }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.title)}
                      style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #f85149', borderRadius: 4, color: '#f85149', cursor: 'pointer', fontSize: 13 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {problems.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, color: '#8b949e', textAlign: 'center' }}>No problems yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
