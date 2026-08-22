import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import Button from "../components/forms/Button";
import { FormField } from "../components/forms/FormField";
import Alert from "../components/feedback/Alert";
import "./AuditLogs.css";

const initialFilters = { date: "", from: "", to: "", module: "", search: "", per_page: 20 };

function pageData(payload) {
  return {
    rows: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload && typeof payload === "object" ? payload : null,
  };
}

export default function AuditLogs() {
  const { isPlatformAdmin } = useAuth();
  const [schoolActivity, setSchoolActivity] = useState({ rows: [], meta: null });
  const [platformActivity, setPlatformActivity] = useState({ rows: [], meta: null });
  const [mySchoolActivity, setMySchoolActivity] = useState({ rows: [], meta: null });
  const [tab, setTab] = useState(isPlatformAdmin ? "schools" : "my_school");
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activePage = isPlatformAdmin ? (tab === "schools" ? schoolActivity : platformActivity) : mySchoolActivity;

  async function load(requestedPage = 1) {
    setLoading(true);
    setError("");
    try {
      const params = { ...filters };
      const pageKey = isPlatformAdmin ? (tab === "schools" ? "school_page" : "platform_page") : "page";
      params[pageKey] = requestedPage;
      if (!params.date) delete params.date;
      if (!params.from) delete params.from;
      if (!params.to) delete params.to;
      if (!params.module) delete params.module;
      if (!params.search) delete params.search;
      const response = await api.get("/activity-logs", { params });
      if (isPlatformAdmin) {
        setSchoolActivity(pageData(response.data?.school_activity));
        setPlatformActivity(pageData(response.data?.platform_activity));
      } else {
        setMySchoolActivity(pageData(response.data?.data));
      }
    } catch (requestError) {
      setError(requestError.message || "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setTab(isPlatformAdmin ? "schools" : "my_school");
  }, [isPlatformAdmin]);

  useEffect(() => {
    load(1);
  }, [isPlatformAdmin, tab, JSON.stringify(filters)]);

  const columns = useMemo(() => [
    { key: "user", label: "User", render: (row) => row.user?.name || "System" },
    { key: "action", label: "Action", render: (row) => row.description || `${row.module}.${row.action}` },
    { key: "time", label: "Time", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "—", align: "right" },
  ], []);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function clearFilters() {
    setFilters(initialFilters);
  }

  return (
    <PageContainer>
      <PageHeader title="Audit logs" subtitle={isPlatformAdmin ? "Review school activity separately from platform-owner actions." : "Review actions recorded inside your active school."} />
      {error && <Alert variant="error" action={<Button size="sm" variant="secondary" onClick={() => load(activePage.meta?.current_page || 1)}>Retry</Button>}>{error}</Alert>}

      <SectionCard title="Filter activity" subtitle="Use a single day or a date range when investigating a specific event.">
        <div className="ui-form-grid">
          <FormField label="Specific day" htmlFor="audit-date" hint="Leave blank when using a range.">
            <input id="audit-date" type="date" className="ui-form-control" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} />
          </FormField>
          <FormField label="Search" htmlFor="audit-search" hint="Search user, module, action, or description.">
            <input id="audit-search" type="search" className="ui-form-control" value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="e.g. subscription" />
          </FormField>
          <FormField label="From" htmlFor="audit-from">
            <input id="audit-from" type="date" className="ui-form-control" value={filters.from} onChange={(event) => updateFilter("from", event.target.value)} />
          </FormField>
          <FormField label="To" htmlFor="audit-to">
            <input id="audit-to" type="date" className="ui-form-control" value={filters.to} onChange={(event) => updateFilter("to", event.target.value)} />
          </FormField>
          <FormField label="Module" htmlFor="audit-module">
            <input id="audit-module" className="ui-form-control" value={filters.module} onChange={(event) => updateFilter("module", event.target.value)} placeholder="e.g. students" />
          </FormField>
          <div className="ui-form-actions" style={{ alignItems: "end", marginTop: 0 }}>
            <Button variant="secondary" onClick={clearFilters}>Clear filters</Button>
            <Button onClick={() => load(1)}>Apply filters</Button>
          </div>
        </div>
      </SectionCard>

      {isPlatformAdmin && (
        <div className="dono-audit-tabs" role="tablist" aria-label="Audit log scope">
          <Button variant={tab === "schools" ? "primary" : "secondary"} onClick={() => setTab("schools")} role="tab" aria-selected={tab === "schools"}>School activity</Button>
          <Button variant={tab === "platform" ? "primary" : "secondary"} onClick={() => setTab("platform")} role="tab" aria-selected={tab === "platform"}>Platform actions</Button>
        </div>
      )}

      <SectionCard title={isPlatformAdmin && tab === "platform" ? "Platform actions" : "School activity"} subtitle="Results are loaded page by page so large histories remain usable on a phone.">
        <DataTable columns={columns} data={activePage.rows} loading={loading} pagination={activePage.meta} onPageChange={load} emptyTitle="No activity found" emptyMessage="No audit entries match the current filters." />
      </SectionCard>
    </PageContainer>
  );
}
