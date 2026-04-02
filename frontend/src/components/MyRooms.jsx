import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import CreateRoomModal from './CreateRoomModal';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    setLoading(true);
    try {
      const { data } = await api.get('/rooms/my');
      setRooms(data.rooms || []);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(roomId) {
    if (!window.confirm('Delete this room? This will also delete all chat history.')) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      setRooms(prev => prev.filter(r => r.roomId !== roomId));
      toast.success('Room deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete room');
    }
  }

  function handleJoin(roomId) {
    navigate(`/room/${roomId}`, { state: { username: user?.username } });
  }

  function handleCreated(roomId) {
    setShowCreate(false);
    navigate(`/room/${roomId}`, { state: { username: user?.username } });
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-primary font-bold font-code">{'<CodeRome />'}</Link>
        <div className="flex items-center gap-3">
          <Link to="/problems" className="text-muted hover:text-white text-sm">Problems</Link>
          <Link to="/profile" className="text-muted hover:text-white text-sm">{user?.username}</Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">My Rooms</h1>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2">
            + New Room
          </button>
        </div>

        {loading ? (
          <div className="text-muted text-center py-16">Loading...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-4">🏠</div>
            <p className="mb-4">No rooms yet. Create one to start collaborating.</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm px-4 py-2">
              Create Room
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map(room => (
              <div key={room.roomId} className="card p-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{room.name}</div>
                  <div className="text-xs text-muted mt-1 flex items-center gap-3">
                    <span>{room.members?.length || 0} member{room.members?.length !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>Active {timeAgo(room.lastActiveAt)}</span>
                    {room.problemId && <span>· Has problem</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleJoin(room.roomId)}
                    className="btn-primary text-sm px-3 py-1.5"
                  >
                    Join
                  </button>
                  <button
                    onClick={() => handleDelete(room.roomId)}
                    className="btn-danger text-sm px-3 py-1.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
