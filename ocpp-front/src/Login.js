import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && (data.token || data.access_token)) {
        const token = data.token || data.access_token;
        // Decode JWT to get role
        function parseJwt (token) {
          try {
            return JSON.parse(atob(token.split('.')[1]));
          } catch (e) {
            return null;
          }
        }
        const payload = parseJwt(token);
        const userId = payload && (payload.id || payload.user_id || payload.sub);
        if (!userId) {
          setError('Login failed: user id not found in token.');
          setLoading(false);
          return;
        }
        // Fetch user details to check role
        fetch(`http://localhost:8080/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
          .then(res => res.json())
          .then(user => {
            if (user.role === 'admin' || user.role === 'operator') {
              localStorage.setItem('token', token);
              onLogin();
              navigate('/');
            } else {
              setError('Access denied: only admin or operator can log in.');
            }
          })
          .catch(() => {
            setError('Login failed: could not verify user role.');
          });
      } else {
        setError(data.message || data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="flex flex-col items-center mb-8">
  <img src="/logo.png" alt="Logo" className="w-64 h-64 mb-6 drop-shadow-2xl" />
        <span className="text-2xl font-bold text-blue-700 tracking-tight">OCPP Management</span>
      </div>
      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-blue-100">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700 tracking-tight">Sign In</h2>
        {error && <div className="text-red-500 mb-4 text-center font-medium bg-red-50 border border-red-200 rounded-lg py-2 px-3">{error}</div>}
        <div className="mb-5">
          <label className="block mb-2 text-gray-700 font-semibold">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border border-blue-200 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/50"
            required
          />
        </div>
        <div className="mb-7">
          <label className="block mb-2 text-gray-700 font-semibold">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-blue-200 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/50"
            required
          />
        </div>
        <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg w-full font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">Forgot your password?</span>
          <Link to="/reset-password" className="text-blue-500 text-sm font-medium hover:underline">Reset</Link>
        </div>
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-blue-100" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-blue-100" />
        </div>
        <div className="flex flex-col items-center mt-8">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span className="text-gray-700 font-semibold text-lg">New here?</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 shadow-sm flex flex-col items-center w-full max-w-xs">
            <span className="text-blue-700 mb-2 text-2xl font-extrabold">Create an account to access the OCPP platform.</span>
            <Link to="/register" className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150">Register</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Login;
