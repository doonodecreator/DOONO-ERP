import { useEffect, useState } from "react";
import api from "../services/api";

import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatCard from "../components/dashboard/StatCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import DataTable from "../components/tables/DataTable";

export default function PlatformOwnerDashboard() {
    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            setLoading(true);

            const response = await api.get("/platform-owner/dashboard");

            setDashboard(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <PageContainer>
                <LoadingSpinner text="Loading dashboard..." />
            </PageContainer>
        );
    }

    if (!dashboard) {
        return (
            <PageContainer>
                <EmptyState
                    title="Dashboard unavailable"
                    message="Unable to load dashboard information."
                />
            </PageContainer>
        );
    }

    const stats = dashboard.system_stats || {};

    const organizations =
        dashboard.organizations || [];

    const columns = [
        {
            key: "name",
            label: "Organization",
        },
        {
            key: "schools_count",
            label: "Schools",
        },
        {
            key: "plan",
            label: "Plan",
        },
        {
            key: "status",
            label: "Status",
        },
    ];

    return (
        <PageContainer>

            <PageHeader
                title="Platform Owner Dashboard"
                subtitle="Manage every organization, school and subscription on the DONO platform."
            />

            <DashboardGrid>

                <StatCard
                    title="Organizations"
                    value={stats.total_organizations || 0}
                    color="#2563eb"
                />

                <StatCard
                    title="Schools"
                    value={stats.total_schools || 0}
                    color="#16a34a"
                />

                <StatCard
                    title="Subscriptions"
                    value={stats.active_subscriptions || 0}
                    color="#ca8a04"
                />

                <StatCard
                    title="Revenue"
                    value={stats.mrr || "₦0"}
                    color="#9333ea"
                />

            </DashboardGrid>

            <PageHeader
                title="Organizations"
                subtitle="Registered organizations on the platform."
            />

            <DataTable
                columns={columns}
                data={organizations}
                emptyMessage="No organizations found."
            />

        </PageContainer>
    );
}
