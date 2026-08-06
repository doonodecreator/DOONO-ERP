import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function AccountantDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(false);
    const [expenses, setExpenses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [showExpenseModal, setShowExpenseModal] = useState(false);

    const [expenseForm, setExpenseForm] = useState({
        title: "",
        description: "",
        amount: "",
        category: "Utilities",
        expense_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        loadFinancialData();
    }, []);

    const loadFinancialData = async () => {
        setLoading(true);
        try {
            const [expRes, payRes] = await Promise.all([
                api.get("/expenses").catch(() => ({ data: { data: [] } })),
                api.get("/fee-payments").catch(() => ({ data: { data: [] } }))
            ]);

            setExpenses(expRes.data?.data || expRes.data || []);
            setPayments(payRes.data?.data || payRes.data || []);
        } catch (err) {
            console.error("Failed to load financial records", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExpense = async (e) => {
        e.preventDefault();
        try {
            await api.post("/expenses", expenseForm);
            setShowExpenseModal(false);
            setExpenseForm({
                title: "",
                description: "",
                amount: "",
                category: "Utilities",
                expense_date: new Date().toISOString().split('T')[0]
            });
            loadFinancialData();
        } catch (err) {
            alert("Error recording expense item.");
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!confirm("Are you sure you want to delete this expense record?")) return;
        try {
            await api.delete(`/expenses/${id}`);
            loadFinancialData();
        } catch (err) {
            alert("Failed to delete expense record.");
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(val);
    };

    const totalIncome = payments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netProfitLoss = totalIncome - totalExpenses;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accountant Portal & Financial Suite</h1>
                        <p className="text-sm text-gray-500 mt-1">Monitor income streams, audit overhead expenditures, and review institutional profit & loss balance sheets.</p>
                    </div>
                    <button onClick={() => setShowExpenseModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm self-start">
                        + Record Expense
                    </button>
                </div>

                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["overview", "income", "expenses", "profit-loss", "tax-reports"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-emerald-600 text-emerald-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab.replace("-", " ")}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Recorded Income</p>
                                    <h3 className="text-2xl font-bold mt-2 text-emerald-600">{formatCurrency(totalIncome)}</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Overhead Expenses</p>
                                    <h3 className="text-2xl font-bold mt-2 text-red-500">{formatCurrency(totalExpenses)}</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Net Balance Sheet Position</p>
                                    <h3 className={`text-2xl font-bold mt-2 ${netProfitLoss >= 0 ? "text-blue-600" : "text-amber-600"}`}>{formatCurrency(netProfitLoss)}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "income" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Institutional Income Ledger (Fee Remittances)</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Receipt Ref</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Amount Received</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50/70">
                                            <td className="p-4 font-mono font-medium text-blue-600">{p.receipt_number}</td>
                                            <td className="p-4">{p.payment_method}</td>
                                            <td className="p-4">{p.payment_date}</td>
                                            <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(p.amount_paid)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "expenses" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900">Overhead Expenditure Items</h3>
                                <button onClick={() => setShowExpenseModal(true)} className="bg-emerald-50 text-emerald-700 font-semibold px-4 py-2 rounded-xl text-xs">
                                    + Add Expense
                                </button>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {expenses.map(e => (
                                        <tr key={e.id} className="hover:bg-gray-50/70">
                                            <td className="p-4 font-semibold text-slate-900">{e.title}</td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">{e.category}</span></td>
                                            <td className="p-4">{e.expense_date}</td>
                                            <td className="p-4 text-right font-bold text-red-500">{formatCurrency(e.amount)}</td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500 hover:underline text-xs font-medium">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "profit-loss" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-6">
                            <h3 className="font-bold text-lg text-slate-900">Profit & Loss Statement Summary</h3>
                            <div className="space-y-4 text-sm max-w-xl">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Gross Income Revenue</span>
                                    <span className="font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 font-medium">Total Operating Expenses</span>
                                    <span className="font-bold text-red-500">({formatCurrency(totalExpenses)})</span>
                                </div>
                                <div className="flex justify-between py-3 border-t-2 border-slate-900 text-base">
                                    <span className="font-bold text-slate-900">Net Surplus / Deficit</span>
                                    <span className={`font-extrabold ${netProfitLoss >= 0 ? "text-blue-600" : "text-amber-600"}`}>{formatCurrency(netProfitLoss)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* EXPENSE MODAL */}
            {showExpenseModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Record Operational Expense</h3>
                            <button onClick={() => setShowExpenseModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Expense Title</label>
                                <input type="text" required value={expenseForm.title} onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Generator Diesel Refill" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount (₦)</label>
                                    <input type="number" required min="0" step="0.01" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                                    <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                        <option value="Utilities">Utilities</option>
                                        <option value="Salaries">Salaries</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Supplies">Supplies</option>
                                        <option value="Miscellaneous">Miscellaneous</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Date</label>
                                <input type="date" required value={expenseForm.expense_date} onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea rows="2" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Optional notes..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
