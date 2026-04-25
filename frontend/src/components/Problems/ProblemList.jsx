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
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-primary font-bold font-code">{'<CodeRome />'}</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/profile" className="text-muted hover:text-white text-sm">{user.username}</Link>
              {user.isAdmin && (
                <Link to="/admin" className="text-xs text-primary border border-primary px-2 py-1 rounded hover:bg-blue-950 transition-colors">Admin</Link>
              )}
              {showJoinInput ? (
                <form onSubmit={handleJoinRoom} className="flex items-center gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={joinRoomId}
                    onChange={(e) => setJoinRoomId(e.target.value)}
                    placeholder="Enter Room ID"
                    className="input-field text-sm py-1 px-2 w-44"
                  />
                  <button type="submit" className="btn-success text-sm">Go</button>
                  <button type="button" onClick={() => { setShowJoinInput(false); setJoinRoomId(''); }} className="text-muted hover:text-white text-sm">✕</button>
                </form>
              ) : (
                <button onClick={() => setShowJoinInput(true)} className="btn-secondary text-sm">
                  Join Room
                </button>
              )}
              <Link to="/my-rooms" className="btn-secondary text-sm">My Rooms</Link>
              <button onClick={() => handleSolveWithTeam(null)} className="btn-primary text-sm">
                New Room
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-primary text-sm">Login</Link>
          )}
        </div>
      </nav>

      {activeRoom && (
        <div className="bg-blue-950 border-b border-primary/40 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-white">You have an active room session.</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/room/${activeRoom}`, { state: { username: user.username } })}
              className="btn-primary text-sm px-4 py-1.5"
            >
              Rejoin Room
            </button>
            <button onClick={() => setActiveRoom(null)} className="text-muted hover:text-white text-sm">Dismiss</button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="🔍 Search problems..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            className="input-field max-w-sm"
          />
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setFilter({ ...filter, difficulty: d })}
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors capitalize ${
                  filter.difficulty === d
                    ? 'border-primary text-primary bg-blue-950'
                    : 'border-border text-muted hover:border-muted'
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
              <tr className="border-b border-border text-left text-muted text-sm">
                <th className="px-4 py-3 w-10">#</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3 w-28">Difficulty</th>
                <th className="px-4 py-3 w-40">Tags</th>
                <th className="px-4 py-3 w-40"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted">Loading...</td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted">
                    No problems found.{' '}
                    {filter.search || filter.difficulty !== 'all' ? (
                      <button onClick={() => setFilter({ difficulty: 'all', search: '' })} className="text-primary hover:underline">
                        Clear filters
                      </button>
                    ) : null}
                  </td>
                </tr>
              ) : (
                problems.map((p, idx) => (
                  <tr key={p._id} className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-muted text-sm">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <Link to={`/problems/${p._id}`} className="hover:text-primary transition-colors font-medium">
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge-${p.difficulty}`}>{p.difficulty}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(p.tags || []).slice(0, 2).map(t => (
                          <span key={t} className="text-xs text-muted bg-surface border border-border px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSolveWithTeam(p._id)}
                        className="text-sm text-primary hover:bg-blue-950 border border-primary px-3 py-1 rounded-md transition-colors"
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
