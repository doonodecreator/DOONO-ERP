import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Transport({ setPage }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('routes');
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Modals
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState({ route_name: '', description: '', fare_amount: '' });

  useEffect(() => {
    loadTransportData();
  }, [activeTab]);

  const loadTransportData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'routes') {
        const res = await api.get('/transport-routes');
        const data = res.data.data || res.data || [];
        setRoutes(Array.isArray(data) ? data : []);
      } else if (activeTab === 'vehicles') {
        const res = await api.get('/vehicles');
        const data = res.data.data || res.data || [];
        setVehicles(Array.isArray(data) ? data : []);
      } else if (activeTab === 'allocations') {
        const res = await api.get('/transport-allocations');
        const data = res.data.data || res.data || [];
        setAllocations(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transport logistics records.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transport-routes', routeForm);
      setMessage('Transport route created successfully!');
      setShowRouteModal(false);
      setRouteForm({ route_name: '', description: '', fare_amount: '' });
      loadTransportData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create route.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Transport & Fleet Logistics</h1>
          <p className="text-sm text-gray-500">Manage school bus routes, vehicle fleets, driver assignments, and student transit fees.</p>
        </div>
        <div>
          {activeTab === 'routes' && (
            <button
              onClick={() => setShowRouteModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
            >
              + Add New Route
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm flex justify-between items-center">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadTransportData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('routes')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'routes' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Bus Routes & Fares
        </button>
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'vehicles' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Vehicle Fleet & Drivers
        </button>
        <button
          onClick={() => setActiveTab('allocations')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'allocations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Student Riders
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading transport records...</div>
        ) : activeTab === 'routes' ? (
          routes.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No transport routes configured. Click "+ Add New Route".</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Route Name</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Fare Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {routes.map((rt) => (
                    <tr key={rt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{rt.route_name}</td>
                      <td className="px-6 py-4 text-gray-500">{rt.description || '—'}</td>
                      <td className="px-6 py-4 font-mono font-bold text-green-600">₦{Number(rt.fare_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'vehicles' ? (
          vehicles.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No vehicles registered in the fleet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Vehicle Number</th>
                    <th className="px-6 py-3">Model</th>
                    <th className="px-6 py-3">Capacity</th>
                    <th className="px-6 py-3">Driver Name</th>
                    <th className="px-6 py-3">Driver Phone</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-gray-900">{v.vehicle_number}</td>
                      <td className="px-6 py-4">{v.model || '—'}</td>
                      <td className="px-6 py-4 font-mono">{v.capacity} Seats</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{v.driver_name || 'Unassigned'}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{v.driver_phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                          {v.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          allocations.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No student transport riders registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Transport Route</th>
                    <th className="px-6 py-3">Pickup Point</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {allocations.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{a.student?.full_name || 'Student #' + a.student_id}</td>
                      <td className="px-6 py-4">{a.transport_route?.route_name || 'Route #' + a.transport_route_id}</td>
                      <td className="px-6 py-4 text-gray-600">{a.pickup_point || 'Main Gate'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                          {a.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Create Route Modal */}
      {showRouteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Transport Route</h3>
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Route Name *</label>
                <input
                  type="text"
                  required
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                  placeholder="e.g. Route A - Asaba Expressway"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Fare Amount (₦) *</label>
                <input
                  type="number"
                  required
                  value={routeForm.fare_amount}
                  onChange={(e) => setRouteForm({ ...routeForm, fare_amount: e.target.value })}
                  placeholder="25000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Stops</label>
                <textarea
                  value={routeForm.description}
                  onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                  placeholder="List major bus stops..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRouteModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
