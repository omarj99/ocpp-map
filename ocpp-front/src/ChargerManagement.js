import React, { useState, useEffect } from 'react';
import ChargerMap from './ChargerMap';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { getToken } from './auth';

const API_URL = 'http://localhost:8081/api/cps'; // Updated port for OCPP charger service

const EVChargingManagement = ({ onLogout }) => {
  const [chargingPoints, setChargingPoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState(chargingPoints);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  // Add state for loading charger commands
  const [commandLoading, setCommandLoading] = useState({}); // { [id]: boolean }

  // Toast notification system
  const [toasts, setToasts] = useState([]);
  const showToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  // Backend endpoint for charger commands
  const COMMAND_API_URL = 'http://localhost:9000/api/charger/command';

  // Fetch chargers from backend
  const fetchChargers = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.status === 401) { onLogout && onLogout(); return; }
      const data = await res.json();
      setChargingPoints(data);
    } catch (err) {
      // handle error
    }
  };

  useEffect(() => {
    fetchChargers();
  }, []);

  // Polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChargers();
    }, 5000); // refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter and sort logic
  useEffect(() => {
    let safePoints = Array.isArray(chargingPoints) ? chargingPoints : [];
    let filtered = safePoints.filter(point => {
      const matchesSearch = (point.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (point.address?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (point.type?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter ? point.status === statusFilter : true;
      const matchesEnabled = enabledFilter ? (enabledFilter === 'enabled' ? point.enabled : !point.enabled) : true;
      return matchesSearch && matchesStatus && matchesEnabled;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
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

    setCurrentPage(1); // Reset to first page on filter/sort change
    setFilteredPoints(filtered);
  }, [chargingPoints, searchTerm, sortField, sortDirection, statusFilter, enabledFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPoints.length / ITEMS_PER_PAGE);
  const paginatedPoints = filteredPoints.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const toggleEnable = async (id) => {
    const point = chargingPoints.find(p => p.id === id);
    if (!point) return;
    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ ...point, enabled: !point.enabled })
      });
      setChargingPoints(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    } catch { }
  };

  // Add or Edit Modal logic
  const [form, setForm] = useState({
    name: '',
    address: '',
    feedback: '',
    ratings: '',
    status: '',
    power: '',
    connector: '',
    sessions: '',
    enabled: '' // Change default to empty string
  });
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  const openAddModal = () => {
    setForm({ name: '', address: '', feedback: '', ratings: '', status: '', power: '', connector: '', sessions: '', enabled: '' });
    setModalMode('add');
    setShowAddModal(true);
  };
  const openEditModal = (point) => {
    setForm({ ...point });
    setModalMode('edit');
    setShowAddModal(true);
  };
  const closeModal = () => setShowAddModal(false);

  const handleFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    if (name === 'enabled') {
      setForm(f => ({
        ...f,
        enabled: value === '' ? '' : value === 'true' ? true : false
      }));
    } else {
      setForm(f => ({
        ...f,
        [name]: inputType === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    // Prepare payload, only include 'enabled' if set to true or false
    const payload = {
      ...form,
      ratings: Number(form.ratings),
      sessions: Number(form.sessions)
    };
    if (form.enabled === true || form.enabled === false) {
      payload.enabled = form.enabled;
    } else {
      delete payload.enabled;
    }
    if (modalMode === 'add') {
      // Create
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setChargingPoints(prev => Array.isArray(prev) ? [...prev, data] : [data]);
          closeModal();
        }
      } catch { }
    } else {
      // Edit
      try {
        const res = await fetch(`${API_URL}/${form.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getToken()}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setChargingPoints(prev => Array.isArray(prev) ? prev.map(p => p.id === form.id ? data : p) : [data]);
          closeModal();
        }
      } catch { }
    }
  };

  const deletePoint = async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) setChargingPoints(prev => prev.filter(point => point.id !== id));
    } catch { }
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

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // In render, use safe fallback for chargingPoints and filteredPoints
  const safeChargingPoints = Array.isArray(chargingPoints) ? chargingPoints : [];
  const safeFilteredPoints = Array.isArray(filteredPoints) ? filteredPoints : [];

  // Handler to send start/stop command
  const sendChargerCommand = async (chargerId, command) => {
    setCommandLoading(prev => ({ ...prev, [chargerId]: true }));

    const body = JSON.stringify({ chargerId, command });
    console.log('Sending charger command body:', body);  // ✅ LOGGING HERE

    try {
      const res = await fetch(COMMAND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body
      });

      if (!res.ok) {
        const err = await res.text();
        alert(`Failed to send command: ${err}`);
      } else {
        // Optionally show success
        // alert('Command sent successfully');
      }
    } catch (e) {
      alert('Error sending command: ' + e.message);
    } finally {
      setCommandLoading(prev => ({ ...prev, [chargerId]: false }));
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div key={toast.id} className={`px-4 py-3 rounded shadow-lg text-white font-medium transition 
            ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}
          >
            {toast.message}
          </div>
        ))}
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header with navigation to User Management */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">EV Charging Points Management</h1>
            <p className="text-gray-600">Manage and monitor your electric vehicle charging infrastructure</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { window.location.href = 'http://localhost:3000/users'; }}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
            >
              {/* User icon (Lucide or emoji) */}
              <span className="mr-2">👤</span>
              User Management
            </button>
          </div>
        </div>

        <ChargerMap />
        {/* Filter/Search Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-6 mt-6">
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <Search className="w-4 h-4 text-gray-400 mr-1" />
            <input
              type="text"
              placeholder="Search by name, address, type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="outline-none border-none bg-transparent text-gray-800 w-40"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Charging">Charging</option>
            <option value="Finishing">Finishing</option>
          </select>
          <select value={enabledFilter} onChange={e => setEnabledFilter(e.target.value)} className="border rounded px-2 py-1">
            <option value="">All</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <button
            onClick={openAddModal}
            className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" /> Add Charger
          </button>
        </div>



        {/* Summary Stats */}
        <div className="mt-6 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-gray-200 to-gray-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-gray-900">{safeChargingPoints.length}</div>
            <div className="text-sm text-gray-700">Total Charging Points</div>
          </div>
          <div className="bg-gradient-to-br from-green-200 to-green-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-green-800">
              {filteredPoints.filter(p => p.status === 'Available').length}
            </div>
            <div className="text-sm text-green-900">Available</div>
          </div>
          <div className="bg-gradient-to-br from-blue-200 to-blue-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-blue-800">
              {filteredPoints.filter(p => p.status === 'Charging').length}
            </div>
            <div className="text-sm text-blue-900">Currently Charging</div>
          </div>
          <div className="bg-gradient-to-br from-orange-200 to-red-100 p-4 rounded-lg border shadow-md">
            <div className="text-2xl font-bold text-orange-800">
              {filteredPoints.filter(p => p.status === 'Finishing').length}
            </div>
            <div className="text-sm text-orange-900">Finishing</div>
          </div>
        </div>

        {/* Charger Table */}
        <div className="overflow-x-auto rounded-lg shadow bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="text-left p-4 font-medium text-gray-900">ID</th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('name')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Name <SortIcon field="name" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Address</th>
                <th className="text-left p-4 font-medium text-gray-900">Feedback</th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('ratings')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Ratings <SortIcon field="ratings" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Status</th>
                <th className="text-left p-4 font-medium text-gray-900">Power</th>
                <th className="text-left p-4 font-medium text-gray-900">Connector</th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('sessions')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Sessions <SortIcon field="sessions" />
                  </button>
                </th>
                <th className="text-left p-4">
                  <button onClick={() => handleSort('enabled')} className="flex items-center gap-1 font-medium text-gray-900 hover:text-blue-600">
                    Enabled <SortIcon field="enabled" />
                  </button>
                </th>
                <th className="text-left p-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedPoints.map(point => (
                <tr key={point.id} className="hover:bg-gray-50">
                  <td className="p-4">{point.id}</td>
                  <td className="p-4">{point.name}</td>
                  <td className="p-4">{point.address}</td>
                  <td className="p-4">{point.feedback}</td>
                  <td className="p-4">{point.ratings}</td>
                  <td className="p-4">
                    <span className={`rounded-md py-0.5 px-2.5 border border-transparent text-sm text-white transition-all shadow-sm ${point.status === 'Available' ? 'bg-green-500' : point.status === 'Charging' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                      {point.status}
                    </span>
                  </td>
                  <td className="p-4">{point.power}</td>
                  <td className="p-4">{point.connector}</td>
                  <td className="p-4">{point.sessions}</td>
                  <td className="p-4">{point.enabled ? 'Yes' : 'No'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(point)}
                        className="p-1 rounded hover:bg-gray-100 text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePoint(point.id)}
                        className="p-1 rounded hover:bg-gray-100 text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {/* Start/Stop buttons */}
                      <button
                        onClick={() => sendChargerCommand(point.id, 'start')}
                        className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                        disabled={commandLoading[point.id]}
                        title="Start Charging"
                      >
                        {commandLoading[point.id] ? 'Starting...' : 'Start'}
                      </button>
                      <button
                        onClick={() => sendChargerCommand(point.id, 'stop')}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        disabled={commandLoading[point.id]}
                        title="Stop Charging"
                      >
                        {commandLoading[point.id] ? 'Stopping...' : 'Stop'}
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
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50">Prev</button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`px-3 py-1 rounded border ${currentPage === idx + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                >
                  {idx + 1}
                </button>
              ))}
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50">Next</button>
            </div>
          )}
        </div>

        {/* Map of charger locations - shown below list and summary */}
        {Array.isArray(safeChargingPoints) && safeChargingPoints.length > 0 &&
          safeChargingPoints.some(cp => cp.latitude && cp.longitude) && (
            <div className="my-8">
              <h2 className="text-xl font-bold mb-2 text-gray-800">Charging Points Map</h2>
              <ChargerMap chargers={safeChargingPoints.filter(cp => cp.latitude && cp.longitude)} />
            </div>
          )
        }

        {/* Modal for Add/Edit */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <form onSubmit={handleFormSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in">
              <h2 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg">{modalMode === 'add' ? 'Add' : 'Edit'} Charging Point</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium">Name</label>
                  <input name="name" value={form.name} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Address</label>
                  <input name="address" value={form.address} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Feedback</label>
                  <input name="feedback" value={form.feedback} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Ratings</label>
                  <input name="ratings" type="number" min="0" max="5" value={form.ratings} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Status</label>
                  <select name="status" value={form.status} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required>
                    <option value="">Select Status</option>
                    <option value="Available">Available</option>
                    <option value="Charging">Charging</option>
                    <option value="Finishing">Finishing</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-medium">Power</label>
                  <input name="power" value={form.power} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Connector</label>
                  <input name="connector" value={form.connector} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Sessions</label>
                  <input name="sessions" type="number" value={form.sessions} onChange={handleFormChange} className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-400 focus:outline-none" required />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <label htmlFor="enabled-cb" className="font-medium mr-2">Enabled</label>
                <select
                  name="enabled"
                  id="enabled-cb"
                  value={form.enabled === '' ? '' : form.enabled === true ? 'true' : 'false'}
                  onChange={e => setForm(f => ({ ...f, enabled: e.target.value === '' ? '' : e.target.value === 'true' ? true : false }))}
                  className="border rounded p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                >
                  <option value="">-- Select --</option>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>
              <div className="flex gap-2 mt-8 justify-center">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">{modalMode === 'add' ? 'Add' : 'Save'}</button>
                <button type="button" onClick={closeModal} className="bg-gray-200 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default EVChargingManagement;