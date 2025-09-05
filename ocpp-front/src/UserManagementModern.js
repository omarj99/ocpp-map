import React, { useState, useEffect } from 'react';
import { User, Plus, Edit2, Trash2, Eye, Calendar, CreditCard, Battery, Search, Filter, MessageSquare } from 'lucide-react';

// Simple auth helper (you can replace this with your actual auth module)
const getToken = () => {
  return localStorage?.getItem('token');
};

const UserManagement = () => {
  // Navigation helper
  const goToChargerManagement = () => {
    window.location.href = 'http://localhost:3000/';
  };

  const goToFeedbackManagement = () => {
    window.location.href = 'http://localhost:3000/feedback';
  };
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [createdUserCredentials, setCreatedUserCredentials] = useState(null);
  const [modalType, setModalType] = useState('view'); // 'view', 'edit', 'create'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // API base URL - Fixed endpoint
  const API_URL = 'http://localhost:8080/api/users';
  const AUTH_URL = 'http://localhost:8080/api/auth/login'; // Use consistent auth endpoint
  const roles = ['admin', 'operator', 'user'];

  // Fetch users from backend
  useEffect(() => {
    const token = getToken();
    fetch(API_URL, {
      headers: {
  'Authorization': token ? `Bearer ${token}` : '',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data);
        } else if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      })
      .catch(() => setUsers([]));
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilter = (e) => {
    setFilterRole(e.target.value);
  };

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

  const filteredUsers = users.filter((user) => {
    const name = user.name || '';
    const email = user.email || '';
    const role = user.role || 'user';
    return (
      (name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterRole === '' || role === filterRole)
    );
  }).sort((a, b) => {
    let aVal = a[sortField] || '';
    let bVal = b[sortField] || '';
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleOpenModal = (type, user) => {
    setModalType(type);
    setSelectedUser(user || null);
    setModalError('');
    setCreatedUserCredentials(null);
    setShowModal(true);
  };

  const handleSaveUser = async (userData) => {
    setModalError('');
    setCreatedUserCredentials(null);

    // Fix field mapping - ensure we use correct field names
    const payload = {
      name: userData.name || '',
      email: userData.email || '',
      car_type: userData.car_type || userData.carType || '',
      role: userData.role || 'user',
      status: userData.status || 'active',
    };

    // Only include password if provided
    if (userData.password && userData.password.trim() !== '') {
      payload.password = userData.password;
    }

    try {
      const token = getToken();
      let res;
      
      if (modalType === 'create') {
        // For creation, password is required
        if (!payload.password) {
          setModalError('Password is required for new users');
          return;
        }
        
        res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMsg = 'Failed to create user';
          try {
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch {
            errorMsg = errorText || errorMsg;
          }
          setModalError(errorMsg);
          return;
        }

        // Store credentials for display
        setCreatedUserCredentials({ 
          email: payload.email, 
          password: payload.password 
        });
        showToast('User created successfully', 'success');

      } else if (modalType === 'edit' && selectedUser) {
  res = await fetch(`${API_URL}/${selectedUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify(payload),
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMsg = 'Failed to update user';
          try {
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch {
            errorMsg = errorText || errorMsg;
          }
          setModalError(errorMsg);
          return;
        }
        showToast('User updated successfully', 'success');

      } else if (modalType === 'delete' && selectedUser) {
  res = await fetch(`${API_URL}/${selectedUser.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          let errorMsg = 'Failed to delete user';
          try {
            const errorData = JSON.parse(errorText);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch {
            errorMsg = errorText || errorMsg;
          }
          setModalError(errorMsg);
          return;
        }
        showToast('User deleted successfully', 'success');
      }

      // Refresh users after successful operation
      const usersRes = await fetch(API_URL, {
        headers: {
          'Authorization': getToken() ? `Bearer ${getToken()}` : '',
        },
      });
      
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(Array.isArray(data) ? data : Array.isArray(data.users) ? data.users : []);
      }
      
      if (modalType !== 'create') {
        setShowModal(false);
        setSelectedUser(null);
      }
      
    } catch (err) {
      setModalError(err.message || 'Network error occurred');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setModalError('');
    setCreatedUserCredentials(null);
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

      {createdUserCredentials && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 rounded text-green-800 shadow max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <strong>User created successfully!</strong><br />
              <span>Email: <b>{createdUserCredentials.email}</b></span><br />
              <span>Password: <b>{createdUserCredentials.password}</b></span><br />
              <span className="text-sm">These credentials can now be used to log in.</span>
            </div>
            <button 
              onClick={() => setCreatedUserCredentials(null)}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage users, roles, and access permissions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenModal('create')}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
            <button
              onClick={goToChargerManagement}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
            >
              <span className="mr-2">⚡</span>
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

        {/* Filter/Search Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <Search className="w-4 h-4 text-gray-400 mr-1" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="outline-none border-none bg-transparent text-gray-800 w-48"
            />
          </div>
          <select value={filterRole} onChange={handleFilter} className="border rounded px-2 py-1">
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-200 to-gray-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-gray-900">{users.length}</div>
            <div className="text-sm text-gray-700">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-green-200 to-green-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-green-800">
              {users.filter(u => u.status === 'active').length}
            </div>
            <div className="text-sm text-green-900">Active Users</div>
          </div>
          <div className="bg-gradient-to-br from-blue-200 to-blue-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-blue-800">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-blue-900">Administrators</div>
          </div>
          <div className="bg-gradient-to-br from-red-200 to-red-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-red-800">
              {users.filter(u => u.status === 'inactive').length}
            </div>
            <div className="text-sm text-red-900">Inactive Users</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Name <SortIcon field="name" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('email')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Email <SortIcon field="email" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('role')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Role <SortIcon field="role" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('status')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Status <SortIcon field="status" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Car Type</th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-400 text-lg">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const name = user.name || '';
                  const email = user.email || '';
                  const role = user.role || 'user';
                  const status = user.status || 'active';
                  const carType = user.car_type || user.carType || '';
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="p-4 font-medium">{name}</td>
                      <td className="p-4 text-gray-600">{email}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`rounded-md py-0.5 px-2.5 border border-transparent text-sm text-white transition-all shadow-sm 
                          ${status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </td>
                      <td className="p-4 text-gray-600">{carType}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal('view', user)}
                            className="p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal('edit', user)}
                            className="p-1 rounded hover:bg-gray-100 text-green-600 hover:text-green-700"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal('delete', user)}
                            className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
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

        {/* User Modal */}
        {showModal && (
          <UserModal
            type={modalType}
            user={selectedUser}
            onClose={handleCloseModal}
            onSave={handleSaveUser}
            error={modalError}
          />
        )}
      </div>
    </div>
  );
};

const UserModal = ({ type, user, onClose, onSave, error }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    car_type: '',
    role: 'user',
    status: 'active',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (type !== 'create' && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        car_type: user.car_type || user.carType || '',
        role: user.role || 'user',
        status: user.status || 'active',
      });
    } else if (type === 'create') {
      setFormData({
        name: '',
        email: '',
        password: '',
        car_type: '',
        role: 'user',
        status: 'active',
      });
    }
  }, [type, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    
    try {
      await onSave(formData);
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = type === 'view';
  const showPasswordField = type === 'create' || type === 'edit';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">
          {type === 'create' ? 'Create New User' : 
           type === 'edit' ? 'Edit User' : 
           type === 'delete' ? 'Delete User' : 'User Details'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {type === 'delete' ? (
          <div>
            <p className="text-gray-600 mb-6 text-center text-lg">
              Are you sure you want to delete the user <strong>{user?.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={onClose}
                className="bg-gray-200 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave({})}
                disabled={isSaving}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {isSaving ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isReadOnly}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isReadOnly}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
              </div>

              {showPasswordField && (
                <div>
                  <label className="block mb-2 font-medium">
                    Password {type === 'create' ? '*' : '(leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={type === 'create'}
                    disabled={isReadOnly}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 font-medium">Car Type</label>
                  <input
                    type="text"
                    name="car_type"
                    value={formData.car_type}
                    onChange={handleChange}
                    disabled={isReadOnly}
                    placeholder="e.g. Tesla Model 3, BMW i3"
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    disabled={isReadOnly}
                    className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50"
                  >
                    <option value="user">User</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 font-medium">Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  disabled={isReadOnly}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-8 justify-center">
              {!isReadOnly && (
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : (type === 'create' ? 'Create User' : 'Update User')}
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-200 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;