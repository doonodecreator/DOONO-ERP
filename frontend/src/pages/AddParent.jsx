import { useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import Alert from "../components/feedback/Alert";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";

const initialForm = {
  father_name: "",
  father_phone: "",
  father_email: "",
  father_occupation: "",
  mother_name: "",
  mother_phone: "",
  mother_email: "",
  mother_occupation: "",
  guardian_name: "",
  guardian_phone: "",
  guardian_email: "",
  guardian_occupation: "",
  guardian_relationship: "",
  address: "",
};

function ContactFields({ prefix, label, form, onChange }) {
  return (
    <SectionCard title={label}>
      <div className="ui-form-grid">
        <FormField label={`${label} name`} htmlFor={`${prefix}-name`}>
          <input id={`${prefix}-name`} name={`${prefix}_name`} className="ui-form-control" value={form[`${prefix}_name`]} onChange={onChange} />
        </FormField>
        <FormField label={`${label} phone`} htmlFor={`${prefix}-phone`}>
          <input id={`${prefix}-phone`} type="tel" name={`${prefix}_phone`} className="ui-form-control" value={form[`${prefix}_phone`]} onChange={onChange} />
        </FormField>
        <FormField label={`${label} email`} htmlFor={`${prefix}-email`}>
          <input id={`${prefix}-email`} type="email" name={`${prefix}_email`} className="ui-form-control" value={form[`${prefix}_email`]} onChange={onChange} />
        </FormField>
        <FormField label="Occupation" htmlFor={`${prefix}-occupation`}>
          <input id={`${prefix}-occupation`} name={`${prefix}_occupation`} className="ui-form-control" value={form[`${prefix}_occupation`]} onChange={onChange} />
        </FormField>
        {prefix === "guardian" && (
          <FormField label="Relationship" htmlFor="guardian-relationship">
            <input id="guardian-relationship" name="guardian_relationship" className="ui-form-control" value={form.guardian_relationship} onChange={onChange} />
          </FormField>
        )}
      </div>
    </SectionCard>
  );
}

export default function AddParent({ setPage }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/parents", form);
      setPage("parents");
    } catch (requestError) {
      setError(requestError.message || "Could not create parent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Add parent" subtitle="Create a parent or guardian profile before linking learners." action={<Button variant="secondary" onClick={() => setPage("parents")}>Back to parents</Button>} />
      {error && <Alert variant="error">{error}</Alert>}
      <form onSubmit={submit}>
        <ContactFields prefix="father" label="Father information" form={form} onChange={handleChange} />
        <ContactFields prefix="mother" label="Mother information" form={form} onChange={handleChange} />
        <ContactFields prefix="guardian" label="Guardian information" form={form} onChange={handleChange} />
        <SectionCard title="Address">
          <FormField label="Home or contact address" htmlFor="parent-address">
            <textarea id="parent-address" name="address" className="ui-form-control" value={form.address} onChange={handleChange} />
          </FormField>
        </SectionCard>
        <FormActions>
          <Button variant="secondary" onClick={() => setPage("parents")}>Cancel</Button>
          <Button type="submit" loading={loading} loadingText="Saving parent…">Save parent</Button>
        </FormActions>
      </form>
    </PageContainer>
  );
}
