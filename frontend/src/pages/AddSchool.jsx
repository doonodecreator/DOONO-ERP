import { useEffect, useState } from "react";
import api from "../services/api";
import { arrayFromResponse } from "../utils/response";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";
import "./OnboardingForm.css";

const initialForm = {
  name: "",
  short_name: "",
  school_type: "Combined",
  has_primary: true,
  has_secondary: true,
  school_code: "",
  country_id: "",
  email: "",
  phone: "",
  address: "",
};

export default function AddSchool({ onSchoolAdded }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countriesError, setCountriesError] = useState("");
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    api.get("/countries")
      .then((response) => setCountries(arrayFromResponse(response)))
      .catch((requestError) => {
        setCountries([]);
        setCountriesError(requestError.response?.data?.message || requestError.message || "Unable to load countries.");
      })
      .finally(() => setLoadingCountries(false));
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!formData.country_id) {
      setError("Select a country before completing school setup.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/schools", { ...formData, country_id: Number(formData.country_id) });
      if (typeof onSchoolAdded === "function") await onSchoolAdded(response.data);
    } catch (requestError) {
      const validationMessage = requestError.errors ? Object.values(requestError.errors).flat().join(" ") : "";
      setError(requestError.response?.data?.message || validationMessage || requestError.message || "Unable to create the school.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dono-onboarding-screen">
      <section className="dono-onboarding-card" aria-labelledby="school-setup-title">
        <div className="dono-onboarding-heading">
          <h1 id="school-setup-title">Set up your first school</h1>
          <p>Register the school foundation before configuring academic sessions, classes, staff, and learners.</p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit} className="ui-form-grid">
          <FormField label="School name" htmlFor="school-name" required>
            <input id="school-name" name="name" className="ui-form-control" value={formData.name} onChange={handleChange} required />
          </FormField>
          <FormField label="Short name" htmlFor="school-short-name">
            <input id="school-short-name" name="short_name" className="ui-form-control" value={formData.short_name} onChange={handleChange} />
          </FormField>
          <FormField label="School code" htmlFor="school-code" required>
            <input id="school-code" name="school_code" className="ui-form-control" value={formData.school_code} onChange={handleChange} required />
          </FormField>
          <FormField label="School type" htmlFor="school-type" required>
            <select id="school-type" name="school_type" className="ui-form-control" value={formData.school_type} onChange={handleChange} required>
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
              <option value="Combined">Combined</option>
            </select>
          </FormField>
          <FormField label="Country" htmlFor="school-country" hint={countriesError || (!loadingCountries && countries.length === 0 ? "No countries are configured in the backend database." : "")} required>
            <select id="school-country" name="country_id" className="ui-form-control" value={formData.country_id} onChange={handleChange} required disabled={loadingCountries || countries.length === 0}>
              <option value="">{loadingCountries ? "Loading countries…" : "Select country"}</option>
              {countries.map((country) => <option key={country.id} value={country.id}>{country.name}</option>)}
            </select>
          </FormField>
          <FormField label="School email" htmlFor="school-email">
            <input id="school-email" type="email" name="email" className="ui-form-control" value={formData.email} onChange={handleChange} />
          </FormField>
          <FormField label="Phone" htmlFor="school-phone">
            <input id="school-phone" type="tel" name="phone" className="ui-form-control" value={formData.phone} onChange={handleChange} />
          </FormField>
          <FormField label="Address" htmlFor="school-address">
            <textarea id="school-address" name="address" className="ui-form-control" value={formData.address} onChange={handleChange} />
          </FormField>
          <FormActions sticky={false}>
            <Button type="submit" loading={loading} loadingText="Creating school…">Complete setup</Button>
          </FormActions>
        </form>
      </section>
    </div>
  );
}
