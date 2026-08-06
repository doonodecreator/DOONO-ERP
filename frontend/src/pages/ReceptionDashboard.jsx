import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function ReceptionDashboard() {
    const [activeTab, setActiveTab] = useState("visitors");
    const [loading, setLoading] = useState(false);
    const [visitors, setVisitors] = useState([]);
    const [passes, setPasses] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [students, setStudents] = useState([]);

    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [showPassModal, setShowPassModal] = useState(false);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    const [visitorForm, setVisitorForm] = useState({ visitor_name: "", phone_number: "", to_see: "", purpose: "" });
    const [passForm, setPassForm] = useState({ student_id: "", type: "Early Departure", authorized_by: "", reason: "" });
    const [appointmentForm, setAppointmentForm] = useState({ visitor_name: "", phone_number: "", host_staff: "", appointment_date: "", notes: "" });

    useEffect(() => {
        loadReceptionData();
    }, []);

    const loadReceptionData = async () => {
        setLoading(true);
        try {
            const [visitorsRes, passesRes, appointmentsRes, studentsRes] = await Promise.all([
                api.get("/visitors").catch(() => ({ data: { data: [] } })),
                api.get("/student-gate-passes").catch(() => ({ data: { data: [] } })),
                api.get("/reception-appointments").catch(() => ({ data: { data: [] } })),
                api.get("/students").catch(() => ({ data: { data: [] } }))
            ]);

            setVisitors(visitorsRes.data?.data || visitorsRes.data || []);
            setPasses(passesRes.data?.data || passesRes.data || []);
            setAppointments(appointmentsRes.data?.data || appointmentsRes.data || []);
            setStudents(studentsRes.data?.data || studentsRes.data || []);
        } catch (err) {
            console.error("Error loading reception data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVisitor = async (e) => {
        e.preventDefault();
        try {
            await api.post("/visitors", visitorForm);
            setShowVisitorModal(false);
            setVisitorForm({ visitor_name: "", phone_number: "", to_see: "", purpose: "" });
            loadReceptionData();
        } catch (err) {
            alert("Failed to check in visitor.");
        }
    };

    const handleCheckoutVisitor = async (id) => {
        try {
            await api.put(`/visitors/${id}`);
            loadReceptionData();
        } catch (err) {
            alert("Failed to check out visitor.");
        }
    };

    const handleSavePass = async (e) => {
        e.preventDefault();
        try {
            await api.post("/student-gate-passes", passForm);
            setShowPassModal(false);
            setPassForm({ student_id: "", type: "Early Departure", authorized_by: "", reason: "" });
            loadReceptionData();
        } catch (err) {
            alert("Failed to issue gate pass.");
        }
    };

    const handleSaveAppointment = async (e) => {
        e.preventDefault();
        try {
            await api.post("/reception-appointments", appointmentForm);
            setShowAppointmentModal(false);
            setAppointmentForm({ visitor_name: "", phone_number: "", host_staff: "", appointment_date: "", notes: "" });
            loadReceptionData();
        } catch (err) {
            alert("Failed to schedule appointment.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Front Desk & Reception Portal</h1>
                        <p className="text-sm text-gray-500 mt-1">Track visitor check-ins, issue student gate passes, and manage appointments.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowVisitorModal(true)} className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Check-in Visitor
                        </button>
                        <button onClick={() => setShowPassModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Issue Gate Pass
                        </button>
                        <button onClick={() => setShowAppointmentModal(true)} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Book Appointment
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["visitors", "passes", "appointments"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-teal-600 text-teal-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab === "visitors" ? "Visitors Log" : tab === "passes" ? "Student Gate Passes" : "Appointments"}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === "visitors" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Visitors Logbook</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Visitor Name</th>
                                        <th className="p-4">Phone Number</th>
                                        <th className="p-4">To See</th>
                                        <th className="p-4">Purpose</th>
                                        <th className="p-4">Check-in Time</th>
                                        <th className="p-4">Status / Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visitors.map(v => (
                                        <tr key={v.id} className="hover:bg-gray-50/70">
                                            <td className="p-4 font-semibold text-slate-900">{v.visitor_name}</td>
                                            <td className="p-4 font-mono text-xs">{v.phone_number}</td>
                                            <td className="p-4 text-teal-700 font-medium">{v.to_see}</td>
                                            <td className="p-4 text-gray-600">{v.purpose}</td>
                                            <td className="p-4 text-xs text-gray-500">{new Date(v.check_in_time).toLocaleString()}</td>
                                            <td className="p-4">
                                                {v.status === 'Checked In' ? (
                                                    <button onClick={() => handleCheckoutVisitor(v.id)} className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-xs font-semibold transition-colors">
                                                        Check Out
                                                    </button>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-semibold">Checked Out</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
{activeTab === "passes" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Student Gate Passes (Check-in/out)</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Pass Type</th>
                                        <th className="p-4">Authorized By</th>
                                        <th className="p-4">Reason</th>
                                        <th className="p-4">Date / Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {passes.map(p => {
                                        const s = p.student || {};
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{s.surname} {s.first_name} ({s.admission_number})</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.type === 'Early Departure' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                                                        {p.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-slate-800">{p.authorized_by}</td>
                                                <td className="p-4 text-gray-600">{p.reason}</td>
                                                <td className="p-4 text-xs text-gray-500">{new Date(p.pass_date).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "appointments" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {appointments.map(a => (
                                <div key={a.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{a.visitor_name}</h3>
                                            <p className="text-xs font-mono text-gray-500 mt-0.5">{a.phone_number}</p>
                                        </div>
                                        <span className="bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                                            {a.status}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-3 text-xs space-y-1.5">
                                        <p><span className="font-semibold text-gray-400">Host Staff:</span> {a.host_staff}</p>
                                        <p><span className="font-semibold text-gray-400">Scheduled For:</span> {new Date(a.appointment_date).toLocaleString()}</p>
                                        {a.notes && <p className="text-gray-600 mt-1 italic">"{a.notes}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VISITOR MODAL */}
            {showVisitorModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Check-in Visitor</h3>
                            <button onClick={() => setShowVisitorModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveVisitor} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Visitor Name</label>
                                <input type="text" required value={visitorForm.visitor_name} onChange={(e) => setVisitorForm({...visitorForm, visitor_name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Full Name" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                                <input type="text" required value={visitorForm.phone_number} onChange={(e) => setVisitorForm({...visitorForm, phone_number: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="080..." />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Whom to See</label>
                                <input type="text" required value={visitorForm.to_see} onChange={(e) => setVisitorForm({...visitorForm, to_see: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Staff or Department" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Purpose of Visit</label>
                                <textarea rows="2" required value={visitorForm.purpose} onChange={(e) => setVisitorForm({...visitorForm, purpose: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Brief reason..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowVisitorModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-teal-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Check In</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* GATE PASS MODAL */}
            {showPassModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Issue Student Gate Pass</h3>
                            <button onClick={() => setShowPassModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSavePass} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Student</label>
                                <select required value={passForm.student_id} onChange={(e) => setPassForm({...passForm, student_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.surname} {s.first_name} ({s.admission_number})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pass Type</label>
                                <select value={passForm.type} onChange={(e) => setPassForm({...passForm, type: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                                    <option value="Early Departure">Early Departure</option>
                                    <option value="Late Arrival">Late Arrival</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Authorized By</label>
                                <input type="text" required value={passForm.authorized_by} onChange={(e) => setPassForm({...passForm, authorized_by: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Parent Name or Principal" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason</label>
                                <textarea rows="2" required value={passForm.reason} onChange={(e) => setPassForm({...passForm, reason: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Medical appointment, family emergency..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowPassModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Issue Pass</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* APPOINTMENT MODAL */}
            {showAppointmentModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Book Reception Appointment</h3>
                            <button onClick={() => setShowAppointmentModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveAppointment} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Visitor Name</label>
                                <input type="text" required value={appointmentForm.visitor_name} onChange={(e) => setAppointmentForm({...appointmentForm, visitor_name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Full Name" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                                    <input type="text" required value={appointmentForm.phone_number} onChange={(e) => setAppointmentForm({...appointmentForm, phone_number: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="080..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Host Staff</label>
                                    <input type="text" required value={appointmentForm.host_staff} onChange={(e) => setAppointmentForm({...appointmentForm, host_staff: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Staff Name" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Appointment Date & Time</label>
                                <input type="datetime-local" required value={appointmentForm.appointment_date} onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                                <textarea rows="2" value={appointmentForm.notes} onChange={(e) => setAppointmentForm({...appointmentForm, notes: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Meeting agenda..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAppointmentModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Appointment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
