import { useEffect, useState, useRef } from 'react';
import { api, useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef(null);

  async function fetchUsers(q = '') {
    setLoading(true);
    try {
      const r = await api.get(`/admin/users?search=${encodeURIComponent(q)}`);
      setUsers(r.data.users || r.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  function handleSearch(e) {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val), 300);
  }

  async function toggleAdmin(u) {
    await api.patch(`/admin/users/${u._id}/role`, { isAdmin: !u.isAdmin });
    fetchUsers(search);
  }

  async function toggleBan(u) {
    await api.patch(`/admin/users/${u._id}/ban`, { isBanned: !u.isBanned });
    fetchUsers(search);
  }

  async function handleDelete(u) {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    await api.delete(`/admin/users/${u._id}`);
    fetchUsers(search);
  }

  const th = { padding: '10px 12px', textAlign: 'left', fontSize: 12, color: '#8b949e', fontWeight: 600, borderBottom: '1px solid #30363d', textTransform: 'uppercase' };
  const td = { padding: '12px 12px', borderBottom: '1px solid #21262d', fontSize: 14, color: '#e6edf3' };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: '#e6edf3' }}>Users</h1>
      <input
        style={{ width: '100%', maxWidth: 400, padding: '8px 12px', background: '#161b22', border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 14, marginBottom: 20, boxSizing: 'border-box' }}
        placeholder="Search by username or email..."
        value={search}
        onChange={handleSearch}
      />
      {loading ? (
        <div style={{ color: '#8b949e' }}>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#161b22', border: '1px solid #30363d', borderRadius: 8, overflow: 'hidden' }}>
          <thead>
            <tr>
              <th style={th}>Username</th>
              <th style={th}>Email</th>
              <th style={th}>Status</th>
              <th style={th}>Joined</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const isSelf = u._id === currentUser?._id || u._id === currentUser?.id;
              return (
                <tr key={u._id}>
                  <td style={td}>
                    {u.username}
                    {isSelf && <span style={{ marginLeft: 6, fontSize: 11, color: '#58a6ff' }}>(you)</span>}
                  </td>
                  <td style={td}>{u.email}</td>
                  <td style={td}>
                    {u.isAdmin && <span style={{ marginRight: 6, padding: '2px 8px', background: '#1a3a5c', border: '1px solid #58a6ff', borderRadius: 12, fontSize: 11, color: '#58a6ff' }}>Admin</span>}
                    {u.isBanned && <span style={{ padding: '2px 8px', background: '#3a1a1a', border: '1px solid #f85149', borderRadius: 12, fontSize: 11, color: '#f85149' }}>Banned</span>}
                    {!u.isAdmin && !u.isBanned && <span style={{ color: '#8b949e', fontSize: 12 }}>User</span>}
                  </td>
                  <td style={td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={td}>
                    <button
                      disabled={isSelf}
                      onClick={() => toggleAdmin(u)}
                      style={{ marginRight: 6, padding: '4px 8px', background: 'transparent', border: '1px solid #30363d', borderRadius: 4, color: isSelf ? '#3a3a4a' : '#58a6ff', cursor: isSelf ? 'not-allowed' : 'pointer', fontSize: 12 }}
                    >
                      {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                    </button>
                    <button
                      disabled={isSelf}
                      onClick={() => toggleBan(u)}
                      style={{ marginRight: 6, padding: '4px 8px', background: 'transparent', border: `1px solid ${isSelf ? '#30363d' : u.isBanned ? '#3fb950' : '#d29922'}`, borderRadius: 4, color: isSelf ? '#3a3a4a' : u.isBanned ? '#3fb950' : '#d29922', cursor: isSelf ? 'not-allowed' : 'pointer', fontSize: 12 }}
                    >
                      {u.isBanned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      disabled={isSelf}
                      onClick={() => handleDelete(u)}
                      style={{ padding: '4px 8px', background: 'transparent', border: `1px solid ${isSelf ? '#30363d' : '#f85149'}`, borderRadius: 4, color: isSelf ? '#3a3a4a' : '#f85149', cursor: isSelf ? 'not-allowed' : 'pointer', fontSize: 12 }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, color: '#8b949e', textAlign: 'center' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
