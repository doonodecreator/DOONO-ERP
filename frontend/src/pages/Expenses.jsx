import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modal";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";

const emptyForm = () => ({
  title: "",
  amount: "",
  category: "Operational",
  expense_date: new Date().toISOString().split("T")[0],
  description: "",
});

function listFrom(response) {
  const data = response?.data?.data?.data ?? response?.data?.data ?? response?.data ?? [];
  return Array.isArray(data) ? data : [];
}

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/expenses");
      setExpenses(listFrom(response));
    } catch (requestError) {
      setExpenses([]);
      setError(requestError?.response?.data?.message || requestError?.message || "Failed to load expense records.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item?.amount || 0), 0),
    [expenses],
  );

  const columns = useMemo(() => [
    { key: "title", label: "Expense title", render: (item) => item?.title || "Untitled expense" },
    { key: "category", label: "Category", render: (item) => item?.category || "Operational" },
    { key: "amount", label: "Amount", render: (item) => `₦${Number(item?.amount || 0).toLocaleString()}` },
    { key: "expense_date", label: "Date", render: (item) => item?.expense_date || "—" },
    { key: "description", label: "Description", render: (item) => item?.description || "—" },
  ], []);

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.post("/expenses", { ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm(emptyForm());
      setMessage("Expense recorded successfully.");
      await loadExpenses();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Failed to record expense.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="School expenses"
        subtitle="Track institutional expenditures, maintenance costs, and operational outflows."
        action={<Button onClick={() => { setError(""); setMessage(""); setShowModal(true); }}>Record expense</Button>}
      />

      {error && <Alert variant="error" action={<Button variant="secondary" size="sm" onClick={loadExpenses}>Retry</Button>}>{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SectionCard title="Total recorded expenditure" subtitle="All expense records returned for the current school.">
          <p className="text-2xl font-bold text-slate-900">₦{totalExpenses.toLocaleString()}</p>
        </SectionCard>
      </div>

      <SectionCard title="Expense register" subtitle="Review the school’s recorded operational spending.">
        {loading ? (
          <LoadingSpinner text="Loading expense records..." />
        ) : expenses.length === 0 ? (
          <EmptyState title="No expenses recorded" message="Select Record expense to add the school’s first expenditure." action={<Button onClick={() => setShowModal(true)}>Record expense</Button>} />
        ) : (
          <DataTable columns={columns} data={expenses} rowKey={(item) => item.id} />
        )}
      </SectionCard>

      <Modal
        open={showModal}
        title="Record school expense"
        description="Enter a verified expenditure. The record will be stored in the current school’s finance history."
        onClose={() => !saving && setShowModal(false)}
        size="lg"
        footer={<FormActions sticky={false}><Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button><Button type="submit" form="expense-form" loading={saving}>Save expense</Button></FormActions>}
      >
        <form id="expense-form" onSubmit={handleCreate} className="ui-form-grid">
          <FormField label="Expense title" htmlFor="expense-title" required>
            <input id="expense-title" required maxLength={255} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="ui-form-control" placeholder="e.g. Generator diesel refill" />
          </FormField>
          <FormField label="Amount (₦)" htmlFor="expense-amount" required>
            <input id="expense-amount" required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="ui-form-control" />
          </FormField>
          <FormField label="Category" htmlFor="expense-category" required>
            <select id="expense-category" required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="ui-form-control">
              <option value="Operational">Operational</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Salary">Salary / wages</option>
              <option value="Utilities">Utilities</option>
              <option value="Supplies">Supplies</option>
            </select>
          </FormField>
          <FormField label="Expense date" htmlFor="expense-date" required>
            <input id="expense-date" required type="date" value={form.expense_date} onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))} className="ui-form-control" />
          </FormField>
          <div className="ui-form-full">
            <FormField label="Description / notes" htmlFor="expense-description">
              <textarea id="expense-description" maxLength={2000} rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="ui-form-control" placeholder="Add the reason, supplier, approval, or supporting details." />
            </FormField>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
