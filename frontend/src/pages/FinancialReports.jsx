import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const initialReport = {
  summary: { income: 0, expenses: 0, profit_loss: 0, payment_count: 0, expense_count: 0 },
  income: [],
  expenses: [],
  income_by_method: [],
  expenses_by_category: [],
};

const currency = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));
const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function FinancialReports({ defaultTab = "overview" }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [report, setReport] = useState(initialReport);
  const [filters, setFilters] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const response = await api.get("/financial-reports", { params });
      const payload = response?.data?.data || response?.data || {};
      setReport({
        ...initialReport,
        ...payload,
        summary: { ...initialReport.summary, ...(payload.summary || {}) },
        income: safeArray(payload.income),
        expenses: safeArray(payload.expenses),
        income_by_method: safeArray(payload.income_by_method),
        expenses_by_category: safeArray(payload.expenses_by_category),
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Financial reports could not be loaded.");
      setReport(initialReport);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReport(); }, []);

  const tabs = useMemo(() => [
    { key: "overview", label: "Overview" },
    { key: "payment-reports", label: "Payment Reports" },
    { key: "income", label: "Income" },
    { key: "expenses", label: "Expenses" },
    { key: "profit-loss", label: "Profit / Loss" },
    { key: "tax-reports", label: "Tax Reports" },
  ], []);

  if (loading) return <LoadingSpinner text="Loading financial reports..." />;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader title="Financial Reports" description="Review school income, payments, expenses, profit or loss, and tax-ready records." />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">From<input type="date" value={filters.from} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-sm font-medium text-slate-600">To<input type="date" value={filters.to} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
          </div>
          <button type="button" onClick={loadReport} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Apply filters</button>
        </div>
        {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button type="button" onClick={loadReport} className="font-semibold underline">Retry</button></div>}
        <div className="mt-5 flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">
          {tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${activeTab === tab.key ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500"}`}>{tab.label}</button>)}
        </div>
      </div>

      {activeTab === "overview" && <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase text-slate-500">Recorded income</p><p className="mt-2 text-2xl font-bold text-emerald-700">{currency(report.summary.income)}</p><p className="mt-1 text-xs text-slate-500">{report.summary.payment_count} payment records</p></div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase text-slate-500">Recorded expenses</p><p className="mt-2 text-2xl font-bold text-rose-700">{currency(report.summary.expenses)}</p><p className="mt-1 text-xs text-slate-500">{report.summary.expense_count} expense records</p></div>
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100"><p className="text-xs font-semibold uppercase text-slate-500">Net profit / loss</p><p className={`mt-2 text-2xl font-bold ${Number(report.summary.profit_loss) >= 0 ? "text-blue-700" : "text-amber-700"}`}>{currency(report.summary.profit_loss)}</p><p className="mt-1 text-xs text-slate-500">Income less recorded expenses</p></div>
      </div>}

      {activeTab === "profit-loss" && <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><h2 className="text-lg font-bold text-slate-900">Profit / Loss Statement</h2><div className="mt-5 max-w-xl space-y-3 text-sm"><div className="flex justify-between border-b py-3"><span>Gross income</span><strong className="text-emerald-700">{currency(report.summary.income)}</strong></div><div className="flex justify-between border-b py-3"><span>Operating expenses</span><strong className="text-rose-700">({currency(report.summary.expenses)})</strong></div><div className="flex justify-between border-t-2 border-slate-900 py-3 text-base"><span className="font-bold">Net position</span><strong>{currency(report.summary.profit_loss)}</strong></div></div></div>}

      {activeTab === "tax-reports" && <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100"><h2 className="text-lg font-bold text-slate-900">Tax-ready Report</h2><p className="mt-2 text-sm text-slate-600">The system has prepared the school’s recorded income and expenses for tax review. No tax rate or statutory tax rule is configured in the current school settings, so tax due is not calculated automatically.</p><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase text-slate-500">Taxable income basis</p><strong>{currency(report.summary.income)}</strong></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase text-slate-500">Deductible expense basis</p><strong>{currency(report.summary.expenses)}</strong></div><div className="rounded-lg bg-amber-50 p-4"><p className="text-xs uppercase text-amber-700">Automatic tax due</p><strong className="text-amber-800">Not configured</strong></div></div></div>}

      {(activeTab === "payment-reports" || activeTab === "income") && <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100"><div className="border-b p-5"><h2 className="font-bold text-slate-900">Payment Reports</h2></div>{safeArray(report.income).length === 0 ? <EmptyState title="No payments found" description="There are no fee payments in the selected date range." /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Receipt</th><th className="p-4">Student</th><th className="p-4">Method</th><th className="p-4">Date</th><th className="p-4 text-right">Amount</th></tr></thead><tbody className="divide-y">{safeArray(report.income).map((payment) => <tr key={payment.id}><td className="p-4 font-mono">{payment.receipt_number || `REC-${payment.id}`}</td><td className="p-4">{payment.student_name || "—"}</td><td className="p-4">{payment.payment_method || "—"}</td><td className="p-4">{payment.payment_date || "—"}</td><td className="p-4 text-right font-semibold text-emerald-700">{currency(payment.amount_paid)}</td></tr>)}</tbody></table></div>}</div>}

      {activeTab === "expenses" && <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100"><div className="border-b p-5"><h2 className="font-bold text-slate-900">Expense Reports</h2></div>{safeArray(report.expenses).length === 0 ? <EmptyState title="No expenses found" description="There are no expense records in the selected date range." /> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Title</th><th className="p-4">Category</th><th className="p-4">Date</th><th className="p-4 text-right">Amount</th></tr></thead><tbody className="divide-y">{safeArray(report.expenses).map((expense) => <tr key={expense.id}><td className="p-4 font-medium">{expense.title}</td><td className="p-4">{expense.category || "—"}</td><td className="p-4">{expense.expense_date || "—"}</td><td className="p-4 text-right font-semibold text-rose-700">{currency(expense.amount)}</td></tr>)}</tbody></table></div>}</div>}
    </div>
  );
}
