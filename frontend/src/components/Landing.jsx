import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary text-xl font-bold font-code">{'<CodeRome />'}</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/problems" className="btn-primary text-sm">
              Open App
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl font-bold mb-4 leading-tight">
            Code Together.{' '}
            <span className="text-primary">Learn Together.</span>
          </h1>
          <p className="text-muted text-xl mb-8 max-w-2xl mx-auto">
            AI-powered collaborative problem solving for engineering teams.
            Solve LeetCode-style problems together in real-time with a shared AI pair programmer.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to={user ? '/problems' : '/register'} className="btn-primary text-base px-6 py-3">
              Start Solving →
            </Link>
            <Link to="/problems" className="btn-secondary text-base px-6 py-3">
              Browse Problems
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl w-full"
        >
          <div className="card p-6 text-left">
            <div className="text-3xl mb-3">🐳</div>
            <h3 className="font-semibold text-lg mb-2">Own Compiler</h3>
            <p className="text-muted text-sm">
              Docker-sandboxed execution. No third-party APIs. 16 languages, 10s timeout, 256MB memory limit.
            </p>
          </div>
          <div className="card p-6 text-left">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-lg mb-2">AI Pair Programmer</h3>
            <p className="text-muted text-sm">
              Shared AI hints, code reviews, and explanations broadcast to your whole team — not private.
            </p>
          </div>
          <div className="card p-6 text-left">
            <div className="text-3xl mb-3">🎥</div>
            <h3 className="font-semibold text-lg mb-2">Video + Chat</h3>
            <p className="text-muted text-sm">
              WebRTC video call and real-time chat built in. No external tools needed.
            </p>
          </div>
        </motion.div>

        {/* Unique angle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 text-muted text-sm max-w-xl"
        >
          <p className="italic">
            "LeetCode is solo. Copilot is individual. CodeRome brings both together —
            teams solve problems in real-time with a shared AI that facilitates collaboration, not replaces it."
          </p>
        </motion.div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-muted text-sm">
        CodeRome — Built with ❤️ for collaborative engineering
      </footer>
    </div>
  );
}
