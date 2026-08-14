import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRoleSlug } from '../utils/role';

export default function Results({ setPage }) {
  const { roles, isPlatformAdmin } = useAuth();
  const [examinations, setExaminations] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('submissions');

  const userRole = getPrimaryRoleSlug({ roles, isPlatformAdmin });

  const isPrincipalOrAdmin = [
    'super_admin',
    'school_admin',
    'admin',
    'principal',
    'proprietor',
  ].includes(userRole);

  useEffect(() => {
    loadExamData();
  }, []);

  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [examRes, subRes] = await Promise.allSettled([
        api.get('/examinations'),
        api.get('/results'),
      ]);

      if (examRes.status === 'fulfilled') {
        const data = examRes.value.data.data || examRes.value.data;
        setExaminations(Array.isArray(data) ? data : []);
      }
      if (subRes.status === 'fulfilled') {
        const data = subRes.value.data.data || subRes.value.data;
        setSubmissions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load examination management records.');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishResults = async (id) => {
    if (!window.confirm('Are you sure you want to approve and publish these class results to student/parent portals?')) return;

    try {
      await api.post(`/results/${id}/publish`);
      alert('Results successfully published!');
      loadExamData();
    } catch (err) {
      alert(err.message || 'Failed to publish results.');
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Exams & Result Submissions</h1>
          <p className="text-sm text-gray-500">Oversee term examinations, review teacher score submissions, and approve publications.</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setPage && setPage('result-entry')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
          >
            + Open Score Entry Sheet
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'submissions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Result Submissions ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('examinations')}
          className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
            activeTab === 'examinations' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Scheduled Examinations ({examinations.length})
        </button>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={loadExamData} className="underline font-semibold">Retry</button>
        </div>
      )}

      {activeTab === 'submissions' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading submitted class results...</div>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No score submissions pending approval.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Submission Date</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{sub.class?.name || sub.class_name || 'N/A'}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">{sub.subject?.name || sub.subject_name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          sub.is_published || sub.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {sub.is_published || sub.status === 'published' ? 'Published' : 'Pending Approval'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{sub.submitted_at || sub.created_at || '—'}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {isPrincipalOrAdmin && !sub.is_published && (
                          <button
                            onClick={() => handlePublishResults(sub.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                          >
                            Approve & Publish
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading exam schedules...</div>
          ) : examinations.length === 0 ? (
            <div className="p-12 text-center text-gray-400">No active examination timetables scheduled.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Exam Title</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Total Marks</th>
                    <th className="px-6 py-3">Dates</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {examinations.map((ex) => (
                    <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{ex.name}</td>
                      <td className="px-6 py-4 text-xs text-gray-600">{ex.exam_type || 'Terminal'}</td>
                      <td className="px-6 py-4 font-mono font-semibold">{ex.total_marks || 100}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {ex.start_date || '—'} to {ex.end_date || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-blue-100 text-blue-700">
                          {ex.status || 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
