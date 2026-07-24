import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function FeesAndPayments() {
    // Tab State
    const [activeTab, setActiveTab] = useState("dashboard");

    // Loading & Error States
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Data States
    const [categories, setCategories] = useState([]);
    const [structures, setStructures] = useState([]);
    const [studentBills, setStudentBills] = useState([]);
    const [payments, setPayments] = useState([]);
    const [academicSessions, setAcademicSessions] = useState([]);
    const [terms, setTerms] = useState([]);
    const [classes, setClasses] = useState([]);

    // Selection / Modal States
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showStructureModal, setShowStructureModal] = useState(false);

    // Form States
    const [categoryForm, setCategoryForm] = useState({ id: null, name: "", description: "" });
    const [structureForm, setStructureForm] = useState({
        id: null, name: "", amount: "", category: "", academic_session_id: "", term_id: "", class_id: "", is_active: true
    });
    const [paymentForm, setPaymentForm] = useState({
        student_id: "", fee_id: "", amount: "", payment_date: new Date().toISOString().split('T')[0], payment_method: "Cash", reference: "", narration: ""
    });

    // Search and Filter States
    const [searchStudent, setSearchStudent] = useState("");
    const [filterClass, setFilterClass] = useState("");

    // Analytics Dashboard States
    const [analytics, setAnalytics] = useState({
        totalExpected: 0,
        totalReceived: 0,
        totalOutstanding: 0,
        debtorCount: 0
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [catRes, structRes, sessionsRes, termsRes, classesRes, billsRes, paymentsRes] = await Promise.all([
                api.get("/fee-categories").catch(() => ({ data: { data: [] } })),
                api.get("/fees").catch(() => ({ data: { data: [] } })),
                api.get("/academic-sessions").catch(() => ({ data: { data: [] } })),
                api.get("/terms").catch(() => ({ data: { data: [] } })),
                api.get("/classes").catch(() => ({ data: { data: [] } })),
                api.get("/student-fees").catch(() => ({ data: { data: [] } })),
                api.get("/fee-payments").catch(() => ({ data: { data: [] } }))
            ]);

            setCategories(catRes.data?.data || []);
            setStructures(structRes.data?.data || []);
            setAcademicSessions(sessionsRes.data?.data || []);
            setTerms(termsRes.data?.data || []);
            setClasses(classesRes.data?.data || []);
            
            const bills = billsRes.data?.data || [];
            setStudentBills(bills);

            const pays = paymentsRes.data?.data || [];
            setPayments(pays);

            let expected = 0, received = 0, debtors = 0;
            bills.forEach(bill => {
                const total = parseFloat(bill.total_amount || 0);
                const paid = parseFloat(bill.paid_amount || 0);
                expected += total;
                received += paid;
                if (total - paid > 0) debtors++;
            });

            setAnalytics({
                totalExpected: expected,
                totalReceived: received,
                totalOutstanding: expected - received,
                debtorCount: debtors
            });

        } catch (err) {
            setError("Failed to synchronize component data with backend resources.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCategory = async (e) => {
        e.preventDefault();
        try {
            if (categoryForm.id) {
                await api.put(`/fee-categories/${categoryForm.id}`, categoryForm);
            } else {
                await api.post("/fee-categories", categoryForm);
            }
            setShowCategoryModal(false);
            setCategoryForm({ id: null, name: "", description: "" });
            loadInitialData();
        } catch (err) {
            alert("Error saving fee category context.");
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!confirm("Are you certain you want to remove this category?")) return;
        try {
            await api.delete(`/fee-categories/${id}`);
            loadInitialData();
        } catch (err) {
            alert("Unable to safely delete requested asset allocation profile.");
        }
    };

   const handleSaveStructure = async (e) => {
        e.preventDefault();
        try {
            if (structureForm.id) {
                await api.put(`/fees/${structureForm.id}`, structureForm);
            } else {
                await api.post("/fees", structureForm);
            }
            setShowStructureModal(false);
            setStructureForm({ id: null, name: "", amount: "", category: "", academic_session_id: "", term_id: "", class_id: "", is_active: true });
            loadInitialData();
        } catch (err) {
            alert("Error mapping fee metrics configurations.");
        }
    };

    const handleDeleteStructure = async (id) => {
        if (!confirm("Remove this configuration template entirely?")) return;
        try {
            await api.delete(`/fees/${id}`);
            loadInitialData();
        } catch (err) {
            alert("Failed to drop selected framework validation rules.");
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...paymentForm,
                reference: paymentForm.reference || `REC-${Date.now()}`
            };
            await api.post("/fee-payments", payload);
            setShowPaymentModal(false);
            setPaymentForm({ student_id: "", fee_id: "", amount: "", payment_date: new Date().toISOString().split('T')[0], payment_method: "Cash", reference: "", narration: "" });
            loadInitialData();
        } catch (err) {
            alert("Could not commit dynamic transaction to database engine.");
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(val);
    };

    const filteredBilling = studentBills.filter(bill => {
        const matchesSearch = (bill.student?.surname || "").toLowerCase().includes(searchStudent.toLowerCase()) || 
                              (bill.student?.admission_number || "").toLowerCase().includes(searchStudent.toLowerCase());
        const matchesClass = filterClass === "" || String(bill.student_enrollment?.class_id) === String(filterClass);
        return matchesSearch && matchesClass;
    });

    const outstandingStudents = studentBills.filter(bill => (parseFloat(bill.total_amount) - parseFloat(bill.paid_amount)) > 0);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            {/* Context Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Fees & Payments</h1>
                        <p className="text-sm text-gray-500 mt-1">Configure baseline asset indices, map collections structures, record incoming revenue streams.</p>
                    </div>
                    <div className="flex gap-2 self-start md:self-auto">
                        <button onClick={() => setShowPaymentModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            Record Payment
                        </button>
                    </div>
                </div>

                {/* Navigation Tab strip */}
                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["dashboard", "categories", "structures", "billing", "history", "outstanding"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab === "structures" ? "Fee Structures" : tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm font-medium text-gray-500">Processing real-time ledger records...</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="print:p-0">
                    {/* DASHBOARD TAB */}
                    {activeTab === "dashboard" && (
                        <div className="space-y-6 print:hidden">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Expected</p>
                                    <h3 className="text-2xl font-bold mt-2 text-slate-900">{formatCurrency(analytics.totalExpected)}</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Received</p>
                                    <h3 className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(analytics.totalReceived)}</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Outstanding Revenue</p>
                                    <h3 className="text-2xl font-bold mt-2 text-red-500">{formatCurrency(analytics.totalOutstanding)}</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Debtor Accounts</p>
                                    <h3 className="text-2xl font-bold mt-2 text-amber-600">{analytics.debtorCount} Students</h3>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-gray-100">
                                    <h3 className="font-bold text-slate-900">Recent System Audited Payments</h3>
                                </div>
                                <div className="overflow-x-auto">
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
                                            {payments.slice(0, 5).map((p) => (
                                                <tr key={p.id} className="hover:bg-gray-50/70">
                                                    <td className="p-4 font-mono font-medium text-blue-600">{p.reference}</td>
                                                    <td className="p-4 font-medium">{p.student?.surname} {p.student?.first_name}</td>
                                                    <td className="p-4">{p.payment_method}</td>
                                                    <td className="p-4">{p.payment_date}</td>
                                                    <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                                                </tr>
                                            ))}

    {payments.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" className="p-8 text-center text-gray-400">No transactions verified in recent batch periods.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CATEGORIES TAB */}
                    {activeTab === "categories" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden print:hidden">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900">Configured Fee Allocations Categories</h3>
                                <button onClick={() => { setCategoryForm({ id: null, name: "", description: "" }); setShowCategoryModal(true); }} className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-4 py-2 rounded-xl text-xs transition-colors">
                                    + New Category
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                        <tr>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Operational Summary</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {categories.map((c) => (
                                            <tr key={c.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{c.name}</td>
                                                <td className="p-4 text-gray-500">{c.description || "N/A"}</td>
                                                <td className="p-4 text-center space-x-2">
                                                    <button onClick={() => { setCategoryForm(c); setShowCategoryModal(true); }} className="text-blue-600 hover:underline font-medium">Edit</button>
                                                    <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 hover:underline font-medium">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* STRUCTURES TAB */}
                    {activeTab === "structures" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden print:hidden">
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-slate-900">Academic Framework Fee Invoicing Templates</h3>
                                <button onClick={() => { setStructureForm({ id: null, name: "", amount: "", category: "", academic_session_id: "", term_id: "", class_id: "", is_active: true }); setShowStructureModal(true); }} className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-4 py-2 rounded-xl text-xs transition-colors">
                                    + Assign Fees Configuration
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                        <tr>
                                            <th className="p-4">Fee Structure Profile</th>
                                            <th className="p-4">Class Range</th>
                                            <th className="p-4">Term Framework</th>
                                            <th className="p-4 text-right">Target Amount</th>
                                            <th className="p-4 text-center">Status</th>
                                            <th className="p-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {structures.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{s.name} <span className="block text-xs font-normal text-gray-400 capitalize">Type: {s.category}</span></td>
                                                <td className="p-4">{s.class?.name || "All Classes"}</td>
                                                <td className="p-4">{s.term?.name || "Full Session"}</td>
                                                <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(s.amount)}</td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                                        {s.is_active ? "Active" : "Disabled"}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center space-x-2">
                                                    <button onClick={() => { setStructureForm(s); setShowStructureModal(true); }} className="text-blue-600 hover:underline font-medium">Edit</button>
                                                    <button onClick={() => handleDeleteStructure(s.id)} className="text-red-500 hover:underline font-medium">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

{/* BILLING TAB */}
                    {activeTab === "billing" && (
                        <div className="space-y-4 print:hidden">
                            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                <input type="text" placeholder="Search student name or admission ID..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 w-full sm:w-72 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">All Dynamic Classes</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                            <tr>
                                                <th className="p-4">Student</th>
                                                <th className="p-4">Admission Number</th>
                                                <th className="p-4">Assigned Class</th>
                                                <th className="p-4 text-right">Total Bill</th>
                                                <th className="p-4 text-right">Amount Paid</th>
                                                <th className="p-4 text-right">Outstanding</th>
                                                <th className="p-4 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredBilling.map((b) => {
                                                const outstanding = parseFloat(b.total_amount) - parseFloat(b.paid_amount);
                                                return (
                                                    <tr key={b.id} className="hover:bg-gray-50/70">
                                                        <td className="p-4 font-semibold text-slate-900">{b.student?.surname} {b.student?.first_name}</td>
                                                        <td className="p-4 font-mono text-xs">{b.student?.admission_number}</td>
                                                        <td className="p-4">{b.student_enrollment?.class?.name || "Unassigned"}</td>
                                                        <td className="p-4 text-right font-medium">{formatCurrency(b.total_amount)}</td>
                                                        <td className="p-4 text-right text-green-600 font-medium">{formatCurrency(b.paid_amount)}</td>
                                                        <td className="p-4 text-right text-red-500 font-bold">{formatCurrency(outstanding)}</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${outstanding <= 0 ? "bg-green-50 text-green-700" : outstanding === parseFloat(b.total_amount) ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                                                                {outstanding <= 0 ? "Fully Paid" : outstanding === parseFloat(b.total_amount) ? "Unpaid" : "Partial"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === "history" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden print:hidden">
                            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <h3 className="font-bold text-slate-900">Historical Transaction Archive</h3>
                                <button onClick={() => window.print()} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-medium self-end transition-colors">Export / Print Page</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                        <tr>
                                            <th className="p-4">Receipt Ref</th>
                                            <th className="p-4">Student Context</th>
                                            <th className="p-4">Method</th>
                                            <th className="p-4">Date Approved</th>
                                            <th className="p-4 text-right">Amount Collected</th>
                                            <th className="p-4 text-center">System Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {payments.map((p) => (
                                            <tr key={p.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-mono text-blue-600 font-semibold">{p.reference}</td>
                                                <td className="p-4">
                                                    <span className="font-semibold block">{p.student?.surname} {p.student?.first_name}</span>
                                                    <span className="text-xs text-gray-400">{p.student?.admission_number}</span>
                                                </td>
                                                <td className="p-4">{p.payment_method}</td>
                                                <td className="p-4">{p.payment_date}</td>
                                                <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(p.amount)}</td>
                                                <td className="p-4 text-center">
                                                    <button onClick={() => setSelectedReceipt(p)} className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 bg-blue-50/50 px-3 py-1.5 rounded-lg transition-colors">
                                                        View Receipt
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}


{/* OUTSTANDING TAB */}
                    {activeTab === "outstanding" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden print:hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Immediate Delinquent Accounts Ledger</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                        <tr>
                                            <th className="p-4">Student Profile</th>
                                            <th className="p-4">Class Identification</th>
                                            <th className="p-4 text-right">Total Owed</th>
                                            <th className="p-4 text-right">Total Remitted</th>
                                            <th className="p-4 text-right">Balance Due</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {outstandingStudents.map((b) => (
                                            <tr key={b.id} className="hover:bg-gray-50/70">
                                                <td className="p-4">
                                                    <span className="font-semibold block text-slate-900">{b.student?.surname} {b.student?.first_name}</span>
                                                    <span className="text-xs font-mono text-gray-400">{b.student?.admission_number}</span>
                                                </td>
                                                <td className="p-4">{b.student_enrollment?.class?.name || "N/A"}</td>
                                                <td className="p-4 text-right font-medium">{formatCurrency(b.total_amount)}</td>
                                                <td className="p-4 text-right text-green-600 font-medium">{formatCurrency(b.paid_amount)}</td>
                                                <td className="p-4 text-right text-red-600 font-bold">{formatCurrency(parseFloat(b.total_amount) - parseFloat(b.paid_amount))}</td>
                                            </tr>
                                        ))}
                                        {outstandingStudents.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="p-8 text-center text-gray-400">Perfect Status: Zero current open liability parameters detected.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* RECORD PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Record Incoming Payment Entry</h3>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-medium">×</button>
                        </div>
                        <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Target Student Invoice Account</label>
                                <select required value={paymentForm.student_id} onChange={(e) => setPaymentForm({...paymentForm, student_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="">-- Choose Account Profile --</option>
                                    {studentBills.map(b => (
                                        <option key={b.id} value={b.student_id}>{b.student?.surname} {b.student?.first_name} ({b.student?.admission_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Payment Method</label>
                                    <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm({...paymentForm, payment_method: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="POS">POS</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Transaction Amount (₦)</label>
                                    <input type="number" required min="1" step="0.01" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Receipt Number / External Reference ID (Optional)</label>
                                <input type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Leave blank to generate auto reference code" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Transaction Description / Narration</label>
                                <textarea rows="2" value={paymentForm.narration} onChange={(e) => setPaymentForm({...paymentForm, narration: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Balance for Q1 Tuition term allocations..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">Commit To Ledger</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CATEGORY OPERATION MODAL */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">{categoryForm.id ? "Edit System Fee Allocation Category" : "Add Fee Allocation Category"}</h3>
                            <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category Title Name</label>
                                <input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Tuition, Sports, ICT, Hostel" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Operational Description Summary</label>
                                <textarea rows="3" value={categoryForm.description} onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Provide background parameters summary data details..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">Save Framework State</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
 
  {/* STRUCTURE OPERATION MODAL */}
            {showStructureModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">{structureForm.id ? "Edit Fee Invoicing Template Structure" : "Assign Fee Architecture Configuration"}</h3>
                            <button onClick={() => setShowStructureModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>
                        <form onSubmit={handleSaveStructure} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fee Structure Template Label Title</label>
                                <input type="text" required value={structureForm.name} onChange={(e) => setStructureForm({...structureForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. JSS1 First Term Base Mandatory Framework" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Target Value Amount (₦)</label>
                                    <input type="number" required min="0" step="0.01" value={structureForm.amount} onChange={(e) => setStructureForm({...structureForm, amount: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category Designation Mapping</label>
                                    <select required value={structureForm.category} onChange={(e) => setStructureForm({...structureForm, category: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">-- Choose Profile --</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Target Session</label>
                                    <select required value={structureForm.academic_session_id} onChange={(e) => setStructureForm({...structureForm, academic_session_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">-- Session --</option>
                                        {academicSessions.map(as => <option key={as.id} value={as.id}>{as.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Target Term</label>
                                    <select required value={structureForm.term_id} onChange={(e) => setStructureForm({...structureForm, term_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">-- Term --</option>
                                        {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Target Class Range</label>
                                    <select required value={structureForm.class_id} onChange={(e) => setStructureForm({...structureForm, class_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">-- Class --</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowStructureModal(false)} className="px-4 py-2 text-sm font-medium text-gray-500">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">Apply Structures Framework</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PRINTABLE VOUCHER RECEIPT MODAL FRAMEWORK */}
            {selectedReceipt && (
                <div className="fixed inset-0 bg-slate-900/70 z-50 overflow-y-auto p-4 md:p-10 flex items-start justify-center print:bg-white print:p-0">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 print:shadow-none print:border-none">
                        {/* Control actions toolbar */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center print:hidden">
                            <h4 className="font-bold text-slate-800">Verified System Audited Receipt Account</h4>
                            <div className="space-x-2">
                                <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-sm">Print Voucher Document</button>
                                <button onClick={() => setSelectedReceipt(null)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs px-4 py-2 rounded-xl transition-colors font-medium">Close View</button>
                            </div>
                        </div>

                        {/* Printable Area Context */}
                        <div className="p-8 md:p-12 text-black bg-white">
                            <div className="flex justify-between items-start border-b-4 border-blue-600 pb-6">
                                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50/50">
                                    <span className="text-[10px] font-bold text-gray-400 tracking-wider text-center px-1 uppercase">DONO School ERP Logo</span>
                                </div>
                                <div className="text-right flex-1 pr-4">
                                    <h2 className="text-3xl font-extrabold tracking-tight uppercase text-blue-900">{selectedReceipt.school?.name || "DONO SCHOOL ERP INSTITUTION"}</h2>
                                    <p className="text-xs text-gray-500 mt-1 max-w-md ml-auto">{selectedReceipt.school?.address || "Official Corporate Institutional Address Registry Profile Data"}</p>
                                    <p className="text-xs text-gray-400 font-mono mt-0.5">{selectedReceipt.school?.phone || "+234 ERP SYSTEM ROOT CONFIG"}</p>
                                </div>
                            </div>

                            <div className="mt-8 bg-gray-50/70 border border-gray-100 rounded-xl p-5 grid grid-cols-2 gap-6 text-xs shadow-sm">
                                <div className="space-y-2">
                                    <h5 className="text-gray-400 uppercase font-bold tracking-wider text-[10px]">Student Remitter Information Context</h5>
                                    <p className="text-sm font-bold text-slate-900">{selectedReceipt.student?.surname} {selectedReceipt.student?.first_name} {selectedReceipt.student?.other_name || ""}</p>
                                    <p className="font-mono text-gray-600">Admission Index ID: <span className="font-bold">{selectedReceipt.student?.admission_number}</span></p>
                                </div>
                                <div className="space-y-2 text-right">
                                    <h5 className="text-gray-400 uppercase font-bold tracking-wider text-[10px]">Voucher System Meta Markers</h5>
                                    <p className="text-sm font-mono font-bold text-blue-600">{selectedReceipt.reference}</p>
                                    <p className="text-gray-600">Verification Processing Date: <span className="font-semibold">{selectedReceipt.payment_date}</span></p>
                                </div>
                            </div>

                            <div className="mt-8">
                                <table className="w-full text-xs text-left border border-gray-200 rounded-xl overflow-hidden">
                                    <thead>
                                        <tr className="bg-slate-900 text-white uppercase font-bold text-[10px] tracking-wider">
                                            <th className="p-4">Transaction Allocation Description Label</th>
                                            <th className="p-4 text-center">Processing Channel</th>
                                            <th className="p-4 text-right">Settled Amount Component</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        <tr>
                                            <td className="p-4 font-medium text-slate-900">
                                                {selectedReceipt.narration || "Standard Baseline Academic Instantiation Fee Profile Assignment"}
                                            </td>
                                            <td className="p-4 text-center font-semibold text-gray-600">{selectedReceipt.payment_method}</td>
                                            <td className="p-4 text-right font-bold text-sm text-slate-900">{formatCurrency(selectedReceipt.amount)}</td>
                                        </tr>
                                        <tr className="bg-gray-50/40">
                                            <td colSpan="2" className="p-4 font-bold text-right uppercase text-[10px] tracking-wider text-gray-400">Total Validated Funds Received</td>
                                            <td className="p-4 text-right font-extrabold text-base text-green-600">{formatCurrency(selectedReceipt.amount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-12 grid grid-cols-3 gap-8 items-center pt-8 border-t border-gray-100">
                                <div className="text-center">
                                    <div className="border-b border-gray-300 h-10 mb-2"></div>
                                    <p className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">Bursary Desk Audit Signee</p>
                                </div>
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 border border-gray-200 rounded-lg flex flex-col items-center justify-center p-2 bg-gray-50/30 font-mono text-[8px] text-gray-400 text-center uppercase tracking-tighter">
                                        <span>QR System</span>
                                        <span>Verification</span>
                                        <span>Placeholder</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="border-b border-gray-300 h-10 mb-2"></div>
                                    <p className="font-bold text-[10px] uppercase text-gray-400 tracking-wider">Authorized Stamp Validation</p>
                                </div>
                            </div>

                            <div className="mt-12 text-center text-[10px] text-gray-400 font-medium space-y-1">
                                <p>This document constitutes an immutable computer generated validation receipt verified by server engines.</p>
                                <p className="font-bold text-slate-700">Secured & Distributed via DONO School ERP Architecture Ecosystem</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
