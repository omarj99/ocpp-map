import React, { useState, useEffect } from 'react';
import { 
  User, 
  Zap, 
  Search, 
  Filter, 
  Eye, 
  Download, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  ArrowUpDown,
  MessageSquare
} from 'lucide-react';

// Mock data - replace with actual API calls
const mockTransactions = [
  {
    id: 'TXN-001',
    type: 'user',
    date: '2024-01-15T10:30:00Z',
    amount: 25.50,
    transactionType: 'charging',
    status: 'completed',
    userName: 'John Smith',
    userEmail: 'john@example.com',
    chargingStation: 'Station Alpha-01',
    duration: '2h 15m',
    energyConsumed: '45 kWh',
    sessionId: 'SES-001'
  },
  {
    id: 'TXN-002',
    type: 'cp',
    date: '2024-01-15T09:15:00Z',
    amount: 125.00,
    transactionType: 'maintenance',
    status: 'completed',
    chargingPointId: 'CP-ALPHA-01',
    chargingPointName: 'Alpha Mall Station 01',
    description: 'Monthly maintenance fee',
    location: 'Alpha Shopping Mall',
    technician: 'Mike Johnson'
  },
  {
    id: 'TXN-003',
    type: 'user',
    date: '2024-01-14T16:45:00Z',
    amount: 18.75,
    transactionType: 'charging',
    status: 'pending',
    userName: 'Sarah Johnson',
    userEmail: 'sarah@example.com',
    chargingStation: 'Station Beta-03',
    duration: '1h 30m',
    energyConsumed: '28 kWh',
    sessionId: 'SES-002'
  },
  {
    id: 'TXN-004',
    type: 'cp',
    date: '2024-01-14T14:20:00Z',
    amount: 750.00,
    transactionType: 'installation',
    status: 'failed',
    chargingPointId: 'CP-GAMMA-05',
    chargingPointName: 'Gamma Office Park Station 05',
    description: 'New charging point installation',
    location: 'Gamma Business Center',
    technician: 'Alex Chen'
  },
  {
    id: 'TXN-005',
    type: 'user',
    date: '2024-01-13T11:10:00Z',
    amount: 32.20,
    transactionType: 'charging',
    status: 'completed',
    userName: 'Mike Chen',
    userEmail: 'mike@example.com',
    chargingStation: 'Station Gamma-05',
    duration: '3h 00m',
    energyConsumed: '55 kWh',
    sessionId: 'SES-003'
  },
  {
    id: 'TXN-006',
    type: 'cp',
    date: '2024-01-13T08:30:00Z',
    amount: 2100.00,
    transactionType: 'upgrade',
    status: 'completed',
    chargingPointId: 'CP-BETA-03',
    chargingPointName: 'Beta Plaza Station 03',
    description: 'Hardware upgrade to fast charging',
    location: 'Beta Shopping Plaza',
    technician: 'Sarah Williams'
  }
];

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions);
  const [selectedView, setSelectedView] = useState('all'); // 'all', 'user', 'cp'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const ITEMS_PER_PAGE = 10;

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Navigation helpers
  const goToUserManagement = () => {
    window.location.href = 'http://localhost:3000/users';
  };

  const goToChargerManagement = () => {
    window.location.href = 'http://localhost:3000/';
  };

  const goToFeedbackManagement = () => {
    window.location.href = 'http://localhost:3000/feedback';
  };

  // Filter and sort logic
  useEffect(() => {
    let filtered = transactions.filter(transaction => {
      const matchesView = selectedView === 'all' || transaction.type === selectedView;
      const matchesSearch = searchTerm === '' || 
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.userName && transaction.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.chargingPointName && transaction.chargingPointName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.userEmail && transaction.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (transaction.location && transaction.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === '' || transaction.status === statusFilter;
      const matchesType = typeFilter === '' || transaction.transactionType === typeFilter;
      
      return matchesView && matchesSearch && matchesStatus && matchesType;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'date') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else if (sortField === 'amount') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, selectedView, searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  // Calculate statistics
  const stats = {
    total: transactions.length,
    userTransactions: transactions.filter(t => t.type === 'user').length,
    cpTransactions: transactions.filter(t => t.type === 'cp').length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    completedTransactions: transactions.filter(t => t.status === 'completed').length,
    pendingTransactions: transactions.filter(t => t.status === 'pending').length,
    failedTransactions: transactions.filter(t => t.status === 'failed').length
  };

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 opacity-30" />;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
  };

  const handleDownloadReceipt = (transactionId) => {
    showToast(`Receipt for ${transactionId} downloaded successfully`, 'success');
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction Management</h1>
            <p className="text-gray-600">Monitor and manage all user and charging point transactions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </button>
            <button
              onClick={goToUserManagement}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              <User className="w-4 h-4 mr-2" />
              User Management
            </button>
            <button
              onClick={goToChargerManagement}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            >
              <span className="mr-2">⚡</span>
              Charger Management
            </button>
            <button
              onClick={goToFeedbackManagement}
              className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Feedback
            </button>
          </div>
        </div>

        {/* View Toggle - Segmented Control */}
        <div className="mb-6">
          <div className="flex bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setSelectedView('all')}
              className={`px-6 py-2 rounded-md font-medium transition ${
                selectedView === 'all' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Transactions
            </button>
            <button
              onClick={() => setSelectedView('user')}
              className={`px-6 py-2 rounded-md font-medium transition flex items-center gap-2 ${
                selectedView === 'user' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4" />
              User Transactions
            </button>
            <button
              onClick={() => setSelectedView('cp')}
              className={`px-6 py-2 rounded-md font-medium transition flex items-center gap-2 ${
                selectedView === 'cp' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              Charging Point Transactions
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Transactions</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold">{formatAmount(stats.totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">User Transactions</p>
                <p className="text-3xl font-bold">{stats.userTransactions}</p>
              </div>
              <User className="w-8 h-8 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Charging Point Transactions</p>
                <p className="text-3xl font-bold">{stats.cpTransactions}</p>
              </div>
              <Zap className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center border rounded-lg px-3 py-2 bg-gray-50 min-w-64">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none border-none bg-transparent text-gray-800 flex-1"
              />
            </div>

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400"
            >
              <option value="">All Types</option>
              <option value="charging">Charging</option>
              <option value="maintenance">Maintenance</option>
              <option value="installation">Installation</option>
              <option value="upgrade">Upgrade</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">
                {filteredTransactions.length} of {stats.total} transactions
              </span>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('id')} 
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      ID <SortIcon field="id" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('date')} 
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Date <SortIcon field="date" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button 
                      onClick={() => handleSort('amount')} 
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      Amount <SortIcon field="amount" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer/Charging Point</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</span>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-400 text-lg">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{transaction.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {transaction.type === 'user' ? (
                            <div className="flex items-center">
                              <User className="w-4 h-4 text-blue-600 mr-2" />
                              <span className="text-sm text-blue-600 font-medium">User</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Zap className="w-4 h-4 text-orange-600 mr-2" />
                              <span className="text-sm text-orange-600 font-medium">Charging Point</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatAmount(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {transaction.type === 'user' ? transaction.userName : transaction.chargingPointName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {transaction.type === 'user' ? transaction.userEmail : transaction.location}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(transaction.status)}`}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1 capitalize">{transaction.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(transaction)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(transaction.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredTransactions.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredTransactions.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Details Modal */}
        {showModal && selectedTransaction && (
          <TransactionModal 
            transaction={selectedTransaction} 
            onClose={() => {
              setShowModal(false);
              setSelectedTransaction(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

const TransactionModal = ({ transaction, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {transaction.type === 'user' ? (
                  <User className="w-8 h-8 text-blue-600" />
                ) : (
                  <Zap className="w-8 h-8 text-orange-600" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{transaction.id}</h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {transaction.type === 'user' ? 'User' : 'Charging Point'} Transaction
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(transaction.amount)}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${
                  transaction.status === 'completed' ? 'bg-green-500' : 
                  transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {transaction.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {transaction.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                  {transaction.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
              </div>
            </div>

            {/* Transaction Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">{transaction.id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium">
                      {new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }).format(new Date(transaction.date))}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Type:</span>
                    <span className="font-medium capitalize">{transaction.transactionType}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold text-lg text-green-600">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(transaction.amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer/Charging Point Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  {transaction.type === 'user' ? 'Customer Information' : 'Charging Point Information'}
                </h4>
                
                <div className="space-y-3">
                  {transaction.type === 'user' ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Customer Name:</span>
                        <span className="font-medium">{transaction.userName}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{transaction.userEmail}</span>
                      </div>
                      
                      {transaction.chargingStation && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Charging Station:</span>
                          <span className="font-medium">{transaction.chargingStation}</span>
                        </div>
                      )}
                      
                      {transaction.duration && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium">{transaction.duration}</span>
                        </div>
                      )}
                      
                      {transaction.energyConsumed && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Energy Consumed:</span>
                          <span className="font-medium">{transaction.energyConsumed}</span>
                        </div>
                      )}

                      {transaction.sessionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Session ID:</span>
                          <span className="font-medium">{transaction.sessionId}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Charging Point ID:</span>
                        <span className="font-medium">{transaction.chargingPointId}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Charging Point Name:</span>
                        <span className="font-medium">{transaction.chargingPointName}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{transaction.location}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">Description:</span>
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                      
                      {transaction.technician && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Technician:</span>
                          <span className="font-medium">{transaction.technician}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            {transaction.type === 'user' && transaction.transactionType === 'charging' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="font-semibold text-blue-900 mb-2">Charging Session Details</h5>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-700">{transaction.energyConsumed}</div>
                    <div className="text-blue-600">Energy Used</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-700">{transaction.duration}</div>
                    <div className="text-blue-600">Session Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-blue-700">
                      ${(transaction.amount / parseFloat(transaction.energyConsumed)).toFixed(2)}/kWh
                    </div>
                    <div className="text-blue-600">Rate</div>
                  </div>
                </div>
              </div>
            )}

            {transaction.type === 'cp' && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <h5 className="font-semibold text-orange-900 mb-2">Charging Point Operation</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-bold text-orange-700">{transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1)}</div>
                    <div className="text-orange-600">Service Type</div>
                  </div>
                  <div>
                    <div className="font-bold text-orange-700">{transaction.technician || 'System'}</div>
                    <div className="text-orange-600">Performed By</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-6 border-t">
              <button
                onClick={() => {
                  // Handle download receipt
                  console.log('Download receipt for:', transaction.id);
                }}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </button>
              
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;