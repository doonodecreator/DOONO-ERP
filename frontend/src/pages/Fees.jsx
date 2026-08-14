import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getPrimaryRoleSlug } from "../utils/role";

export default function Fees({ setPage }) {
    const { roles, isPlatformAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [studentFees, setStudentFees] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classes, setClasses] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedFee, setSelectedFee] = useState(null);

    const [paymentForm, setPaymentForm] = useState({
        amount_paid: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "Cash",
        transaction_reference: "",
        remarks: ""
    });

    const userRole = getPrimaryRoleSlug({ roles, isPlatformAdmin });

    const canManageFees = ["super_admin", "proprietor", "principal", "bursar", "accountant"].includes(userRole);

    useEffect(() => {
        loadFinancialData();
    }, []);

    const loadFinancialData = async () => {
        try {
            setLoading(true);
            setError("");
            const [feeRes, structRes, sessionRes, termRes, classRes] = await Promise.allSettled([
                api.get("/student-fees"),
                api.get("/fees"),
                api.get("/academic-sessions"),
                api.get("/terms"),
                api.get("/classes")
            ]);

            if (feeRes.status === "fulfilled") {
                const data = feeRes.value.data.data || feeRes.value.data;
                setStudentFees(Array.isArray(data) ? data : []);
            }
            if (structRes.status === "fulfilled") {
                const data = structRes.value.data.data || structRes.value.data;
                setFeeStructures(Array.isArray(data) ? data : []);
            }
            if (sessionRes.status === "fulfilled") {
                const data = sessionRes.value.data.data || sessionRes.value.data;
                setSessions(Array.isArray(data) ? data : []);
            }
            if (termRes.status === "fulfilled") {
                const data = termRes.value.data.data || termRes.value.data;
                setTerms(Array.isArray(data) ? data : []);
            }
            if (classRes.status === "fulfilled") {
                const data = classRes.value.data.data || classRes.value.data;
                setClasses(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            setError(err.message || "Failed to load fee management data.");
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!selectedFee) return;

        try {
            await api.post("/payment-receipts", {
                student_fee_id: selectedFee.id,
                ...paymentForm
            });
            setSuccessMsg("Payment recorded successfully!");
            setShowPayModal(false);
            setSelectedFee(null);
            loadFinancialData();
        } catch (err) {
            alert(err.message || "Failed to process payment.");
        }
    };

    const filteredStudentFees = studentFees.filter((fee) => {
        const studentName = (fee.student?.full_name || fee.student_name || "").toLowerCase();
        const matchesSearch = studentName.includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || (fee.status || "").toLowerCase() === statusFilter.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fees & Student Invoices</h1>
                    <p className="text-sm text-gray-500">Overview of assigned student fee structures, dues, and payment records.</p>
                </div>
                {canManageFees && (
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setPage && setPage("fees-payments")}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 text-sm transition shadow-sm"
                        >
                            Configure Fee Setup
                        </button>
                    </div>
                )}
            </div>

            {successMsg && (
                <div className="p-4 mb-4 bg-green-50 text-green-700 rounded-lg border border-green-200 text-sm flex justify-between">
                    <span>{successMsg}</span>
                    <button onClick={() => setSuccessMsg("")} className="font-bold">✕</button>
                </div>
            )}
            {error && (
                <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between">
                    <span>{error}</span>
                    <button onClick={loadFinancialData} className="underline font-semibold">Retry</button>
                </div>
            )}

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by student name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                    <option value="all">All Payment Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="unpaid">Unpaid / Due</option>
                </select>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">Loading student fee invoices...</div>
                ) : filteredStudentFees.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <p className="text-base font-medium">No fee records found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3">Fee Category / Description</th>
                                    <th className="px-6 py-3">Amount Due</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStudentFees.map((fee) => (
                                    <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {fee.student?.full_name || fee.student_name || "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {fee.fee_category?.name || fee.remarks || "General Fee"}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-semibold text-gray-800">
                                            ₦{Number(fee.amount_due || fee.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                                                (fee.status || "").toLowerCase() === "paid"
                                                    ? "bg-green-100 text-green-700"
                                                    : (fee.status || "").toLowerCase() === "partial"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}>
                                                {fee.status || "Unpaid"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canManageFees && (fee.status || "").toLowerCase() !== "paid" && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedFee(fee);
                                                        setPaymentForm((prev) => ({
                                                            ...prev,
                                                            amount_paid: fee.amount_due || fee.amount || ""
                                                        }));
                                                        setShowPayModal(true);
                                                    }}
                                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                                                >
                                                    Record Payment
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showPayModal && selectedFee && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Record Payment</h2>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount Paid (₦)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={paymentForm.amount_paid}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Payment Method</label>
                                <select
                                    value={paymentForm.payment_method}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="POS">POS</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Transaction Ref / Cheque No</label>
                                <input
                                    type="text"
                                    value={paymentForm.transaction_reference}
                                    onChange={(e) => setPaymentForm({ ...paymentForm, transaction_reference: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPayModal(false)}
                                    className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                >
                                    Submit Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
