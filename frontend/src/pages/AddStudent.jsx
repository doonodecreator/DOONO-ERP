import { useEffect, useState } from "react";
import api from "../services/api";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import Button from "../components/forms/Button";
import { FormField, FormActions } from "../components/forms/FormField";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import Alert from "../components/feedback/Alert";

const initialForm = {
  admission_number: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  gender: "Male",
  date_of_birth: "",
  admission_date: new Date().toISOString().split("T")[0],
  class_id: "",
  stream_id: "",
  academic_session_id: "",
  religion: "",
  nationality: "Nigerian",
  state_of_origin: "",
  local_government: "",
  address: "",
  blood_group: "",
  genotype: "",
  medical_notes: "",
  status: "Active",
};

export default function AddStudent({ setPage }) {
  const [classes, setClasses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        setLoadingOptions(true);
        const [classRes, streamRes, sessionRes] = await Promise.allSettled([
          api.get("/classes"),
          api.get("/streams"),
          api.get("/academic-sessions"),
        ]);
        if (classRes.status === "fulfilled") {
          const data = classRes.value.data?.data ?? classRes.value.data;
          setClasses(Array.isArray(data) ? data : []);
        }
        if (streamRes.status === "fulfilled") {
          const data = streamRes.value.data?.data ?? streamRes.value.data;
          setStreams(Array.isArray(data) ? data : []);
        }
        if (sessionRes.status === "fulfilled") {
          const data = sessionRes.value.data?.data ?? sessionRes.value.data;
          setSessions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setFormError(err.response?.data?.message || "Unable to load academic options.");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchFormOptions();
  }, []);

  useEffect(() => () => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: null }));
  };

  const handlePhoto = (event) => {
    const nextPhoto = event.target.files?.[0] || null;
    setPhoto(nextPhoto);
    setPhotoPreview(nextPhoto ? URL.createObjectURL(nextPhoto) : "");
  };

  const errorFor = (name) => Array.isArray(errors[name]) ? errors[name][0] : errors[name];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError("");
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
      if (photo) payload.append("photo", photo);
      await api.post("/students", payload, { headers: { "Content-Type": "multipart/form-data" } });
      setPage?.("students");
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else setFormError(err.response?.data?.message || "Unable to register student.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOptions) return <PageContainer><PageHeader title="Add Student" subtitle="Register a student and assign them to an academic class." action={<Button variant="secondary" onClick={() => setPage?.("students")}>Back to students</Button>} /><LoadingSpinner text="Loading academic options..." /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="Add Student" subtitle="Register a student and assign them to an academic class." action={<Button variant="secondary" onClick={() => setPage?.("students")}>Back to students</Button>} />
      {formError && <Alert variant="error">{formError}</Alert>}
      <form onSubmit={handleSubmit}>
        <SectionCard title="1. Personal information" subtitle="Use the student’s official names and basic details.">
          <div className="ui-form-grid">
            <FormField label="First name" htmlFor="student-first" required error={errorFor("first_name")}><input id="student-first" name="first_name" value={form.first_name} onChange={handleChange} required className="ui-form-control" aria-invalid={!!errorFor("first_name")} /></FormField>
            <FormField label="Middle name" htmlFor="student-middle"><input id="student-middle" name="middle_name" value={form.middle_name} onChange={handleChange} className="ui-form-control" /></FormField>
            <FormField label="Last name" htmlFor="student-last" required error={errorFor("last_name")}><input id="student-last" name="last_name" value={form.last_name} onChange={handleChange} required className="ui-form-control" aria-invalid={!!errorFor("last_name")} /></FormField>
            <FormField label="Gender" htmlFor="student-gender" required><select id="student-gender" name="gender" value={form.gender} onChange={handleChange} className="ui-form-control"><option>Male</option><option>Female</option></select></FormField>
            <FormField label="Date of birth" htmlFor="student-dob"><input id="student-dob" type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className="ui-form-control" /></FormField>
            <FormField label="Admission date" htmlFor="student-admission-date" required><input id="student-admission-date" type="date" name="admission_date" value={form.admission_date} onChange={handleChange} required className="ui-form-control" /></FormField>
            <FormField label="Student photo" htmlFor="student-photo" hint="Optional JPG, PNG, or WebP image up to 5 MB."><input id="student-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} className="ui-form-control" />{photoPreview && <img src={photoPreview} alt="Student preview" style={{ width: 76, height: 76, marginTop: 8, borderRadius: "50%", objectFit: "cover" }} />}</FormField>
          </div>
        </SectionCard>

        <SectionCard title="2. Academic placement" subtitle="Assign the student to the current school structure.">
          <div className="ui-form-grid">
            <FormField label="Admission number" htmlFor="student-admission-number" hint="Use the school’s official admission number."><input id="student-admission-number" name="admission_number" required value={form.admission_number} onChange={handleChange} className="ui-form-control" aria-invalid={!!errorFor("admission_number")} /></FormField>
            <FormField label="Academic session" htmlFor="student-session"><select id="student-session" name="academic_session_id" value={form.academic_session_id} onChange={handleChange} className="ui-form-control"><option value="">Select session</option>{sessions.map((session) => <option key={session.id} value={session.id}>{session.name || session.session_year}</option>)}</select></FormField>
            <FormField label="Assigned class" htmlFor="student-class" required error={errorFor("class_id")}><select id="student-class" name="class_id" value={form.class_id} onChange={handleChange} required className="ui-form-control"><option value="">Select class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
            <FormField label="Assigned stream" htmlFor="student-stream"><select id="student-stream" name="stream_id" value={form.stream_id} onChange={handleChange} className="ui-form-control"><option value="">Select stream</option>{streams.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
          </div>
        </SectionCard>

        <SectionCard title="3. Origin and contact" subtitle="Optional information used for school records and communication.">
          <div className="ui-form-grid">
            <FormField label="Religion" htmlFor="student-religion"><input id="student-religion" name="religion" value={form.religion} onChange={handleChange} className="ui-form-control" /></FormField>
            <FormField label="Nationality" htmlFor="student-nationality"><input id="student-nationality" name="nationality" value={form.nationality} onChange={handleChange} className="ui-form-control" /></FormField>
            <FormField label="State of origin" htmlFor="student-state"><input id="student-state" name="state_of_origin" value={form.state_of_origin} onChange={handleChange} className="ui-form-control" /></FormField>
            <FormField label="Local government" htmlFor="student-lga"><input id="student-lga" name="local_government" value={form.local_government} onChange={handleChange} className="ui-form-control" /></FormField>
            <div className="ui-form-full"><FormField label="Address" htmlFor="student-address"><textarea id="student-address" name="address" value={form.address} onChange={handleChange} className="ui-form-control" /></FormField></div>
          </div>
        </SectionCard>

        <SectionCard title="4. Medical and status" subtitle="Keep health information brief and relevant to school safety.">
          <div className="ui-form-grid">
            <FormField label="Blood group" htmlFor="student-blood"><input id="student-blood" name="blood_group" value={form.blood_group} onChange={handleChange} placeholder="e.g. O+" className="ui-form-control" /></FormField>
            <FormField label="Genotype" htmlFor="student-genotype"><input id="student-genotype" name="genotype" value={form.genotype} onChange={handleChange} placeholder="e.g. AA" className="ui-form-control" /></FormField>
            <FormField label="Status" htmlFor="student-status"><select id="student-status" name="status" value={form.status} onChange={handleChange} className="ui-form-control"><option>Active</option><option>Graduated</option><option>Transferred</option><option>Suspended</option></select></FormField>
            <div className="ui-form-full"><FormField label="Medical notes" htmlFor="student-medical"><textarea id="student-medical" name="medical_notes" value={form.medical_notes} onChange={handleChange} className="ui-form-control" /></FormField></div>
          </div>
        </SectionCard>
        <FormActions><Button type="button" variant="secondary" onClick={() => setPage?.("students")}>Cancel</Button><Button type="submit" loading={submitting}>Create student</Button></FormActions>
      </form>
    </PageContainer>
  );
}
