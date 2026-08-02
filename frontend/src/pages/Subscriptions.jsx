/* ============================================================
   DONO SCHOOL ERP
   SUBSCRIPTIONS MODULE
   Developer: DONO De Creator

   This page controls:

   ✔ Subscription Plans
   ✔ School Subscriptions
   ✔ Promo Campaigns
   ✔ Coupons
   ✔ Free Schools
   ✔ Pricing
   ✔ Plan Assignment
============================================================ */

import { useEffect, useState } from "react";
import api from "../services/api";
import CreateSchoolModal from '../components/CreateSchoolModal';

/* ============================================================
   EMPTY OBJECTS
============================================================ */

const emptyPlan = {
  id: null,
  name: "",
  slug: "",
  description: "",
  monthly_price: "",
  quarterly_price: "",
  half_yearly_price: "",
  yearly_price: "",
  currency: "USD",
  max_students: "",
  max_staff: "",
  max_branches: 1,
  trial_days: 30,
  is_active: true,
};

const emptyPromo = {
  id: null,
  name: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  start_date: "",
  end_date: "",
  is_active: true,
};

const emptyCoupon = {
  id: null,
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  max_usage: 1,
  used_count: 0,
  start_date: "",
  end_date: "",
  is_active: true,
};

export default function Subscriptions() {

/* ============================================================
   PAGE STATES
============================================================ */

const [loading, setLoading] = useState(false);
const [isModalOpen, setIsModalOpen] = useState(false);
const [message, setMessage] = useState("");
const [error, setError] = useState("");
const [activeTab, setActiveTab] = useState("plans");

/* ============================================================
   DATA
============================================================ */

const [plans, setPlans] = useState([]);
const [subscriptions, setSubscriptions] = useState([]);
const [promoCampaigns, setPromoCampaigns] = useState([]);
const [coupons, setCoupons] = useState([]);
const [schools, setSchools] = useState([]);
const [freeSchools, setFreeSchools] = useState([]);

/* ============================================================
   FORMS
============================================================ */

const [planForm, setPlanForm] = useState(emptyPlan);
const [promoForm, setPromoForm] = useState(emptyPromo);
const [couponForm, setCouponForm] = useState(emptyCoupon);
const [freeSchoolForm, setFreeSchoolForm] = useState({
    school_id: "",
    plan_id: "",
    access_type: "temporary",
    expiry_date: "",
    reason: ""
});

/* ============================================================
   SEARCH
============================================================ */

const [search, setSearch] = useState("");

/* ============================================================
   PAGE LOAD
============================================================ */

useEffect(() => {
  loadEverything();
}, []);

/* ============================================================
   LOAD EVERYTHING
============================================================ */

async function loadEverything() {
  setLoading(true);
  setError("");
  try {
    await Promise.all([
      loadPlans(),
      loadSubscriptions(),
      loadPromoCampaigns(),
      loadCoupons(),
      loadFreeSchools(),
    ]);
  } catch (error) {
    console.log(error);
    setError("Failed to load subscription data.");
  } finally {
    setLoading(false);
  }
}

/* ============================================================
   LOAD SUBSCRIPTION PLANS
============================================================ */

async function loadPlans() {
  const response = await api.get("/subscription-plans");
  const rows = response.data.data ?? response.data ?? [];
  setPlans(rows);
}

/* ============================================================
   LOAD SCHOOL SUBSCRIPTIONS
============================================================ */

async function loadSubscriptions() {
  try {
    const response = await api.get("/school-subscriptions");
    const rows = response.data.data ?? response.data ?? [];
    setSubscriptions(rows);
  } catch (error) {
    console.log(error);
  }
}

/* ============================================================
   LOAD PROMO CAMPAIGNS
============================================================ */

async function loadPromoCampaigns() {
  try {
    const response = await api.get("/promo-campaigns");
    const rows = response.data.data ?? response.data ?? [];
    setPromoCampaigns(rows);
  } catch (error) {
    console.log(error);
    setPromoCampaigns([]);
  }
}

/* ============================================================
   LOAD COUPONS
============================================================ */

async function loadCoupons() {
  try {
    const response = await api.get("/coupons");
    const rows = response.data.data ?? response.data ?? [];
    setCoupons(rows);
  } catch (error) {
    console.log(error);
    setCoupons([]);
  }
}

/* ============================================================
   LOAD FREE SCHOOLS
============================================================ */

async function loadFreeSchools() {
  setFreeSchools([]);
}

/* ============================================================
   CREATE / UPDATE SUBSCRIPTION PLAN
============================================================ */

async function savePlan() {
  try {
    setLoading(true);
    setError("");
    setMessage("");
    if (planForm.id) {
      await api.put(`/subscription-plans/${planForm.id}`, planForm);
      setMessage("Subscription plan updated successfully.");
    } else {
      await api.post("/subscription-plans", planForm);
      setMessage("Subscription plan created successfully.");
    }
    setPlanForm(emptyPlan);
    await loadPlans();
  } catch (error) {
    console.log(error);
    setError("Unable to save subscription plan.");
  } finally {
    setLoading(false);
  }
}

/* ============================================================
   EDIT SUBSCRIPTION PLAN
============================================================ */

function editPlan(plan) {
  setPlanForm({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    description: plan.description,
    monthly_price: plan.monthly_price,
    quarterly_price: plan.quarterly_price,
    half_yearly_price: plan.half_yearly_price,
    yearly_price: plan.yearly_price,
    currency: plan.currency,
    max_students: plan.max_students,
    max_staff: plan.max_staff,
    max_branches: plan.max_branches,
    trial_days: plan.trial_days,
    is_active: plan.is_active,
  });
}

/* ============================================================
   DELETE SUBSCRIPTION PLAN
============================================================ */

async function deletePlan(id) {
  if (!window.confirm("Delete this subscription plan?")) {
    return;
  }
  try {
    await api.delete(`/subscription-plans/${id}`);
    setMessage("Subscription plan deleted.");
    await loadPlans();
  } catch (error) {
    console.log(error);
    setError("Unable to delete subscription plan.");
  }
}

/* ============================================================
   PROMO CAMPAIGN FUNCTIONS
============================================================ */

async function savePromo() {
  try {
    setLoading(true);
    setError("");
    setMessage("");
    if (promoForm.id) {
      await api.put(`/promo-campaigns/${promoForm.id}`, promoForm);
      setMessage("Promo campaign updated successfully.");
    } else {
      await api.post("/promo-campaigns", promoForm);
      setMessage("Promo campaign created successfully.");
    }
    setPromoForm(emptyPromo);
    await loadPromoCampaigns();
  } catch (error) {
    console.log(error);
    setError("Unable to save promo campaign.");
  } finally {
    setLoading(false);
  }
}

function editPromo(promo) {
  setPromoForm({
    id: promo.id,
    name: promo.name,
    description: promo.description,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    start_date: promo.start_date,
    end_date: promo.end_date,
    is_active: promo.is_active,
  });
}

async function deletePromo(id) {
  if (!window.confirm("Delete this promo campaign?")) {
    return;
  }
  try {
    await api.delete(`/promo-campaigns/${id}`);
    setMessage("Promo campaign deleted.");
    await loadPromoCampaigns();
  } catch (error) {
    console.log(error);
    setError("Unable to delete promo campaign.");
  }
}

/* ============================================================
   COUPON FUNCTIONS
============================================================ */

async function saveCoupon() {
  try {
    setLoading(true);
    setError("");
    setMessage("");
    if (couponForm.id) {
      await api.put(`/coupons/${couponForm.id}`, couponForm);
      setMessage("Coupon updated successfully.");
    } else {
      await api.post("/coupons", couponForm);
      setMessage("Coupon created successfully.");
    }
    setCouponForm(emptyCoupon);
    await loadCoupons();
  } catch (error) {
    console.log(error);
    setError("Unable to save coupon.");
  } finally {
    setLoading(false);
  }
}

function editCoupon(coupon) {
  setCouponForm({
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    max_usage: coupon.max_usage,
    used_count: coupon.used_count,
    start_date: coupon.start_date,
    end_date: coupon.end_date,
    is_active: coupon.is_active,
  });
}

async function deleteCoupon(id) {
  if (!window.confirm("Delete this coupon?")) {
    return;
  }
  try {
    await api.delete(`/coupons/${id}`);
    setMessage("Coupon deleted successfully.");
    await loadCoupons();
  } catch (error) {
    console.log(error);
    setError("Unable to delete coupon.");
  }
}

/* ============================================================
   FREE SCHOOL FUNCTIONS
============================================================ */

function grantFreeAccess(school) {
  console.log("Grant free access", school);
}

function revokeFreeAccess(school) {
  console.log("Revoke free access", school);
}

/* ============================================================
   USER INTERFACE
============================================================ */

return (
  <div className="container-fluid py-4">
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2 className="fw-bold">Subscription Management</h2>
        
        {/* 🔘 Register New School Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow my-2"
        >
          + Register New School
        </button>

        <p className="text-muted mb-0">
          Manage plans, subscriptions, promotions, coupons and free schools.
        </p>
      </div>

      <button className="btn btn-primary" onClick={loadEverything}>
        Refresh
      </button>
    </div>

    {message && <div className="alert alert-success">{message}</div>}
    {error && <div className="alert alert-danger">{error}</div>}

    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <input
              type="text"
              className="form-control"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>

    <ul className="nav nav-tabs mb-4">
      <li className="nav-item">
        <button
          className={`nav-link ${activeTab === "plans" ? "active" : ""}`}
          onClick={() => setActiveTab("plans")}
        >
          Plans
        </button>
      </li>
      <li className="nav-item">
        <button
          className={`nav-link ${activeTab === "subscriptions" ? "active" : ""}`}
          onClick={() => setActiveTab("subscriptions")}
        >
          School Subscriptions
        </button>
      </li>
      <li className="nav-item">
        <button
          className={`nav-link ${activeTab === "promo" ? "active" : ""}`}
          onClick={() => setActiveTab("promo")}
        >
          Promo Campaigns
        </button>
      </li>
      <li className="nav-item">
        <button
          className={`nav-link ${activeTab === "coupon" ? "active" : ""}`}
          onClick={() => setActiveTab("coupon")}
        >
          Coupons
        </button>
      </li>
      <li className="nav-item">
        <button
          className={`nav-link ${activeTab === "free" ? "active" : ""}`}
          onClick={() => setActiveTab("free")}
        >
          Free Schools
        </button>
      </li>
    </ul>

    {activeTab === "plans" && (
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">
                {planForm.id ? "Edit Plan" : "Create Plan"}
              </h5>
            </div>
            <div className="card-body">
              <input
                className="form-control mb-2"
                placeholder="Plan name"
                value={planForm.name}
                onChange={(e) =>
                  setPlanForm({ ...planForm, name: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Slug (example: basic)"
                value={planForm.slug}
                onChange={(e) =>
                  setPlanForm({ ...planForm, slug: e.target.value })
                }
              />
              <textarea
                className="form-control mb-2"
                placeholder="Description"
                value={planForm.description}
                onChange={(e) =>
                  setPlanForm({ ...planForm, description: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Monthly price"
                type="number"
                value={planForm.monthly_price}
                onChange={(e) =>
                  setPlanForm({ ...planForm, monthly_price: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Quarterly price"
                type="number"
                value={planForm.quarterly_price}
                onChange={(e) =>
                  setPlanForm({ ...planForm, quarterly_price: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Half yearly price"
                type="number"
                value={planForm.half_yearly_price}
                onChange={(e) =>
                  setPlanForm({ ...planForm, half_yearly_price: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Yearly price"
                type="number"
                value={planForm.yearly_price}
                onChange={(e) =>
                  setPlanForm({ ...planForm, yearly_price: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Maximum students"
                type="number"
                value={planForm.max_students}
                onChange={(e) =>
                  setPlanForm({ ...planForm, max_students: e.target.value })
                }
              />
              <input
                className="form-control mb-2"
                placeholder="Maximum staff"
                type="number"
                value={planForm.max_staff}
                onChange={(e) =>
                  setPlanForm({ ...planForm, max_staff: e.target.value })
                }
              />
              <button className="btn btn-success w-100" onClick={savePlan}>
                {planForm.id ? "Update Plan" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Subscription Plans</h5>
              <span className="badge bg-primary">{plans.length} Plans</span>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Monthly</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th width="170">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans
                    .filter((plan) =>
                      plan.name?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((plan) => (
                      <tr key={plan.id}>
                        <td>
                          <strong>{plan.name}</strong>
                          <br />
                          <small className="text-muted">{plan.slug}</small>
                        </td>
                        <td>
                          {plan.currency} {plan.monthly_price}
                        </td>
                        <td>{plan.max_students}</td>
                        <td>
                          {plan.is_active ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-danger">Disabled</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => editPlan(plan)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deletePlan(plan.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

    {activeTab === "subscriptions" && (
      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">School Subscriptions</h5>
          <button className="btn btn-primary btn-sm" onClick={loadSubscriptions}>
            Refresh
          </button>
        </div>
        <div className="table-responsive">
          <table className="table table-striped align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>School</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Billing</th>
                <th>Expiry</th>
                <th>Amount</th>
                <th>Current</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-5">
                    No school subscriptions found.
                  </td>
                </tr>
              ) : (
                subscriptions.map((subscription) => (
                  <tr key={subscription.id}>
                    <td>{subscription.school?.name}</td>
                    <td>{subscription.subscription_plan?.name}</td>
                    <td>
                      <span
                        className={`badge ${
                          subscription.status === "active"
                            ? "bg-success"
                            : subscription.status === "trial"
                            ? "bg-warning text-dark"
                            : subscription.status === "expired"
                            ? "bg-danger"
                            : "bg-secondary"
                        }`}
                      >
                        {subscription.status}
                      </span>
                    </td>
                    <td>{subscription.billing_cycle}</td>
                    <td>{subscription.expiry_date}</td>
                    <td>
                      {subscription.currency} {subscription.amount_paid}
                    </td>
                    <td>
                      {subscription.is_current ? (
                        <span className="badge bg-success">YES</span>
                      ) : (
                        <span className="badge bg-secondary">NO</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}

    {activeTab === "promo" && (
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">
                {promoForm.id ? "Edit Promo" : "Create Promo"}
              </h5>
            </div>
            <div className="card-body">
              <input
                className="form-control mb-2"
                placeholder="Promo Name"
                value={promoForm.name}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, name: e.target.value })
                }
              />
              <textarea
                className="form-control mb-2"
                placeholder="Description"
                value={promoForm.description}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, description: e.target.value })
                }
              />
              <select
                className="form-select mb-2"
                value={promoForm.discount_type}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, discount_type: e.target.value })
                }
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                className="form-control mb-2"
                type="number"
                placeholder="Discount Value"
                value={promoForm.discount_value}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, discount_value: e.target.value })
                }
              />
              <label className="mb-1">Start Date</label>
              <input
                className="form-control mb-2"
                type="date"
                value={promoForm.start_date}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, start_date: e.target.value })
                }
              />
              <label className="mb-1">End Date</label>
              <input
                className="form-control mb-3"
                type="date"
                value={promoForm.end_date}
                onChange={(e) =>
                  setPromoForm({ ...promoForm, end_date: e.target.value })
                }
              />
              <button className="btn btn-success w-100" onClick={savePromo}>
                {promoForm.id ? "Update Promo" : "Create Promo"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Promo Campaigns</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Discount</th>
                    <th>Period</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promoCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No promo campaigns available.
                      </td>
                    </tr>
                  ) : (
                    promoCampaigns.map((promo) => (
                      <tr key={promo.id}>
                        <td>{promo.name}</td>
                        <td>{promo.discount_type}</td>
                        <td>{promo.discount_value}</td>
                        <td>
                          {promo.start_date}
                          <br />
                          {promo.end_date}
                        </td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => editPromo(promo)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deletePromo(promo.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

    {activeTab === "coupon" && (
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">
                {couponForm.id ? "Edit Coupon" : "Create Coupon"}
              </h5>
            </div>
            <div className="card-body">
              <input
                className="form-control mb-2"
                placeholder="Coupon Code"
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    code: e.target.value.toUpperCase(),
                  })
                }
              />
              <textarea
                className="form-control mb-2"
                placeholder="Description"
                value={couponForm.description}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    description: e.target.value,
                  })
                }
              />
              <select
                className="form-select mb-2"
                value={couponForm.discount_type}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discount_type: e.target.value,
                  })
                }
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
              <input
                className="form-control mb-2"
                type="number"
                placeholder="Discount Value"
                value={couponForm.discount_value}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    discount_value: e.target.value,
                  })
                }
              />
              <input
                className="form-control mb-2"
                type="number"
                placeholder="Maximum Usage"
                value={couponForm.max_usage}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    max_usage: e.target.value,
                  })
                }
              />
              <label className="mb-1">Start Date</label>
              <input
                className="form-control mb-2"
                type="date"
                value={couponForm.start_date}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    start_date: e.target.value,
                  })
                }
              />
              <label className="mb-1">End Date</label>
              <input
                className="form-control mb-3"
                type="date"
                value={couponForm.end_date}
                onChange={(e) =>
                  setCouponForm({
                    ...couponForm,
                    end_date: e.target.value,
                  })
                }
              />
              <button className="btn btn-success w-100" onClick={saveCoupon}>
                {couponForm.id ? "Update Coupon" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Coupons</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Usage</th>
                    <th>Validity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No coupons available.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr key={coupon.id}>
                        <td>
                          <strong>{coupon.code}</strong>
                        </td>
                        <td>
                          {coupon.discount_value}{" "}
                          {coupon.discount_type === "percentage"
                            ? "%"
                            : coupon.currency}
                        </td>
                        <td>
                          {coupon.used_count}/{coupon.max_usage}
                        </td>
                        <td>
                          {coupon.start_date}
                          <br />
                          {coupon.end_date}
                        </td>
                        <td>
                          <button
                            className="btn btn-warning btn-sm me-2"
                            onClick={() => editCoupon(coupon)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteCoupon(coupon.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

    {activeTab === "free" && (
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Grant Free Access</h5>
            </div>
            <div className="card-body">
              <select
                className="form-select mb-3"
                value={freeSchoolForm.school_id}
                onChange={(e) =>
                  setFreeSchoolForm({
                    ...freeSchoolForm,
                    school_id: e.target.value,
                  })
                }
              >
                <option value="">Select School</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>

              <select
                className="form-select mb-3"
                value={freeSchoolForm.plan_id}
                onChange={(e) =>
                  setFreeSchoolForm({
                    ...freeSchoolForm,
                    plan_id: e.target.value,
                  })
                }
              >
                <option value="">Select Plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>

              <label className="mb-1">Access Type</label>
              <select
                className="form-select mb-3"
                value={freeSchoolForm.access_type}
                onChange={(e) =>
                  setFreeSchoolForm({
                    ...freeSchoolForm,
                    access_type: e.target.value,
                  })
                }
              >
                <option value="temporary">Temporary</option>
                <option value="lifetime">Lifetime</option>
              </select>

              <label className="mb-1">Expiry Date</label>
              <input
                className="form-control mb-3"
                type="date"
                value={freeSchoolForm.expiry_date}
                onChange={(e) =>
                  setFreeSchoolForm({
                    ...freeSchoolForm,
                    expiry_date: e.target.value,
                  })
                }
              />

              <textarea
                className="form-control mb-3"
                rows="3"
                placeholder="Reason for granting free access"
                value={freeSchoolForm.reason}
                onChange={(e) =>
                  setFreeSchoolForm({
                    ...freeSchoolForm,
                    reason: e.target.value,
                  })
                }
              />

              <button className="btn btn-success w-100" onClick={grantFreeAccess}>
                Grant Free Access
              </button>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-header">
              <h5 className="mb-0">Schools With Special Access</h5>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Plan</th>
                    <th>Access</th>
                    <th>Expires</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {freeSchools.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        No schools currently enjoying free access.
                      </td>
                    </tr>
                  ) : (
                    freeSchools.map((item) => (
                      <tr key={item.id}>
                        <td>{item.school_name}</td>
                        <td>{item.plan_name}</td>
                        <td>
                          {item.access_type === "lifetime" ? (
                            <span className="badge bg-success">Lifetime</span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              Temporary
                            </span>
                          )}
                        </td>
                        <td>{item.expiry_date ?? "Never"}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => revokeFreeAccess(item.id)}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 🪟 Register School Modal Popup */}
    {isModalOpen && (
      <CreateSchoolModal
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          console.log('School created successfully!');
          loadEverything();
        }}
      />
    )}
  </div>
);
}
