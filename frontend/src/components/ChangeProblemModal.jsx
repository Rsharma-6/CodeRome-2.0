import { useState, useEffect } from 'react';
import { api } from '../context/AuthContext';

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'];

export default function ChangeProblemModal({ onSelect, onClose }) {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ difficulty: 'all', search: '' });

  useEffect(() => {
    fetchProblems();
  }, [filter]);

  async function fetchProblems() {
    setLoading(true);
    try {
      const params = {};
      if (filter.difficulty !== 'all') params.difficulty = filter.difficulty;
      if (filter.search) params.search = filter.search;
      const { data } = await api.get('/problems', { params });
      setProblems(data.problems || []);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <h2 className="text-lg font-semibold">Change Problem</h2>
          <button onClick={onClose} className="text-muted hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 flex-shrink-0">
          <input
            type="text"
            placeholder="Search problems..."
            value={filter.search}
            onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
            className="input-field text-sm flex-1"
          />
          <div className="flex gap-2">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setFilter(f => ({ ...f, difficulty: d }))}
                className={`px-2.5 py-1 rounded text-xs border transition-colors capitalize ${
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

        {/* Problem list */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="text-muted text-sm text-center py-8">Loading...</div>
          ) : problems.length === 0 ? (
            <div className="text-muted text-sm text-center py-8">No problems found.</div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-surface">
                <tr className="border-b border-border text-left text-muted text-xs">
                  <th className="px-4 py-2 w-8">#</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2 w-24">Difficulty</th>
                  <th className="px-4 py-2 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {problems.map((p, idx) => (
                  <tr
                    key={p._id}
                    className="border-b border-border last:border-0 hover:bg-surface/50 transition-colors cursor-pointer"
                    onClick={() => onSelect(p._id)}
                  >
                    <td className="px-4 py-2.5 text-muted text-xs">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-sm font-medium">{p.title}</td>
                    <td className="px-4 py-2.5">
                      <span className={`badge-${p.difficulty}`}>{p.difficulty}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        className="text-xs text-primary hover:bg-blue-950 border border-primary px-2.5 py-1 rounded transition-colors"
                        onClick={(e) => { e.stopPropagation(); onSelect(p._id); }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
