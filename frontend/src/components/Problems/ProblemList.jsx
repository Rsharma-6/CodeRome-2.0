import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import CreateRoomModal from '../CreateRoomModal';

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

export default function ProblemList() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ difficulty: 'all', search: '' });
  const [joinRoomId, setJoinRoomId] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [createRoomProblemId, setCreateRoomProblemId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, [filter]);

  useEffect(() => {
    if (!user) return;
    api.get('/user/active-room')
      .then(({ data }) => { if (data.roomId) setActiveRoom(data.roomId); })
      .catch(() => {});
  }, [user]);

  async function fetchProblems() {
    setLoading(true);
    try {
      const params = {};
      if (filter.difficulty !== 'all') params.difficulty = filter.difficulty;
      if (filter.search) params.search = filter.search;
      const { data } = await api.get('/problems', { params });
      setProblems(data.problems || []);
    } catch {
      toast.error('Failed to load problems');
    } finally {
      setLoading(false);
    }
  }

  function handleSolveWithTeam(problemId) {
    setCreateRoomProblemId(problemId || null);
    setShowCreateRoom(true);
  }

  function handleRoomCreated(roomId) {
    setShowCreateRoom(false);
    navigate(`/room/${roomId}`, { state: { username: user?.username } });
  }

  function handleJoinRoom(e) {
    e.preventDefault();
    const id = joinRoomId.trim();
    if (!id) return;
    navigate(`/room/${id}`, { state: { username: user?.username || 'Guest' } });
  }

  return (
    <>
    <div className="min-h-screen bg-bg">
      {/* Navbar */}
      <nav className="sticky top-0 z-20 border-b border-border/60 px-6 py-3.5 flex items-center justify-between backdrop-blur-sm bg-bg/90">
        <Link to="/" className="text-primary font-bold font-code tracking-tight text-lg">{'<CodeRome/>'}</Link>
        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link to="/profile" className="nav-link font-medium">{user.username}</Link>
              {user.isAdmin && (
                <Link
                  to="/admin"
                  className="text-xs text-primary border border-primary/50 px-2.5 py-1 rounded-lg hover:bg-primary/10 transition-colors"
                >
                  Admin
                </Link>
              )}
              {showJoinInput ? (
                <form onSubmit={handleJoinRoom} className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Enter Room ID"
                    className="input-field text-sm py-1.5 px-2.5 w-44"
                  />
                  <button type="submit" className="btn-success text-sm py-1.5 px-3">Go</button>
                  <button
                    type="button"
                    onClick={() => { setShowJoinInput(false); setJoinRoomId(''); }}
                    className="text-muted hover:text-white transition-colors text-sm"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button onClick={() => setShowJoinInput(true)} className="btn-secondary text-sm py-1.5">
                  Join Room
                </button>
              )}
              <Link to="/my-rooms" className="btn-secondary text-sm py-1.5">My Rooms</Link>
              <button onClick={() => handleSolveWithTeam(null)} className="btn-primary text-sm py-1.5">
                + New Room
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">Login</Link>
          )}
        </div>
      </nav>

      {activeRoom && (
        <div className="bg-primary/10 border-b border-primary/30 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-white/80">You have an active room session.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/room/${activeRoom}`, { state: { username: user.username } })}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Rejoin Room →
            </button>
            <button onClick={() => setActiveRoom(null)} className="nav-link text-xs">Dismiss</button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search problems..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="input-field max-w-sm"
          />
          <div className="flex gap-1.5">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setFilter({ ...filter, difficulty: d })}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-150 capitalize font-medium ${
                  filter.difficulty === d
                    ? 'border-primary/60 text-primary bg-primary/10'
                    : 'border-border text-muted hover:border-border/80 hover:text-white/70'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Problems table */}
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface2 text-left">
                <th className="px-4 py-3 w-10 section-label">#</th>
                <th className="px-4 py-3 section-label">Title</th>
                <th className="px-4 py-3 w-28 section-label">Difficulty</th>
                <th className="px-4 py-3 w-40 section-label">Tags</th>
                <th className="px-4 py-3 w-40" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted">
                      <span className="w-4 h-4 border-2 border-muted/30 border-t-muted rounded-full animate-spin" />
                      Loading problems...
                    </div>
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted">
                    No problems found.{' '}
                    {filter.search || filter.difficulty !== 'all' ? (
                      <button
                        onClick={() => setFilter({ difficulty: 'all', search: '' })}
                        className="text-primary hover:underline ml-1"
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                problems.map((p, idx) => (
                  <tr
                    key={p._id}
                    className="border-b border-border/60 last:border-0 hover:bg-surface2/60 transition-colors group"
                  >
                    <td className="px-4 py-3.5 text-muted text-sm font-mono">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/problems/${p._id}`}
                        className="hover:text-primary transition-colors font-medium group-hover:text-primary/90"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`badge-${p.difficulty}`}>{p.difficulty}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 2).map(t => (
                          <span key={t} className="text-xs text-muted/80 bg-surface2 border border-border/60 px-1.5 py-0.5 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleSolveWithTeam(p._id)}
                        className="text-sm text-primary hover:bg-primary/10 border border-primary/40 hover:border-primary/70 px-3 py-1.5 rounded-lg transition-all duration-150 font-medium"
                      >
                        Solve with Team →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {showCreateRoom && (
        <CreateRoomModal
          problemId={createRoomProblemId}
          onClose={() => setShowCreateRoom(false)}
          onCreated={handleRoomCreated}
        />
      )}
    </>
  );
}
