import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { api, useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/problems/progress/me')
      .then(({ data }) => setProgress(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="card p-8 text-center">
          <p className="text-muted mb-4">Please log in to view your profile.</p>
          <Link to="/login" className="btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  const chartData = progress ? [
    { name: 'Easy', count: progress.easyCount, fill: '#3fb950' },
    { name: 'Medium', count: progress.mediumCount, fill: '#d29922' },
    { name: 'Hard', count: progress.hardCount, fill: '#f85149' },
  ] : [];

  async function handleLogout() {
    await logout();
    navigate('/');
    toast.success('Logged out');
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-primary font-bold font-code">{'<CodeRome/>'}</Link>
        <div className="flex items-center gap-3">
          <Link to="/problems" className="text-muted hover:text-white text-sm">Problems</Link>
          <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile header */}
        <div className="card p-6 mb-6 flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
            {user.username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user.username}</h1>
            <p className="text-muted text-sm">{user.email}</p>
            {user.profile?.bio && <p className="text-sm mt-1">{user.profile.bio}</p>}
            <p className="text-muted text-xs mt-2">
              Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-muted text-center py-12">Loading stats...</div>
        ) : progress ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stats */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Problems Solved</h3>
              <div className="text-4xl font-bold text-primary mb-4">{progress.acceptedCount}</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-success">Easy</span>
                  <span>{progress.easyCount}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5">
                  <div className="bg-success h-1.5 rounded-full" style={{ width: `${progress.easyCount > 0 ? Math.min(100, (progress.easyCount / Math.max(progress.acceptedCount, 1)) * 100) : 0}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warning">Medium</span>
                  <span>{progress.mediumCount}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5">
                  <div className="bg-warning h-1.5 rounded-full" style={{ width: `${progress.mediumCount > 0 ? Math.min(100, (progress.mediumCount / Math.max(progress.acceptedCount, 1)) * 100) : 0}%` }} />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-danger">Hard</span>
                  <span>{progress.hardCount}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-1.5">
                  <div className="bg-danger h-1.5 rounded-full" style={{ width: `${progress.hardCount > 0 ? Math.min(100, (progress.hardCount / Math.max(progress.acceptedCount, 1)) * 100) : 0}%` }} />
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Difficulty Breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                  <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#8b949e', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: '6px' }} />
                  <Bar dataKey="count" fill="#58a6ff" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <rect key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent solved */}
            {progress.solvedProblems?.length > 0 && (
              <div className="card p-6 md:col-span-2">
                <h3 className="font-semibold mb-4">Solved Problems</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {progress.solvedProblems.slice(0, 12).map(p => (
                    <Link
                      key={p._id}
                      to={`/problems/${p._id}`}
                      className="bg-bg border border-border rounded p-2 text-sm hover:border-primary transition-colors"
                    >
                      <div className="font-medium truncate">{p.title}</div>
                      <span className={`badge-${p.difficulty} mt-1 inline-block`}>{p.difficulty}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="card p-12 text-center text-muted">
            <p>No stats yet. Solve some problems to see your progress!</p>
            <Link to="/problems" className="btn-primary mt-4 inline-block">Browse Problems</Link>
          </div>
        )}
      </div>
    </div>
  );
}
