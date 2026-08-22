import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Clinic() {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClinicVisits();
  }, []);

  const loadClinicVisits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clinic-visits');
      const data = res.data.data || res.data || [];
      setVisits(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch clinic visits.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Clinic & Sickbay Records</h1>
          <p className="text-sm text-gray-500">Monitor student health visits, diagnoses, treatments, and medical notes.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={loadClinicVisits} className="underline font-semibold">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading clinic visit logs...</div>
        ) : visits.length === 0 ? (
          <div className="p-12 text-center text-gray-400">No medical visits recorded in sickbay.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Complaint / Symptoms</th>
                  <th className="px-6 py-3">Treatment / Medication</th>
                  <th className="px-6 py-3">Visit Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">{v.student?.full_name || 'Student #' + v.student_id}</td>
                    <td className="px-6 py-4 text-gray-800">{v.complaint || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{v.treatment || '—'}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{v.visit_date || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
                        {v.status || 'Discharged'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
