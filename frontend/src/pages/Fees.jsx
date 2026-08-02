import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Fees({ setPage }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [studentFees, setStudentFees] = useState([]);
    const [feeCategories, setFeeCategories] = useState([]);
    const [enrollments, setEnrollments] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [terms, setTerms] = useState([]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [error, setError] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Modals
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPayModal, setShowPayModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);

    const [selectedFee, setSelectedFee] = useState(null);
    const [receiptData, setReceiptData] = useState(null);

    // Normalize user role & Permissions
    const userRole = (
        user?.role ||
        user?.roles?.[0]?.slug ||
        user?.roles?.[0]?.name ||
        "guest"
    ).toLowerCase();

    const canManageFees = ["admin", "superadmin", "bursar", "accountant"].includes(userRole);
    const canDeleteFees = ["admin", "superadmin"].includes(userRole);
    const isStudent = userRole === "student";
    const isParent = userRole === "parent";

    // Form states
    const [assignForm, setAssignForm] = useState({
        student_enrollment_id: "",
        fee_category_id: "",
        academic_session_id: "",
        term_id: "",
        amount: "",
        discount: 0,
        amount_due: "",
        due_date: "",
        remarks: "",
    });

    const [editForm, setEditForm] = useState({
        id: "",
        student_enrollment_id: "",
        fee_category_id: "",
        academic_session_id: "",
        term_id: "",
        amount: "",
        discount: 0,
        amount_due: "",
        due_date: "",
        status: "Pending",
        remarks: "",
    });

    const [payForm, setPayForm] = useState({
        student_fee_id: "",
        amount_paid: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "Cash",
        receipt_number: "",
        transaction_reference: "",
        bank_name: "",
        remarks: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [feesRes, catsRes, enrollRes, sessRes, termsRes] = await Promise.allSettled([
                api.get("/student-fees"),
                api.get("/fee-categories"),
                api.get("/student-enrollments"),
                api.get("/academic-sessions"),
                api.get("/terms"),
            ]);

            if (feesRes.status === "fulfilled") {
                const raw = feesRes.value?.data?.data ?? feesRes.value?.data ?? [];
                setStudentFees(Array.isArray(raw) ? raw : []);
            }
            if (catsRes.status === "fulfilled") {
                const raw = catsRes.value?.data?.data ?? catsRes.value?.data ?? [];
                setFeeCategories(Array.isArray(raw) ? raw : []);
            }
            if (enrollRes.status === "fulfilled") {
                const raw = enrollRes.value?.data?.data ?? enrollRes.value?.data ?? [];
                setEnrollments(Array.isArray(raw) ? raw : []);
            }
            if (sessRes.status === "fulfilled") {
                const raw = sessRes.value?.data?.data ?? sessRes.value?.data ?? [];
                setSessions(Array.isArray(raw) ? raw : []);
            }
            if (termsRes.status === "fulfilled") {
                const raw = termsRes.value?.data?.data ?? termsRes.value?.data ?? [];
                setTerms(Array.isArray(raw) ? raw : []);
            }
        } catch (err) {
            console.error("Failed to load fee data:", err);
            setError("Unable to load fee data.");
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (amountVal, discountVal, isEdit = false) => {
        const amt = parseFloat(amountVal) || 0;
        const disc = parseFloat(discountVal) || 0;
        const due = Math.max(0, amt - disc);

        if (isEdit) {
            setEditForm((prev) => ({
                ...prev,
                amount: amountVal,
                discount: discountVal,
                amount_due: due.toFixed(2),
            }));
        } else {
            setAssignForm((prev) => ({
                ...prev,
                amount: amountVal,
                discount: discountVal,
                amount_due: due.toFixed(2),
            }));
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!canManageFees) return;
        try {
            setError("");
            await api.post("/student-fees", assignForm);
            setSuccessMsg("Fee assigned successfully!");
            setShowAssignModal(false);
            setAssignForm({
                student_enrollment_id: "",
                fee_category_id: "",
                academic_session_id: "",
                term_id: "",
                amount: "",
                discount: 0,
                amount_due: "",
                due_date: "",
                remarks: "",
            });
            loadData();
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            console.error("Failed to assign fee:", err);
            setError(err.response?.data?.message || "Failed to assign fee to student.");
        }
    };

    const openEditModal = (fee) => {
        setSelectedFee(fee);
        setEditForm({
            id: fee.id,
            student_enrollment_id: fee.student_enrollment_id || fee.student_enrollment?.id || "",
            fee_category_id: fee.fee_category_id || fee.fee_category?.id || "",
            academic_session_id: fee.academic_session_id || fee.academic_session?.id || "",
            term_id: fee.term_id || fee.term?.id || "",
            amount: fee.amount || "",
            discount: fee.discount || 0,
            amount_due: fee.amount_due || "",
            due_date: fee.due_date ? fee.due_date.split("T")[0] : "",
            status: fee.status || "Pending",
            remarks: fee.remarks || "",
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!canManageFees) return;
        try {
            setError("");
            await api.put(`/student-fees/${editForm.id}`, editForm);
            setSuccessMsg("Fee record updated successfully!");
            setShowEditModal(false);
            loadData();
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            console.error("Failed to update fee:", err);
            setError(err.response?.data?.message || "Failed to update fee record.");
        }
    };

    const handleDeleteFee = async (id) => {
        if (!canDeleteFees) {
            setError("Unauthorized: Only Administrators can delete fee records.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this fee record? This action cannot be undone.")) {
            return;
        }
        try {
            setError("");
            await api.delete(`/student-fees/${id}`);
            setSuccessMsg("Fee record deleted successfully!");
            loadData();
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            console.error("Failed to delete fee:", err);
            setError(err.response?.data?.message || "Failed to delete fee record.");
        }
    };

    const openPayModal = (fee) => {
        setSelectedFee(fee);
        const generatedReceiptNo = `REC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const totalPaid = (fee.payments || []).reduce(
            (sum, p) => sum + parseFloat(p.amount_paid || 0),
            0
        );
        const balance = Math.max(0, parseFloat(fee.amount_due || 0) - totalPaid);

        setPayForm({
            student_fee_id: fee.id,
            amount_paid: balance.toFixed(2),
            payment_date: new Date().toISOString().split("T")[0],
            payment_method: "Cash",
            receipt_number: generatedReceiptNo,
            transaction_reference: "",
            bank_name: "",
            remarks: "",
        });
        setShowPayModal(true);
    };

    const handlePaySubmit = async (e) => {
        e.preventDefault();
        if (!canManageFees) return;
        try {
            setError("");
            const res = await api.post("/fee-payments", payForm);
            setSuccessMsg("Payment recorded successfully!");
            setShowPayModal(false);

            const paymentData = res.data?.data || res.data;
            setReceiptData({
                payment: paymentData,
                fee: selectedFee,
            });
            setShowReceiptModal(true);
            loadData();
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            console.error("Failed to record payment:", err);
            setError(err.response?.data?.message || "Failed to record payment.");
        }
    };

    const openReceiptView = (fee, payment) => {
        setReceiptData({
            fee,
            payment,
        });
        setShowReceiptModal(true);
    };

    const printReceipt = () => {
        window.print();
    };

    // Role-aware Filtering
    const filteredFees = studentFees.filter((item) => {
        const student = item.student_enrollment?.student || item.student || {};
        const fullname = `${student.surname ?? ""} ${student.first_name ?? student.firstname ?? ""}`.toLowerCase();

        if (isStudent) {
            const studentUserId = student.user_id || student.id;
            const currentUserId = user?.student_id || user?.id;
            if (studentUserId !== currentUserId && student.admission_number !== user?.admission_number) {
                return false;
            }
        }

        if (isParent) {
            const linkedChildrenIds = user?.children_ids || user?.children?.map((c) => c.id) || [];
            const studentId = student.id;
            if (linkedChildrenIds.length > 0 && !linkedChildrenIds.includes(studentId)) {
                return false;
            }
        }

       const matchesSearch =
            fullname.includes(search.toLowerCase()) ||
            (student.admission_number && student.admission_number.toLowerCase().includes(search.toLowerCase())) ||
            (item.fee_category?.name && item.fee_category.name.toLowerCase().includes(search.toLowerCase()));

        const matchesStatus =
            statusFilter === "all" || (item.status || "Pending").toLowerCase() === statusFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Calculations
    const totalFeesAssigned = filteredFees.reduce(
        (acc, curr) => acc + parseFloat(curr.amount_due || 0),
        0
    );
    const totalFeesPaid = filteredFees.reduce((acc, curr) => {
        const paid = (curr.payments || []).reduce(
            (pAcc, p) => pAcc + parseFloat(p.amount_paid || 0),
            0
        );
        return acc + paid;
    }, 0);
    const totalOutstanding = Math.max(0, totalFeesAssigned - totalFeesPaid);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-2xl font-bold text-blue-700">Loading Fees & Payments...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 print:hidden">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-blue-700">Fees & Payments</h1>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                                Role: {userRole}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-1">
                            {!canManageFees
                                ? "View fee statements, outstanding balances, and official payment receipts."
                                : "Assign fees, manage student balances, record payments, and print receipts."}
                        </p>
                    </div>
                    <div className="flex gap-3 items-center flex-wrap">
                        {setPage && (
                            <button
                                onClick={() => setPage("dashboard")}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm"
                            >
                                &larr; Back to Dashboard
                            </button>
                        )}
                        {canManageFees && (
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm"
                            >
                                + Assign Fee
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 print:hidden">{error}</div>}
            {successMsg && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 print:hidden">{successMsg}</div>}

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 print:hidden">
                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-blue-600">
                    <p className="text-sm text-gray-500 font-medium">Total Fees Billed</p>
                    <h3 className="text-2xl font-extrabold text-blue-900 mt-1">
                        ₦{totalFeesAssigned.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-green-600">
                    <p className="text-sm text-gray-500 font-medium">Total Amount Collected</p>
                    <h3 className="text-2xl font-extrabold text-green-700 mt-1">
                        ₦{totalFeesPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-md border-l-4 border-red-600">
                    <p className="text-sm text-gray-500 font-medium">Outstanding Balance</p>
                    <h3 className="text-2xl font-extrabold text-red-600 mt-1">
                        ₦{totalOutstanding.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                    </h3>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl p-4 shadow-md mb-6 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Search student, adm no, or fee..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border rounded-lg px-4 py-2 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Partial">Partial</option>
                        <option value="Paid">Paid</option>
                        <option value="Waived">Waived</option>
                    </select>
                </div>
                <button
                    onClick={loadData}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold text-sm w-full md:w-auto"
                >
                    Refresh
                </button>
            </div>

            {/* Student Fees Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden print:hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-blue-700 text-white text-sm">
                            <tr>
                                <th className="p-4 text-left">Student</th>
                                <th className="p-4 text-left">Fee Category</th>
                                <th className="p-4 text-left">Session / Term</th>
                                <th className="p-4 text-right">Amount Due</th>
                                <th className="p-4 text-right">Paid</th>
                                <th className="p-4 text-right">Balance</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFees.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-10 text-gray-500">
                                        No student fee records found.
                                    </td>
                                </tr>
                            ) : (
                                filteredFees.map((fee) => {
                                    const student = fee.student_enrollment?.student || fee.student || {};
                                    const totalPaid = (fee.payments || []).reduce(
                                        (sum, p) => sum + parseFloat(p.amount_paid || 0),
                                        0
                                    );
                                    const amountDue = parseFloat(fee.amount_due || 0);
                                    const balance = Math.max(0, amountDue - totalPaid);
                                    const status = fee.status || (balance === 0 ? "Paid" : totalPaid > 0 ? "Partial" : "Pending");

                                    return (
                                        <tr key={fee.id} className="border-b hover:bg-gray-50 text-sm">
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-900">
                                                    {student.surname ?? ""} {student.first_name ?? student.firstname ?? ""}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Adm: {student.admission_number || "-"}
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-gray-800">
                                                {fee.fee_category?.name || "General Fee"}
                                            </td>
                                            <td className="p-4 text-xs text-gray-600">
                                                <div>{fee.academic_session?.name || "-"}</div>
                                                <div className="text-gray-400">{fee.term?.name || "-"}</div>
                                            </td>
                                            <td className="p-4 text-right font-bold text-gray-900">
                                                ₦{amountDue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-right font-semibold text-green-700">
                                                ₦{totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-right font-bold text-red-600">
                                                ₦{balance.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={`px-3 py-1 text-xs rounded-full font-bold ${
                                                        status === "Paid"
                                                            ? "bg-green-100 text-green-800"
                                                            : status === "Partial"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center space-x-1 whitespace-nowrap">
                                                {canManageFees && status !== "Paid" && (
                                                    <button
                                                        onClick={() => openPayModal(fee)}
                                                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                                {fee.payments && fee.payments.length > 0 && (
                                                    <button
                                                        onClick={() => openReceiptView(fee, fee.payments[fee.payments.length - 1])}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
                                                    >
                                                        Receipt
                                                    </button>
                                                )}

                                                {canManageFees && (
                                                    <button
                                                        onClick={() => openEditModal(fee)}
                                                        className="bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded text-xs font-semibold"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                {canDeleteFees && (
                                                    <button
                                                        onClick={() => handleDeleteFee(fee.id)}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-xs font-semibold"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Assign Fee */}
            {showAssignModal && canManageFees && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h2 className="text-xl font-bold text-blue-900">Assign Fee to Student</h2>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleAssignSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Student Enrollment *</label>
                                <select
                                    required
                                    value={assignForm.student_enrollment_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, student_enrollment_id: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Student...</option>
                                    {enrollments.map((enr) => {
                                        const s = enr.student || {};
                                        return (
                                            <option key={enr.id} value={enr.id}>
                                                {s.surname || ""} {s.first_name || s.firstname || ""} ({s.admission_number || "No Adm"}) - {enr.class?.name || "Class"}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Fee Category *</label>
                                <select
                                    required
                                    value={assignForm.fee_category_id}
                                    onChange={(e) => setAssignForm({ ...assignForm, fee_category_id: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Fee Category...</option>
                                    {feeCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name} {cat.amount ? `(₦${cat.amount})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Session *</label>
                                    <select
                                        required
                                        value={assignForm.academic_session_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, academic_session_id: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Session...</option>
                                        {sessions.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Term *</label>
                                    <select
                                        required
                                        value={assignForm.term_id}
                                        onChange={(e) => setAssignForm({ ...assignForm, term_id: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select Term...</option>
                                        {terms.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Amount (₦) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={assignForm.amount}
                                        onChange={(e) => handleAmountChange(e.target.value, assignForm.discount, false)}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Discount (₦)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={assignForm.discount}
                                        onChange={(e) => handleAmountChange(assignForm.amount, e.target.value, false)}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Amount Due</label>
                                    <input
                                        type="number"
                                        readOnly
                                        value={assignForm.amount_due}
                                        className="w-full border bg-gray-100 font-bold text-blue-900 rounded-lg p-2.5"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold">Cancel</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold">Assign Fee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

             {/* Modal: Edit Fee */}
            {showEditModal && canManageFees && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h2 className="text-xl font-bold text-amber-600">Edit Student Fee</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Fee Category *</label>
                                <select
                                    required
                                    value={editForm.fee_category_id}
                                    onChange={(e) => setEditForm({ ...editForm, fee_category_id: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Fee Category...</option>
                                    {feeCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Amount (₦) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={editForm.amount}
                                        onChange={(e) => handleAmountChange(e.target.value, editForm.discount, true)}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Discount (₦)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editForm.discount}
                                        onChange={(e) => handleAmountChange(editForm.amount, e.target.value, true)}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Amount Due</label>
                                    <input
                                        type="number"
                                        readOnly
                                        value={editForm.amount_due}
                                        className="w-full border bg-gray-100 font-bold text-blue-900 rounded-lg p-2.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium text-gray-700 mb-1">Status *</label>
                                <select
                                    value={editForm.status}
                                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Partial">Partial</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Waived">Waived</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold">Cancel</button>
                                <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg font-semibold">Update Fee</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Record Payment */}
            {showPayModal && selectedFee && canManageFees && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                        <div className="flex justify-between items-center border-b pb-3 mb-4">
                            <h2 className="text-xl font-bold text-green-700">Record Fee Payment</h2>
                            <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>
                        <form onSubmit={handlePaySubmit} className="space-y-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg border text-xs space-y-1">
                                <p><strong>Fee Title:</strong> {selectedFee.fee_category?.name || "Fee"}</p>
                                <p><strong>Student:</strong> {selectedFee.student_enrollment?.student?.surname || ""} {selectedFee.student_enrollment?.student?.first_name || ""}</p>
                                <p><strong>Total Due:</strong> ₦{parseFloat(selectedFee.amount_due || 0).toLocaleString("en-NG")}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Amount Paid (₦) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={payForm.amount_paid}
                                        onChange={(e) => setPayForm({ ...payForm, amount_paid: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 font-bold focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Payment Method *</label>
                                    <select
                                        required
                                        value={payForm.payment_method}
                                        onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="POS">POS</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Payment Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={payForm.payment_date}
                                        onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                                        className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-medium text-gray-700 mb-1">Receipt Number *</label>
                                    <input
                                        type="text"
                                        required
                                        value={payForm.receipt_number}
                                        onChange={(e) => setPayForm({ ...payForm, receipt_number: e.target.value })}
                                        className="w-full border bg-gray-50 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowPayModal(false)} className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg font-semibold">Cancel</button>
                                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-semibold">Save Payment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal & Printable Receipt */}
            {showReceiptModal && receiptData && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:p-0 print:static print:bg-white">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 print:shadow-none print:w-full print:max-w-none">
                        <div className="flex justify-between items-center border-b pb-4 mb-6 print:hidden">
                            <h2 className="text-2xl font-bold text-blue-900">Official Payment Receipt</h2>
                            <div className="space-x-3">
                                <button onClick={printReceipt} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">Print Receipt</button>
                                <button onClick={() => setShowReceiptModal(false)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm">Close</button>
                            </div>
                        </div>

                        {/* Printable Receipt Body */}
                        <div id="printable-receipt" className="border-4 border-dashed border-blue-900 p-6 rounded-lg text-black">
                            <div className="text-center border-b pb-4">
                                <h1 className="text-2xl font-black uppercase text-blue-900">DONO SCHOOL ERP</h1>
                                <p className="text-xs text-gray-600">Official School Fee Payment Receipt</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                                <div>
                                    <p><strong>Receipt No:</strong> <span className="font-mono">{receiptData.payment?.receipt_number || receiptData.payment?.receipt?.receipt_number || "-"}</span></p>
                                    <p><strong>Payment Date:</strong> {receiptData.payment?.payment_date || "-"}</p>
                                    <p><strong>Payment Method:</strong> {receiptData.payment?.payment_method || "Cash"}</p>
                                </div>
                                <div className="text-right">
                                    <p><strong>Fee Category:</strong> {receiptData.fee?.fee_category?.name || "School Fee"}</p>
                                    <p><strong>Session:</strong> {receiptData.fee?.academic_session?.name || "-"}</p>
                                    <p><strong>Term:</strong> {receiptData.fee?.term?.name || "-"}</p>
                                </div>
                            </div>

                            <div className="mt-6 bg-gray-50 p-4 rounded border text-sm space-y-2">
                                <p><strong>Student Name:</strong> {receiptData.fee?.student_enrollment?.student?.surname || ""} {receiptData.fee?.student_enrollment?.student?.first_name || ""}</p>
                                <p><strong>Admission No:</strong> {receiptData.fee?.student_enrollment?.student?.admission_number || "-"}</p>
                            </div>

                            <div className="mt-6 border-t border-b py-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Amount Paid:</span>
                                    <span className="text-green-700">₦{parseFloat(receiptData.payment?.amount_paid || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-between items-end text-xs text-gray-500 pt-6">
                                <div>
                                    <p>Issued By: {receiptData.payment?.receipt?.issued_by || user?.name || "System Administrator"}</p>
                                    <p>Status: CONFIRMED</p>
                                </div>
                                <div className="text-right border-t border-gray-400 pt-1 w-36 text-center">
                                    Authorized Signature
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
