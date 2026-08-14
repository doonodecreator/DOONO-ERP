import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPrimaryRoleSlug } from '../utils/role';

export default function ResultEntry({ setPage }) {
  const { roles, isPlatformAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [terms, setTerms] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');

  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [isLocked, setIsLocked] = useState(false);

  const userRole = getPrimaryRoleSlug({ roles, isPlatformAdmin });

  const isPrincipalOrAdmin = [
    'super_admin',
    'school_admin',
    'admin',
    'principal',
    'proprietor',
  ].includes(userRole);

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedSession && selectedTerm) {
      loadStudentScores();
    }
  }, [selectedClass, selectedSubject, selectedSession, selectedTerm]);

  const loadDropdowns = async () => {
    try {
      setLoading(true);
      const [classRes, subjRes, sessRes, termRes] = await Promise.allSettled([
        api.get('/classes'),
        api.get('/subjects'),
        api.get('/academic-sessions'),
        api.get('/terms'),
      ]);

      if (classRes.status === 'fulfilled') {
        const data = classRes.value.data.data || classRes.value.data;
        setClasses(Array.isArray(data) ? data : []);
      }
      if (subjRes.status === 'fulfilled') {
        const data = subjRes.value.data.data || subjRes.value.data;
        setSubjects(Array.isArray(data) ? data : []);
      }
      if (sessRes.status === 'fulfilled') {
        const data = sessRes.value.data.data || sessRes.value.data;
        const sessList = Array.isArray(data) ? data : [];
        setSessions(sessList);
        if (sessList.length > 0) setSelectedSession(sessList[0].id);
      }
      if (termRes.status === 'fulfilled') {
        const data = termRes.value.data.data || termRes.value.data;
        const termList = Array.isArray(data) ? data : [];
        setTerms(termList);
        if (termList.length > 0) setSelectedTerm(termList[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize entry options.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudentScores = async () => {
    try {
      setLoading(true);
      setError('');
      setMessage('');

      const response = await api.get('/results', {
        params: {
          class_id: selectedClass,
          subject_id: selectedSubject,
          academic_session_id: selectedSession,
          term_id: selectedTerm,
        },
      });

      const resData = response.data.data || response.data || [];
      const studentList = resData.students || resData || [];
      setStudents(Array.isArray(studentList) ? studentList : []);

      const initialScores = {};
      (Array.isArray(studentList) ? studentList : []).forEach((st) => {
        const stId = st.id || st.student_id || st.student_enrollment_id;
        initialScores[stId] = {
          ca_score: st.ca_score ?? st.result?.ca_score ?? 0,
          exam_score: st.exam_score ?? st.result?.exam_score ?? 0,
        };
      });

      setScores(initialScores);
      setIsLocked(resData.is_locked || false);
    } catch (err) {
      setError(err.message || 'Failed to fetch score matrix.');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (studentId, field, value) => {
    const numericValue = Math.max(0, Math.min(field === 'ca_score' ? 40 : 60, Number(value) || 0));
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numericValue,
      },
    }));
  };

  const calculateTotal = (ca, exam) => {
    return (Number(ca) || 0) + (Number(exam) || 0);
  };

  const calculateGrade = (total) => {
    if (total >= 70) return { grade: 'A', remark: 'Excellent' };
    if (total >= 60) return { grade: 'B', remark: 'Very Good' };
    if (total >= 50) return { grade: 'C', remark: 'Credit' };
    if (total >= 45) return { grade: 'D', remark: 'Pass' };
    if (total >= 40) return { grade: 'E', remark: 'Fair' };
    return { grade: 'F', remark: 'Fail' };
  };

  const handleSaveScores = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject) return;

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      class_id: selectedClass,
      subject_id: selectedSubject,
      academic_session_id: selectedSession,
      term_id: selectedTerm,
      results: students.map((st) => {
        const stId = st.id || st.student_id || st.student_enrollment_id;
        const sc = scores[stId] || { ca_score: 0, exam_score: 0 };
        const total = calculateTotal(sc.ca_score, sc.exam_score);
        const { grade, remark } = calculateGrade(total);

        return {
          student_enrollment_id: st.student_enrollment_id || stId,
          student_id: st.student_id || stId,
          ca_score: sc.ca_score,
          exam_score: sc.exam_score,
          total_score: total,
          grade: grade,
          remark: remark,
        };
      }),
    };

    try {
      await api.post('/results', payload);
      setMessage('Scores successfully saved and computed!');
    } catch (err) {
      setError(err.message || 'Failed to submit score sheet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Result Entry Sheet</h1>
          <p className="text-sm text-gray-500">Record CA test marks and exam scores with real-time grade calculations.</p>
        </div>
        {students.length > 0 && !isLocked && (
          <button
            onClick={handleSaveScores}
            disabled={saving}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-50 text-sm"
          >
            {saving ? 'Saving Sheet...' : 'Save & Submit Scores'}
          </button>
        )}
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
          <button onClick={loadStudentScores} className="underline font-semibold">Retry</button>
        </div>
      )}

      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Class *</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Class...</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code || 'CORE'})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name || s.session_year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Academic Term</label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
          >
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading student roster and scores...</div>
        ) : !selectedClass || !selectedSubject ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">Please select a Class and Subject to open the score sheet.</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-base font-medium">No students enrolled in this class.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">#</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Admission No</th>
                  <th className="px-6 py-3">CA Score (Max 40)</th>
                  <th className="px-6 py-3">Exam Score (Max 60)</th>
                  <th className="px-6 py-3">Total (100)</th>
                  <th className="px-6 py-3">Grade</th>
                  <th className="px-6 py-3">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((st, idx) => {
                  const stId = st.id || st.student_id || st.student_enrollment_id;
                  const fullName = st.full_name || `${st.first_name || ''} ${st.last_name || ''}`.trim();
                  const currentScores = scores[stId] || { ca_score: 0, exam_score: 0 };
                  const total = calculateTotal(currentScores.ca_score, currentScores.exam_score);
                  const { grade, remark } = calculateGrade(total);

                  return (
                    <tr key={stId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">{idx + 1}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{fullName}</td>
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{st.admission_number || '—'}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          max="40"
                          min="0"
                          disabled={isLocked}
                          value={currentScores.ca_score}
                          onChange={(e) => handleScoreChange(stId, 'ca_score', e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono font-semibold focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          max="60"
                          min="0"
                          disabled={isLocked}
                          value={currentScores.exam_score}
                          onChange={(e) => handleScoreChange(stId, 'exam_score', e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-mono font-semibold focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-900 text-base">{total}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-bold ${
                          grade === 'A' ? 'bg-green-100 text-green-700' :
                          grade === 'B' ? 'bg-blue-100 text-blue-700' :
                          grade === 'C' ? 'bg-indigo-100 text-indigo-700' :
                          grade === 'D' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-600">{remark}</td>
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
