import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

const safeArray = (value) => (Array.isArray(value) ? value : []);

export default function Marketplace() {
  const [apps, setApps] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [catalogResponse, installationsResponse] = await Promise.all([api.get("/marketplace/apps"), api.get("/marketplace/installations")]);
      setApps(safeArray(catalogResponse?.data?.data));
      setInstallations(safeArray(installationsResponse?.data?.data));
    } catch (requestError) {
      setApps([]);
      setInstallations([]);
      setError(requestError?.response?.data?.message || "Unable to load the integration marketplace.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function install(app) {
    setWorkingId(app.id);
    setError("");
    setNotice("");
    try {
      await api.post(`/marketplace/apps/${app.id}/install`, { configuration: {} });
      setNotice(`${app.name} is now installed for this school.`);
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to install this integration.");
    } finally {
      setWorkingId(null);
    }
  }

  async function uninstall(installation) {
    if (!window.confirm(`Revoke ${installation.app?.name || "this integration"} for this school?`)) return;
    setWorkingId(installation.id);
    setError("");
    setNotice("");
    try {
      await api.post(`/marketplace/installations/${installation.id}/uninstall`);
      setNotice("Integration installation revoked.");
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to revoke this integration.");
    } finally {
      setWorkingId(null);
    }
  }

  const installedIds = new Set(installations.filter((item) => item?.status === "active").map((item) => item?.marketplace_app_id));

  return (
    <PageContainer>
      <PageHeader title="Integration marketplace" subtitle="Install only platform-approved applications for this school. An installation does not grant cross-school access or bypass DOONO permissions." />
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      <SectionCard title="Approved applications" subtitle="Platform owners publish catalogue entries; your school Proprietor controls which published applications are installed.">
        {loading ? <LoadingSpinner text="Loading marketplace…" /> : apps.length === 0 ? <EmptyState title="No approved applications" message="The Software Owner has not published an integration for schools yet." /> : <div className="grid gap-4 md:grid-cols-2">{apps.map((app) => { const installed = installedIds.has(app.id); const installation = installations.find((item) => item?.marketplace_app_id === app.id && item?.status === "active"); return <article key={app.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">{app.name}</h2><p className="text-sm text-slate-500">Published by {app.publisher}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{installed ? "Installed" : "Available"}</span></div><p className="mt-3 text-sm text-slate-600">{app.description}</p>{Array.isArray(app.capabilities) && app.capabilities.length > 0 && <p className="mt-3 text-xs text-slate-500">Capabilities: {app.capabilities.join(", ")}</p>}<div className="mt-4">{installed ? <Button variant="danger" size="sm" loading={workingId === installation?.id} onClick={() => uninstall(installation)}>Revoke installation</Button> : <Button size="sm" loading={workingId === app.id} onClick={() => install(app)}>Install for this school</Button>}</div></article>; })}</div>}
      </SectionCard>
    </PageContainer>
  );
}
