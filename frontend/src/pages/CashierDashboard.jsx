import React, { useState, useEffect } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";

export default function CashierDashboard() {
    const [activeTab, setActiveTab] = useState("receive");
    const [loading, setLoading] = useState(false);
    const [studentBills, setStudentBills] = useState([]);
    const [payments, setPayments] = useState([]);
    
    const [paymentForm, setPaymentForm] = useState({
        student_fee_id: "",
        amount_paid: "",
        payment_method: "Cash",
        transaction_reference: "",
        remarks: ""
    });

    const [discountForm, setDiscountForm] = useState({
        student_fee_id: "",
        discount_amount: "",
        reason: ""
    });

    const [selectedReceipt, setSelectedReceipt] = useState(null);

    useEffect(() => {
        loadCashierData();
    }, []);

    const loadCashierData = async () => {
        setLoading(true);
        try {
            const [billsRes, paymentsRes] = await Promise.all([
                api.get("/student-fees").catch(() => ({ data: { data: [] } })),
                api.get("/fee-payments").catch(() => ({ data: { data: [] } }))
            ]);

            setStudentBills(arrayFromResponse(billsRes));
            setPayments(arrayFromResponse(paymentsRes));
        } catch (err) {
            console.error("Error loading cashier records", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post("/fee-payments", paymentForm);
            alert("Payment successfully recorded and receipt generated!");
            setPaymentForm({
                student_fee_id: "",
                amount_paid: "",
                payment_method: "Cash",
                transaction_reference: "",
                remarks: ""
            });
            loadCashierData();
            if (res.data?.data) {
                setSelectedReceipt(res.data.data);
            }
        } catch (err) {
            alert("Failed to process payment transaction.");
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(val);
    };

    const pendingBills = studentBills.filter(b => (parseFloat(b.amount_due || b.total_amount || 0) - parseFloat(b.amount_paid || b.paid_amount || 0)) > 0);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Cashier & Bursary Operations Desk</h1>
                        <p className="text-sm text-gray-500 mt-1">Fast-track teller window collections, issue verified payment receipts, and manage student fee ledgers.</p>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["receive", "pending", "history", "reports"].map((tab) => (
                        <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab === "receive" ? "Receive Payment" : tab === "pending" ? "Pending / Outstanding" : tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === "receive" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">New Teller Payment Entry</h3>
                                <form onSubmit={handleRecordPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Student Bill Account</label>
                                        <select required value={paymentForm.student_fee_id} onChange={(e) => setPaymentForm({...paymentForm, student_fee_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                            <option value="">-- Choose Student Bill --</option>
                                            {pendingBills.map(b => {
                                                const student = b.student_enrollment?.student || b.student || {};
                                                const due = parseFloat(b.amount_due || b.total_amount || 0) - parseFloat(b.amount_paid || b.paid_amount || 0);
                                                return (
                                                    <option key={b.id} value={b.id}>
                                                        {student.surname} {student.first_name} ({student.admission_number}) — Balance Due: {formatCurrency(due)}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Amount Paid (₦)</label>
                                            <input type="number" required min="1" step="0.01" value={paymentForm.amount_paid} onChange={(e) => setPaymentForm({...paymentForm, amount_paid: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment Channel</label>
                                            <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                                <option value="Cash">Cash</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="POS">POS Terminal</option>
                                                <option value="Cheque">Cheque</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Transaction Reference / Teller Number</label>
                                        <input type="text" value={paymentForm.transaction_reference} onChange={(e) => setPaymentForm({...paymentForm, transaction_reference: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional bank teller or POS reference ID" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Remarks / Notes</label>
                                        <textarea rows="2" value={paymentForm.remarks} onChange={(e) => setPaymentForm({...paymentForm, remarks: e.target.value})} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional narration..."></textarea>
                                    </div>
                                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                                        Post Payment & Print Receipt
                                    </button>
                                </form>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-2">Quick Teller Stats</h3>
                                <p className="text-xs text-gray-400 mb-4">Real-time session collection metrics.</p>
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 uppercase">Today's Transactions</p>
                                        <h4 className="text-xl font-bold text-slate-900 mt-1">{payments.length} Payments Recorded</h4>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <p className="text-xs font-semibold text-gray-400 uppercase">Total Collected Volume</p>
                                        <h4 className="text-xl font-bold text-emerald-600 mt-1">
                                            {formatCurrency(payments.reduce((acc, p) => acc + parseFloat(p.amount_paid || 0), 0))}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "pending" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Pending & Outstanding Student Balances</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Student Name</th>
                                        <th className="p-4">Admission Number</th>
                                        <th className="p-4 text-right">Total Bill</th>
                                        <th className="p-4 text-right">Paid</th>
                                        <th className="p-4 text-right">Balance Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {pendingBills.map(b => {
                                        const student = b.student_enrollment?.student || b.student || {};
                                        const total = parseFloat(b.amount_due || b.total_amount || 0);
                                        const paid = parseFloat(b.amount_paid || b.paid_amount || 0);
                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{student.surname} {student.first_name}</td>
                                                <td className="p-4 font-mono text-xs">{student.admission_number}</td>
                                                <td className="p-4 text-right font-medium">{formatCurrency(total)}</td>
                                                <td className="p-4 text-right text-emerald-600 font-medium">{formatCurrency(paid)}</td>
                                                <td className="p-4 text-right text-red-500 font-bold">{formatCurrency(total - paid)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "history" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Transaction History & Receipts</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Receipt Ref</th>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Method</th>
                                        <th className="p-4">Date</th>
                                        <th className="p-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {payments.map(p => {
                                        const student = p.studentFee?.studentEnrollment?.student || p.student || {};
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-mono font-medium text-blue-600">{p.receipt_number}</td>
                                                <td className="p-4 font-medium">{student.surname} {student.first_name}</td>
                                                <td className="p-4">{p.payment_method}</td>
                                                <td className="p-4">{p.payment_date}</td>
                                                <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(p.amount_paid)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
