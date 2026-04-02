import { useState } from 'react';
import { api } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function CreateRoomModal({ problemId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/rooms', { name: name.trim(), problemId: problemId || null });
      onCreated(data.roomId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Create Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted block mb-1">Room Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Graph Theory Session"
              maxLength={60}
              className="input-field w-full"
            />
            <div className="text-xs text-muted mt-1 text-right">{name.length}/60</div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={!name.trim() || loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create & Enter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
