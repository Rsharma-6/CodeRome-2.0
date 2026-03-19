import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { api } from '../../context/AuthContext';
import { useAuth } from '../../context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

export default function ProblemDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/problems/${id}`)
      .then(({ data }) => setProblem(data))
      .catch(() => toast.error('Problem not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center text-muted">Loading...</div>;
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <p className="text-muted">Problem not found.</p>
        <Link to="/problems" className="btn-secondary">Back to Problems</Link>
      </div>
    );
  }

  function handleSolveWithTeam() {
    const roomId = uuidv4();
    navigate(`/room/${roomId}`, { state: { problemId: problem._id, username: user?.username || 'Guest' } });
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/problems" className="text-primary font-bold font-code">← Problems</Link>
        <button onClick={handleSolveWithTeam} className="btn-primary">
          Solve with Team →
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          <span className={`badge-${problem.difficulty}`}>{problem.difficulty}</span>
        </div>

        {problem.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {problem.tags.map(t => (
              <span key={t} className="text-xs text-muted bg-surface border border-border px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="card p-6 mb-6 prose prose-invert max-w-none">
          <ReactMarkdown>{problem.description}</ReactMarkdown>
        </div>

        {problem.testCases?.length > 0 && (
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Example Test Cases</h3>
            <div className="space-y-4">
              {problem.testCases.slice(0, 3).map((tc, i) => (
                <div key={i} className="bg-bg rounded p-3 font-code text-sm">
                  <div className="text-muted mb-1">Example {i + 1}:</div>
                  {tc.input && (
                    <div><span className="text-muted">Input:</span> <span className="text-white">{tc.input}</span></div>
                  )}
                  <div><span className="text-muted">Output:</span> <span className="text-success">{tc.expectedOutput}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
