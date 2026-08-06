import React, { useState, useEffect } from 'react';
import api from '../utils/api';
​export default function Expenses() {
const [expenses, setExpenses] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [showModal, setShowModal] = useState(false);
​const [form, setForm] = useState({
title: '',
amount: '',
category: 'Operational',
expense_date: new Date().toISOString().split('T')[0],
description: '',
});
​useEffect(() => {
loadExpenses();
}, []);
​const loadExpenses = async () => {
try {
setLoading(true);
setError('');
const res = await api.get('/expenses');
const data = res.data.data || res.data || [];
setExpenses(Array.isArray(data) ? data : []);
} catch (err) {
setError(err.response?.data?.message || 'Failed to load expense records.');
} finally {
setLoading(false);
}
};
​const handleCreate = async (e) => {
e.preventDefault();
try {
await api.post('/expenses', form);
setShowModal(false);
setForm({ title: '', amount: '', category: 'Operational', expense_date: new Date().toISOString().split('T')[0], description: '' });
loadExpenses();
} catch (err) {
alert(err.response?.data?.message || 'Failed to record expense.');
}
};
​const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
​return (
<div className="p-6 bg-gray-50 min-h-screen">
<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
<div>
<h1 className="text-2xl font-bold text-gray-800">School Expenses & Accounts</h1>
<p className="text-sm text-gray-500">Track institutional expenditures, maintenance costs, and operational outflows.</p>
</div>
<button
onClick={() => setShowModal(true)}
className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
>
+ Record Expense
</button>
</div>
​{error && (
<div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between items-center">
<span>{error}</span>
<button onClick={loadExpenses} className="underline font-semibold">Retry</button>
</div>
)}
​{/* Metric Card */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
<div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
<div className="p-3 bg-red-100 text-red-600 rounded-lg text-2xl">💸</div>
<div>
<p className="text-xs text-gray-500 font-medium">Total Recorded Expenditures</p>
<h3 className="text-2xl font-bold text-gray-800 font-mono">₦{totalExpenses.toLocaleString()}</h3>
</div>
</div>
</div>
​<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
{loading ? (
<div className="p-12 text-center text-gray-500">Loading expense records...</div>
) : expenses.length === 0 ? (
<div className="p-12 text-center text-gray-400">No expenses recorded yet. Click "+ Record Expense".</div>
) : (
<div className="overflow-x-auto">
<table className="w-full text-left text-sm text-gray-600">
<thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
<tr>
<th className="px-6 py-3">Expense Title</th>
<th className="px-6 py-3">Category</th>
<th className="px-6 py-3">Amount</th>
<th className="px-6 py-3">Date</th>
<th className="px-6 py-3">Description</th>
</tr>
</thead>
<tbody className="divide-y divide-gray-100">
{expenses.map((ex) => (
<tr key={ex.id} className="hover:bg-gray-50 transition-colors">
<td className="px-6 py-4 font-semibold text-gray-900">{ex.title}</td>
<td className="px-6 py-4">
<span className="px-2.5 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-700">
{ex.category || 'Operational'}
</span>
</td>
<td className="px-6 py-4 font-mono font-semibold text-red-600">₦{Number(ex.amount || 0).toLocaleString()}</td>
<td className="px-6 py-4 text-xs text-gray-500">{ex.expense_date || '—'}</td>
<td className="px-6 py-4 text-gray-500">{ex.description || '—'}</td>
</tr>
))}
</tbody>
</table>
</div>
)}
</div>
​{/* Modal */}
{showModal && (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
<div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
<h3 className="text-lg font-bold text-gray-900 mb-4">Record School Expense</h3>
<form onSubmit={handleCreate} className="space-y-4">
<div>
<label className="block text-xs font-semibold text-gray-600 mb-1">Expense Title *</label>
<input
type="text"
required
value={form.title}
onChange={(e) => setForm({ ...form, title: e.target.value })}
placeholder="e.g. Generator Diesel Refill"
className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
/>
</div>
<div className="grid grid-cols-2 gap-4">
<div>
<label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₦) *</label>
<input
type="number"
step="0.01"
required
value={form.amount}
onChange={(e) => setForm({ ...form, amount: e.target.value })}
placeholder="15000"
className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
/>
</div>
<div>
<label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
<select
value={form.category}
onChange={(e) => setForm({ ...form, category: e.target.value })}
className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
>
<option value="Operational">Operational</option>
<option value="Maintenance">Maintenance</option>
<option value="Salary">Salary / Wages</option>
<option value="Utilities">Utilities</option>
<option value="Supplies">Supplies</option>
</select>
</div>
</div>
<div>
<label className="block text-xs font-semibold text-gray-600 mb-1">Expense Date</label>
<input
type="date"
value={form.expense_date}
onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
/>
</div>
<div>
<label className="block text-xs font-semibold text-gray-600 mb-1">Description / Notes</label>
<textarea
value={form.description}
onChange={(e) => setForm({ ...form, description: e.target.value })}
placeholder="Additional details..."
rows="3"
className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
></textarea>
</div>
<div className="flex justify-end space-x-3 pt-2">
<button
type="button"
onClick={() => setShowModal(false)}
className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
>
Cancel
</button>
<button
type="submit"
className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
>
Save Expense
</button>
</div>
</form>
</div>
</div>
)}
</div>
);
}
