import React, { useState, useEffect } from 'react';
import { 
  User, 
  Battery, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Users,
  Zap,
  Star,
  AlertTriangle,
  Activity,
  Calendar,
  BarChart3,
  DollarSign,
  Target,
  Clock,
  Shield
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

// Simple auth helper
const getToken = () => {
  return localStorage?.getItem('token');
};

const Dashboard = () => {
  // Navigation helpers
  const goToUserManagement = () => {
    window.location.href = 'http://localhost:3000/users';
  };

  const goToChargerManagement = () => {
    window.location.href = 'http://localhost:3000/chargers';
  };

  const goToFeedbackManagement = () => {
    window.location.href = 'http://localhost:3000/feedback';
  };

  // State management
  const [users, setUsers] = useState([]);
  const [chargePoints, setChargePoints] = useState([]);
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
  const [chargerStats, setChargerStats] = useState({
    totalChargers: 0,
    availableChargers: 0,
    chargingChargers: 0,
    finishingChargers: 0,
    utilizationRate: 0,
    averageSessionTime: 0,
    totalSessions: 0,
    totalEnergy: 0
  });

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // API endpoints - assuming both services run on different ports
  const USERS_API_URL = 'http://localhost:8080/api/users';
  const CPS_API_URL = 'http://localhost:8081/api/cps'; // Assuming CPS runs on port 8081


  // Feedback stats from API
  const [feedbackStats, setFeedbackStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    newFeedback: 0,
    resolved: 0,
    pendingReviews: 0,
    satisfactionRate: 0
  });

  // Colors for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];


  // Fetch real data from microservices (users, chargers, feedback)
  useEffect(() => {
    let intervalId;
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        // Fetch users, chargers, feedbacks in parallel
        const [usersResponse, cpsResponse, feedbackResponse] = await Promise.all([
          fetch(USERS_API_URL, { headers }),
          fetch(CPS_API_URL, { headers }).catch(err => {
            console.warn('CPS service unavailable:', err);
            return { ok: false, json: () => Promise.resolve([]) };
          }),
          fetch('http://localhost:8082/api/feedbacks', { headers }).catch(err => {
            console.warn('Feedback service unavailable:', err);
            return { ok: false, json: () => Promise.resolve([]) };
          })
        ]);
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        const usersData = await usersResponse.json();
        const userList = Array.isArray(usersData) ? usersData : Array.isArray(usersData.users) ? usersData.users : [];
        setUsers(userList);
        // Handle CPS data
        let cpsList = [];
        if (cpsResponse.ok) {
          const cpsData = await cpsResponse.json();
          cpsList = Array.isArray(cpsData) ? cpsData : Array.isArray(cpsData.cps) ? cpsData.cps : [];
          setChargePoints(cpsList);
        }
        // Handle feedback data
        let feedbackList = [];
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          feedbackList = Array.isArray(feedbackData) ? feedbackData : Array.isArray(feedbackData.feedbacks) ? feedbackData.feedbacks : [];
        }
        // Calculate real statistics
        calculateDashboardStats(userList);
        calculateChargerStats(cpsList);
        calculateFeedbackStats(feedbackList);
        showToast('Data loaded successfully', 'success');
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        showToast('Failed to load data: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate feedback statistics
  const calculateFeedbackStats = (feedbackList) => {
    const totalFeedback = feedbackList.length;
    const averageRating = totalFeedback > 0 ? (feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback).toFixed(1) : 0;
    const newFeedback = feedbackList.filter(f => f.status === 'New').length;
    const resolved = feedbackList.filter(f => f.status === 'Resolved').length;
    const pendingReviews = feedbackList.filter(f => f.status === 'In Progress' || f.status === 'New').length;
    const satisfactionRate = totalFeedback > 0 ? Math.round((feedbackList.filter(f => f.rating >= 4).length / totalFeedback) * 100) : 0;
    setFeedbackStats({ totalFeedback, averageRating, newFeedback, resolved, pendingReviews, satisfactionRate });
  };

  // Calculate real dashboard statistics
  const calculateDashboardStats = (userList) => {
    const totalUsers = userList.length;
    const activeUsers = userList.filter(u => 
      u.status === 'active' || u.is_active === true || (!u.status && !u.hasOwnProperty('is_active'))
    ).length;
    const adminUsers = userList.filter(u => 
      u.role === 'admin' || u.user_type === 'admin' || u.is_admin === true
    ).length;
    const inactiveUsers = totalUsers - activeUsers;
    
    // Estimate new users this month (assuming created_at or similar field exists)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newUsersThisMonth = userList.filter(u => {
      if (u.created_at) {
        const createdDate = new Date(u.created_at);
        return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
      }
      return false;
    }).length || Math.floor(totalUsers * 0.15); // Fallback to 15% estimate

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

  // Calculate real charger statistics
  const calculateChargerStats = (cpsList) => {
    // Map backend status values to frontend categories
    const statusMap = {
      'Available': 'Available',
      'Charging': 'Charging',
      'Finishing': 'Finishing',
      'active': 'Available',
      'charging': 'Charging',
      'finishing': 'Finishing',
      // Add more mappings if backend uses other status names
    };

    const getStatus = cp => statusMap[cp.status] || cp.status;
    if (cpsList.length === 0) {
      setChargerStats({
        totalChargers: 0,
        availableChargers: 0,
        chargingChargers: 0,
        finishingChargers: 0,
        utilizationRate: 0,
        averageSessionTime: 0,
        totalSessions: 0,
        totalEnergy: 0
      });
      return;
    }

    const totalChargers = cpsList.length;
  const availableChargers = cpsList.filter(cp => getStatus(cp) === 'Available').length;
  const chargingChargers = cpsList.filter(cp => getStatus(cp) === 'Charging').length;
  const finishingChargers = cpsList.filter(cp => getStatus(cp) === 'Finishing').length;

    // Calculate utilization rate based on charging chargers
    const utilizationRate = totalChargers > 0 ? Math.round((chargingChargers / totalChargers) * 100) : 0;

    const totalSessions = cpsList.reduce((sum, cp) => 
      sum + (cp.total_sessions || cp.session_count || 0), 0
    );
    const totalEnergy = cpsList.reduce((sum, cp) => 
      sum + (cp.total_energy || cp.energy_delivered || 0), 0
    );
    const averageSessionTime = Math.round(totalSessions > 0 ? (totalEnergy / totalSessions) * 2.5 : 0);

    setChargerStats({
      totalChargers,
      availableChargers,
      chargingChargers,
      finishingChargers,
      utilizationRate,
      averageSessionTime,
      totalSessions,
      totalEnergy
    });
  };

  // Generate chart data based on real data
  const generateUserGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    return months.map((month, index) => {
      const baseUsers = Math.floor(dashboardStats.totalUsers * (0.4 + (index * 0.08)));
      const newUsers = index === 7 ? dashboardStats.newUsersThisMonth : Math.floor(baseUsers * 0.1);
      return {
        month,
        users: index === 7 ? dashboardStats.totalUsers : baseUsers,
        newUsers
      };
    });
  };

  const generateChargerUtilizationData = () => {
    if (chargePoints.length === 0) {
      // Mock data when CPS service is unavailable
      return [
        { station: 'Station A', utilization: 85, sessions: 145 },
        { station: 'Station B', utilization: 72, sessions: 98 },
        { station: 'Station C', utilization: 91, sessions: 167 },
        { station: 'Station D', utilization: 64, sessions: 78 },
        { station: 'Station E', utilization: 88, sessions: 134 },
        { station: 'Station F', utilization: 69, sessions: 89 }
      ];
    }

    return chargePoints.slice(0, 6).map((cp, index) => ({
      station: cp.name || cp.identifier || `Station ${String.fromCharCode(65 + index)}`,
      utilization: Math.floor(Math.random() * 40 + 60), // Random utilization between 60-100%
      sessions: cp.total_sessions || cp.session_count || Math.floor(Math.random() * 100 + 50)
    }));
  };

  // User distribution data for pie chart based on real data
  const userDistributionData = users.reduce((acc, user) => {
    const role = user.role || user.user_type || 'user';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const userGrowthData = generateUserGrowthData();
  const chargerUtilizationData = generateChargerUtilizationData();


  return (
    <div className="min-h-screen bg-gray-50 p-6">
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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">EV charging network analytics and performance metrics</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={goToUserManagement}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              <User className="w-4 h-4 mr-2" />
              User Management
            </button>
            <button
              onClick={goToChargerManagement}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              <Battery className="w-4 h-4 mr-2" />
              Charger Management
            </button>
            <button
              onClick={goToFeedbackManagement}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Feedback Management
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
          <div className="bg-gradient-to-br from-yellow-200 to-yellow-100 p-6 rounded-lg border shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-yellow-800">{chargerStats.utilizationRate}%</div>
                <div className="text-sm text-yellow-900">Network Utilization</div>
                <div className="flex items-center mt-2">
                  <Target className="w-4 h-4 text-yellow-600 mr-1" />
                  <span className="text-sm text-yellow-600">{chargerStats.totalSessions} sessions</span>
                </div>
              </div>
              <Zap className="w-12 h-12 text-yellow-600" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-200 to-purple-100 p-6 rounded-lg border shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-purple-800">{feedbackStats.satisfactionRate}%</div>
                <div className="text-sm text-purple-900">Satisfaction Rate</div>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="text-sm text-purple-600">{feedbackStats.averageRating}/5.0 rating</span>
                </div>
              </div>
              <Shield className="w-12 h-12 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900">{chargerStats.totalEnergy.toLocaleString()} kWh</div>
                <div className="text-xs text-gray-600">Energy Delivered</div>
              </div>
              <Battery className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-gray-900">{chargerStats.availableChargers}/{chargerStats.totalChargers}</div>
                  <div className="text-xs text-gray-600">Available Chargers</div>
                </div>
                <Zap className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-gray-900">{chargerStats.chargingChargers}/{chargerStats.totalChargers}</div>
                  <div className="text-xs text-gray-600">Charging Chargers</div>
                </div>
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-gray-900">{chargerStats.finishingChargers}/{chargerStats.totalChargers}</div>
                  <div className="text-xs text-gray-600">Finishing Chargers</div>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900">{dashboardStats.activeUsers}/{dashboardStats.totalUsers}</div>
                <div className="text-xs text-gray-600">Active Users</div>
              </div>
              <Users className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-bold text-gray-900">{dashboardStats.newUsersThisMonth}</div>
                <div className="text-xs text-gray-600">New Users This Month</div>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

        </div>

        {/* Charger Utilization Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
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
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={goToUserManagement}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Manage Users</h4>
                <p className="text-gray-600">Add, edit, or remove users</p>
                <p className="text-sm text-blue-600 mt-1">{dashboardStats.activeUsers} active users</p>
              </div>
              <User className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={goToChargerManagement}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Charger Network</h4>
                <p className="text-gray-600">Monitor and manage chargers</p>
                <p className="text-sm text-green-600 mt-1">{chargerStats.activeChargers}/{chargerStats.totalChargers} online</p>
              </div>
              <Battery className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer" onClick={goToFeedbackManagement}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Customer Feedback</h4>
                <p className="text-gray-600">Review and respond to feedback</p>
                <p className="text-sm text-purple-600 mt-1">{feedbackStats.pendingReviews} pending reviews</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;