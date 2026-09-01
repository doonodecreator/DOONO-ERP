import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import { useAuth } from "../context/AuthContext";

function resultsPayload(response) {
  const value = response?.data?.data;
  return value && typeof value === "object" && !Array.isArray(value)
    ? { ...value, results: Array.isArray(value.results) ? value.results : [] }
    : { query: "", results: [] };
}

export default function GlobalSearch({ setPage, onOpenResult }) {
  const { school, isOrganizationOwner, isPlatformAdmin } = useAuth();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [payload, setPayload] = useState({ query: "", results: [] });
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const options = useMemo(() => school ? [
    ["", "All school records"], ["students", "Students"], ["parents", "Parents / guardians"], ["staff", "Staff"], ["enrollments", "Enrollments"], ["results", "Results"],
  ] : [["", "All organization records"], ...(isPlatformAdmin ? [["organizations", "Organizations"]] : []), ["schools", "Schools"]], [school, isOrganizationOwner, isPlatformAdmin]);

  useEffect(() => {
    setType("");
    setPayload({ query: "", results: [] });
    setSearched(false);
    setError("");
  }, [school?.id]);

  const runSearch = async (event) => {
    event?.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setError("Enter at least 2 characters to search.");
      setSearched(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/global-search", { params: { q: trimmed, ...(type ? { type } : {}), limit: 25 } });
      setPayload(resultsPayload(response));
      setSearched(true);
    } catch (requestError) {
      setPayload({ query: trimmed, results: [] });
      setError(requestError?.response?.data?.message || "Global search could not be completed.");
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return <PageContainer>
    <PageHeader title="Global Search" subtitle={school ? "Find permitted records in the current school without opening every module." : "Find organizations and schools available in your current context."} />
    <form onSubmit={runSearch} className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_220px_auto] md:items-end">
        <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Search by name, number, email, or phone</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={school ? "e.g. admission number or student name" : "e.g. school name or school code"} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-600" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold text-slate-700">Record type</span><select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">All available</option>{options.filter(([value]) => value).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button type="submit" disabled={loading} className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Searching..." : "Search"}</button>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Search is limited to records your current role and school context is permitted to view. It does not search another school.</p>
    </form>
    {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
    {loading ? <LoadingSpinner text="Searching permitted records..." /> : !searched ? <EmptyState title="Search when you are ready" message="Enter a name, admission number, staff number, email, phone, school name, or school code." /> : payload.results.length === 0 ? <EmptyState title="No records found" message={`No permitted records matched “${payload.query || query.trim()}” in this context.`} /> : <section className="space-y-3" aria-label="Search results">{payload.results.map((result) => <article key={`${result.type}-${result.id}`} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{result.title || "Record"}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{result.type || "record"}</span></div><p className="mt-1 text-sm text-slate-600">{result.subtitle || "Open the related workspace to continue."}</p></div><button type="button" onClick={() => (onOpenResult ? onOpenResult(result) : setPage?.(result.page))} className="shrink-0 rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700">Open workspace</button></div></article>)}</section>}
  </PageContainer>;
}
