import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function NurseDashboard() {
    const [activeTab, setActiveTab] = useState("visits");
    const [loading, setLoading] = useState(false);
    const [visits, setVisits] = useState([]);
    const [records, setRecords] = useState([]);
    const [students, setStudents] = useState([]);
    
    const [showVisitModal, setShowVisitModal] = useState(false);
    const [showRecordModal, setShowRecordModal] = useState(false);

    const [visitForm, setVisitForm] = useState({
        student_id: "",
        visit_date: new Date().toISOString().slice(0, 16),
        complaint: "",
        treatment_given: "",
        nurse_notes: ""
    });

    const [recordForm, setRecordForm] = useState({
        student_id: "",
        blood_group: "",
        genotype: "",
        allergies: "",
        chronic_conditions: "",
        emergency_contact_name: "",
        emergency_contact_phone: ""
    });

    useEffect(() => {
        loadClinicData();
    }, []);

    const loadClinicData = async () => {
        setLoading(true);
        try {
            const [visitsRes, recordsRes, studentsRes] = await Promise.all([
                api.get("/clinic-visits").catch(() => ({ data: { data: [] } })),
                api.get("/medical-records").catch(() => ({ data: { data: [] } })),
                api.get("/students").catch(() => ({ data: { data: [] } }))
            ]);

            setVisits(visitsRes.data?.data || visitsRes.data || []);
            setRecords(recordsRes.data?.data || recordsRes.data || []);
            setStudents(studentsRes.data?.data || studentsRes.data || []);
        } catch (err) {
            console.error("Error loading clinic records", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVisit = async (e) => {
        e.preventDefault();
        try {
            await api.post("/clinic-visits", visitForm);
            setShowVisitModal(false);
            setVisitForm({
                student_id: "",
                visit_date: new Date().toISOString().slice(0, 16),
                complaint: "",
                treatment_given: "",
                nurse_notes: ""
            });
            loadClinicData();
        } catch (err) {
            alert("Failed to log clinic visit.");
        }
    };

    const handleSaveRecord = async (e) => {
        e.preventDefault();
        try {
            await api.post("/medical-records", recordForm);
            setShowRecordModal(false);
            setRecordForm({
                student_id: "",
                blood_group: "",
                genotype: "",
                allergies: "",
                chronic_conditions: "",
                emergency_contact_name: "",
                emergency_contact_phone: ""
            });
            loadClinicData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to save medical record.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Clinic & Nurse Portal</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage student health profiles, monitor dispensary visit logs, track allergies, and view emergency contact details.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowRecordModal(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Medical Profile
                        </button>
                        <button onClick={() => setShowVisitModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Log Clinic Visit
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["visits", "records"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-rose-600 text-rose-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab === "visits" ? "Clinic Visits Log" : "Student Medical Records"}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === "visits" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Dispensary & Clinic Visit History</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Complaint / Symptoms</th>
                                        <th className="p-4">Treatment Administered</th>
                                        <th className="p-4">Visit Date</th>
                                        <th className="p-4">Treated By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {visits.map(v => {
                                        const student = v.student || {};
                                        return (
                                            <tr key={v.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{student.surname} {student.first_name} ({student.admission_number})</td>
                                                <td className="p-4 text-rose-600 font-medium">{v.complaint}</td>
                                                <td className="p-4 text-emerald-700">{v.treatment_given}</td>
                                                <td className="p-4 text-xs font-mono text-gray-500">{v.visit_date}</td>
                                                <td className="p-4 text-xs text-gray-600">Nurse</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
  {activeTab === "records" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Student Health & Emergency Profiles</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Student</th>
                                        <th className="p-4 text-center">Blood Group</th>
                                        <th className="p-4 text-center">Genotype</th>
                                        <th className="p-4">Allergies & Conditions</th>
                                        <th className="p-4">Emergency Contact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {records.map(r => {
                                        const student = r.student || {};
                                        return (
                                            <tr key={r.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{student.surname} {student.first_name}</td>
                                                <td className="p-4 text-center font-bold text-rose-600">{r.blood_group || "N/A"}</td>
                                                <td className="p-4 text-center font-bold text-blue-600">{r.genotype || "N/A"}</td>
                                                <td className="p-4">
                                                    <p className="text-xs"><span className="font-semibold text-gray-500">Allergies:</span> {r.allergies || "None"}</p>
                                                    <p className="text-xs mt-0.5"><span className="font-semibold text-gray-500">Chronic:</span> {r.chronic_conditions || "None"}</p>
                                                </td>
                                                <td className="p-4">
                                                    <p className="font-medium text-slate-900 text-xs">{r.emergency_contact_name || "N/A"}</p>
                                                    <p className="text-xs font-mono text-emerald-600">{r.emergency_contact_phone || "N/A"}</p>
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

            {/* LOG VISIT MODAL */}
            {showVisitModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Log Dispensary / Clinic Visit</h3>
                            <button onClick={() => setShowVisitModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveVisit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Student</label>
                                <select required value={visitForm.student_id} onChange={(e) => setVisitForm({...visitForm, student_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.surname} {s.first_name} ({s.admission_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Visit Date & Time</label>
                                    <input type="datetime-local" required value={visitForm.visit_date} onChange={(e) => setVisitForm({...visitForm, visit_date: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Complaint / Symptoms</label>
                                    <input type="text" required value={visitForm.complaint} onChange={(e) => setVisitForm({...visitForm, complaint: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Headache, Fever..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Treatment / Medication Administered</label>
                                <textarea rows="2" required value={visitForm.treatment_given} onChange={(e) => setVisitForm({...visitForm, treatment_given: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Paracetamol 500mg, rest given..."></textarea>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Nurse Observation / Notes</label>
                                <textarea rows="2" value={visitForm.nurse_notes} onChange={(e) => setVisitForm({...visitForm, nurse_notes: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Optional notes..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowVisitModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Visit Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD MEDICAL RECORD MODAL */}
            {showRecordModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Add Student Medical & Emergency Profile</h3>
                            <button onClick={() => setShowRecordModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveRecord} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Student</label>
                                <select required value={recordForm.student_id} onChange={(e) => setRecordForm({...recordForm, student_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.surname} {s.first_name} ({s.admission_number})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Blood Group</label>
                                    <select value={recordForm.blood_group} onChange={(e) => setRecordForm({...recordForm, blood_group: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
                                        <option value="">Select</option>
                                        {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Genotype</label>
                                    <select value={recordForm.genotype} onChange={(e) => setRecordForm({...recordForm, genotype: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none">
                                        <option value="">Select</option>
                                        {["AA", "AS", "SS", "AC"].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Allergies</label>
                                    <input type="text" value={recordForm.allergies} onChange={(e) => setRecordForm({...recordForm, allergies: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Dust, Penicillin..." />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Chronic Conditions</label>
                                    <input type="text" value={recordForm.chronic_conditions} onChange={(e) => setRecordForm({...recordForm, chronic_conditions: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Asthma, Diabetes..." />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Contact Name</label>
                                    <input type="text" value={recordForm.emergency_contact_name} onChange={(e) => setRecordForm({...recordForm, emergency_contact_name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Parent/Guardian Name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Emergency Phone</label>
                                    <input type="text" value={recordForm.emergency_contact_phone} onChange={(e) => setRecordForm({...recordForm, emergency_contact_phone: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Phone Number" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowRecordModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-rose-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Medical Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
