import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function FeesAndPayments() {
    const [activeTab, setActiveTab] = useState("structures");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [structures, setStructures] = useState([]);
    const [payments, setPayments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classes, setClasses] = useState([]);

    const [showStructureModal, setShowStructureModal] = useState(false);
    const [structureForm, setStructureForm] = useState({
        name: "",
        amount: "",
        category: "Tuition",
        academic_session_id: "",
        term_id: "",
        class_id: "",
        description: "",
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const [structRes, payRes, sessRes, termRes, classRes] = await Promise.allSettled([
                api.get("/fees"),
                api.get("/payment-receipts"),
                api.get("/academic-sessions"),
                api.get("/terms"),
                api.get("/classes")
            ]);

            if (structRes.status === "fulfilled") {
                const data = structRes.value.data.data || structRes.value.data;
                setStructures(Array.isArray(data) ? data : []);
            }
            if (payRes.status === "fulfilled") {
                const data = payRes.value.data.data || payRes.value.data;
                setPayments(Array.isArray(data) ? data : []);
            }
            if (sessRes.status === "fulfilled") {
                const data = sessRes.value.data.data || sessRes.value.data;
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
            setError(err.response?.data?.message || "Failed to load fee configuration data.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStructure = async (e) => {
        e.preventDefault();
        try {
            await api.post("/fees", structureForm);
            setShowStructureModal(false);
            setStructureForm({
                name: "",
                amount: "",
                category: "Tuition",
                academic_session_id: "",
                term_id: "",
                class_id: "",
                description: "",
                is_active: true
            });
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save fee structure.");
        }
    };

    const handleDeleteStructure = async (id, name) => {
        if (!window.confirm(`Are you sure you want to delete fee structure "${name}"?`)) return;
        try {
            await api.delete(`/fees/${id}`);
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete fee structure.");
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fee Structures & Payment History</h1>
                    <p className="text-sm text-gray-500">Define academic fee rates and inspect payment receipt records.</p>
                </div>
                {activeTab === "structures" && (
                    <button
                        onClick={() => setShowStructureModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm transition shadow-sm"
                    >
                        + Create Fee Structure
                    </button>
                )}
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 mb-6 bg-white rounded-xl p-1 shadow-sm">
                <button
                    onClick={() => setActiveTab("structures")}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
                        activeTab === "structures" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    Fee Structures ({structures.length})
                </button>
                <button
                    onClick={() => setActiveTab("payments")}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition ${
                        activeTab === "payments" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    Payment Logs ({payments.length})
                </button>
            </div>

            {error && (
                <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm flex justify-between">
                    <span>{error}</span>
                    <button onClick={loadData} className="underline font-semibold">Retry</button>
                </div>
            )}

            {/* Content per Tab */}
            {activeTab === "structures" ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading fee structures...</div>
                    ) : structures.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No fee structures configured yet.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Fee Name</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Target Class</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {structures.map((st) => (
                                    <tr key={st.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{st.name}</td>
                                        <td className="px-6 py-4">{st.category || "Tuition"}</td>
                                        <td className="px-6 py-4">{st.class?.name || "All Classes"}</td>
                                        <td className="px-6 py-4 font-mono font-semibold text-gray-800">
                                            ₦{Number(st.amount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDeleteStructure(st.id, st.name)}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading payment receipts...</div>
                    ) : payments.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">No payment receipts logged yet.</div>
                    ) : (
                        <table className="w-full text-left text-sm text-gray-600">
                            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3">Receipt No</th>
                                    <th className="px-6 py-3">Amount Paid</th>
                                    <th className="px-6 py-3">Payment Method</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Ref</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-mono font-semibold text-gray-800">
                                            {p.receipt_number || `REC-${p.id}`}
                                        </td>
                                        <td className="px-6 py-4 font-mono font-semibold text-green-700">
                                            ₦{Number(p.amount_paid || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">{p.payment_method || "Cash"}</td>
                                        <td className="px-6 py-4">{p.payment_date || "—"}</td>
                                        <td className="px-6 py-4 font-mono text-xs">{p.transaction_reference || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Create Fee Structure Modal */}
            {showStructureModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">Create Fee Structure</h2>
                        <form onSubmit={handleCreateStructure} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Fee Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1st Term Tuition Fee"
                                    value={structureForm.name}
                                    onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₦) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={structureForm.amount}
                                        onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                                    <select
                                        value={structureForm.category}
                                        onChange={(e) => setStructureForm({ ...structureForm, category: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                    >
                                        <option value="Tuition">Tuition</option>
                                        <option value="Admission">Admission</option>
                                        <option value="Uniform">Uniform</option>
                                        <option value="Books">Books</option>
                                        <option value="Exam">Exam</option>
                                        <option value="Transport">Transport</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Class (Optional - leave empty for all classes)</label>
                                <select
                                    value={structureForm.class_id}
                                    onChange={(e) => setStructureForm({ ...structureForm, class_id: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowStructureModal(false)}
                                    className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                >
                                    Save Fee Structure
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
