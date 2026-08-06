import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function HostelDashboard() {
    const [activeTab, setActiveTab] = useState("allocations");
    const [loading, setLoading] = useState(false);
    const [hostels, setHostels] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [students, setStudents] = useState([]);

    const [showHostelModal, setShowHostelModal] = useState(false);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [showAllocationModal, setShowAllocationModal] = useState(false);

    const [hostelForm, setHostelForm] = useState({ name: "", type: "Mixed", description: "" });
    const [roomForm, setRoomForm] = useState({ hostel_id: "", room_number: "", capacity: 4 });
    const [allocationForm, setAllocationForm] = useState({ hostel_room_id: "", student_id: "", bed_space: "" });

    useEffect(() => {
        loadHostelData();
    }, []);

    const loadHostelData = async () => {
        setLoading(true);
        try {
            const [hostelsRes, allocationsRes, studentsRes] = await Promise.all([
                api.get("/hostels").catch(() => ({ data: { data: [] } })),
                api.get("/hostel-allocations").catch(() => ({ data: { data: [] } })),
                api.get("/students").catch(() => ({ data: { data: [] } }))
            ]);

            setHostels(hostelsRes.data?.data || hostelsRes.data || []);
            setAllocations(allocationsRes.data?.data || allocationsRes.data || []);
            setStudents(studentsRes.data?.data || studentsRes.data || []);
        } catch (err) {
            console.error("Error loading hostel data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveHostel = async (e) => {
        e.preventDefault();
        try {
            await api.post("/hostels", hostelForm);
            setShowHostelModal(false);
            setHostelForm({ name: "", type: "Mixed", description: "" });
            loadHostelData();
        } catch (err) {
            alert("Failed to create hostel block.");
        }
    };

    const handleSaveRoom = async (e) => {
        e.preventDefault();
        try {
            await api.post("/hostel-rooms", roomForm);
            setShowRoomModal(false);
            setRoomForm({ hostel_id: "", room_number: "", capacity: 4 });
            loadHostelData();
        } catch (err) {
            alert("Failed to create hostel room.");
        }
    };

    const handleAllocateStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post("/hostel-allocations", allocationForm);
            setShowAllocationModal(false);
            setAllocationForm({ hostel_room_id: "", student_id: "", bed_space: "" });
            loadHostelData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to allocate bed space.");
        }
    };
// Flatten all rooms across hostels for dropdown selection
    const allRooms = hostels.flatMap(h => (h.rooms || []).map(r => ({ ...r, hostel_name: h.name })));

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hostel & Accommodation Portal</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage boarding housing blocks, configure room capacities, and allocate student bed spaces.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setShowHostelModal(true)} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Add Hostel
                        </button>
                        <button onClick={() => setShowRoomModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Add Room
                        </button>
                        <button onClick={() => setShowAllocationModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Allocate Bed
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["allocations", "hostels"].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-sky-600 text-sky-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab === "allocations" ? "Active Bed Allocations" : "Hostel Blocks & Rooms"}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-gray-100">
                    <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === "allocations" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Student Bed Space Allocations</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Hostel Block</th>
                                        <th className="p-4">Room Number</th>
                                        <th className="p-4">Bed Space</th>
                                        <th className="p-4">Allocation Date</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allocations.map(a => {
                                        const student = a.student || {};
                                        const room = a.room || {};
                                        const hostel = room.hostel || {};
                                        return (
                                            <tr key={a.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{student.surname} {student.first_name} ({student.admission_number})</td>
                                                <td className="p-4">{hostel.name || "N/A"}</td>
                                                <td className="p-4 font-medium text-indigo-600">Room {room.room_number || "N/A"}</td>
                                                <td className="p-4 font-mono text-xs">{a.bed_space || "Standard"}</td>
                                                <td className="p-4 text-xs text-gray-500">{a.allocated_date}</td>
                                                <td className="p-4"><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-semibold">{a.status}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === "hostels" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hostels.map(h => (
                                <div key={h.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{h.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{h.description || "No description provided."}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${h.type === 'Boys' ? 'bg-blue-50 text-blue-700' : h.type === 'Girls' ? 'bg-rose-50 text-rose-700' : 'bg-purple-50 text-purple-700'}`}>
                                            {h.type} Hostel
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-3">
                                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Rooms Overview</h4>
                                        <div className="space-y-2">
                                            {(h.rooms || []).map(r => (
                                                <div key={r.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl text-xs">
                                                    <span className="font-semibold text-slate-800">Room {r.room_number}</span>
                                                    <span className="text-gray-500">Beds: <strong className={r.occupied_beds >= r.capacity ? 'text-red-500' : 'text-emerald-600'}>{r.occupied_beds}</strong> / {r.capacity}</span>
                                                </div>
                                            ))}
                                            {(!h.rooms || h.rooms.length === 0) && <p className="text-xs text-gray-400 italic">No rooms added yet.</p>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

{/* ADD HOSTEL MODAL */}
            {showHostelModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Add Hostel Block</h3>
                            <button onClick={() => setShowHostelModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveHostel} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hostel Name</label>
                                <input type="text" required value={hostelForm.name} onChange={(e) => setHostelForm({...hostelForm, name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="e.g. Tinubu Hall" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hostel Type</label>
                                <select value={hostelForm.type} onChange={(e) => setHostelForm({...hostelForm, type: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none">
                                    <option value="Boys">Boys</option>
                                    <option value="Girls">Girls</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
                                <textarea rows="2" value={hostelForm.description} onChange={(e) => setHostelForm({...hostelForm, description: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-sky-500 outline-none" placeholder="Details about block..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowHostelModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-sky-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Hostel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ROOM MODAL */}
            {showRoomModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Add Room to Hostel</h3>
                            <button onClick={() => setShowRoomModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveRoom} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Hostel</label>
                                <select required value={roomForm.hostel_id} onChange={(e) => setRoomForm({...roomForm, hostel_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                                    <option value="">-- Choose Hostel --</option>
                                    {hostels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.type})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Room Number</label>
                                    <input type="text" required value={roomForm.room_number} onChange={(e) => setRoomForm({...roomForm, room_number: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 102" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bed Capacity</label>
                                    <input type="number" required min="1" value={roomForm.capacity} onChange={(e) => setRoomForm({...roomForm, capacity: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowRoomModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ALLOCATE BED MODAL */}
            {showAllocationModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Allocate Bed Space to Student</h3>
                            <button onClick={() => setShowAllocationModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleAllocateStudent} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Student</label>
                                <select required value={allocationForm.student_id} onChange={(e) => setAllocationForm({...allocationForm, student_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="">-- Choose Student --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.surname} {s.first_name} ({s.admission_number})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Room</label>
                                <select required value={allocationForm.hostel_room_id} onChange={(e) => setAllocationForm({...allocationForm, hostel_room_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="">-- Choose Room --</option>
                                    {allRooms.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.hostel_name} - Room {r.room_number} (Free: {r.capacity - r.occupied_beds})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Bed Space (Optional)</label>
                                <input type="text" value={allocationForm.bed_space} onChange={(e) => setAllocationForm({...allocationForm, bed_space: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Top Bunk, Bed A" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAllocationModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Allocate Bed</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
