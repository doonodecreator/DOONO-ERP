import { useEffect, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const safeArray = (value) => (Array.isArray(value) ? value : []);
const currency = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));

export default function LibraryWorkspace({ defaultTab = "books" }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [data, setData] = useState({ books: [], members: [], loans: [], reports: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/library/workspace");
      const payload = response?.data?.data || response?.data || {};
      setData({ books: safeArray(payload.books), members: safeArray(payload.members), loans: safeArray(payload.loans), reports: payload.reports || {} });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Library workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <LoadingSpinner text="Loading library workspace..." />;

  return <div className="space-y-6 p-4 md:p-6">
    <PageHeader title="Library Workspace" description="Manage the school library catalogue, members, loans, fines, and reports." />
    {error && <div className="flex items-center justify-between rounded-lg bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={loadData} className="font-semibold underline">Retry</button></div>}
    <div className="flex gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">{[{ key: "books", label: "Books" }, { key: "members", label: "Members" }, { key: "loans", label: "Loans" }, { key: "reports", label: "Reports" }].map((tab) => <button type="button" key={tab.key} onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${activeTab === tab.key ? "bg-indigo-600 text-white" : "text-slate-600"}`}>{tab.label}</button>)}</div>

    {activeTab === "reports" && <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs uppercase text-slate-500">Book titles</p><strong className="mt-2 block text-2xl">{data.reports.book_titles || 0}</strong></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs uppercase text-slate-500">Active loans</p><strong className="mt-2 block text-2xl">{data.reports.active_loans || 0}</strong></div><div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs uppercase text-slate-500">Outstanding fines</p><strong className="mt-2 block text-2xl text-rose-700">{currency(data.reports.fines)}</strong></div></div>}

    {activeTab === "books" && <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{data.books.length === 0 ? <EmptyState title="No books in catalogue" description="Add books from the Books workspace to populate the library catalogue." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Title</th><th className="p-4">Author</th><th className="p-4">Category</th><th className="p-4">Copies</th></tr></thead><tbody className="divide-y">{data.books.map((book) => <tr key={book.id}><td className="p-4 font-medium">{book.title}</td><td className="p-4">{book.author || "—"}</td><td className="p-4">{book.category || "—"}</td><td className="p-4">{book.available_copies} / {book.total_copies}</td></tr>)}</tbody></table>}</div>}

    {activeTab === "members" && <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{data.members.length === 0 ? <EmptyState title="No library members" description="Active students in this school will appear as library members." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Member</th><th className="p-4">Admission No.</th><th className="p-4">Class</th><th className="p-4">Loans</th></tr></thead><tbody className="divide-y">{data.members.map((member) => <tr key={member.id}><td className="p-4 font-medium">{member.name}</td><td className="p-4">{member.admission_number || "—"}</td><td className="p-4">{member.class || "—"}</td><td className="p-4">{member.loan_count}</td></tr>)}</tbody></table>}</div>}

    {activeTab === "loans" && <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-100">{data.loans.length === 0 ? <EmptyState title="No library loans" description="Book loans will appear here after books are issued." /> : <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Book</th><th className="p-4">Member</th><th className="p-4">Due date</th><th className="p-4">Status</th><th className="p-4 text-right">Fine</th></tr></thead><tbody className="divide-y">{data.loans.map((loan) => <tr key={loan.id}><td className="p-4 font-medium">{loan.book || "—"}</td><td className="p-4">{loan.student || "—"}</td><td className="p-4">{loan.due_date || "—"}</td><td className="p-4">{loan.status || "—"}</td><td className="p-4 text-right">{currency(loan.fine_amount)}</td></tr>)}</tbody></table>}</div>}
  </div>;
}
