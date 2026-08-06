import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const emptyPlatformSettings = {
  platform_name: "",
  platform_email: "",
  platform_phone: "",
  platform_logo: "",
  trial_days: 240,
  default_subscription_plan_id: "",
  default_currency_id: "",
  allow_school_registration: true,
  maintenance_mode: false,
  paystack_enabled: true,
  stripe_enabled: true,
  email_notifications: true,
  sms_notifications: false,
};

const emptySchoolSettings = {
  school_name: "",
  school_email: "",
  school_phone: "",
  school_address: "",
  school_logo: "",
  bank_name: "",
  account_number: "",
  account_name: "",
  paystack_public_key: "",
  paystack_secret_key: "",
  paystack_subaccount_code: "",
  motto: "",
};

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const userRole =
    user?.role ||
    user?.roles?.[0]?.slug ||
    user?.roles?.[0]?.name ||
    "guest";

  const isSuperAdmin = userRole === "super_admin";
  const isSchoolAdmin = userRole === "school_admin" || userRole === "admin" || userRole === "proprietor";

  // State containers
  const [platformSettings, setPlatformSettings] = useState(emptyPlatformSettings);
  const [schoolSettings, setSchoolSettings] = useState(emptySchoolSettings);
  const [plans, setPlans] = useState([]);
  const [currencies, setCurrencies] = useState([]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadPlatformData();
    } else if (isSchoolAdmin) {
      loadSchoolData();
    }
  }, [isSuperAdmin, isSchoolAdmin]);

  /* ============================================================
     SUPER ADMIN LOADER (Global Platform Settings)
  ============================================================ */
  async function loadPlatformData() {
    setLoading(true);
    setError("");
    try {
      const [settingsRes, plansRes, currenciesRes] = await Promise.allSettled([
        api.get("/system-settings"),
        api.get("/subscription-plans"),
        api.get("/currencies"),
      ]);

      if (settingsRes.status === "fulfilled") {
        const data = settingsRes.value?.data?.data ?? settingsRes.value?.data ?? {};
        setPlatformSettings({
          ...emptyPlatformSettings,
          ...data,
          default_subscription_plan_id:
            data?.default_subscription_plan?.id ?? data?.default_subscription_plan_id ?? "",
          default_currency_id:
            data?.default_currency?.id ?? data?.default_currency_id ?? "",
        });
      }

      if (plansRes.status === "fulfilled") {
        const data = plansRes.value?.data?.data ?? plansRes.value?.data ?? [];
        setPlans(Array.isArray(data) ? data : []);
      }

      if (currenciesRes.status === "fulfilled") {
        const data = currenciesRes.value?.data?.data ?? currenciesRes.value?.data ?? [];
        setCurrencies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError("Failed to load platform settings.");
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     SCHOOL ADMIN LOADER (School Level Settings Only)
  ============================================================ */
  async function loadSchoolData() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/school/settings");
      const data = res?.data?.data ?? res?.data ?? {};
      setSchoolSettings({ ...emptySchoolSettings, ...data });
    } catch (err) {
      console.error("School settings load error:", err);
    } finally {
      setLoading(false);
    }
  }

  /* ============================================================
     SAVE HANDLERS
  ============================================================ */
  async function savePlatformSettings() {
    try {
      setLoading(true);
      setMessage("");
      setError("");
      await api.put("/system-settings", platformSettings);
      setMessage("Platform settings updated successfully.");
    } catch (err) {
      setError(err?.message || "Unable to save platform settings.");
    } finally {
      setLoading(false);
    }
  }

  async function saveSchoolSettings() {
    try {
      setLoading(true);
      setMessage("");
      setError("");
      await api.put("/school/settings", schoolSettings);
      setMessage("School details and payment credentials updated successfully.");
    } catch (err) {
      setError(err?.message || "Unable to save school settings.");
    } finally {
      setLoading(false);
    }
  }

  // --- Strict UI Isolation Guard ---
  if (!isSuperAdmin && !isSchoolAdmin) {
    return null;
  }

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* ============================================================
          VIEW 1: SOFTWARE OWNER / SUPER ADMIN (Platform Control)
      ============================================================ */}
      {isSuperAdmin && (
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center bg-white py-3">
            <div>
              <h4 className="mb-0" style={{ fontSize: "20px", color: "#1e3a8a", fontWeight: "700" }}>
                Global SaaS Platform Settings
              </h4>
              <small className="text-muted">Software Owner Master Control Panel</small>
            </div>
            <button
              className="btn btn-primary"
              onClick={savePlatformSettings}
              disabled={loading}
              style={{ background: "#2563eb", border: "none" }}
            >
              {loading ? "Saving..." : "Save Platform Settings"}
            </button>
          </div>

          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label font-weight-bold">Platform Name</label>
                <input
                  className="form-control"
                  value={platformSettings.platform_name}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, platform_name: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">Platform Support Email</label>
                <input
                  className="form-control"
                  value={platformSettings.platform_email}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, platform_email: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">Platform Phone</label>
                <input
                  className="form-control"
                  value={platformSettings.platform_phone}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, platform_phone: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">Platform Logo URL</label>
                <input
                  className="form-control"
                  value={platformSettings.platform_logo}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, platform_logo: e.target.value })
                  }
                />
              </div>

              <div className="col-md-4">
                <label className="form-label font-weight-bold">Trial Days</label>
                <input
                  type="number"
                  className="form-control"
                  value={platformSettings.trial_days}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, trial_days: e.target.value })
                  }
                />
              </div>

              <div className="col-md-4">
                <label className="form-label font-weight-bold">Default Subscription Plan</label>
                <select
                  className="form-select"
                  value={platformSettings.default_subscription_plan_id}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      default_subscription_plan_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select Default Plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label font-weight-bold">System Currency</label>
                <select
                  className="form-select"
                  value={platformSettings.default_currency_id}
                  onChange={(e) =>
                    setPlatformSettings({
                      ...platformSettings,
                      default_currency_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select Currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.id}>
                      {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
              </div>

              <hr className="my-4" />

              <div className="col-12">
                <h5 style={{ color: "#1e3a8a", fontWeight: "600" }}>System & Gateways</h5>
              </div>

              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platformSettings.allow_school_registration}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        allow_school_registration: e.target.checked,
                      })
                    }
                  />
                  <label className="form-check-label">Allow Self Registration for Schools</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platformSettings.maintenance_mode}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        maintenance_mode: e.target.checked,
                      })
                    }
                  />
                  <label className="form-check-label">Enable System Maintenance Mode</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platformSettings.paystack_enabled}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        paystack_enabled: e.target.checked,
                      })
                    }
                  />
                  <label className="form-check-label">Enable Paystack Integration</label>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={platformSettings.stripe_enabled}
                    onChange={(e) =>
                      setPlatformSettings({
                        ...platformSettings,
                        stripe_enabled: e.target.checked,
                      })
                    }
                  />
                  <label className="form-check-label">Enable Stripe Integration</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 2: SCHOOL ADMIN / PROPRIETOR (School Profile & Payment Settings)
      ============================================================ */}
      {isSchoolAdmin && !isSuperAdmin && (
        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center bg-white py-3">
            <div>
              <h4 className="mb-0" style={{ fontSize: "20px", color: "#1e3a8a", fontWeight: "700" }}>
                School Profile & Payment Configuration
              </h4>
              <small className="text-muted">Manage your school information and direct fee collection credentials</small>
            </div>
            <button
              className="btn btn-primary"
              onClick={saveSchoolSettings}
              disabled={loading}
              style={{ background: "#2563eb", border: "none" }}
            >
              {loading ? "Saving..." : "Save School Settings"}
            </button>
          </div>

          <div className="card-body">
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label font-weight-bold">School Name</label>
                <input
                  className="form-control"
                  value={schoolSettings.school_name}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, school_name: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">Official School Email</label>
                <input
                  className="form-control"
                  value={schoolSettings.school_email}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, school_email: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">Phone Number</label>
                <input
                  className="form-control"
                  value={schoolSettings.school_phone}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, school_phone: e.target.value })
                  }
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">School Logo URL</label>
                <input
                  className="form-control"
                  value={schoolSettings.school_logo}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, school_logo: e.target.value })
                  }
                />
              </div>

              <div className="col-md-12">
                <label className="form-label font-weight-bold">Physical Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={schoolSettings.school_address}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, school_address: e.target.value })
                  }
                />
              </div>

              <hr className="my-4" />

              <div className="col-12">
                <h5 style={{ color: "#1e3a8a", fontWeight: "600" }}>Direct Fee Collection & Bank Accounts</h5>
                <p className="text-muted small">Enter your school's bank payout details and Paystack keys so student online fee payments go straight to your school account.</p>
              </div>

              <div className="col-md-4">
                <label className="form-label font-weight-bold">Bank Name</label>
                <input
                  className="form-control"
                  value={schoolSettings.bank_name}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, bank_name: e.target.value })
                  }
                  placeholder="e.g. First Bank / Guarantee Trust Bank"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label font-weight-bold">Account Number</label>
                <input
                  className="form-control"
                  value={schoolSettings.account_number}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, account_number: e.target.value })
                  }
                  placeholder="0123456789"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label font-weight-bold">Account Name</label>
                <input
                  className="form-control"
                  value={schoolSettings.account_name}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, account_name: e.target.value })
                  }
                  placeholder="School Official Account Name"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">Paystack Public Key</label>
                <input
                  className="form-control font-monospace"
                  value={schoolSettings.paystack_public_key}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, paystack_public_key: e.target.value })
                  }
                  placeholder="pk_live_xxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label font-weight-bold">Paystack Secret Key</label>
                <input
                  type="password"
                  className="form-control font-monospace"
                  value={schoolSettings.paystack_secret_key}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, paystack_secret_key: e.target.value })
                  }
                  placeholder="sk_live_xxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              <div className="col-md-12">
                <label className="form-label font-weight-bold">Paystack Subaccount Code (Optional)</label>
                <input
                  className="form-control font-monospace"
                  value={schoolSettings.paystack_subaccount_code}
                  onChange={(e) =>
                    setSchoolSettings({ ...schoolSettings, paystack_subaccount_code: e.target.value })
                  }
                  placeholder="ACCT_xxxxxxxxxx"
                />
                <small className="text-muted">Use this if you prefer split settlements from a single master merchant account.</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

