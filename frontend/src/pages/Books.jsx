import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

const blankBook = { title: "", author: "", isbn: "", category: "Textbook", total_copies: 1 };
const blankLoan = { book_id: "", student_id: "", due_date: "" };
const blankReservation = { book_id: "", student_id: "", notes: "" };

export default function Books() {
  const [activeTab, setActiveTab] = useState("catalog");
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [bookForm, setBookForm] = useState(blankBook);
  const [loanForm, setLoanForm] = useState(blankLoan);
  const [reservationForm, setReservationForm] = useState(blankReservation);
  const [modal, setModal] = useState(null);

  const loadLibrary = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [response, reservationResponse] = await Promise.all([api.get("/library/workspace"), api.get("/book-reservations")]);
      const payload = response?.data?.data || {};
      setBooks(Array.isArray(payload.books) ? payload.books : []);
      setLoans(Array.isArray(payload.loans) ? payload.loans : []);
      setMembers(Array.isArray(payload.members) ? payload.members : []);
      setReservations(Array.isArray(reservationResponse?.data?.data?.data) ? reservationResponse.data.data.data : Array.isArray(reservationResponse?.data?.data) ? reservationResponse.data.data : []);
    } catch (reason) {
      setError(reason?.response?.data?.message || "The library workspace could not be loaded.");
      setBooks([]); setLoans([]); setMembers([]); setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLibrary(); }, [loadLibrary]);

  async function createBook(event) {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      await api.post("/books", { ...bookForm, total_copies: Number(bookForm.total_copies) });
      setMessage("Book added to the school catalog.");
      setBookForm(blankBook); setModal(null); await loadLibrary();
    } catch (reason) {
      setError(reason?.response?.data?.message || "The book could not be added.");
    } finally { setSaving(false); }
  }

  async function issueBook(event) {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      await api.post("/book-loans", loanForm);
      setMessage("Book issued successfully. Available inventory was updated.");
      setLoanForm(blankLoan); setModal(null); await loadLibrary();
    } catch (reason) {
      setError(reason?.response?.data?.message || "The book could not be issued.");
    } finally { setSaving(false); }
  }

  async function createReservation(event) {
    event.preventDefault();
    try {
      setSaving(true); setError("");
      await api.post("/book-reservations", reservationForm);
      setMessage("Book reservation created successfully."); setReservationForm(blankReservation); setModal(null); await loadLibrary();
    } catch (reason) { setError(reason?.response?.data?.message || "The reservation could not be created."); }
    finally { setSaving(false); }
  }

  async function updateReservation(id, status) {
    try {
      setSaving(true); setError(""); await api.put(`/book-reservations/${id}`, { status });
      setMessage(`Reservation marked ${status.toLowerCase()}.`); await loadLibrary();
    } catch (reason) { setError(reason?.response?.data?.message || "The reservation could not be updated."); }
    finally { setSaving(false); }
  }

  async function updateLoan(id, status) {
    try {
      setSaving(true); setError("");
      await api.put(`/book-loans/${id}`, { status, fine_amount: 0 });
      setMessage(status === "Returned" ? "Book returned and inventory restored." : "Loan marked as lost; the copy remains unavailable.");
      await loadLibrary();
    } catch (reason) {
      setError(reason?.response?.data?.message || "The loan could not be updated.");
    } finally { setSaving(false); }
  }

  const catalogColumns = [
    { key: "title", label: "Book", render: (book) => <><strong>{book.title}</strong><small>{book.author || "Author not recorded"}</small></> },
    { key: "isbn", label: "ISBN", render: (book) => book.isbn || "—" },
    { key: "category", label: "Category", render: (book) => book.category || "Textbook" },
    { key: "copies", label: "Inventory", render: (book) => `${book.available_copies ?? 0} available / ${book.total_copies ?? 0}` },
  ];
  const reservationColumns = [
    { key: "book", label: "Book", render: (reservation) => reservation.book?.title || `Book #${reservation.book_id}` },
    { key: "student", label: "Student", render: (reservation) => reservation.student ? `${reservation.student.first_name || ""} ${reservation.student.last_name || reservation.student.surname || ""}`.trim() : `Student #${reservation.student_id}` },
    { key: "requested_at", label: "Requested", render: (reservation) => reservation.requested_at ? new Date(reservation.requested_at).toLocaleDateString() : "—" },
    { key: "status", label: "Action", render: (reservation) => reservation.status === "pending" ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={saving} onClick={() => updateReservation(reservation.id, "fulfilled")}>Fulfill</Button><Button size="sm" variant="danger" disabled={saving} onClick={() => updateReservation(reservation.id, "cancelled")}>Cancel</Button></div> : <span>{reservation.status}</span> },
  ];
  const loanColumns = [
    { key: "book", label: "Book", render: (loan) => loan.book || `Book #${loan.book_id}` },
    { key: "student", label: "Student", render: (loan) => loan.student || `Student #${loan.student_id}` },
    { key: "borrowed_date", label: "Borrowed", render: (loan) => loan.borrowed_date || "—" },
    { key: "due_date", label: "Due", render: (loan) => loan.due_date || "—" },
    { key: "status", label: "Action", render: (loan) => loan.status === "Borrowed" ? <div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" disabled={saving} onClick={() => updateLoan(loan.id, "Returned")}>Return</Button><Button size="sm" variant="danger" disabled={saving} onClick={() => updateLoan(loan.id, "Lost")}>Lost</Button></div> : <span>{loan.status}</span> },
  ];

  return <PageContainer>
    <PageHeader title="Library & Book Inventory" subtitle="Maintain the school catalog, issue books to active learners, and keep copy availability accurate." action={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={loadLibrary} loading={loading}>Refresh</Button>{activeTab === "catalog" ? <Button onClick={() => setModal("book")}>Add book</Button> : activeTab === "loans" ? <Button onClick={() => setModal("loan")}>Issue book</Button> : <Button onClick={() => setModal("reservation")}>Reserve book</Button>}</div>} />
    {error && <Alert variant="error" action={<Button variant="secondary" size="sm" onClick={loadLibrary}>Retry</Button>}>{error}</Alert>}
    {message && <Alert variant="success" action={<Button variant="secondary" size="sm" onClick={() => setMessage("")}>Dismiss</Button>}>{message}</Alert>}
    <div className="mb-5 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm"><Button variant={activeTab === "catalog" ? "primary" : "secondary"} onClick={() => setActiveTab("catalog")}>Book catalog ({books.length})</Button><Button variant={activeTab === "loans" ? "primary" : "secondary"} onClick={() => setActiveTab("loans")}>Loans ({loans.length})</Button><Button variant={activeTab === "reservations" ? "primary" : "secondary"} onClick={() => setActiveTab("reservations")}>Reservations ({reservations.length})</Button></div>
    {loading ? <LoadingSpinner text="Loading library workspace..." /> : activeTab === "catalog" ? <DataTable columns={catalogColumns} data={books} emptyTitle="No books in the catalog" emptyMessage="Add the school’s first book to begin tracking copies." /> : activeTab === "loans" ? <DataTable columns={loanColumns} data={loans} emptyTitle="No loans recorded" emptyMessage="Issue a book to an active learner when the library desk is ready." /> : <DataTable columns={reservationColumns} data={reservations} emptyTitle="No reservations" emptyMessage="Reserve an unavailable book for an active learner." />}

    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">{modal === "book" ? "Add book to catalog" : modal === "loan" ? "Issue a book" : "Reserve a book"}</h2><p className="mt-1 text-sm text-slate-600">{modal === "book" ? "Inventory is initialized from the number of physical copies." : modal === "loan" ? "Only books and active learners in the current school are shown." : "Reserve a title for an active learner while all copies are unavailable."}</p></div><button type="button" className="text-slate-500" onClick={() => setModal(null)} aria-label="Close">×</button></div>{modal === "book" ? <form onSubmit={createBook} className="space-y-4"><label className="block text-sm font-semibold">Title<input required value={bookForm.title} onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} className="ui-input mt-1 w-full" /></label><label className="block text-sm font-semibold">Author<input required value={bookForm.author} onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} className="ui-input mt-1 w-full" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">ISBN<input value={bookForm.isbn} onChange={(event) => setBookForm({ ...bookForm, isbn: event.target.value })} className="ui-input mt-1 w-full" /></label><label className="block text-sm font-semibold">Copies<input required min="1" type="number" value={bookForm.total_copies} onChange={(event) => setBookForm({ ...bookForm, total_copies: event.target.value })} className="ui-input mt-1 w-full" /></label></div><label className="block text-sm font-semibold">Category<input required value={bookForm.category} onChange={(event) => setBookForm({ ...bookForm, category: event.target.value })} className="ui-input mt-1 w-full" /></label><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={saving}>Save book</Button></div></form> : modal === "loan" ? <form onSubmit={issueBook} className="space-y-4"><label className="block text-sm font-semibold">Book<select required value={loanForm.book_id} onChange={(event) => setLoanForm({ ...loanForm, book_id: event.target.value })} className="ui-input mt-1 w-full"><option value="">Select available book</option>{books.filter((book) => Number(book.available_copies) > 0).map((book) => <option key={book.id} value={book.id}>{book.title} ({book.available_copies} available)</option>)}</select></label><label className="block text-sm font-semibold">Active learner<select required value={loanForm.student_id} onChange={(event) => setLoanForm({ ...loanForm, student_id: event.target.value })} className="ui-input mt-1 w-full"><option value="">Select learner</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} — {member.admission_number || "No admission number"}</option>)}</select></label><label className="block text-sm font-semibold">Due date<input required type="date" value={loanForm.due_date} onChange={(event) => setLoanForm({ ...loanForm, due_date: event.target.value })} className="ui-input mt-1 w-full" /></label><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={saving}>Issue book</Button></div></form> : <form onSubmit={createReservation} className="space-y-4"><label className="block text-sm font-semibold">Book<select required value={reservationForm.book_id} onChange={(event) => setReservationForm({ ...reservationForm, book_id: event.target.value })} className="ui-input mt-1 w-full"><option value="">Select book</option>{books.map((book) => <option key={book.id} value={book.id}>{book.title} ({book.available_copies ?? 0} available)</option>)}</select></label><label className="block text-sm font-semibold">Active learner<select required value={reservationForm.student_id} onChange={(event) => setReservationForm({ ...reservationForm, student_id: event.target.value })} className="ui-input mt-1 w-full"><option value="">Select learner</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name} — {member.admission_number || "No admission number"}</option>)}</select></label><label className="block text-sm font-semibold">Notes<textarea value={reservationForm.notes} onChange={(event) => setReservationForm({ ...reservationForm, notes: event.target.value })} className="ui-input mt-1 min-h-20 w-full" /></label><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button><Button type="submit" loading={saving}>Reserve book</Button></div></form>}</div></div>}
  </PageContainer>;
}
