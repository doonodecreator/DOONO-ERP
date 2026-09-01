import React, { useState, useEffect } from "react";
import api from "../services/api";
import FeePaymentModal from "../components/FeePaymentModal";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import EmptyState from "../components/feedback/EmptyState";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

export default function ParentPortal() {
    const [activeTab, setActiveTab] = useState("children");
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState("");
    const [paymentTarget, setPaymentTarget] = useState(null);
    const [consents, setConsents] = useState([]);
    const [consentLoading, setConsentLoading] = useState(false);
    const [consentSaving, setConsentSaving] = useState(null);

    useEffect(() => { loadParentData(); }, []);
    useEffect(() => { if (activeTab !== "community") return; loadConsents(); }, [activeTab]);

    const loadParentData = async () => {
        setLoading(true);
        try {
            const res = await api.get("/parent/dashboard");
            setDashboardData(res.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to load parent portal data.");
            setDashboardData(null);
        }
        finally { setLoading(false); }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

    const children = Array.isArray(dashboardData?.children) ? dashboardData.children : [];
    const feeGroups = dashboardData?.fee_breakdown && typeof dashboardData.fee_breakdown === "object" ? Object.values(dashboardData.fee_breakdown) : [];
    const feeBreakdown = Array.isArray(feeGroups) ? feeGroups : [];

    const loadConsents = async () => {
        try { setConsentLoading(true); const response = await api.get("/portal/community/consents"); const value = response?.data?.data; setConsents(Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []); }
        catch (err) { setError(err?.response?.data?.message || "Unable to load community consent settings."); setConsents([]); }
        finally { setConsentLoading(false); }
    };

    const decideConsent = async (consent, status, videoAllowed = false, globalExchangeAllowed = false) => {
        try { setConsentSaving(consent.id); setError(""); await api.patch(`/portal/community/consents/${consent.id}`, { status, video_allowed: videoAllowed, global_exchange_allowed: globalExchangeAllowed }); await loadConsents(); }
        catch (err) { setError(err?.response?.data?.message || "Unable to save this consent decision."); }
        finally { setConsentSaving(null); }
    };

    const downloadReportCard = async (studentId) => {
        setDownloadingId(studentId);
        setError("");
        try {
            const response = await api.get(`/parent/report-cards/${studentId}/download`, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.download = "Report_Card.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err?.response?.data?.message || "No published report card is available for this child yet.");
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <PageContainer>
            <PageHeader
                title="Parent Portal"
                subtitle="Follow only the children linked to your parent account in the active school."
                action={<div className="rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm"><span className="text-sm text-slate-500">Outstanding: </span><span className="text-lg font-bold text-rose-600">₦{Number(dashboardData?.outstanding_fees || 0).toLocaleString()}</span></div>}
            />
            {error && <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

            <div className="flex gap-4 mb-6">
                <button type="button" onClick={() => setActiveTab("children")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'children' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>My Children</button>
                <button type="button" onClick={() => setActiveTab("fees")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'fees' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>Fees Breakdown</button>
                <button type="button" onClick={() => setActiveTab("community")} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'community' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}>Community Permissions</button>
            </div>

            {activeTab === "children" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {children.length === 0 ? (
                        <EmptyState title="No children are linked yet" message="Ask the school administrator to create or link your parent portal account and connect each of your children to this parent record. The school must link every child separately, even when one parent has several children." />
                    ) : children.map(child => (
                        <div key={child.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold">{child.full_name || `${child.first_name || ""} ${child.last_name || ""}`.trim() || "Unnamed child"}</h3>
                            <p className="text-slate-500 text-sm">{child.division || "Division not assigned"} · {child.class || "Class not assigned"}{child.stream ? ` · ${child.stream}` : ""}</p>
                            <p className="mt-2 font-mono text-xs font-semibold text-indigo-700">Admission number: {child.admission_number || "Not assigned"}</p>
                            <div className="mt-4 flex gap-2">
                                <button type="button" onClick={() => downloadReportCard(child.id)} disabled={downloadingId === child.id} className="text-indigo-600 text-sm font-semibold disabled:opacity-50">{downloadingId === child.id ? "Preparing..." : "Download Report Card"}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === "community" && (
                <div className="space-y-5">
                    <Alert variant="info">These permissions apply to linked children only. Approving video or exchange does not make a child’s profile public or allow unrestricted private messaging. School moderation and backend school boundaries still apply.</Alert>
                    {consentLoading ? <LoadingSpinner text="Loading consent settings..." /> : consents.length === 0 ? <EmptyState title="No active child consent records" message="Consent settings appear when the school has linked an active child to your parent account." /> : consents.map((consent) => <section key={consent.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-bold text-slate-900">{consent.student?.first_name || "Student"} {consent.student?.last_name || ""}</h3><p className="mt-1 text-sm text-slate-500">Current decision: <strong className="capitalize">{consent.status}</strong></p><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={() => decideConsent(consent, "approved", true, false)} loading={consentSaving === consent.id}>Allow moderated videos</Button><Button size="sm" variant="secondary" onClick={() => decideConsent(consent, "approved", false, true)} loading={consentSaving === consent.id}>Allow approved exchange</Button><Button size="sm" variant="danger" onClick={() => decideConsent(consent, "denied")} loading={consentSaving === consent.id}>Deny</Button></div></section>)}
                </div>
            )}

            {activeTab === "fees" && (
                <div className="space-y-6">
                    {feeBreakdown.length === 0 ? <EmptyState title="No outstanding fee items" message="There are no unpaid fee items available for your linked children in this school." /> : feeBreakdown.map((data, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-lg text-indigo-900">{data.student_name}</h3>
                                <span className="text-rose-600 font-bold">Total: ₦{Number(data.total_due || 0).toLocaleString()}</span>
                            </div>
                            <table className="w-full text-sm">
                                <thead className="text-slate-400 border-b">
                                    <tr><th className="text-left py-2">Fee Item</th><th className="text-right py-2">Amount</th><th className="text-right py-2">Action</th></tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(data.items) && data.items.map((item, i) => (
                                        <tr key={item.student_fee_id || i} className="border-b last:border-0">
                                            <td className="py-2 text-slate-700">{item.category}</td>
                                            <td className="py-2 text-right font-medium">₦{Number(item.amount || 0).toLocaleString()}</td>
                                            <td className="py-2 pl-3 text-right"><button type="button" onClick={() => setPaymentTarget({ studentId: item.student_id, studentFeeId: item.student_fee_id, feeCategoryId: item.fee_category_id, feeName: item.category, amount: item.amount })} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Pay</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
            <FeePaymentModal
                isOpen={Boolean(paymentTarget)}
                onClose={() => setPaymentTarget(null)}
                {...(paymentTarget || {})}
            />
        </PageContainer>
    );
}
