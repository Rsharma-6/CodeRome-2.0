import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: '🐳',
    title: 'Own Compiler',
    desc: 'Docker-sandboxed execution. No third-party APIs. 16 languages, 10s timeout, 256MB memory limit.',
    accent: 'border-primary/30 hover:border-primary/60',
    glow: 'group-hover:shadow-glow-primary',
  },
  {
    icon: '🤖',
    title: 'AI Pair Programmer',
    desc: 'Shared AI hints, code reviews, and explanations broadcast to your whole team — not private.',
    accent: 'border-ai/30 hover:border-ai/60',
    glow: 'group-hover:shadow-glow-ai',
  },
  {
    icon: '🎥',
    title: 'Video + Chat',
    desc: 'WebRTC video call and real-time chat built in. No external tools needed.',
    accent: 'border-success/30 hover:border-success/60',
    glow: '',
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg flex flex-col overflow-hidden">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-80 h-80 bg-ai/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 border-b border-border/60 px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-bg/80">
        <div className="flex items-center gap-2">
          <span className="text-primary text-xl font-bold font-code tracking-tight">{'<CodeRome/>'}</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/problems" className="btn-primary text-sm">
              Open App →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 bg-surface border border-border rounded-full px-3 py-1 text-xs text-muted mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Real-time collaborative coding
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-5 leading-tight tracking-tight whitespace-nowrap">
            Code Together.{' '}
            <span className="gradient-text">Learn Together.</span>
          </h1>
          <p className="text-muted text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered collaborative problem solving for engineering teams.
            Solve LeetCode-style problems in real-time with a shared AI pair programmer.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to={user ? '/problems' : '/register'} className="btn-primary text-base px-7 py-3">
              Start Solving →
            </Link>
            <Link to="/problems" className="btn-secondary text-base px-7 py-3">
              Browse Problems
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-20 max-w-4xl w-full"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className={`group bg-surface border ${f.accent} rounded-xl p-6 text-left transition-all duration-300 ${f.glow}`}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-base mb-2 text-white">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16 max-w-xl"
        >
          <blockquote className="text-muted/70 text-sm italic border-l-2 border-border pl-4 text-left">
            "LeetCode is solo. Copilot is individual. CodeRome brings both together —
            teams solve problems in real-time with a shared AI that facilitates collaboration, not replaces it."
          </blockquote>
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-border/40 px-6 py-4 text-center text-muted/60 text-sm">
        CodeRome — Built with ❤️ for collaborative engineering
      </footer>
    </div>
  );
}
