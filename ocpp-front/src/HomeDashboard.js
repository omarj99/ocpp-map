import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Users, Lightning, BarChart2, Menu } from 'lucide-react';

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: <BarChart2 className="w-6 h-6 mr-2" /> },
  { to: '/users', label: 'User Management', icon: <Users className="w-6 h-6 mr-2" /> },
  { to: '/chargers', label: 'Charger Management', icon: <Lightning className="w-6 h-6 mr-2 text-yellow-500" /> },
];

const HomeDashboard = () => {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-blue-200">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl border-r border-blue-100 flex flex-col py-8 px-4">
        <div className="flex items-center mb-10">
          <Menu className="w-8 h-8 text-blue-700 mr-2" />
          <span className="text-2xl font-bold text-blue-900">OCPP Admin</span>
        </div>
        <nav className="flex flex-col gap-2">
          {sidebarLinks.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg font-medium transition ${
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-blue-800 hover:bg-blue-50'
                }`
              }
              end={link.to === '/dashboard'}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-10 text-xs text-blue-300 text-center">
          &copy; {new Date().getFullYear()} OCPP Platform
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10 flex flex-col">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-8">Dashboard</h1>
        {/* Example dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border-t-4 border-blue-400">
            <BarChart2 className="w-10 h-10 text-blue-500 mb-2" />
            <span className="text-2xl font-bold text-blue-900">Overview</span>
            <span className="text-blue-600 mt-2 text-center">Quick stats and system health</span>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border-t-4 border-yellow-400">
            <Lightning className="w-10 h-10 text-yellow-500 mb-2" />
            <span className="text-2xl font-bold text-blue-900">Chargers</span>
            <span className="text-blue-600 mt-2 text-center">Monitor and control charging points</span>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center border-t-4 border-blue-600">
            <Users className="w-10 h-10 text-blue-600 mb-2" />
            <span className="text-2xl font-bold text-blue-900">Users</span>
            <span className="text-blue-600 mt-2 text-center">Manage users and roles</span>
          </div>
        </div>
        {/* Render nested routes here */}
        <Outlet />
      </main>
    </div>
  );
};

export default HomeDashboard;
