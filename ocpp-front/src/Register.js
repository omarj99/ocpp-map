import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Register({ onRegister }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [carType, setCarType] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, car_type: carType, role: 'user' }) // role always user
      });
      let data = {};
      try {
        data = await res.json();
      } catch (jsonErr) {
        // If backend returns no JSON, fallback to empty object
        data = {};
      }
      if (res.ok) {
        if (onRegister) onRegister(data);
        setSuccess(
          <span>
            Registration successful!<br />
            <span className="text-xs text-gray-600">Welcome, {(data && (data.name || data.email)) || email}!<br />Role: {(data && data.role) || 'user'}<br />Status: {(data && data.status) || 'active'}</span><br />You can now log in.
          </span>
        );
        setTimeout(() => navigate('/login'), 1800);
      } else {
        // Log error for debugging
        console.error('Registration error:', data);
        setError(data.message || data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
      console.error('Network error:', err);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="flex flex-col items-center mb-8">
  <img src="/logo.png" alt="Logo" className="w-16 h-16 mb-2 drop-shadow-lg" />
        <span className="text-2xl font-bold text-blue-700 tracking-tight">OCPP Management</span>
      </div>
      <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border border-blue-100">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700 tracking-tight">Sign Up</h2>
        {error && <div className="text-red-500 mb-4 text-center font-medium bg-red-50 border border-red-200 rounded-lg py-2 px-3">{error}</div>}
        {success && <div className="text-green-600 mb-4 text-center font-medium bg-green-50 border border-green-200 rounded-lg py-2 px-3">{success}</div>}
        <div className="mb-5">
          <label className="block mb-2 text-gray-700 font-semibold">Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="border border-blue-200 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/50"
            required
          />
        </div>
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
        <div className="mb-5">
          <label className="block mb-2 text-gray-700 font-semibold">Password</label>
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-blue-200 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/50"
            required
          />
        </div>
        <div className="mb-7">
          <label className="block mb-2 text-gray-700 font-semibold">Car Type</label>
          <input
            type="text"
            placeholder="e.g. Tesla Model 3"
            value={carType}
            onChange={e => setCarType(e.target.value)}
            className="border border-blue-200 p-3 w-full rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none bg-blue-50/50"
            required
          />
        </div>
        <button type="submit" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-lg w-full font-semibold shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
        <div className="flex items-center my-6">
          <div className="flex-grow h-px bg-blue-100" />
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <div className="flex-grow h-px bg-blue-100" />
        </div>
        <div className="flex flex-col items-center mt-2">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span className="text-gray-700 font-semibold text-lg">Already have an account?</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-4 shadow-sm flex flex-col items-center w-full max-w-xs">
            <span className="text-gray-600 mb-2">Sign in to access your dashboard.</span>
            <Link to="/login" className="inline-block px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-lg shadow hover:from-blue-700 hover:to-blue-600 transition-all duration-150">Login</Link>
          </div>
        </div>
      </form>
    </div>
  );
}

export default Register;
