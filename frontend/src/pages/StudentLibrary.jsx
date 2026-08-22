import { useEffect, useState } from "react";
import api from "../services/api";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";

export default function StudentLibrary() {
  const [data, setData] = useState({ books: [], my_loans: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/student/library")
      .then((response) => {
        if (!active) return;
        const payload = response?.data?.data || {};
        setData({
          books: Array.isArray(payload.books) ? payload.books : [],
          my_loans: Array.isArray(payload.my_loans) ? payload.my_loans : [],
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError?.response?.data?.message || "Unable to load your library.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  if (loading) return <LoadingSpinner text="Loading your library..." />;

  return (
    <PageContainer>
      <PageHeader title="My Library" subtitle="Browse the school catalogue and view your current loans." />
      {error && <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Available catalogue" description="Books currently listed by your school library.">
          {data.books.length === 0 ? <EmptyState title="No books available" message="The school library catalogue is empty." /> : <div className="divide-y divide-slate-100">{data.books.map((book) => <article key={book.id} className="py-4 first:pt-0 last:pb-0"><h3 className="font-semibold text-slate-900">{book.title}</h3><p className="mt-1 text-sm text-slate-500">{book.author || "Author not listed"}{book.category ? ` · ${book.category}` : ""}</p><p className="mt-2 text-xs font-semibold text-emerald-700">{book.available_copies} available</p></article>)}</div>}
        </SectionCard>
        <SectionCard title="My loans" description="Your issued books, due dates, and fines.">
          {data.my_loans.length === 0 ? <EmptyState title="No active loans" message="Books issued to you will appear here." /> : <div className="divide-y divide-slate-100">{data.my_loans.map((loan) => <article key={loan.id} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{loan.book || "Book"}</h3><p className="mt-1 text-sm text-slate-500">Borrowed {loan.borrowed_date || "—"} · Due {loan.due_date || "—"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{loan.status || "Unknown"}</span></div>{Number(loan.fine_amount || 0) > 0 && <p className="mt-2 text-sm font-semibold text-rose-600">Fine: ₦{Number(loan.fine_amount).toLocaleString()}</p>}</article>)}</div>}
        </SectionCard>
      </div>
    </PageContainer>
  );
}
