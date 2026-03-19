import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/problems', label: 'Problems' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/rooms', label: 'Rooms' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <aside style={{ width: 240, background: '#161b22', borderRight: '1px solid #30363d', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #30363d' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#58a6ff' }}>CodeRome</div>
          <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>Admin Panel</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 12px',
                borderRadius: 6,
                marginBottom: 4,
                textDecoration: 'none',
                color: isActive ? '#e6edf3' : '#8b949e',
                background: isActive ? '#1f2937' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #30363d' }}>
          <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 8 }}>{user?.username}</div>
          <button
            onClick={handleLogout}
            style={{ background: 'none', border: '1px solid #30363d', color: '#8b949e', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, width: '100%' }}
          >
            Logout
          </button>
        </div>
      </aside>
      {/* Main content */}
      <main style={{ marginLeft: 240, flex: 1, padding: 32 }}>
        <Outlet />
      </main>
    </div>
  );
}
