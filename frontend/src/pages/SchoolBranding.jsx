import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import PageContainer from "../components/layout/PageContainer";
import PageHeader from "../components/layout/PageHeader";
import SectionCard from "../components/layout/SectionCard";
import LoadingSpinner from "../components/feedback/LoadingSpinner";
import EmptyState from "../components/feedback/EmptyState";
import Button from "../components/forms/Button";
import { FormActions, FormField } from "../components/forms/FormField";
import "./SchoolBranding.css";

const defaults = {
  primary_color: "#1E40AF",
  secondary_color: "#FFFFFF",
  accent_color: "#F59E0B",
  report_card_theme: "classic",
  report_card_layout: "standard",
  custom_header: "",
  custom_footer: "",
  show_watermark: true,
  allow_branding: false,
  watermark_text: "Powered by DOONO De Creator ERP",
  pass_mark: 40,
  maximum_score: 100,
  promotion_pass_mark: 50,
  show_class_position: true,
  show_class_average: true,
  show_attendance: true,
  show_student_passport: true,
  show_principal_signature: true,
  show_school_stamp: true,
  show_teacher_comment: true,
  show_principal_comment: true,
};

function imagePreview(file, existing) {
  return file ? URL.createObjectURL(file) : existing || "";
}

export default function SchoolBranding({ setPage }) {
  const { school, roles, isOrganizationOwner, isPlatformAdmin } = useAuth();
  const roleList = Array.isArray(roles) ? roles : [];
  const canManage = isPlatformAdmin || isOrganizationOwner || roleList.some((role) => role?.slug === "proprietor");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [schoolData, setSchoolData] = useState(null);
  const [branding, setBranding] = useState(defaults);
  const [configuration, setConfiguration] = useState({});
  const [files, setFiles] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/school-branding");
      const payload = response?.data?.data ?? response?.data ?? {};
      const schoolPayload = payload.school || school || null;
      const brandingPayload = schoolPayload?.branding || {};
      setSchoolData(schoolPayload);
      setBranding({ ...defaults, ...brandingPayload, ...schoolPayload, ...pickConfig(payload.academic_configuration) });
      setConfiguration(payload.academic_configuration || {});
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Unable to load school branding.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [school?.id]);

  function pickConfig(value) {
    const source = value || {};
    return Object.fromEntries(Object.keys(defaults).filter((key) => Object.prototype.hasOwnProperty.call(source, key)).map((key) => [key, source[key]]));
  }

  function update(name, value) {
    setBranding((current) => ({ ...current, [name]: value }));
  }

  function chooseFile(name, event) {
    const file = event.target.files?.[0] || null;
    setFiles((current) => ({ ...current, [name]: file }));
  }

  const previews = useMemo(() => ({
    logo: imagePreview(files.logo, schoolData?.logo_url || schoolData?.logo),
    report_card_logo: imagePreview(files.report_card_logo, schoolData?.report_card_logo_url || schoolData?.report_card_logo_url),
    principal_signature: imagePreview(files.principal_signature, schoolData?.principal_signature_url),
    school_stamp: imagePreview(files.school_stamp, schoolData?.school_stamp_url),
  }), [files, schoolData]);

  useEffect(() => () => Object.values(previews).forEach((url) => { if (url?.startsWith("blob:")) URL.revokeObjectURL(url); }), [previews]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      [
        "primary_color", "secondary_color", "accent_color", "report_card_theme", "report_card_layout",
        "custom_header", "custom_footer", "watermark_text", "pass_mark", "maximum_score", "promotion_pass_mark",
      ].forEach((key) => formData.append(key, branding[key] ?? ""));
      [
        "show_watermark", "allow_branding", "show_class_position", "show_class_average", "show_attendance",
        "show_student_passport", "show_principal_signature", "show_school_stamp", "show_teacher_comment",
        "show_principal_comment",
      ].forEach((key) => formData.append(key, branding[key] ? "1" : "0"));
      Object.entries(files).forEach(([key, file]) => { if (file) formData.append(key, file); });

      await api.post("/school-branding", formData, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage("School branding and report-card design saved successfully.");
      setFiles({});
      await load();
    } catch (err) {
      const validation = err?.response?.data?.errors || err?.errors;
      const firstError = validation ? Object.values(validation).flat()?.[0] : null;
      setError(firstError || err?.message || "Unable to save school branding.");
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return <PageContainer><PageHeader title="School Branding" subtitle="Only the Proprietor can change school identity and report-card design." /><EmptyState title="Branding access is restricted" message="Ask the school Proprietor to manage logos, colors, signatures, stamps, and report-card visibility." /></PageContainer>;
  }

  if (loading) return <PageContainer><LoadingSpinner text="Loading school branding..." /></PageContainer>;

  return (
    <PageContainer>
      <PageHeader title="School Branding & Report Card Design" subtitle="Build a consistent school identity for dashboards, report cards, and official communication." action={<Button variant="primary" onClick={save} loading={saving}>Save design</Button>} />
      {error && <div className="school-branding-feedback school-branding-feedback-error" role="alert">{error}</div>}
      {message && <div className="school-branding-feedback school-branding-feedback-success" role="status">{message}</div>}

      <form onSubmit={save} className="school-branding-layout">
        <div className="school-branding-editor">
          <SectionCard title="School identity" subtitle="Upload the assets families and learners should recognize.">
            <div className="school-branding-file-grid">
              {[{ key: "logo", label: "School logo", help: "Used across the school identity." }, { key: "report_card_logo", label: "Report-card logo", help: "Optional alternate logo for official reports." }, { key: "principal_signature", label: "Principal signature", help: "Shown when enabled below." }, { key: "school_stamp", label: "School stamp", help: "Shown when enabled below." }].map((item) => <FormField key={item.key} label={item.label} htmlFor={`branding-${item.key}`} hint={item.help}><input id={`branding-${item.key}`} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" onChange={(event) => chooseFile(item.key, event)} />{previews[item.key] && <img className="school-branding-upload-preview" src={previews[item.key]} alt={`${item.label} preview`} />}</FormField>)}
            </div>
            <div className="school-branding-form-grid">
              <FormField label="Primary color" htmlFor="branding-primary-color"><input id="branding-primary-color" type="color" value={branding.primary_color} onChange={(event) => update("primary_color", event.target.value)} /></FormField>
              <FormField label="Secondary color" htmlFor="branding-secondary-color"><input id="branding-secondary-color" type="color" value={branding.secondary_color} onChange={(event) => update("secondary_color", event.target.value)} /></FormField>
              <FormField label="Accent color" htmlFor="branding-accent-color"><input id="branding-accent-color" type="color" value={branding.accent_color} onChange={(event) => update("accent_color", event.target.value)} /></FormField>
              <FormField label="Report-card theme" htmlFor="branding-theme"><select id="branding-theme" value={branding.report_card_theme} onChange={(event) => update("report_card_theme", event.target.value)}><option value="classic">Classic</option><option value="modern">Modern</option><option value="minimal">Minimal</option></select></FormField>
              <FormField label="Report-card layout" htmlFor="branding-layout"><select id="branding-layout" value={branding.report_card_layout} onChange={(event) => update("report_card_layout", event.target.value)}><option value="standard">Standard portrait</option><option value="compact">Compact portrait</option><option value="landscape">Landscape</option></select></FormField>
              <FormField label="Watermark text" htmlFor="branding-watermark"><input id="branding-watermark" value={branding.watermark_text} onChange={(event) => update("watermark_text", event.target.value)} maxLength={255} /></FormField>
            </div>
          </SectionCard>

          <SectionCard title="Report-card content" subtitle="Choose what your school publishes on official results.">
            <div className="school-branding-switch-grid">{[
              ["show_class_position", "Show class position"], ["show_class_average", "Show class average"], ["show_attendance", "Show attendance"], ["show_student_passport", "Show student passport"], ["show_principal_signature", "Show principal signature"], ["show_school_stamp", "Show school stamp"], ["show_teacher_comment", "Show teacher comment"], ["show_principal_comment", "Show principal comment"], ["show_watermark", "Show watermark"]
            ].map(([key, label]) => <label key={key} className="school-branding-switch"><input type="checkbox" checked={!!branding[key]} onChange={(event) => update(key, event.target.checked)} /><span>{label}</span></label>)}</div>
            <div className="school-branding-form-grid school-branding-number-grid">
              <FormField label="Pass mark" htmlFor="branding-pass-mark"><input id="branding-pass-mark" type="number" min="0" max="100" value={branding.pass_mark} onChange={(event) => update("pass_mark", event.target.value)} /></FormField>
              <FormField label="Maximum score" htmlFor="branding-max-score"><input id="branding-max-score" type="number" min="1" max="1000" value={branding.maximum_score} onChange={(event) => update("maximum_score", event.target.value)} /></FormField>
              <FormField label="Promotion pass mark" htmlFor="branding-promotion-mark"><input id="branding-promotion-mark" type="number" min="0" max="100" value={branding.promotion_pass_mark} onChange={(event) => update("promotion_pass_mark", event.target.value)} /></FormField>
            </div>
          </SectionCard>

          <SectionCard title="Custom report-card text" subtitle="Add school-approved instructions or closing notes without editing code.">
            <FormField label="Custom header" htmlFor="branding-custom-header"><textarea id="branding-custom-header" rows="4" value={branding.custom_header} onChange={(event) => update("custom_header", event.target.value)} maxLength={5000} placeholder="Optional text printed below the school identity." /></FormField>
            <FormField label="Custom footer" htmlFor="branding-custom-footer"><textarea id="branding-custom-footer" rows="4" value={branding.custom_footer} onChange={(event) => update("custom_footer", event.target.value)} maxLength={5000} placeholder="Optional text printed at the end of the report card." /></FormField>
            <label className="school-branding-switch"><input type="checkbox" checked={!!branding.allow_branding} onChange={(event) => update("allow_branding", event.target.checked)} /><span>Enable school branding on official report cards</span></label>
          </SectionCard>
          <FormActions><Button type="submit" variant="primary" loading={saving}>Save branding and report-card design</Button>{setPage && <Button type="button" variant="secondary" onClick={() => setPage("report-cards")}>Open report cards</Button>}</FormActions>
        </div>

        <aside className="school-branding-preview" aria-label="Report card preview">
          <div className="school-branding-preview-card" style={{ "--preview-primary": branding.primary_color, "--preview-accent": branding.accent_color }}>
            {previews.report_card_logo || previews.logo ? <img src={previews.report_card_logo || previews.logo} alt="School logo preview" /> : <div className="school-branding-preview-placeholder">LOGO</div>}
            <p className="school-branding-preview-school">{schoolData?.name || school?.name || "Your School"}</p>
            <p className="school-branding-preview-title">Student Report Card</p>
            <div className="school-branding-preview-student"><span>Student Name</span><strong>Sample Learner</strong><span>Class</span><strong>Sample Class</strong></div>
            <div className="school-branding-preview-table"><span>Subject</span><span>Total</span><span>Grade</span><span>Mathematics</span><b>84</b><b>A</b><span>English</span><b>76</b><b>B</b></div>
            <div className="school-branding-preview-summary"><strong>Average 80%</strong><strong>Position 3rd</strong></div>
            {branding.show_watermark && <small>{branding.watermark_text}</small>}
          </div>
          <p className="school-branding-preview-note">This preview reflects the selected colors, logo, layout choices, and watermark. Official values come from the approved results engine.</p>
        </aside>
      </form>
    </PageContainer>
  );
}
