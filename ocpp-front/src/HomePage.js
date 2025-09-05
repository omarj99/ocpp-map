
import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Zap, BarChart2 } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-200 p-8">
      <div className="max-w-2xl w-full text-center mb-12">
        <h1 className="text-5xl font-extrabold text-blue-900 mb-4 drop-shadow-lg">Welcome to OCPP Platform</h1>
        <p className="text-lg text-blue-700 mb-8">A modern dashboard to manage users and EV charging points with professional UI/UX.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        {/* Home card removed for cleaner landing page */}
        <Link to="/dashboard" className="flex flex-col items-center bg-white rounded-2xl shadow-xl p-8 hover:scale-105 transition-transform border border-blue-100">
          <BarChart2 className="w-14 h-14 text-blue-600 mb-4" />
          <span className="text-2xl font-semibold text-blue-900 mb-2">Dashboard</span>
          <span className="text-blue-600 text-center">Overview and quick stats</span>
        </Link>
        <Link to="/users" className="flex flex-col items-center bg-white rounded-2xl shadow-xl p-8 hover:scale-105 transition-transform border border-blue-100">
          <Users className="w-14 h-14 text-blue-600 mb-4" />
          <span className="text-2xl font-semibold text-blue-900 mb-2">User Management</span>
          <span className="text-blue-600 text-center">Manage users, roles, and access</span>
        </Link>
        <Link to="/chargers" className="flex flex-col items-center bg-white rounded-2xl shadow-xl p-8 hover:scale-105 transition-transform border border-blue-100">
          <Zap className="w-14 h-14 text-yellow-500 mb-4" />
          <span className="text-2xl font-semibold text-blue-900 mb-2">Charger Management</span>
          <span className="text-blue-600 text-center">Monitor and control charging points</span>
        </Link>
      </div>
      <footer className="mt-16 text-blue-400 text-sm text-center w-full">
        &copy; {new Date().getFullYear()} OCPP Platform. All rights reserved.
      </footer>
    </div>
  );
};

export default HomePage;
