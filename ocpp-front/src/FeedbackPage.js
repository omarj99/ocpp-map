
import { Search, Trash2, Star, MessageSquare, User, Plus, Edit, Eye } from 'lucide-react';
import React, { useState, useEffect } from 'react';

// API endpoint
const FEEDBACK_API_URL = 'http://localhost:8082/api/feedbacks';

// Simple auth helper
const getToken = () => {
  return localStorage?.getItem('token');
};

const FeedbackManagement = ({ onLogout }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  // Fetch feedback from API
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const token = getToken();
        if (!token) throw new Error('No authentication token found');
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        const response = await fetch(FEEDBACK_API_URL, { headers });
        if (!response.ok) throw new Error('Failed to fetch feedback');
        const data = await response.json();
        const feedbacks = Array.isArray(data) ? data : Array.isArray(data.feedbacks) ? data.feedbacks : [];
        setFeedbackList(feedbacks);
      } catch (err) {
        showToast('Failed to load feedback: ' + (err.message || 'Unknown error'), 'error');
      }
    };
    fetchFeedback();
  }, []);
  const [enrichedFeedback, setEnrichedFeedback] = useState([]);
  const [filteredFeedback, setFilteredFeedback] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dateSubmitted');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Form state for create/edit
  const [formData, setFormData] = useState({
    userName: '',
    chargerId: '',
    chargerName: '',
    rating: 5,
    comment: '',
    category: 'Service Quality',
    status: 'New',
    response: ''
  });

  // Enrich feedback with user statistics
  useEffect(() => {
    const userStats = {};
    
    // Calculate user statistics
    feedbackList.forEach(feedback => {
      if (!userStats[feedback.userId]) {
        userStats[feedback.userId] = {
          totalReviews: 0,
          totalReports: 0
        };
      }
      userStats[feedback.userId].totalReviews++;
      
      // Count as report if rating <= 2 or technical issue
      if (feedback.rating <= 2 || feedback.category === 'Technical Issue') {
        userStats[feedback.userId].totalReports++;
      }
    });

    // Enrich feedback with user stats
    const enriched = feedbackList.map(feedback => ({
      ...feedback,
      userTotalReviews: userStats[feedback.userId].totalReviews,
      userTotalReports: userStats[feedback.userId].totalReports
    }));

    setEnrichedFeedback(enriched);
  }, [feedbackList]);

  // Filter and sort logic
  useEffect(() => {
    let filtered = enrichedFeedback.filter(feedback => {
      const matchesSearch = 
        feedback.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.chargerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = ratingFilter ? feedback.rating === parseInt(ratingFilter) : true;
      const matchesStatus = statusFilter ? feedback.status === statusFilter : true;
      const matchesCategory = categoryFilter ? feedback.category === categoryFilter : true;
      
      return matchesSearch && matchesRating && matchesStatus && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'dateSubmitted') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
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

    setCurrentPage(1);
    setFilteredFeedback(filtered);
  }, [enrichedFeedback, searchTerm, sortField, sortDirection, ratingFilter, statusFilter, categoryFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredFeedback.length / ITEMS_PER_PAGE);
  const paginatedFeedback = filteredFeedback.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const openModal = (mode, feedback = null) => {
    setModalMode(mode);
    setSelectedFeedback(feedback);
    
    if (mode === 'create') {
      setFormData({
        userName: '',
        chargerId: '',
        chargerName: '',
        rating: 5,
        comment: '',
        category: 'Service Quality',
        status: 'New',
        response: ''
      });
    } else if (mode === 'edit' && feedback) {
      setFormData({
        userName: feedback.userName,
        chargerId: feedback.chargerId,
        chargerName: feedback.chargerName,
        rating: feedback.rating,
        comment: feedback.comment,
        category: feedback.category,
        status: feedback.status,
        response: feedback.response || ''
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
    setModalMode('view');
    setFormData({
      userName: '',
      chargerId: '',
      chargerName: '',
      rating: 5,
      comment: '',
      category: 'Service Quality',
      status: 'New',
      response: ''
    });
  };

  // Create or update feedback via API
  const handleSubmit = async () => {
    const token = getToken();
    if (!token) {
      showToast('No authentication token found', 'error');
      return;
    }
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    try {
      if (modalMode === 'create') {
        const response = await fetch(FEEDBACK_API_URL, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to create feedback');
        showToast('Feedback created successfully', 'success');
      } else if (modalMode === 'edit' && selectedFeedback) {
        const response = await fetch(`${FEEDBACK_API_URL}/${selectedFeedback.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
        if (!response.ok) throw new Error('Failed to update feedback');
        showToast('Feedback updated successfully', 'success');
      }
      // Refresh feedback list
      const refreshed = await fetch(FEEDBACK_API_URL, { headers });
      const refreshedData = await refreshed.json();
      setFeedbackList(Array.isArray(refreshedData) ? refreshedData : Array.isArray(refreshedData.feedbacks) ? refreshedData.feedbacks : []);
      closeModal();
    } catch (err) {
      showToast((modalMode === 'create' ? 'Create' : 'Update') + ' failed: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  // Delete feedback via API
  const deleteFeedback = async (id) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    const token = getToken();
    if (!token) {
      showToast('No authentication token found', 'error');
      return;
    }
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    try {
      const response = await fetch(`${FEEDBACK_API_URL}/${id}`, { method: 'DELETE', headers });
      if (!response.ok) throw new Error('Failed to delete feedback');
      showToast('Feedback deleted successfully', 'success');
      // Refresh feedback list
      const refreshed = await fetch(FEEDBACK_API_URL, { headers });
      const refreshedData = await refreshed.json();
      setFeedbackList(Array.isArray(refreshedData) ? refreshedData : Array.isArray(refreshedData.feedbacks) ? refreshedData.feedbacks : []);
    } catch (err) {
      showToast('Delete failed: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Feedback Management</h1>
            <p className="text-gray-600">Review and manage customer feedback for charging stations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openModal('create')}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Feedback
            </button>
            <button
              onClick={() => { window.location.href = 'http://localhost:3000/chargers'; }}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              <span className="mr-2">⚡</span>
              Charger Management
            </button>
            <button
              onClick={() => { window.location.href = 'http://localhost:3000/users'; }}
              className="flex items-center px-6 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
            >
              <User className="w-4 h-4 mr-2" />
              User Management
            </button>
          </div>
        </div>

        {/* Filter/Search Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <Search className="w-4 h-4 text-gray-400 mr-1" />
            <input
              type="text"
              placeholder="Search by user, charger, comment..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="outline-none border-none bg-transparent text-gray-800 w-48"
            />
          </div>
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="In Progress">In Progress</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Categories</option>
            <option value="Service Quality">Service Quality</option>
            <option value="Technical Issue">Technical Issue</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Pricing">Pricing</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-200 to-gray-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-gray-900">{feedbackList.length}</div>
            <div className="text-sm text-gray-700">Total Feedback</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-200 to-yellow-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-yellow-800">
              {(feedbackList.reduce((sum, f) => sum + f.rating, 0) / feedbackList.length || 0).toFixed(1)}
            </div>
            <div className="text-sm text-yellow-900">Average Rating</div>
          </div>
          <div className="bg-gradient-to-br from-red-200 to-red-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-red-800">
              {feedbackList.filter(f => f.status === 'New').length}
            </div>
            <div className="text-sm text-red-900">New Feedback</div>
          </div>
          <div className="bg-gradient-to-br from-green-200 to-green-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-green-800">
              {feedbackList.filter(f => f.status === 'Resolved').length}
            </div>
            <div className="text-sm text-green-900">Resolved</div>
          </div>
        </div>

        {/* Feedback Table */}
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('dateSubmitted')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Date <SortIcon field="dateSubmitted" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('userName')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    User <SortIcon field="userName" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('userTotalReviews')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Nbr Reviews <SortIcon field="userTotalReviews" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('chargerName')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Charger Name <SortIcon field="chargerName" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('rating')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Rating <SortIcon field="rating" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('userTotalReports')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Nb Reports <SortIcon field="userTotalReports" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedFeedback.map(feedback => (
                <tr key={feedback.id} className="hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-600">
                    {formatDate(feedback.dateSubmitted)}
                  </td>
                  <td className="p-4 font-medium">{feedback.userName}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-blue-100 bg-blue-600 rounded-full">
                      {feedback.userTotalReviews}
                    </span>
                  </td>
                  <td className="p-4">{feedback.chargerName}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {renderStars(feedback.rating)}
                      <span className="ml-1 text-sm text-gray-600">({feedback.rating})</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                      feedback.userTotalReports > 0 ? 'text-red-100 bg-red-600' : 'text-green-100 bg-green-600'
                    }`}>
                      {feedback.userTotalReports}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`rounded-md py-0.5 px-2.5 border border-transparent text-sm text-white transition-all shadow-sm 
                      ${feedback.status === 'New' ? 'bg-red-500' : 
                        feedback.status === 'In Progress' ? 'bg-yellow-500' : 
                        feedback.status === 'Reviewed' ? 'bg-blue-500' : 'bg-green-500'}`}
                    >
                      {feedback.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openModal('view', feedback)}
                        className="p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openModal('edit', feedback)}
                        className="p-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-700"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteFeedback(feedback.id)}
                        className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              <button 
                onClick={() => handlePageChange(currentPage - 1)} 
                disabled={currentPage === 1} 
                className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`px-3 py-1 rounded border ${currentPage === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button 
                onClick={() => handlePageChange(currentPage + 1)} 
                disabled={currentPage === totalPages} 
                className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal for View/Edit/Create */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
                {modalMode === 'create' ? 'Add New Feedback' : 
                 modalMode === 'edit' ? 'Edit Feedback' : 'Feedback Details'}
              </h2>
              
              {modalMode === 'view' && selectedFeedback ? (
                // View Mode
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div><span className="font-medium">User:</span> {selectedFeedback.userName}</div>
                      <div><span className="font-medium">Charger:</span> {selectedFeedback.chargerName}</div>
                      <div><span className="font-medium">Date:</span> {formatDate(selectedFeedback.dateSubmitted)}</div>
                      <div><span className="font-medium">Category:</span> {selectedFeedback.category}</div>
                      <div>
                        <span className="font-medium">Rating:</span>
                        <div className="flex items-center gap-1 mt-1">
                          {renderStars(selectedFeedback.rating)}
                          <span className="ml-1 text-sm text-gray-600">({selectedFeedback.rating})</span>
                        </div>
                      </div>
                      <div><span className="font-medium">Status:</span> {selectedFeedback.status}</div>
                      <div><span className="font-medium">User Reviews:</span> {selectedFeedback.userTotalReviews}</div>
                      <div><span className="font-medium">User Reports:</span> {selectedFeedback.userTotalReports}</div>
                    </div>
                    <div>
                      <span className="font-medium">Comment:</span>
                      <p className="mt-1 text-gray-700">{selectedFeedback.comment}</p>
                    </div>
                    {selectedFeedback.response && (
                      <div className="mt-4">
                        <span className="font-medium">Response:</span>
                        <p className="mt-1 text-gray-700 bg-blue-50 p-3 rounded">{selectedFeedback.response}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Create/Edit Form
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 font-medium">User Name</label>
                      <input
                        type="text"
                        value={formData.userName}
                        onChange={(e) => setFormData(prev => ({ ...prev, userName: e.target.value }))}
                        className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        disabled={modalMode === 'view'}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium">Charger Name</label>
                      <input
                        type="text"
                        value={formData.chargerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, chargerName: e.target.value }))}
                        className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        disabled={modalMode === 'view'}
                      />
                    </div>
                    <div>
                      <label className="block mb-2 font-medium">Rating</label>
                      <select
                        value={formData.rating}
                        onChange={(e) => setFormData(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                        className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        disabled={modalMode === 'view'}
                      >
                        <option value={1}>1 Star</option>
                        <option value={2}>2 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={5}>5 Stars</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 font-medium">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        disabled={modalMode === 'view'}
                      >
                        <option value="Service Quality">Service Quality</option>
                        <option value="Technical Issue">Technical Issue</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Pricing">Pricing</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 font-medium">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none"
                        disabled={modalMode === 'view'}
                      >
                        <option value="New">New</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Reviewed">Reviewed</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-medium">Comment</label>
                    <textarea
                      value={formData.comment}
                      onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none h-24"
                      disabled={modalMode === 'view'}
                      rows="3"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 font-medium">Response</label>
                    <textarea
                      value={formData.response}
                      onChange={(e) => setFormData(prev => ({ ...prev, response: e.target.value }))}
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none h-24"
                      disabled={modalMode === 'view'}
                      rows="3"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-8 justify-center">
                {modalMode !== 'view' && (
                  <button 
                    onClick={handleSubmit} 
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    {modalMode === 'create' ? 'Create Feedback' : 'Update Feedback'}
                  </button>
                )}
                <button 
                  onClick={closeModal} 
                  className="bg-gray-200 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;