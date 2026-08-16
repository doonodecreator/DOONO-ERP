import React, { useState, useEffect } from "react";
import api from "../services/api";

export default function ParentPortal() {
    const [activeTab, setActiveTab] = useState("children");
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => { loadParentData(); }, []);

    const loadParentData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/parent/dashboard");
            setDashboardData(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    const children = dashboardData?.children || [];
    const feeBreakdown = dashboardData?.fee_breakdown || {};

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Parent Portal</h1>
                <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                    <span className="text-sm text-slate-500">Total Outstanding: </span>
                    <span className="text-lg font-bold text-rose-600">₦{dashboardData?.outstanding_fees?.toLocaleString()}</span>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <button onClick={() => setActiveTab("children")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'children' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>My Children</button>
                <button onClick={() => setActiveTab("fees")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'fees' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>Fees Breakdown</button>
            </div>

            {activeTab === "children" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {children.map(child => (
                        <div key={child.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold">{child.first_name} {child.last_name}</h3>
                            <p className="text-slate-500 text-sm">{child.division?.name} - {child.class?.name}</p>
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => window.open(`${api.defaults.baseURL}/report-cards/${child.id}/download`, "_blank")} className="text-indigo-600 text-sm font-semibold">Download Report Card</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "fees" && (
                <div className="space-y-6">
                    {Object.values(feeBreakdown).map((data, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-indigo-900">{data.student_name}</h3>
                                <span className="text-rose-600 font-bold">Total: ₦{data.total_due.toLocaleString()}</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="text-slate-400 border-b">
                                    <tr><th className="text-left py-2">Fee Item</th><th className="text-right py-2">Amount</th></tr>
                                </thead>
                                <tbody>
                                    {data.items.map((item, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="py-2 text-slate-700">{item.category}</td>
                                            <td className="py-2 text-right font-medium">₦{item.amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700">Pay for {data.student_name}</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
