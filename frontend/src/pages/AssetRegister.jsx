import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import PageHeader from "../components/layout/PageHeader";
import DataTable from "../components/tables/DataTable";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";

const CATEGORIES = [
  "IT Equipment",
  "Furniture",
  "Classroom Equipment",
  "Laboratory",
  "Sports",
  "Security",
  "Office",
  "Other",
];

const CONDITIONS = ["New", "Good", "Fair", "Poor"];
const STATUSES = ["Active", "In Repair", "Lost", "Disposed"];

const initialForm = {
  name: "",
  category: "IT Equipment",
  quantity: "1",
  unit_of_measure: "Item",
  location: "",
  custodian_staff_id: "",
  acquisition_date: "",
  acquisition_cost: "",
  warranty_expires_at: "",
  condition: "Good",
  status: "Active",
  notes: "",
};

export default function AssetRegister() {
  const [assets, setAssets] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [custodianSearch, setCustodianSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingAsset, setEditingAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadAssets = async () => {
    const response = await api.get("/assets", { params: { per_page: 50 } });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;

    if (!data) {
      throw new Error("The asset register response is not a valid collection.");
    }

    setAssets(data);
  };

  const loadStaffOptions = async (search = "") => {
    const response = await api.get("/assets/options", { params: search ? { search } : undefined });
    const data = Array.isArray(response?.data?.data) ? response.data.data : null;

    if (!data) {
      throw new Error("The asset custodian response is not a valid collection.");
    }

    setStaffOptions(data);
  };

  const loadPage = async () => {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadAssets(), loadStaffOptions()]);
    } catch (requestError) {
      setAssets([]);
      setStaffOptions([]);
      setError(requestError.message || "Unable to load the asset register.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, []);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const searchCustodians = async () => {
    try {
      setError("");
      await loadStaffOptions(custodianSearch.trim());
    } catch (requestError) {
      setStaffOptions([]);
      setError(requestError.message || "Unable to search staff custodians.");
    }
  };

  const editAsset = (asset) => {
    setEditingAsset(asset);
    setForm({
      name: asset.name || "",
      category: asset.category || "IT Equipment",
      quantity: String(asset.quantity || 1),
      unit_of_measure: asset.unit_of_measure || "Item",
      location: asset.location || "",
      custodian_staff_id: asset.custodian_staff_id ? String(asset.custodian_staff_id) : "",
      acquisition_date: asset.acquisition_date || "",
      acquisition_cost: asset.acquisition_cost ?? "",
      warranty_expires_at: asset.warranty_expires_at || "",
      condition: asset.condition || "Good",
      status: asset.status || "Active",
      notes: asset.notes || "",
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingAsset(null);
    setForm(initialForm);
  };

  const submitAsset = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setMessage("");

      const payload = {
        ...form,
        quantity: Number(form.quantity),
        custodian_staff_id: form.custodian_staff_id ? Number(form.custodian_staff_id) : null,
        acquisition_date: form.acquisition_date || null,
        acquisition_cost: form.acquisition_cost === "" ? null : Number(form.acquisition_cost),
        warranty_expires_at: form.warranty_expires_at || null,
        notes: form.notes || null,
      };

      if (editingAsset) {
        await api.put(`/assets/${editingAsset.id}`, payload);
        setMessage(`Asset ${editingAsset.asset_number} updated successfully.`);
      } else {
        const { status, ...createPayload } = payload;
        await api.post("/assets", createPayload);
        setMessage("Asset registered successfully.");
      }

      resetForm();
      await loadAssets();
    } catch (requestError) {
      setError(requestError.message || "Unable to save the asset.");
    } finally {
      setSubmitting(false);
    }
  };

  const summary = useMemo(() => assets.reduce((totals, asset) => {
    totals[asset.status] = (totals[asset.status] || 0) + Number(asset.quantity || 0);
    return totals;
  }, { Active: 0, "In Repair": 0, Lost: 0, Disposed: 0 }), [assets]);

  const columns = [
    { key: "asset_number", label: "Asset no." },
    { key: "name", label: "Asset" },
    { key: "category", label: "Category" },
    {
      key: "quantity",
      label: "Quantity",
      render: (row) => `${row.quantity} ${row.unit_of_measure || "Item"}`,
    },
    { key: "location", label: "Location" },
    {
      key: "custodian",
      label: "Custodian",
      render: (row) => row.custodian?.full_name || "Unassigned",
    },
    { key: "condition", label: "Condition" },
    { key: "status", label: "Status" },
    {
      key: "actions",
      label: "Actions",
      render: (row) => <button type="button" onClick={() => editAsset(row)}>Edit</button>,
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="Asset Register"
        subtitle="Register, assign, and track operational school assets. Vehicles and library books remain in their dedicated modules."
      />

      <form onSubmit={submitAsset} className="asset-register-form">
        <h2>{editingAsset ? `Edit ${editingAsset.asset_number}` : "Register asset"}</h2>
        <label>
          Asset name
          <input value={form.name} onChange={(event) => setField("name", event.target.value)} maxLength={255} required />
        </label>
        <label>
          Category
          <select value={form.category} onChange={(event) => setField("category", event.target.value)}>
            {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Quantity
          <input type="number" min="1" max="1000000" value={form.quantity} onChange={(event) => setField("quantity", event.target.value)} required />
        </label>
        <label>
          Unit of measure
          <input value={form.unit_of_measure} onChange={(event) => setField("unit_of_measure", event.target.value)} maxLength={50} />
        </label>
        <label>
          Location
          <input value={form.location} onChange={(event) => setField("location", event.target.value)} maxLength={255} required />
        </label>
        <label>
          Search staff custodians
          <input value={custodianSearch} onChange={(event) => setCustodianSearch(event.target.value)} maxLength={100} placeholder="Name or staff number" />
          <button type="button" onClick={searchCustodians}>Search custodians</button>
        </label>
        <label>
          Custodian (optional)
          <select value={form.custodian_staff_id} onChange={(event) => setField("custodian_staff_id", event.target.value)}>
            <option value="">Unassigned</option>
            {Array.isArray(staffOptions) && staffOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.label}</option>
            ))}
          </select>
        </label>
        <label>
          Acquisition date (optional)
          <input type="date" value={form.acquisition_date} onChange={(event) => setField("acquisition_date", event.target.value)} />
        </label>
        <label>
          Acquisition cost (optional)
          <input type="number" min="0" step="0.01" value={form.acquisition_cost} onChange={(event) => setField("acquisition_cost", event.target.value)} />
        </label>
        <label>
          Warranty expiry (optional)
          <input type="date" value={form.warranty_expires_at} onChange={(event) => setField("warranty_expires_at", event.target.value)} />
        </label>
        <label>
          Condition
          <select value={form.condition} onChange={(event) => setField("condition", event.target.value)}>
            {CONDITIONS.map((condition) => <option key={condition} value={condition}>{condition}</option>)}
          </select>
        </label>
        {editingAsset ? (
          <label>
            Lifecycle status
            <select value={form.status} onChange={(event) => setField("status", event.target.value)}>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
        ) : (
          <p>New assets are registered with an <strong>Active</strong> lifecycle status.</p>
        )}
        <label>
          Notes (optional)
          <textarea value={form.notes} onChange={(event) => setField("notes", event.target.value)} maxLength={4000} />
        </label>
        <div className="asset-register-actions">
          <button type="submit" disabled={submitting}>{submitting ? "Saving..." : editingAsset ? "Save asset changes" : "Register asset"}</button>
          {editingAsset && <button type="button" onClick={resetForm}>Cancel edit</button>}
        </div>
      </form>

      {message && <div role="status" className="success-message">{message}</div>}
      {error && <div role="alert" className="error-message">{error}</div>}

      <div className="asset-register-summary">
        {Object.entries(summary).map(([status, count]) => (
          <div key={status} className="asset-register-summary-card">
            <span>{status}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading asset register..." />
      ) : assets.length === 0 ? (
        <EmptyState title="No assets registered" message="Register school operational assets to begin tracking their condition and lifecycle status." />
      ) : (
        <DataTable columns={columns} data={Array.isArray(assets) ? assets : []} emptyMessage="No assets registered." />
      )}
    </div>
  );
}
