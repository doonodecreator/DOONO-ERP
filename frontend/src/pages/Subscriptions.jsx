import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

export default function Subscriptions() {
    const { isPlatformAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [mySub, setMySub] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            const [plansRes, subRes] = await Promise.all([
                api.get("/subscription-plans"),
                api.get("/my-subscription")
            ]);
            setPlans(Array.isArray(plansRes.data?.data?.data) ? plansRes.data.data.data : (Array.isArray(plansRes.data?.data) ? plansRes.data.data : []));
            setMySub(subRes.data?.data || null);
        } catch (err) {
            setError("Failed to load subscription details.");
        } finally {
            setLoading(false);
        }
    }

    async function handleRenew() {
        try {
            const res = await api.post("/payments/initialize-subscription");
            if (res.data?.data?.authorization_url) {
                window.location.href = res.data.data.authorization_url;
            }
        } catch (err) {
            alert(err.response?.data?.message || "Renewal failed.");
        }
    }

    if (loading) return <PageContainer><LoadingSpinner /></PageContainer>;

    return (
        <PageContainer>
            <PageHeader title="Subscription" subtitle="Manage your school's platform access." />
            
            {mySub && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Current Plan: {mySub.plan?.name}</h3>
                            <p className="text-slate-500">Status: <span className={`font-semibold ${mySub.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{mySub.status.toUpperCase()}</span></p>
                            <p className="text-slate-500 text-sm mt-1">Expires on: {new Date(mySub.expiry_date).toLocaleDateString()}</p>
                        </div>
                        {mySub.status !== 'exempt' && (
                            <button onClick={handleRenew} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                                Renew Now
                            </button>
                        )}
                    </div>
                </div>
            )}

            <h3 className="text-xl font-bold text-slate-900 mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
                        <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                        <p className="text-slate-500 text-sm mb-4">{plan.description}</p>
                        <div className="text-2xl font-bold text-indigo-600 mb-6">{plan.currency} {plan.monthly_price}<span className="text-sm text-slate-400 font-normal">/mo</span></div>
                        <ul className="text-sm text-slate-600 space-y-2 mb-8 flex-grow">
                            <li>Up to {plan.max_students} Students</li>
                            <li>Up to {plan.max_staff} Staff</li>
                        </ul>
                        <button disabled className="w-100 py-2 rounded-lg border border-slate-200 text-slate-400 font-medium">
                            {mySub?.plan?.id === plan.id ? 'Current Plan' : 'Request Upgrade'}
                        </button>
                    </div>
                ))}
            </div>
        </PageContainer>
    );
}
