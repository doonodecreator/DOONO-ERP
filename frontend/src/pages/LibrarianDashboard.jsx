import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function LibrarianDashboard() {
    const [activeTab, setActiveTab] = useState("catalog");
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState([]);
    const [loans, setLoans] = useState([]);
    const [students, setStudents] = useState([]);
    
    const [showBookModal, setShowBookModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);

    const [bookForm, setBookForm] = useState({
        title: "",
        author: "",
        isbn: "",
        category: "General",
        total_copies: 1
    });

    const [loanForm, setLoanForm] = useState({
        book_id: "",
        student_id: "",
        due_date: ""
    });

    useEffect(() => {
        loadLibraryData();
    }, []);

    const loadLibraryData = async () => {
        setLoading(true);
        try {
            const [booksRes, loansRes, studentsRes] = await Promise.all([
                api.get("/books").catch(() => ({ data: { data: [] } })),
                api.get("/book-loans").catch(() => ({ data: { data: [] } })),
                api.get("/students").catch(() => ({ data: { data: [] } }))
            ]);

            setBooks(booksRes.data?.data || booksRes.data || []);
            setLoans(loansRes.data?.data || loansRes.data || []);
            setStudents(studentsRes.data?.data || studentsRes.data || []);
        } catch (err) {
            console.error("Error loading library records", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBook = async (e) => {
        e.preventDefault();
        try {
            await api.post("/books", bookForm);
            setShowBookModal(false);
            setBookForm({ title: "", author: "", isbn: "", category: "General", total_copies: 1 });
            loadLibraryData();
        } catch (err) {
            alert("Failed to add book to catalog.");
        }
    };

    const handleIssueLoan = async (e) => {
        e.preventDefault();
        try {
            await api.post("/book-loans", loanForm);
            setShowLoanModal(false);
            setLoanForm({ book_id: "", student_id: "", due_date: "" });
            loadLibraryData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to issue book loan.");
        }
    };

    const handleUpdateLoanStatus = async (loanId, status) => {
        const fine = status === "Lost" ? prompt("Enter fine amount (₦) for lost book:", "0") : 0;
        try {
            await api.put(`/book-loans/${loanId}`, { status, fine_amount: fine ? parseFloat(fine) : 0 });
            loadLibraryData();
        } catch (err) {
            alert("Failed to update loan status.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Library Management Portal</h1>
                        <p className="text-sm text-gray-500 mt-1">Catalog school texts, track active student borrowings, process returns, and manage overdue or lost book fines.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowBookModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Add Book
                        </button>
                        <button onClick={() => setShowLoanModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            Borrow / Issue Book
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["catalog", "borrowed", "reports"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-amber-600 text-amber-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab === "catalog" ? "Book Catalog" : tab === "borrowed" ? "Active Loans & Returns" : tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === "catalog" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Library Book Inventory</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Title</th>
                                        <th className="p-4">Author</th>
                                        <th className="p-4">Category</th>
                                        <th className="p-4">ISBN</th>
                                        <th className="p-4 text-center">Available / Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {books.map(b => (
                                        <tr key={b.id} className="hover:bg-gray-50/70">
                                            <td className="p-4 font-semibold text-slate-900">{b.title}</td>
                                            <td className="p-4">{b.author}</td>
                                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium">{b.category}</span></td>
                                            <td className="p-4 font-mono text-xs">{b.isbn || "N/A"}</td>
                                            <td className="p-4 text-center font-bold">
                                                <span className={b.available_copies > 0 ? "text-emerald-600" : "text-red-500"}>{b.available_copies}</span> / {b.total_copies}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "borrowed" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Active Loans & Returns Ledger</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Book Title</th>
                                        <th className="p-4">Borrower (Student)</th>
                                        <th className="p-4">Borrowed Date</th>
                                        <th className="p-4">Due Date</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loans.map(l => {
                                        const student = l.student || {};
                                        const book = l.book || {};
                                        return (
                                            <tr key={l.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{book.title}</td>
                                                <td className="p-4">{student.surname} {student.first_name} ({student.admission_number})</td>
                                                <td className="p-4">{l.borrowed_date}</td>
                                                <td className="p-4 font-medium text-amber-600">{l.due_date}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${l.status === 'Borrowed' ? 'bg-blue-50 text-blue-700' : l.status === 'Returned' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        {l.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center space-x-2">
                                                    {l.status === 'Borrowed' && (
                                                        <>
                                                            <button onClick={() => handleUpdateLoanStatus(l.id, 'Returned')} className="text-emerald-600 hover:underline text-xs font-semibold">Mark Returned</button>
                                                            <button onClick={() => handleUpdateLoanStatus(l.id, 'Lost')} className="text-red-500 hover:underline text-xs font-semibold">Mark Lost</button>
                                                        </>
                                                    )}
                                                    {l.status !== 'Borrowed' && <span className="text-xs text-gray-400">Completed</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ADD BOOK MODAL */}
            {showBookModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Add New Book to Catalog</h3>
                            <button onClick={() => setShowBookModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveBook} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Book Title</label>
                                <input type="text" required value={bookForm.title} onChange={(e) => setBookForm({...bookForm, title: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="e.g. Advanced Mathematics for Senior Secondary" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Author</label>
                                    <input type="text" required value={bookForm.author} onChange={(e) => setBookForm({...bookForm, author: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Author name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Total Copies</label>
                                    <input type="number" required min="1" value={bookForm.total_copies} onChange={(e) => setBookForm({...bookForm, total_copies: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category</label>
                                    <input type="text" value={bookForm.category} onChange={(e) => setBookForm({...bookForm, category: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Science, Arts..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">ISBN (Optional)</label>
                                    <input type="text" value={bookForm.isbn} onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="ISBN-13" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowBookModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Book</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ISSUE LOAN MODAL */}
            {showLoanModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Issue Book Loan to Student</h3>
                            <button onClick={() => setShowLoanModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleIssueLoan} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Book</label>
                                <select required value={loanForm.book_id} onChange={(e) => setLoanForm({...loanForm, book_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="">-- Choose Book --</option>
                                    {books.filter(b => b.available_copies > 0).map(b => (
                                        <option key={b.id} value={b.id}>{b.title} (Available: {b.available_copies})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Student</label>
                                <select required value={loanForm.student_id} onChange={(e) => setLoanForm({...loanForm, student_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.surname} {s.first_name} ({s.admission_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Due Date</label>
                                <input type="date" required value={loanForm.due_date} onChange={(e) => setLoanForm({...loanForm, due_date: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowLoanModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Issue Loan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
