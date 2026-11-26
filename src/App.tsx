import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/pages/Home';
import Login from './components/pages/Login';
import Signup from './components/pages/Signup';
import StudentDashboard from './components/pages/StudentDashboard';
import AdminDashboard from './components/pages/AdminDashboard';
import { User } from './types';

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        if (window.location.pathname.startsWith('/admin')) {
          window.location.replace('/');
          return;
        }
      } else {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          if (window.location.pathname.startsWith('/admin')) {
            window.location.replace('/');
            return;
          }
        }
      }
    }
    setLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bengali text-gov-green">লোড হচ্ছে...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} /> : <Login onLogin={login} />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        
        <Route 
          path="/dashboard/*" 
          element={user?.role === 'student' ? <StudentDashboard user={user} onLogout={logout} onUpdateUser={updateUser} /> : <Navigate to="/login" />} 
        />
        
        <Route 
          path="/admin/*" 
          element={user?.role === 'admin' ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}
