import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRoleSlug } from '../utils/role';
import { arrayFromResponse } from '../utils/response';
import { flushAttendanceQueue, queueAttendanceRegister } from '../utils/offlineQueue';

export default function Attendance() {
  const { permissions = [], roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const canManageAttendance = permissions.includes('manage_attendance');
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStreamId, setSelectedStreamId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [remarksMap, setRemarksMap] = useState({});
  const [attendanceVersionMap, setAttendanceVersionMap] = useState({});
  
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionHistory, setCorrectionHistory] = useState({});

  useEffect(() => {
    loadAcademicFilters();
    const synchronize = async () => {
      const result = await flushAttendanceQueue(api);
      if (result.conflicts > 0) setError(`${result.conflicts} offline attendance register${result.conflicts === 1 ? '' : 's'} conflicted with a newer server version. Reload the register and review it before saving again.`);
      else if (result.sent > 0) setSuccessMsg(`${result.sent} offline attendance register${result.sent === 1 ? '' : 's'} synchronized.`);
    };
    synchronize();
    window.addEventListener('online', synchronize);
    return () => window.removeEventListener('online', synchronize);
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedSessionId && selectedTermId) {
      loadClassAttendance();
    } else {
      setStudents([]);
    }
  }, [selectedClassId, selectedStreamId, selectedSessionId, selectedTermId, attendanceDate]);

  const loadAcademicFilters = async () => {
    try {
      setLoadingClasses(true);
      setError(null);
      const [classRes, sessionRes, termRes] = await Promise.all([
        role === 'teacher' ? api.get('/teacher/dashboard') : api.get('/classes'),
        api.get('/academic-sessions'),
        api.get('/terms'),
      ]);
      const classList = role === 'teacher'
        ? (Array.isArray(classRes?.data?.my_classes) ? classRes.data.my_classes : [])
        : arrayFromResponse(classRes);
      const sessionList = arrayFromResponse(sessionRes);
      const termList = arrayFromResponse(termRes);
      setClasses(classList);
      setSessions(sessionList);
      setTerms(termList);
      if (classList.length > 0) {
        const firstClass = classList[0];
        setSelectedClassId(firstClass.class_id || firstClass.id);
        setSelectedStreamId(firstClass.stream_id || '');
      }
      const currentSession = sessionList.find((item) => item.is_current) || sessionList[0];
      const currentTerm = termList.find((item) => item.is_current) || termList[0];
      if (currentSession) setSelectedSessionId(currentSession.id);
      if (currentTerm) setSelectedTermId(currentTerm.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load academic classes, sessions, and terms.');
      setClasses([]);
      setSessions([]);
      setTerms([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  const loadClassAttendance = async () => {
    try {
      setLoadingStudents(true);
      setError(null);
      setSuccessMsg('');

      const res = await api.get('/attendance/class-list', {
        params: {
          academic_session_id: selectedSessionId,
          term_id: selectedTermId,
          class_id: selectedClassId,
          stream_id: selectedStreamId || null,
          attendance_date: attendanceDate,
        },
      });

      const list = arrayFromResponse(res);
      setStudents(list);

      // Initialize status and remarks map
      const initialStatus = {};
      const initialRemarks = {};
      const initialVersions = {};

      (Array.isArray(list) ? list : []).forEach((item) => {
        const studentId = item.id || item.student_id || item.student_enrollment_id;
        initialStatus[studentId] = String(item.attendance_status || item.attendance?.status || 'Present').toLowerCase();
        initialRemarks[studentId] = item.attendance_remarks || item.remarks || '';
        initialVersions[studentId] = item.attendance_updated_at || null;
      });

      setAttendanceMap(initialStatus);
      setRemarksMap(initialRemarks);
      setAttendanceVersionMap(initialVersions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load class register.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleRemarkChange = (studentId, remark) => {
    setRemarksMap((prev) => ({
      ...prev,
      [studentId]: remark,
    }));
  };

  const loadCorrections = async (attendanceId) => {
    if (!attendanceId) return;
    const current = correctionHistory[attendanceId];
    if (current?.loaded) {
      setCorrectionHistory((previous) => ({ ...previous, [attendanceId]: { ...current, open: !current.open } }));
      return;
    }
    setCorrectionHistory((previous) => ({ ...previous, [attendanceId]: { loading: true, open: true, items: [] } }));
    try {
      const response = await api.get(`/attendance/${attendanceId}/corrections`, { params: { per_page: 25 } });
      setCorrectionHistory((previous) => ({ ...previous, [attendanceId]: { loading: false, loaded: true, open: true, items: arrayFromResponse(response) } }));
    } catch (err) {
      setCorrectionHistory((previous) => ({ ...previous, [attendanceId]: { loading: false, loaded: true, open: true, items: [], error: err.response?.data?.message || 'Unable to load correction history.' } }));
    }
  };

  const handleMarkAll = (status) => {
    const updated = {};
    students.forEach((s) => {
      const id = s.id || s.student_id || s.student_enrollment_id;
      updated[id] = status;
    });
    setAttendanceMap(updated);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClassId) return;

    setSubmitting(true);
    setError(null);
    setSuccessMsg('');

    const payload = {
      class_id: selectedClassId,
      stream_id: selectedStreamId || null,
      attendance_date: attendanceDate,
      academic_session_id: selectedSessionId,
      term_id: selectedTermId,
      correction_reason: correctionReason.trim() || null,
      records: students.map((s) => {
        const id = s.id || s.student_id || s.student_enrollment_id;
        const status = attendanceMap[id] || 'present';
        return {
          student_enrollment_id: s.student_enrollment_id || id,
          status: status.charAt(0).toUpperCase() + status.slice(1),
          remarks: remarksMap[id] || '',
          client_changed_at: attendanceVersionMap[id] || new Date().toISOString(),
        };
      }),
    };

    const idempotencyKey = `attendance:${selectedSessionId}:${selectedTermId}:${selectedClassId}:${selectedStreamId || 'all'}:${attendanceDate}:${Date.now()}`;
    try {
      await api.post('/attendance/bulk', payload, { headers: { 'Idempotency-Key': idempotencyKey } });
      setSuccessMsg('Attendance records updated successfully!');
      await loadClassAttendance();
    } catch (err) {
      if (err?.isNetworkError || !err?.response) {
        queueAttendanceRegister(payload, idempotencyKey);
        setSuccessMsg('The register was saved on this device and will synchronize when the connection returns.');
      } else if (err?.response?.status === 409) {
        setError('A newer attendance version exists on the server. Reload the register, review the changed rows, and save again.');
      } else {
        setError(err.response?.data?.message || 'Failed to save attendance records.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Summary counts
  const totalCount = students.length;
  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter((s) => s === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter((s) => s === 'late').length;
  const excusedCount = Object.values(attendanceMap).filter((s) => s === 'excused').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Student Attendance</h1>
          <p className="text-sm text-gray-500">Take roll call, monitor absenteeism, and log student class presence.</p>
        </div>
        {canManageAttendance && students.length > 0 && (
          <button type="button"
            onClick={handleSaveAttendance}
            disabled={submitting}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50 text-sm"
          >
            {submitting ? 'Saving Register...' : 'Save Attendance Register'}
          </button>
        )}
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm flex justify-between items-center">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} className="font-bold text-gray-500">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={loadClassAttendance} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Select Academic Class</label>
          {loadingClasses ? (
            <div className="text-sm text-gray-400 py-2">Loading classes...</div>
          ) : (
            <select
              value={`${selectedClassId}|${selectedStreamId || ''}`}
              onChange={(e) => {
                const [classId, streamId = ''] = e.target.value.split('|');
                setSelectedClassId(classId);
                setSelectedStreamId(streamId);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            >
              <option value="">Select class</option>
              {classes.map((cls) => (
                  <option key={`${cls.class_id || cls.id}|${cls.stream_id || ''}`} value={`${cls.class_id || cls.id}|${cls.stream_id || ''}`}>
                    {cls.name} {cls.division?.name ? `(${cls.division.name})` : ''}
                  </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Session</label>
          <select value={selectedSessionId} onChange={(e) => setSelectedSessionId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">Select session</option>
            {sessions.map((session) => <option key={session.id} value={session.id}>{session.name || session.session_year}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Term</label>
          <select value={selectedTermId} onChange={(e) => setSelectedTermId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
            <option value="">Select term</option>
            {terms.map((term) => <option key={term.id} value={term.id}>{term.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Attendance Date</label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        {canManageAttendance && <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Correction reason (only needed when changing a saved register)</label>
          <input type="text" maxLength={1000} value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} placeholder="For example: corrected after signed class register review" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>}

          <div className="flex flex-col justify-end">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Quick Bulk Actions</label>
          <div className="flex space-x-2">
            {canManageAttendance && <button
              type="button"
              onClick={() => handleMarkAll('present')}
              className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-medium border border-green-200 flex-1"
            >
              All Present
            </button>}
            {canManageAttendance && <button
              type="button"
              onClick={() => handleMarkAll('absent')}
              className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-medium border border-red-200 flex-1"
            >
              All Absent
            </button>}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">Total Enrolled</p>
            <h3 className="text-xl font-bold text-gray-800">{totalCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm bg-green-50/20">
            <p className="text-xs text-green-600 font-medium">Present</p>
            <h3 className="text-xl font-bold text-green-700">{presentCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm bg-red-50/20">
            <p className="text-xs text-red-600 font-medium">Absent</p>
            <h3 className="text-xl font-bold text-red-700">{absentCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm bg-yellow-50/20">
            <p className="text-xs text-yellow-600 font-medium">Late</p>
            <h3 className="text-xl font-bold text-yellow-700">{lateCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm bg-purple-50/20">
            <p className="text-xs text-purple-600 font-medium">Excused</p>
            <h3 className="text-xl font-bold text-purple-700">{excusedCount}</h3>
          </div>
        </div>
      )}

      {/* Attendance Register Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loadingStudents ? (
          <div className="p-12 text-center text-gray-500">Loading student roster for this date...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">No students enrolled in the selected class.</p>
            <p className="text-xs mt-1">Select another class or register students into this academic level.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Admission No</th>
                  <th className="px-6 py-3">Attendance Status</th>
                  <th className="px-6 py-3">Remarks / Note</th>
                  <th className="px-6 py-3">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((st, idx) => {
                  const studentId = st.id || st.student_id || st.student_enrollment_id;
                  const student = st.student || {};
                  const fullName = st.full_name || student.full_name || `${st.first_name || student.first_name || ''} ${st.last_name || student.last_name || ''}`.trim() || 'Student';
                  const currentStatus = attendanceMap[studentId] || 'present';

                  return (
                    <tr key={studentId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{fullName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{st.admission_number || student.admission_number || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50 space-x-1">
                          {[
                            { key: 'present', label: 'Present', color: 'bg-green-600 text-white' },
                            { key: 'absent', label: 'Absent', color: 'bg-red-600 text-white' },
                            { key: 'late', label: 'Late', color: 'bg-yellow-500 text-white' },
                            { key: 'excused', label: 'Excused', color: 'bg-purple-600 text-white' },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => handleStatusChange(studentId, opt.key)}
                              disabled={!canManageAttendance}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                currentStatus === opt.key
                                  ? opt.color
                                  : 'text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          placeholder="Add optional note..."
                          value={remarksMap[studentId] || ''}
                          onChange={(e) => handleRemarkChange(studentId, e.target.value)}
                          readOnly={!canManageAttendance}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-6 py-4 align-top">
                        {st.attendance_id ? <>
                          <button type="button" onClick={() => loadCorrections(st.attendance_id)} className="whitespace-nowrap rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                            {correctionHistory[st.attendance_id]?.open ? 'Hide history' : 'View history'}
                          </button>
                          {correctionHistory[st.attendance_id]?.open && <div className="mt-2 min-w-56 max-w-xs rounded-lg bg-slate-50 p-2 text-xs">
                            {correctionHistory[st.attendance_id]?.loading ? <span className="text-slate-500">Loading history...</span> : correctionHistory[st.attendance_id]?.error ? <span className="text-red-600">{correctionHistory[st.attendance_id].error}</span> : correctionHistory[st.attendance_id]?.items?.length ? <div className="space-y-2">{correctionHistory[st.attendance_id].items.map((item) => <div key={item.id} className="border-b border-slate-200 pb-2 last:border-0 last:pb-0"><p className="font-semibold text-slate-700">{item.before_status} → {item.after_status}</p><p className="text-slate-500">{item.reason}</p><p className="text-slate-400">{item.editor?.name || 'Authorized user'} · {item.created_at ? new Date(item.created_at).toLocaleString() : 'Date unavailable'}</p></div>)}</div> : <span className="text-slate-500">No corrections recorded.</span>}
                          </div>}
                        </> : <span className="text-slate-400">Not saved</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
