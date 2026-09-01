import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

export default function Benchmarking() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/benchmarks/status");
      setStatus(response?.data?.data || null);
    } catch (requestError) {
      setStatus(null);
      setError(requestError?.response?.data?.message || "Unable to load benchmarking consent.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function updateConsent(isOptedIn) {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.put("/benchmarks/consent", { is_opted_in: isOptedIn });
      setStatus(response?.data?.data || { ...status, is_opted_in: isOptedIn });
      setNotice(response?.data?.message || "Benchmarking consent updated.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to update benchmarking consent.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Anonymous benchmarking" subtitle="Choose whether this school may contribute de-identified aggregate insight metrics to the platform cohort." />
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      {loading ? <LoadingSpinner text="Loading benchmarking consent…" /> : !status ? <EmptyState title="Consent status unavailable" message="The school context could not be loaded." /> : <SectionCard title={status.is_opted_in ? "Benchmarking is enabled" : "Benchmarking is disabled"} subtitle="This choice is controlled by the school Proprietor and can be revoked at any time."><p className="text-sm leading-6 text-slate-600">When enabled, DOONO may include this school’s aggregate insight snapshot in a peer cohort. The platform does not publish the school name, students, parents, staff, student-level results, medical data, fees, or private files in benchmarking output. Results are withheld until a minimum cohort is available.</p><div className="mt-5 flex flex-wrap gap-3">{status.is_opted_in ? <Button variant="danger" loading={saving} onClick={() => updateConsent(false)}>Revoke consent</Button> : <Button loading={saving} onClick={() => updateConsent(true)}>Opt in to anonymous benchmarking</Button>}</div><p className="mt-4 text-xs text-slate-500">{status.is_opted_in ? `Enabled ${status.consented_at ? new Date(status.consented_at).toLocaleString() : "recently"}.` : "No benchmark contribution will be made while disabled."}</p></SectionCard>}
    </PageContainer>
  );
}
