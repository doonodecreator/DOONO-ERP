import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function ReportCardVerification() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, valid: false, data: null, message: "" });

  useEffect(() => {
    let active = true;
    api.get(`/verify/report-card/${encodeURIComponent(token || "")}`)
      .then((response) => {
        if (active) setState({ loading: false, valid: response?.data?.valid === true, data: response?.data?.data || null, message: response?.data?.message || "" });
      })
      .catch((error) => {
        if (active) setState({ loading: false, valid: false, data: null, message: error?.response?.data?.message || "This document could not be verified." });
      });
    return () => { active = false; };
  }, [token]);

  if (state.loading) return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"><p>Checking official document...</p></main>;

  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900"><div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-8"><div className="mb-6 border-b border-slate-100 pb-5"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">DOONO De Creator ERP</p><h1 className="mt-2 text-2xl font-bold">Document verification</h1><p className="mt-2 text-sm leading-6 text-slate-500">This page confirms whether a report card was officially published by a school using DOONO.</p></div>{state.valid && state.data ? <><div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><p className="font-bold text-emerald-800">Official document verified</p><p className="mt-1 text-sm text-emerald-700">The document token is valid and the report card is published.</p></div><dl className="grid gap-4 sm:grid-cols-2">{[["School", state.data.school], ["Learner", state.data.student_name], ["Admission number", state.data.admission_number], ["Academic session", state.data.academic_session], ["Term", state.data.term], ["Average score", state.data.average_score === null || state.data.average_score === undefined ? "—" : `${state.data.average_score}%`], ["Overall grade", state.data.overall_grade || "—"], ["Position", state.data.position || "—"], ["Promotion status", state.data.promotion_status || "—"]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-800">{value || "—"}</dd></div>)}</dl></> : <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="font-bold text-rose-800">Document not verified</p><p className="mt-2 text-sm leading-6 text-rose-700">{state.message || "This document could not be verified or is no longer published."}</p></div>}<p className="mt-6 text-xs leading-5 text-slate-500">Verification confirms publication status and selected summary fields only. It does not expose private comments, guardian data, medical details, or the school’s full student records.</p></div></main>;
}
