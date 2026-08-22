import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import DashboardGrid from "../components/dashboard/DashboardGrid";
import StatCard from "../components/dashboard/StatCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { FormField, FormActions } from "../components/forms/FormField";
import Modal from "../components/modals/Modal";
import DataTable from "../components/tables/DataTable";

const initialExpense = () => ({ title: "", description: "", amount: "", category: "Utilities", expense_date: new Date().toISOString().split("T")[0] });
const money = (value) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(Number(value || 0));

export default function AccountantDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState(initialExpense);

  const loadFinancialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [expenseResponse, paymentResponse] = await Promise.all([api.get("/expenses"), api.get("/fee-payments")]);
      setExpenses(arrayFromResponse(expenseResponse));
      setPayments(arrayFromResponse(paymentResponse));
    } catch (err) {
      setError(err?.message || "Unable to load financial records. Please retry.");
      setExpenses([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFinancialData(); }, []);

  const totalIncome = useMemo(() => payments.reduce((sum, payment) => sum + Number(payment?.amount_paid || 0), 0), [payments]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + Number(expense?.amount || 0), 0), [expenses]);
  const netProfitLoss = totalIncome - totalExpenses;

  const handleSaveExpense = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/expenses", expenseForm);
      setShowExpenseModal(false);
      setExpenseForm(initialExpense());
      await loadFinancialData();
    } catch (err) {
      setError(err?.message || "Unable to save the expense record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense record?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      await loadFinancialData();
    } catch (err) {
      setError(err?.message || "Unable to delete the expense record.");
    }
  };

  const paymentColumns = [
    { key: "receipt_number", label: "Receipt reference" },
    { key: "payment_method", label: "Method" },
    { key: "payment_date", label: "Date" },
    { key: "amount_paid", label: "Amount", align: "right", render: (row) => money(row.amount_paid) },
  ];
  const expenseColumns = [
    { key: "title", label: "Title" },
    { key: "category", label: "Category" },
    { key: "expense_date", label: "Date" },
    { key: "amount", label: "Amount", align: "right", render: (row) => money(row.amount) },
    { key: "actions", label: "Action", align: "right", render: (row) => <Button variant="danger" size="sm" onClick={(event) => { event.stopPropagation(); handleDeleteExpense(row.id); }}>Delete</Button> },
  ];
  const tabs = ["overview", "income", "expenses", "profit-loss", "tax-reports"];

  return <PageContainer>
    <PageHeader title="Accountant portal" subtitle="Monitor school income, expenses, and the current profit-and-loss position." action={<Button onClick={() => setShowExpenseModal(true)}>Record expense</Button>} />
    {error && <Alert variant="error" action={<Button variant="secondary" size="sm" onClick={loadFinancialData}>Retry</Button>}>{error}</Alert>}
    <div className="ui-tabs ui-tabs-scroll" role="tablist" aria-label="Accountant workspaces">{tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "ui-tab ui-tab-active" : "ui-tab"} onClick={() => setActiveTab(tab)}>{tab.replace("-", " ")}</button>)}</div>
    {loading ? <LoadingSpinner text="Loading financial records..." /> : <>
      {activeTab === "overview" && <><DashboardGrid><StatCard title="Recorded income" value={money(totalIncome)} color="success" /><StatCard title="Operating expenses" value={money(totalExpenses)} color="danger" /><StatCard title="Net balance" value={money(netProfitLoss)} color={netProfitLoss >= 0 ? "info" : "warning"} /></DashboardGrid><div className="dashboard-section-grid"><SectionCard title="Finance summary" subtitle="Income and overhead records currently loaded for this school."><div className="dashboard-list"><div className="dashboard-list-row"><span className="dashboard-list-title">Fee remittances</span><strong>{payments.length}</strong></div><div className="dashboard-list-row"><span className="dashboard-list-title">Expense records</span><strong>{expenses.length}</strong></div></div></SectionCard><SectionCard title="Next action" subtitle="Keep the ledger current so school leadership can make informed decisions."><Button onClick={() => setActiveTab("income")}>Review income ledger</Button><Button variant="secondary" onClick={() => setActiveTab("expenses")}>Review expenses</Button></SectionCard></div></>}
      {activeTab === "income" && <SectionCard title="Institutional income ledger" subtitle="Fee remittances received through the school payment workflow."><DataTable columns={paymentColumns} data={payments} emptyTitle="No income records" emptyMessage="Paid fee remittances will appear here." /></SectionCard>}
      {activeTab === "expenses" && <SectionCard title="Overhead expenditure items" subtitle="Record and review school operating expenses." actions={<Button size="sm" onClick={() => setShowExpenseModal(true)}>Add expense</Button>}><DataTable columns={expenseColumns} data={expenses} emptyTitle="No expense records" emptyMessage="Record the first school expense to start the ledger." /></SectionCard>}
      {activeTab === "profit-loss" && <SectionCard title="Profit and loss statement" subtitle="A live summary based on the loaded income and expense ledgers."><div className="dashboard-list dashboard-list-compact"><div className="dashboard-list-row"><span className="dashboard-list-title">Gross income revenue</span><strong>{money(totalIncome)}</strong></div><div className="dashboard-list-row"><span className="dashboard-list-title">Operating expenses</span><strong>{money(totalExpenses)}</strong></div><div className="dashboard-list-row"><span className="dashboard-list-title">Net surplus / deficit</span><strong>{money(netProfitLoss)}</strong></div></div></SectionCard>}
      {activeTab === "tax-reports" && <SectionCard title="Tax reports" subtitle="Tax report exports will use the same verified ledger data once a reporting period is selected."><EmptyState title="Select a reporting period" message="Choose a reporting period and the system will prepare a tax-ready summary from recorded transactions." /></SectionCard>}
    </>}
    <Modal open={showExpenseModal} title="Record operational expense" description="Save a school-scoped expense in the finance ledger." onClose={() => setShowExpenseModal(false)} footer={<FormActions sticky={false}><Button variant="secondary" onClick={() => setShowExpenseModal(false)}>Cancel</Button><Button type="submit" form="expense-form" loading={saving}>Save expense</Button></FormActions>}>
      <form id="expense-form" onSubmit={handleSaveExpense} className="ui-form-grid"><FormField label="Expense title" htmlFor="expense-title" required><input id="expense-title" className="ui-form-control" value={expenseForm.title} onChange={(event) => setExpenseForm({ ...expenseForm, title: event.target.value })} placeholder="e.g. Generator diesel refill" required /></FormField><FormField label="Amount (₦)" htmlFor="expense-amount" required><input id="expense-amount" type="number" min="0" step="0.01" className="ui-form-control" value={expenseForm.amount} onChange={(event) => setExpenseForm({ ...expenseForm, amount: event.target.value })} required /></FormField><FormField label="Category" htmlFor="expense-category" required><select id="expense-category" className="ui-form-control" value={expenseForm.category} onChange={(event) => setExpenseForm({ ...expenseForm, category: event.target.value })}><option>Utilities</option><option>Salaries</option><option>Maintenance</option><option>Supplies</option><option>Miscellaneous</option></select></FormField><FormField label="Date" htmlFor="expense-date" required><input id="expense-date" type="date" className="ui-form-control" value={expenseForm.expense_date} onChange={(event) => setExpenseForm({ ...expenseForm, expense_date: event.target.value })} required /></FormField><div className="ui-form-full"><FormField label="Description" htmlFor="expense-description"><textarea id="expense-description" className="ui-form-control" value={expenseForm.description} onChange={(event) => setExpenseForm({ ...expenseForm, description: event.target.value })} rows="3" /></FormField></div></form>
    </Modal>
  </PageContainer>;
}
