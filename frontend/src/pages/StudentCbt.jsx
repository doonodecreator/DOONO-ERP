import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const listFrom = (response) => { const value = response?.data?.data ?? response?.data ?? []; if (Array.isArray(value)) return value; if (Array.isArray(value?.data)) return value.data; return []; };
const formatTime = (seconds) => `${String(Math.floor(Math.max(0, seconds) / 60)).padStart(2, "0")}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;

export default function StudentCbt() {
  const [assessments, setAssessments] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAssessments() {
    try { setLoading(true); setError(""); const response = await api.get("/student/cbt-assessments"); setAssessments(listFrom(response)); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to load available CBT assessments."); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadAssessments(); }, []);

  useEffect(() => {
    if (!attempt?.expires_at) return undefined;
    const update = () => { const remaining = Math.max(0, Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000)); setSecondsLeft(remaining); if (remaining === 0 && attempt.status === "in_progress") submitAttempt(true); };
    update(); const timer = window.setInterval(update, 1000); return () => window.clearInterval(timer);
  }, [attempt?.expires_at, attempt?.status]);

  const questions = useMemo(() => Array.isArray(attempt?.assessment?.questions) ? attempt.assessment.questions : [], [attempt]);
  const currentQuestion = questions[currentIndex];

  async function startAssessment(assessment) {
    try { setWorking(true); setError(""); setMessage(""); const response = await api.post(`/student/cbt-assessments/${assessment.id}/start`); const nextAttempt = response?.data?.data || response?.data?.attempt; setAttempt(nextAttempt); setSelectedAnswers(Object.fromEntries((nextAttempt?.answers || []).map((answer) => [answer.cbt_assessment_question_id, answer.selected_answer]))); setCurrentIndex(0); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Unable to start this CBT assessment."); }
    finally { setWorking(false); }
  }

  async function saveAnswer(questionId, answer) {
    setSelectedAnswers((current) => ({ ...current, [questionId]: answer }));
    if (!attempt?.id) return;
    try { await api.post(`/student/cbt-attempts/${attempt.id}/answers`, { assessment_question_id: questionId, selected_answer: answer }); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Answer could not be autosaved. Check your connection and try again."); }
  }

  async function submitAttempt(expired = false) {
    if (!attempt?.id || working) return;
    try { setWorking(true); setError(""); const response = await api.post(`/student/cbt-attempts/${attempt.id}/submit`); setAttempt(response?.data?.data || response?.data?.attempt || { ...attempt, status: "submitted" }); setMessage(expired ? "Time expired. Your answers were submitted automatically." : "Your CBT was submitted successfully."); await loadAssessments(); }
    catch (requestError) { setError(requestError?.response?.data?.message || "The CBT could not be submitted."); }
    finally { setWorking(false); }
  }

  if (loading) return <PageContainer><LoadingSpinner text="Loading CBT assessments..." /></PageContainer>;

  if (attempt?.status === "in_progress") return <PageContainer><PageHeader title={attempt.assessment?.title || "CBT Examination"} subtitle={attempt.assessment?.instructions || "Answer each question. Your answers are autosaved."} action={<div className={`rounded-lg px-4 py-2 text-sm font-bold ${secondsLeft !== null && secondsLeft < 60 ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>Time left {formatTime(secondsLeft || 0)}</div>} />{error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="mb-4 flex gap-2 overflow-x-auto pb-2">{questions.map((question, index) => <button key={question.id} type="button" onClick={() => setCurrentIndex(index)} className={`min-h-10 min-w-10 rounded-full border px-3 text-sm font-bold ${index === currentIndex ? "bg-indigo-600 text-white" : selectedAnswers[question.id] ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "bg-white text-slate-600"}`}>{index + 1}</button>)}</div>{currentQuestion ? <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase text-slate-500">Question {currentIndex + 1} of {questions.length} · {currentQuestion.marks} mark{currentQuestion.marks === 1 ? "" : "s"}</p><h2 className="mt-3 text-lg font-bold text-slate-900">{currentQuestion.question}</h2><div className="mt-5 space-y-3">{(Array.isArray(currentQuestion.options) ? currentQuestion.options : []).map((option) => <label key={option} className={`flex min-h-12 items-center gap-3 rounded-lg border p-3 ${selectedAnswers[currentQuestion.id] === option ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}><input type="radio" name={`question-${currentQuestion.id}`} checked={selectedAnswers[currentQuestion.id] === option} onChange={() => saveAnswer(currentQuestion.id, option)} />{option}</label>)}</div><div className="mt-6 flex flex-wrap justify-between gap-3"><button type="button" disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} className="rounded-lg border px-4 py-2 font-semibold disabled:opacity-40">Previous</button>{currentIndex < questions.length - 1 ? <button type="button" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white">Next</button> : <button type="button" disabled={working} onClick={() => submitAttempt(false)} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{working ? "Submitting..." : "Submit test"}</button>}</div></section> : <EmptyState title="No questions assigned" message="This assessment has no question snapshot." />}</PageContainer>;

  if (attempt?.status === "submitted") return <PageContainer><PageHeader title={attempt.assessment?.title || "CBT Result"} subtitle="Your attempt has been submitted." /><div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="text-lg font-bold text-emerald-900">Submission received</h2><p className="mt-2 text-sm text-emerald-800">Your score has been recorded in the official result-computation engine.</p><p className="mt-2 text-sm text-emerald-800">The score, class position, highest average, grade, and report card will remain hidden until the official final result is approved and published.</p><button type="button" onClick={() => { setAttempt(null); setMessage(""); loadAssessments(); }} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Back to available tests</button></div></PageContainer>;

  return <PageContainer><PageHeader title="CBT Examinations" subtitle="Start an assigned computer-based test from the school CBT centre, a phone, or a computer." />{error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}{message && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}{assessments.length === 0 ? <EmptyState title="No CBT tests available" message="Your school has not published an assessment for your current class yet." /> : <div className="space-y-4">{assessments.map((assessment) => { const remaining = Number(assessment.attempts_remaining ?? assessment.max_attempts ?? 0); const exhausted = assessment.attempt_status !== "in_progress" && remaining <= 0; return <article key={assessment.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">{assessment.title}</h2><p className="mt-1 text-sm text-slate-500">{assessment.subject?.name || "Subject"} · {assessment.questions_count || 0} questions · {assessment.duration_minutes} minutes</p><p className="mt-1 text-xs text-slate-500">{assessment.attempt_status === "in_progress" ? "Attempt in progress" : `${remaining} attempt${remaining === 1 ? "" : "s"} remaining`}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{assessment.attempt_status || "Ready"}</span></div><button type="button" disabled={working || exhausted} onClick={() => startAssessment(assessment)} className="mt-4 min-h-11 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{assessment.attempt_status === "in_progress" ? "Resume test" : exhausted ? "All attempts used" : "Start test"}</button></article>; })}</div>}</PageContainer>;
}
