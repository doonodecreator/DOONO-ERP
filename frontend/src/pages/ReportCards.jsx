import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { arrayFromResponse } from '../utils/response';
import { useAuth } from '../context/AuthContext';

function apiErrorMessage(error, fallback) {
  const data = error?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const first = Object.values(data.errors).flat()?.[0];
    if (first) return first;
  }
  return data?.message || error?.message || fallback;
}

export default function ReportCards() {
  const { user } = useAuth();
  const [reportCards, setReportCards] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    loadFiltersAndReports();
  }, []);

  const loadFiltersAndReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const [repRes, sessRes, termRes, classRes] = await Promise.allSettled([
        api.get('/report-cards'),
        api.get('/academic-sessions'),
        api.get('/terms'),
        api.get('/classes'),
      ]);

      if (repRes.status === 'fulfilled') setReportCards(arrayFromResponse(repRes.value));
      if (sessRes.status === 'fulfilled') setSessions(arrayFromResponse(sessRes.value));
      if (termRes.status === 'fulfilled') setTerms(arrayFromResponse(termRes.value));
      if (classRes.status === 'fulfilled') setClasses(arrayFromResponse(classRes.value));

      const reportFailure = repRes.status === 'rejected' ? apiErrorMessage(repRes.reason, 'Report cards could not be loaded.') : '';
      const filterFailure = [sessRes, termRes, classRes].find((result) => result.status === 'rejected');
      if (reportFailure) setError(reportFailure);
      else if (filterFailure) setError(apiErrorMessage(filterFailure.reason, 'Some report-card filters could not be loaded.'));
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load report cards.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (e, report) => {
    e.stopPropagation();
    try {
      setDownloadingId(report.id);
      const response = await api.get(`/report-cards/${report.id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const studentName = report.student?.full_name || report.student_name || 'Student';
      link.setAttribute('download', `ReportCard_${studentName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download report card PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleViewReport = async (report) => {
    try {
      setSelectedReport(report);
      setShowModal(true);
    } catch (err) {
      setSelectedReport(report);
      setShowModal(true);
    }
  };

  const filteredReports = reportCards.filter((rc) => {
    const enrollment = rc.student_enrollment || {};
    const student = enrollment.student || {};
    const studentName = (student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || rc.student_name || '').toLowerCase();
    const admNo = (student.admission_number || enrollment.admission_number || '').toLowerCase();
    const matchesSearch = studentName.includes(search.toLowerCase()) || admNo.includes(search.toLowerCase());

    const matchesSession = !selectedSession || String(rc.academic_session_id) === String(selectedSession);
    const matchesTerm = !selectedTerm || String(rc.term_id) === String(selectedTerm);
    const matchesClass = !selectedClass || String(enrollment.class_id || rc.class_id) === String(selectedClass);

    return matchesSearch && matchesSession && matchesTerm && matchesClass;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Terminal Report Cards</h1>
          <p className="text-sm text-gray-500">View student academic performance summaries, class positions, and print PDF report cards.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Search student or admission no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Academic Sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>{s.name || s.session_year}</option>
          ))}
        </select>

        <select
          value={selectedTerm}
          onChange={(e) => setSelectedTerm(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Academic Terms</option>
          {terms.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={loadFiltersAndReports} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Report Cards Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading terminal report cards...</div>
        ) : error ? null : filteredReports.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">No report cards found.</p>
            <p className="text-xs mt-1">Make sure results have been calculated and published for the selected term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Total Score</th>
                  <th className="px-6 py-3">Average %</th>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Grade</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((rc) => {
                  const enrollment = rc.student_enrollment || {};
                  const student = enrollment.student || {};
                  const studentName = student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || rc.student_name || 'N/A';
                  return (
                    <tr
                      key={rc.id}
                      onClick={() => handleViewReport(rc)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-900">{studentName}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-gray-800">{rc.total_score || '—'}</td>
                      <td className="px-6 py-4 font-mono font-semibold text-blue-600">
                        {rc.average_score ? `${Number(rc.average_score).toFixed(1)}%` : '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-700">
                        {rc.position ? `${rc.position}` : '—'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{rc.overall_grade || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          rc.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {rc.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button type="button"
                          onClick={(e) => handleDownloadPdf(e, rc)}
                          disabled={downloadingId === rc.id}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {downloadingId === rc.id ? 'Downloading...' : 'PDF Report'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Preview Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedReport.student_enrollment?.student?.full_name || selectedReport.student_name || 'Report Card Summary'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div><span className="text-gray-500 text-xs">Total Score:</span> <p className="font-bold font-mono">{selectedReport.total_score || '—'}</p></div>
                <div><span className="text-gray-500 text-xs">Average Score:</span> <p className="font-bold font-mono text-blue-600">{selectedReport.average_score}%</p></div>
                <div><span className="text-gray-500 text-xs">Position:</span> <p className="font-bold text-indigo-700">{selectedReport.position || '—'}</p></div>
                <div><span className="text-gray-500 text-xs">Overall Grade:</span> <p className="font-bold">{selectedReport.overall_grade || '—'}</p></div>
              </div>

              {selectedReport.teacher_comment && (
                <div>
                  <label className="text-xs font-semibold text-gray-500">Teacher's Comment:</label>
                  <p className="text-xs bg-blue-50/50 p-2.5 rounded border border-blue-100 text-gray-700 italic">
                    "{selectedReport.teacher_comment}"
                  </p>
                </div>
              )}

              {selectedReport.principal_comment && (
                <div>
                  <label className="text-xs font-semibold text-gray-500">Principal's Comment:</label>
                  <p className="text-xs bg-purple-50/50 p-2.5 rounded border border-purple-100 text-gray-700 italic">
                    "{selectedReport.principal_comment}"
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4 mt-4 border-t">
              <button type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
              <button type="button"
                onClick={(e) => handleDownloadPdf(e, selectedReport)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
