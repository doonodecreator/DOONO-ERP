import React, { useState, useEffect } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";

export default function TransportDashboard() {
    const [activeTab, setActiveTab] = useState("allocations");
    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [allocations, setAllocations] = useState([]);
    const [students, setStudents] = useState([]);

    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [showAllocationModal, setShowAllocationModal] = useState(false);

    const [vehicleForm, setVehicleForm] = useState({ vehicle_number: "", model: "", capacity: 14, driver_name: "", driver_phone: "", status: "Active" });
    const [routeForm, setRouteForm] = useState({ route_name: "", description: "", vehicle_id: "", fare_amount: "" });
    const [allocationForm, setAllocationForm] = useState({ transport_route_id: "", student_id: "", pickup_point: "" });

    useEffect(() => {
        loadTransportData();
    }, []);

    const loadTransportData = async () => {
        setLoading(true);
        try {
            const [vehiclesRes, routesRes, allocationsRes, studentsRes] = await Promise.all([
                api.get("/vehicles").catch(() => ({ data: { data: [] } })),
                api.get("/transport-routes").catch(() => ({ data: { data: [] } })),
                api.get("/transport-allocations").catch(() => ({ data: { data: [] } })),
                api.get("/students").catch(() => ({ data: { data: [] } }))
            ]);

            setVehicles(arrayFromResponse(vehiclesRes));
            setRoutes(arrayFromResponse(routesRes));
            setAllocations(arrayFromResponse(allocationsRes));
            setStudents(arrayFromResponse(studentsRes));
        } catch (err) {
            console.error("Error loading transport data", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveVehicle = async (e) => {
        e.preventDefault();
        try {
            await api.post("/vehicles", vehicleForm);
            setShowVehicleModal(false);
            setVehicleForm({ vehicle_number: "", model: "", capacity: 14, driver_name: "", driver_phone: "", status: "Active" });
            loadTransportData();
        } catch (err) {
            alert("Failed to register vehicle.");
        }
    };

    const handleSaveRoute = async (e) => {
        e.preventDefault();
        try {
            await api.post("/transport-routes", routeForm);
            setShowRouteModal(false);
            setRouteForm({ route_name: "", description: "", vehicle_id: "", fare_amount: "" });
            loadTransportData();
        } catch (err) {
            alert("Failed to create transport route.");
        }
    };

    const handleAllocateStudent = async (e) => {
        e.preventDefault();
        try {
            await api.post("/transport-allocations", allocationForm);
            setShowAllocationModal(false);
            setAllocationForm({ transport_route_id: "", student_id: "", pickup_point: "" });
            loadTransportData();
        } catch (err) {
            alert(err.response?.data?.message || "Failed to allocate student to route.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 text-gray-800">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">School Transport Portal</h1>
                        <p className="text-sm text-gray-500 mt-1">Manage bus fleets, define route schedules, assign drivers, and allocate student bus passes.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setShowVehicleModal(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Add Vehicle
                        </button>
                        <button type="button" onClick={() => setShowRouteModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Add Route
                        </button>
                        <button type="button" onClick={() => setShowAllocationModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                            + Allocate Student
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-b border-gray-100 mt-6 overflow-x-auto pb-px">
                    {["allocations", "routes", "vehicles"].map((tab) => (
                        <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap transition-all -mb-px ${activeTab === tab ? "border-amber-600 text-amber-600 font-semibold" : "border-transparent text-gray-500 hover:text-gray-900"}`}>
                            {tab === "allocations" ? "Student Allocations" : tab === "routes" ? "Bus Routes" : "Vehicle Fleet"}
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
                    {activeTab === "allocations" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">Assigned Transport Passengers</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Student</th>
                                        <th className="p-4">Route Name</th>
                                        <th className="p-4">Assigned Vehicle</th>
                                        <th className="p-4">Pickup Point</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {allocations.map(a => {
                                        const student = a.student || {};
                                        const route = a.route || {};
                                        const vehicle = route.vehicle || {};
                                        return (
                                            <tr key={a.id} className="hover:bg-gray-50/70">
                                                <td className="p-4 font-semibold text-slate-900">{student.surname} {student.first_name} ({student.admission_number})</td>
                                                <td className="p-4 font-medium text-blue-600">{route.route_name || "N/A"}</td>
                                                <td className="p-4">{vehicle.vehicle_number ? `${vehicle.vehicle_number} (${vehicle.driver_name || 'No driver'})` : 'Unassigned'}</td>
                                                <td className="p-4 text-gray-600">{a.pickup_point || "Main Gate"}</td>
                                                <td className="p-4"><span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-semibold">{a.status}</span></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
{activeTab === "routes" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {routes.map(r => (
                                <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{r.route_name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{r.description || "No specific itinerary notes."}</p>
                                        </div>
                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold font-mono">
                                            ₦{Number(r.fare_amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-100 pt-3 text-xs space-y-1">
                                        <p><span className="font-semibold text-gray-400">Assigned Bus:</span> {r.vehicle?.vehicle_number || "None Assigned"}</p>
                                        <p><span className="font-semibold text-gray-400">Driver:</span> {r.vehicle?.driver_name || "N/A"} ({r.vehicle?.driver_phone || "No phone"})</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "vehicles" && (
                        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-gray-100">
                                <h3 className="font-bold text-slate-900">School Vehicle Fleet & Drivers</h3>
                            </div>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-medium">
                                    <tr>
                                        <th className="p-4">Vehicle Number</th>
                                        <th className="p-4">Model</th>
                                        <th className="p-4 text-center">Capacity</th>
                                        <th className="p-4">Driver Name</th>
                                        <th className="p-4">Driver Phone</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {vehicles.map(v => (
                                        <tr key={v.id} className="hover:bg-gray-50/70">
                                            <td className="p-4 font-bold font-mono text-slate-900">{v.vehicle_number}</td>
                                            <td className="p-4 text-gray-600">{v.model || "Standard Bus"}</td>
                                            <td className="p-4 text-center font-semibold">{v.capacity} seats</td>
                                            <td className="p-4 font-medium text-slate-800">{v.driver_name || "Unassigned"}</td>
                                            <td className="p-4 text-xs font-mono text-emerald-600">{v.driver_phone || "N/A"}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-semibold ${v.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                    {v.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ADD VEHICLE MODAL */}
            {showVehicleModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Register Vehicle</h3>
                            <button type="button" onClick={() => setShowVehicleModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveVehicle} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle Number</label>
                                    <input type="text" required value={vehicleForm.vehicle_number} onChange={(e) => setVehicleForm({...vehicleForm, vehicle_number: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="ABC-123-XY" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Capacity</label>
                                    <input type="number" required min="1" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({...vehicleForm, capacity: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Vehicle Model</label>
                                <input type="text" value={vehicleForm.model} onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Toyota Hiace Bus" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Driver Name</label>
                                    <input type="text" value={vehicleForm.driver_name} onChange={(e) => setVehicleForm({...vehicleForm, driver_name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Driver Full Name" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Driver Phone</label>
                                    <input type="text" value={vehicleForm.driver_phone} onChange={(e) => setVehicleForm({...vehicleForm, driver_phone: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none" placeholder="080..." />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                                <select value={vehicleForm.status} onChange={(e) => setVehicleForm({...vehicleForm, status: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 outline-none">
                                    <option value="Active">Active</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowVehicleModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-amber-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Vehicle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD ROUTE MODAL */}
            {showRouteModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Create Bus Route</h3>
                            <button type="button" onClick={() => setShowRouteModal(false)} className="text-gray-400">×</button>
                        </div>
                        <form onSubmit={handleSaveRoute} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Route Name</label>
                                <input type="text" required value={routeForm.route_name} onChange={(e) => setRouteForm({...routeForm, route_name: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Route A - GRA / Asaba" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign Vehicle</label>
                                    <select value={routeForm.vehicle_id} onChange={(e) => setRouteForm({...routeForm, vehicle_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                                        <option value="">-- Choose Vehicle --</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicle_number} ({v.driver_name || 'No driver'})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fare Amount (₦)</label>
                                    <input type="number" required min="0" step="0.01" value={routeForm.fare_amount} onChange={(e) => setRouteForm({...routeForm, fare_amount: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="15000" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description / Stops</label>
                                <textarea rows="2" value={routeForm.description} onChange={(e) => setRouteForm({...routeForm, description: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Major stops along route..."></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowRouteModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Save Route</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ALLOCATE STUDENT MODAL */}
            {showAllocationModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Allocate Student to Transport Route</h3>
                            <button type="button" onClick={() => setShowAllocationModal(false)} className="text-gray-400">×</button>
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
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Select Route</label>
                                <select required value={allocationForm.transport_route_id} onChange={(e) => setAllocationForm({...allocationForm, transport_route_id: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="">-- Choose Route --</option>
                                    {routes.map(r => <option key={r.id} value={r.id}>{r.route_name} (₦{Number(r.fare_amount).toLocaleString()})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pickup Point / Bus Stop</label>
                                <input type="text" value={allocationForm.pickup_point} onChange={(e) => setAllocationForm({...allocationForm, pickup_point: e.target.value})} className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Winner's Chapel Junction" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowAllocationModal(false)} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
                                <button type="submit" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm">Allocate Pass</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
