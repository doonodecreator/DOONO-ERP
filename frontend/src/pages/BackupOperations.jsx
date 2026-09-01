import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function BackupOperations() {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/platform/backups", { params: { per_page: 25 } });
      const payload = response?.data || {};
      setRows(Array.isArray(payload?.data) ? payload.data : []);
      setPagination(payload || null);
    } catch (requestError) {
      setRows([]);
      setPagination(null);
      setError(requestError?.response?.data?.message || "Unable to load backup runs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function requestBackup() {
    setRunning(true);
    setError("");
    setNotice("");
    try {
      const response = await api.post("/platform/backups");
      setNotice(response?.data?.message || "Encrypted backup request queued.");
      await load();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to queue encrypted backup.");
    } finally {
      setRunning(false);
    }
  }

  async function verifyBackup(row) {
    setVerifyingId(row.id);
    setError("");
    setNotice("");
    try {
      const response = await api.post(`/platform/backups/${row.id}/verify`);
      setNotice(response?.data?.message || "Encrypted backup verification queued.");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to queue backup verification.");
    } finally {
      setVerifyingId(null);
    }
  }

  const columns = [
    { key: "started_at", label: "Started", render: (row) => formatDate(row.started_at) },
    { key: "status", label: "Status", render: (row) => row.status || "unknown" },
    { key: "disk", label: "Private disk" },
    { key: "bytes", label: "Size", render: (row) => formatBytes(row.bytes) },
    { key: "sha256", label: "SHA-256", render: (row) => row.sha256 ? <code>{row.sha256.slice(0, 16)}…</code> : "—" },
    { key: "completed_at", label: "Completed", render: (row) => formatDate(row.completed_at) },
    { key: "failure_message", label: "Failure", render: (row) => row.failure_message || "—" },
    { key: "actions", label: "Actions", render: (row) => row.status === "succeeded" && row.path ? <Button size="sm" variant="secondary" loading={verifyingId === row.id} onClick={() => verifyBackup(row)}>Verify artifact</Button> : "—" },
  ];

  return (
    <PageContainer>
      <PageHeader title="Backups & logs" subtitle="Encrypted database backup requests and operational evidence. Backup automation runs only when explicitly configured." action={<Button onClick={requestBackup} loading={running} loadingText="Queueing…">Request encrypted backup</Button>} />
      {error && <Alert variant="error">{error}</Alert>}
      {notice && <Alert variant="success">{notice}</Alert>}
      <SectionCard title="Operational boundary" subtitle="Backups are never marked successful until the encrypted artifact is written to the configured private disk.">
        <p className="text-sm text-slate-600">The worker requires a database dump binary, GPG, a secret passphrase of at least 16 characters, and a private filesystem disk. A local disk is suitable for testing only; production requires persistent private object storage, retention, access control, and a restore drill.</p>
      </SectionCard>
      <SectionCard title="Backup runs" subtitle="The artifact path and checksum are recorded for verification; plaintext dump files are removed from the work directory after each attempt.">
        {loading ? <LoadingSpinner text="Loading backup runs…" /> : rows.length === 0 ? <EmptyState title="No backup runs" message="Request an encrypted backup after configuring the worker secrets and private storage." /> : <DataTable columns={columns} data={rows} loading={loading} pagination={pagination} onPageChange={load} emptyTitle="No backup runs" emptyMessage="No backup records are available." />}
      </SectionCard>
    </PageContainer>
  );
}
