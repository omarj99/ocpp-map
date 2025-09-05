import TransactionManagement from './TransactionManagement';
// AppRoutes.js - Complete implementation with enhanced dashboard
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import Login from './Login';
import Register from './Register';
import ProtectedRoute from './ProtectedRoute';
import { isAuthenticated, removeToken } from './auth';
import { 
  Settings, 
  Bell, 
  Mail, 
  Smartphone, 
  Shield, 
  User, 
  Globe, 
  Database,
  Moon,
  Sun,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Key,
  Clock,
  Zap,
  Battery,
  DollarSign,
  BarChart3,
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Users,
  Star,
  AlertTriangle,
  Activity,
  Calendar,
  Target
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Import your existing components
import FeedbackPage from './FeedbackPage';
import OCPPChargerController from './ChargerController';
import EVChargingManagement from './ChargerManagement';
import HomePage from './HomePage';
import UserManagementModern from './UserManagementModern';

// Simple auth helper
const getToken = () => {
  return localStorage?.getItem('token');
};

// Enhanced Dashboard component with charts and KPIs
const DashboardComponent = () => {
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    inactiveUsers: 0,
    newUsersThisMonth: 0,
    userGrowthRate: 0
  });

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // API endpoints
  const API_URL = 'http://localhost:8080/api/users';

  // Extended mock data for charts and KPIs
  const mockChargerStats = {
    totalChargers: 25,
    activeChargers: 22,
    maintenanceChargers: 2,
    offlineChargers: 1,
    utilizationRate: 78,
    averageSessionTime: 45,
    totalSessions: 1250,
    totalEnergy: 15600
  };

  const mockFeedbackStats = {
    totalFeedback: 156,
    averageRating: 4.2,
    newFeedback: 8,
    resolvedIssues: 12,
    pendingReviews: 15,
    satisfactionRate: 87
  };

  const mockRevenueStats = {
    monthlyRevenue: 45600,
    revenueGrowth: 12.3,
    averageRevenuePerUser: 89.50,
    totalRevenue: 234500
  };

  // Chart data
  const userGrowthData = [
    { month: 'Jan', users: 45, newUsers: 8 },
    { month: 'Feb', users: 52, newUsers: 7 },
    { month: 'Mar', users: 61, newUsers: 9 },
    { month: 'Apr', users: 68, newUsers: 7 },
    { month: 'May', users: 76, newUsers: 8 },
    { month: 'Jun', users: 85, newUsers: 9 },
    { month: 'Jul', users: 94, newUsers: 9 },
    { month: 'Aug', users: Math.max(dashboardStats.totalUsers, 102), newUsers: dashboardStats.newUsersThisMonth }
  ];

  const chargerUtilizationData = [
    { station: 'Downtown A', utilization: 85, sessions: 145 },
    { station: 'Mall B', utilization: 72, sessions: 98 },
    { station: 'Highway C', utilization: 91, sessions: 167 },
    { station: 'Office D', utilization: 64, sessions: 78 },
    { station: 'Airport E', utilization: 88, sessions: 134 },
    { station: 'Hotel F', utilization: 69, sessions: 89 }
  ];

  const feedbackTrendData = [
    { month: 'Jan', rating: 4.1, feedback: 15 },
    { month: 'Feb', rating: 4.2, feedback: 18 },
    { month: 'Mar', rating: 4.0, feedback: 22 },
    { month: 'Apr', rating: 4.3, feedback: 19 },
    { month: 'May', rating: 4.1, feedback: 25 },
    { month: 'Jun', rating: 4.4, feedback: 28 },
    { month: 'Jul', rating: 4.2, feedback: 24 },
    { month: 'Aug', rating: mockFeedbackStats.averageRating, feedback: mockFeedbackStats.newFeedback }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 38500 },
    { month: 'Feb', revenue: 41200 },
    { month: 'Mar', revenue: 39800 },
    { month: 'Apr', revenue: 43100 },
    { month: 'May', revenue: 44800 },
    { month: 'Jun', revenue: 46200 },
    { month: 'Jul', revenue: 44900 },
    { month: 'Aug', revenue: mockRevenueStats.monthlyRevenue }
  ];

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Fetch real user data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        const response = await fetch(API_URL, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        const userList = Array.isArray(data) ? data : Array.isArray(data.users) ? data.users : [];
        
        setUsers(userList);
        calculateDashboardStats(userList);
        
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        showToast('Failed to load user data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Calculate dashboard statistics
  const calculateDashboardStats = (userList) => {
    const totalUsers = userList.length;
    const activeUsers = userList.filter(u => u.status === 'active').length;
    const adminUsers = userList.filter(u => u.role === 'admin').length;
    const inactiveUsers = userList.filter(u => u.status === 'inactive').length;
    
    const currentMonth = new Date().getMonth();
    const newUsersThisMonth = Math.floor(totalUsers * 0.15);
    const userGrowthRate = totalUsers > 0 ? ((newUsersThisMonth / totalUsers) * 100).toFixed(1) : 0;

    setDashboardStats({
      totalUsers,
      activeUsers,
      adminUsers,
      inactiveUsers,
      newUsersThisMonth,
      userGrowthRate: parseFloat(userGrowthRate)
    });
  };

  // User distribution data for pie chart
  const userDistributionData = users.reduce((acc, user) => {
    const role = user.role || 'user';
    const existing = acc.find(item => item.name === role);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: role, value: 1 });
    }
    return acc;
  }, []);

  const formatPercentage = (value, total) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`px-4 py-3 rounded shadow-lg text-white font-medium transition 
              ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">EV Charging Network Dashboard</h1>
            <p className="text-blue-100 mt-1">
              Analytics and performance metrics for your charging infrastructure
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">Today</div>
            <div className="text-lg font-semibold">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-200 to-blue-100 p-6 rounded-lg border shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-blue-800">{dashboardStats.totalUsers}</div>
              <div className="text-sm text-blue-900">Total Users</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+{dashboardStats.userGrowthRate}% this month</span>
              </div>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-200 to-green-100 p-6 rounded-lg border shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-800">{formatCurrency(mockRevenueStats.monthlyRevenue)}</div>
              <div className="text-sm text-green-900">Monthly Revenue</div>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-sm text-green-600">+{mockRevenueStats.revenueGrowth}% MoM</span>
              </div>
            </div>
            <DollarSign className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-200 to-yellow-100 p-6 rounded-lg border shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-800">{mockChargerStats.utilizationRate}%</div>
              <div className="text-sm text-yellow-900">Network Utilization</div>
              <div className="flex items-center mt-2">
                <Target className="w-4 h-4 text-yellow-600 mr-1" />
                <span className="text-sm text-yellow-600">{mockChargerStats.totalSessions} sessions</span>
              </div>
            </div>
            <Zap className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-200 to-purple-100 p-6 rounded-lg border shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-purple-800">{mockFeedbackStats.satisfactionRate}%</div>
              <div className="text-sm text-purple-900">Satisfaction Rate</div>
              <div className="flex items-center mt-2">
                <Star className="w-4 h-4 text-purple-600 mr-1" />
                <span className="text-sm text-purple-600">{mockFeedbackStats.averageRating}/5.0 rating</span>
              </div>
            </div>
            <Shield className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">{mockChargerStats.totalEnergy.toLocaleString()} kWh</div>
              <div className="text-xs text-gray-600">Energy Delivered</div>
            </div>
            <Battery className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">{mockChargerStats.averageSessionTime}min</div>
              <div className="text-xs text-gray-600">Avg Session Time</div>
            </div>
            <Clock className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(mockRevenueStats.averageRevenuePerUser)}</div>
              <div className="text-xs text-gray-600">Revenue per User</div>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xl font-bold text-gray-900">{mockFeedbackStats.pendingReviews}</div>
              <div className="text-xs text-gray-600">Pending Reviews</div>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Additional Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-lg shadow text-white">
          <div className="flex items-center">
            <div>
              <div className="text-2xl font-bold">98.2%</div>
              <div className="text-sm opacity-90">Uptime</div>
            </div>
            <Activity className="w-8 h-8 ml-auto opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-4 rounded-lg shadow text-white">
          <div className="flex items-center">
            <div>
              <div className="text-2xl font-bold">2.1s</div>
              <div className="text-sm opacity-90">Response Time</div>
            </div>
            <Zap className="w-8 h-8 ml-auto opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-lg shadow text-white">
          <div className="flex items-center">
            <div>
              <div className="text-2xl font-bold">156</div>
              <div className="text-sm opacity-90">Active Sessions</div>
            </div>
            <Battery className="w-8 h-8 ml-auto opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 rounded-lg shadow text-white">
          <div className="flex items-center">
            <div>
              <div className="text-2xl font-bold">94%</div>
              <div className="text-sm opacity-90">Success Rate</div>
            </div>
            <Target className="w-8 h-8 ml-auto opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 rounded-lg shadow text-white">
          <div className="flex items-center">
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm opacity-90">Issues Today</div>
            </div>
            <AlertTriangle className="w-8 h-8 ml-auto opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-4 rounded-lg shadow text-white">
          <div className="flex items-center">
            <div>
              <div className="text-2xl font-bold">8.5k</div>
              <div className="text-sm opacity-90">Monthly kWh</div>
            </div>
            <Zap className="w-8 h-8 ml-auto opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            User Growth Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="users" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Area type="monotone" dataKey="newUsers" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Revenue Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charger Status Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Battery className="w-5 h-5 mr-2" />
            Charger Status
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Online', value: mockChargerStats.activeChargers },
                  { name: 'Maintenance', value: mockChargerStats.maintenanceChargers },
                  { name: 'Offline', value: mockChargerStats.offlineChargers }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#F59E0B" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            User Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Feedback Rating Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2" />
            Rating Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: '5 Stars', value: 68 },
                  { name: '4 Stars', value: 45 },
                  { name: '3 Stars', value: 28 },
                  { name: '2 Stars', value: 10 },
                  { name: '1 Star', value: 5 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10B981" />
                <Cell fill="#3B82F6" />
                <Cell fill="#F59E0B" />
                <Cell fill="#F97316" />
                <Cell fill="#EF4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Station Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Station Performance Overview
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chargerUtilizationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="station" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="utilization" fill="#F59E0B" name="Utilization %" />
            <Bar dataKey="sessions" fill="#3B82F6" name="Total Sessions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/users'}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Manage Users</h4>
              <p className="text-gray-600">Add, edit, or remove users</p>
              <p className="text-sm text-blue-600 mt-1">{dashboardStats.activeUsers} active users</p>
            </div>
            <User className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/chargers'}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Charger Network</h4>
              <p className="text-gray-600">Monitor and manage chargers</p>
              <p className="text-sm text-green-600 mt-1">{mockChargerStats.activeChargers}/{mockChargerStats.totalChargers} online</p>
            </div>
            <Battery className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/feedback'}>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Customer Feedback</h4>
              <p className="text-gray-600">Review and respond to feedback</p>
              <p className="text-sm text-purple-600 mt-1">{mockFeedbackStats.pendingReviews} pending reviews</p>
            </div>
            <MessageSquare className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingsComponent = () => {
  // State for all settings categories
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    alerts: true,
    maintenance: false,
    reports: true
  });

  const [security, setSecurity] = useState({
    twoFactor: false,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordExpiry: 90
  });

  const [system, setSystem] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    currency: 'USD',
    autoBackup: true,
    dataRetention: 365
  });

  const [chargerDefaults, setChargerDefaults] = useState({
    maxPower: 50,
    defaultTariff: 0.25,
    sessionTimeout: 240,
    energyLimit: 100,
    autoStart: true,
    smartCharging: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle save settings
  const handleSaveSettings = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSecurityChange = (key, value) => {
    setSecurity(prev => ({ ...prev, [key]: value }));
  };

  const handleSystemChange = (key, value) => {
    setSystem(prev => ({ ...prev, [key]: value }));
  };

  const handleChargerChange = (key, value) => {
    setChargerDefaults(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Success/Loading Notification */}
      {(saveSuccess || loading) && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-medium transition-all
          ${loading ? 'bg-blue-600' : 'bg-green-600'}`}>
          <div className="flex items-center">
            {loading ? (
              <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5 mr-2" />
            )}
            {loading ? 'Saving settings...' : 'Settings saved successfully!'}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 text-white">
        <div className="flex items-center">
          <Settings className="w-8 h-8 mr-3" />
          <div>
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-gray-300 mt-1">Configure your EV charging management system</p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Notifications Settings */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-6">
            <Bell className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-600">Receive updates via email</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Smartphone className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">SMS Alerts</div>
                  <div className="text-sm text-gray-600">Critical alerts via SMS</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">System Alerts</div>
                  <div className="text-sm text-gray-600">Charger status and errors</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.alerts}
                  onChange={(e) => handleNotificationChange('alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Weekly Reports</div>
                  <div className="text-sm text-gray-600">Automated performance reports</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.reports}
                  onChange={(e) => handleNotificationChange('reports', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-6">
            <Shield className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Security</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Key className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-gray-600">Add extra security to your account</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.twoFactor}
                  onChange={(e) => handleSecurityChange('twoFactor', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Session Timeout (minutes)</label>
              </div>
              <select 
                value={security.sessionTimeout}
                onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Key className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Password Expiry (days)</label>
              </div>
              <input
                type="number"
                value={security.passwordExpiry}
                onChange={(e) => handleSecurityChange('passwordExpiry', parseInt(e.target.value) || 90)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min="30"
                max="365"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Login Alerts</div>
                  <div className="text-sm text-gray-600">Notify on new device login</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={security.loginAlerts}
                  onChange={(e) => handleSecurityChange('loginAlerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-6">
            <Globe className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">System Preferences</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                {system.theme === 'light' ? <Sun className="w-5 h-5 text-gray-600 mr-3" /> : <Moon className="w-5 h-5 text-gray-600 mr-3" />}
                <label className="font-medium">Theme</label>
              </div>
              <select 
                value={system.theme}
                onChange={(e) => handleSystemChange('theme', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Globe className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Language</label>
              </div>
              <select 
                value={system.language}
                onChange={(e) => handleSystemChange('language', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="zh">Chinese</option>
              </select>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Timezone</label>
              </div>
              <select 
                value={system.timezone}
                onChange={(e) => handleSystemChange('timezone', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Berlin">Berlin</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Currency</label>
              </div>
              <select 
                value={system.currency}
                onChange={(e) => handleSystemChange('currency', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Charger Defaults */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center mb-6">
            <Zap className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Charger Defaults</h2>
          </div>
          
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Battery className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Maximum Power (kW)</label>
              </div>
              <input
                type="number"
                value={chargerDefaults.maxPower}
                onChange={(e) => handleChargerChange('maxPower', parseFloat(e.target.value) || 50)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                min="1"
                max="350"
                step="0.1"
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <DollarSign className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Default Tariff ($/kWh)</label>
              </div>
              <input
                type="number"
                value={chargerDefaults.defaultTariff}
                onChange={(e) => handleChargerChange('defaultTariff', parseFloat(e.target.value) || 0.25)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                min="0.01"
                max="2.00"
                step="0.01"
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Session Timeout (minutes)</label>
              </div>
              <input
                type="number"
                value={chargerDefaults.sessionTimeout}
                onChange={(e) => handleChargerChange('sessionTimeout', parseInt(e.target.value) || 240)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                min="5"
                max="1440"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Zap className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Smart Charging</div>
                  <div className="text-sm text-gray-600">Enable load balancing</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chargerDefaults.smartCharging}
                  onChange={(e) => handleChargerChange('smartCharging', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex items-center mb-6">
          <Database className="w-6 h-6 text-indigo-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <Database className="w-5 h-5 text-gray-600 mr-3" />
                <div>
                  <div className="font-medium">Automatic Backup</div>
                  <div className="text-sm text-gray-600">Daily system backups</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={system.autoBackup}
                  onChange={(e) => handleSystemChange('autoBackup', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 text-gray-600 mr-3" />
                <label className="font-medium">Data Retention (days)</label>
              </div>
              <select 
                value={system.dataRetention}
                onChange={(e) => handleSystemChange('dataRetention', parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
                <option value={365}>1 year</option>
                <option value={730}>2 years</option>
                <option value={1095}>3 years</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="font-medium text-gray-900">Export Data</div>
              <div className="text-sm text-gray-600 mb-3">Download all system data</div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                Export Database
              </button>
            </div>

            <div className="p-4 border-2 border-dashed border-red-300 rounded-lg text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
              <div className="font-medium text-red-900">Clear Cache</div>
              <div className="text-sm text-red-600 mb-3">Clear system cache data</div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                Clear Cache
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
// Reports component
const ReportsComponent = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium mb-2">Usage Report</h3>
          <p className="text-sm text-gray-600">View charging session analytics</p>
          <button className="mt-2 text-blue-600 hover:text-blue-800">Generate Report</button>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium mb-2">Revenue Report</h3>
          <p className="text-sm text-gray-600">Financial performance overview</p>
          <button className="mt-2 text-blue-600 hover:text-blue-800">Generate Report</button>
        </div>
      </div>
    </div>
  </div>
);

function AppRoutes() {
  const [auth, setAuth] = useState(isAuthenticated());

  const handleLogin = () => setAuth(true);
  const handleLogout = () => {
    removeToken();
    setAuth(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={auth ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/register" 
          element={auth ? <Navigate to="/dashboard" replace /> : <Register onRegister={() => {}} />} 
        />

        {/* Protected routes with dashboard layout */}
        <Route path="/transactions" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="transactions">
              <TransactionManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="feedback" onLogout={handleLogout}>
              <FeedbackPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="dashboard" onLogout={handleLogout}>
              <DashboardComponent />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="users" onLogout={handleLogout}>
              <UserManagementModern />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/chargers" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="chargers" onLogout={handleLogout}>
              <EVChargingManagement />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/charger" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="controller" onLogout={handleLogout}>
              <OCPPChargerController />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="reports" onLogout={handleLogout}>
              <ReportsComponent />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout currentPage="settings" onLogout={handleLogout}>
              <SettingsComponent />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Legacy routes - redirect to new structure */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />

        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;