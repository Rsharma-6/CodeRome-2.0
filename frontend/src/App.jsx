import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Landing from './components/Landing';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProblemList from './components/Problems/ProblemList';
import ProblemDetail from './components/Problems/ProblemDetail';
import EditorPage from './components/EditorPage';
import Profile from './components/Profile';
import Home from './components/Home'; // keep old home for /home route
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import AdminProblems from './components/admin/AdminProblems';
import ProblemForm from './components/admin/ProblemForm';
import AdminUsers from './components/admin/AdminUsers';
import AdminRooms from './components/admin/AdminRooms';

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || !user.isAdmin) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-center" toastOptions={{ style: { background: '#161b22', color: '#fff', border: '1px solid #30363d' } }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/problems" element={<ProblemList />} />
        <Route path="/problems/:id" element={<ProblemDetail />} />
        <Route path="/room/:roomId" element={<EditorPage />} />
        <Route path="/profile" element={<Profile />} />
        {/* Legacy route — keep old home page accessible */}
        <Route path="/editor/:roomId" element={<EditorPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="problems" element={<AdminProblems />} />
          <Route path="problems/new" element={<ProblemForm />} />
          <Route path="problems/:id/edit" element={<ProblemForm />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="rooms" element={<AdminRooms />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
