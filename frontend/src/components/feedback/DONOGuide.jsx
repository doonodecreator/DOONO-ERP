import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPrimaryRoleSlug } from "../../utils/role";
import { ARCHITECTURE_MODULES } from "../../config/architectureModules";
import { GUIDE_MODULE_KEYS_WITH_DOCUMENTS, controlGuide, moduleGuide, pageGuideKey, roleGuide } from "../../config/guideKnowledge";
import { normalizeSchoolOsPage, schoolOsCapability } from "../../config/schoolOsCapabilities";
import "./DONOGuide.css";

const GUIDE_LABELS = { "id-card": "Student ID Card" };
const uniqueModules = GUIDE_MODULE_KEYS_WITH_DOCUMENTS.map((key) => {
  const page = normalizeSchoolOsPage(ARCHITECTURE_MODULES[key]?.page || key);
  const capability = schoolOsCapability(page);
  return {
    key,
    label: capability?.label || ARCHITECTURE_MODULES[key]?.label || GUIDE_LABELS[key] || key,
    page,
  };
}).filter((module, index, list) => list.findIndex((item) => item.key === module.key) === index);

export default function DONOGuide({ page = "dashboard", setPage }) {
  const { user, roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const roleHelp = useMemo(() => roleGuide(role), [role]);
  const currentPageKey = pageGuideKey(normalizeSchoolOsPage(page));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("page");
  const [selectedModule, setSelectedModule] = useState(currentPageKey);
  const [stepIndex, setStepIndex] = useState(0);
  const [roleStepIndex, setRoleStepIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [tourComplete, setTourComplete] = useState(false);
  const [selectedControl, setSelectedControl] = useState(null);
  const closeButtonRef = useRef(null);
  const storageKey = `doono-guide:${user?.id || "guest"}:${role}:${school?.id || "organization"}`;

  useEffect(() => {
    setSelectedModule(currentPageKey);
    setStepIndex(0);
  }, [currentPageKey]);

  useEffect(() => {
    if (!open) return undefined;
    setTourComplete(window.localStorage.getItem(storageKey) === "complete");
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, storageKey]);

  const pageHelp = useMemo(() => moduleGuide(selectedModule), [selectedModule]);
  const activeSteps = view === "role" ? roleHelp.steps : pageHelp.steps;
  const activeIndex = view === "role" ? roleStepIndex : stepIndex;
  const currentStep = activeSteps[activeIndex] || activeSteps[0];
  const filteredModules = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return uniqueModules;
    return uniqueModules.filter((module) => `${module.label} ${module.key}`.toLowerCase().includes(normalized));
  }, [query]);

  if (!user?.id) return null;

  function openGuide(nextView = "page") {
    setSelectedControl(null);
    setView(nextView);
    setOpen(true);
    if (nextView === "role") setRoleStepIndex(0);
    else setStepIndex(0);
  }

  function finishTour() {
    window.localStorage.setItem(storageKey, "complete");
    setTourComplete(true);
    setOpen(false);
  }

  function openAction(action) {
    if (!action || typeof setPage !== "function") return;
    const canonicalPage = normalizeSchoolOsPage(action);
    setSelectedModule(pageGuideKey(canonicalPage));
    setStepIndex(0);
    setPage(canonicalPage);
  }

  function explainControl(label) {
    setSelectedControl(controlGuide(label, selectedModule, role));
  }

  function nextStep() {
    if (activeIndex + 1 >= activeSteps.length) {
      if (view === "role") finishTour();
      else setOpen(false);
      return;
    }
    const next = activeSteps[activeIndex + 1];
    if (next?.action) openAction(next.action);
    if (view === "role") setRoleStepIndex((index) => index + 1);
    else setStepIndex((index) => index + 1);
  }

  function chooseModule(event) {
    const nextModule = event.target.value;
    setSelectedModule(nextModule);
    setStepIndex(0);
    const selected = uniqueModules.find((module) => module.key === nextModule);
    if (selected?.page && typeof setPage === "function") setPage(selected.page);
  }

  return (
    <>
      <div className="dono-guide-launcher" aria-label="DOONO Guide controls">
        <button type="button" className="dono-guide-trigger" onClick={() => openGuide("page")} aria-label="Open DOONO Guide">
          Guide
        </button>
        {typeof setPage === "function" && <button type="button" className="dono-guide-support-trigger" onClick={() => setPage("support-centre")} aria-label="Open Support Centre">
          Support
        </button>}
        <button type="button" className="dono-guide-tour-trigger" onClick={() => openGuide("role")} aria-label="Start my role tour">
          {tourComplete ? "Replay tour" : "Role tour"}
        </button>
      </div>

      {open && (
        <div className="dono-guide-layer" role="presentation">
          <button type="button" className="dono-guide-backdrop" onClick={() => setOpen(false)} aria-label="Close guide" />
          <section className="dono-guide-card" role="dialog" aria-modal="true" aria-labelledby="dono-guide-title">
            <div className="dono-guide-card-header">
              <div>
                <span className="dono-guide-kicker">DOONO Guide · {roleHelp.label}</span>
                <h2 id="dono-guide-title">{view === "role" ? `${roleHelp.label} tour` : pageHelp.title}</h2>
              </div>
              <button ref={closeButtonRef} type="button" className="dono-guide-close" onClick={() => setOpen(false)} aria-label="Close guide">×</button>
            </div>

            <div className="dono-guide-tabs" role="tablist" aria-label="Guide view">
              <button type="button" role="tab" aria-selected={view === "page"} className={view === "page" ? "is-active" : ""} onClick={() => { setView("page"); setStepIndex(0); }}>This page</button>
              <button type="button" role="tab" aria-selected={view === "role"} className={view === "role" ? "is-active" : ""} onClick={() => { setView("role"); setRoleStepIndex(0); }}>My role</button>
            </div>

            {view === "page" && (
              <label className="dono-guide-module-picker">
                <span>Explore a module</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search modules" aria-label="Search modules" />
                <select value={selectedModule} onChange={chooseModule} aria-label="Choose a module">
                  {filteredModules.map((module) => <option key={module.key} value={module.key}>{module.label}</option>)}
                </select>
              </label>
            )}

            <p className="dono-guide-purpose">{view === "role" ? roleHelp.intro : pageHelp.purpose}</p>
            {view === "role" && <section className="dono-guide-role-profile">
              <div className="dono-guide-role-definition"><strong>What this role means</strong><p>{roleHelp.definition}</p></div>
              <div className="dono-guide-role-grid">
                <div><strong>Main purpose</strong><p>{roleHelp.primaryPurpose}</p></div>
                <div><strong>Works with</strong><p>{roleHelp.worksWith}</p></div>
                <div><strong>Before you start</strong><p>{roleHelp.firstChecks}</p></div>
              </div>
              <div className="dono-guide-role-grid">
                <div><strong>What this role can do</strong><ul>{(Array.isArray(roleHelp.canDo) ? roleHelp.canDo : []).map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><strong>What this role must not do</strong><ul>{(Array.isArray(roleHelp.cannotDo) ? roleHelp.cannotDo : []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
              <div className="dono-guide-role-workflow"><strong>Normal working cycle</strong><ol>{(Array.isArray(roleHelp.dailyWorkflow) ? roleHelp.dailyWorkflow : []).map((item) => <li key={item}>{item}</li>)}</ol></div>
            </section>}
            {view === "page" && <div className="dono-guide-explanation-grid">
              <section><strong>Why this feature matters</strong><p>{pageHelp.whyItMatters}</p></section>
              <section><strong>What to prepare first</strong><p>{pageHelp.beforeYouStart}</p></section>
            </div>}
            {view === "page" && <section className="dono-guide-detail-section"><h3>Important fields and what they mean</h3><div className="dono-guide-field-list">{(Array.isArray(pageHelp.fields) ? pageHelp.fields : []).map((field) => <div key={field.name}><strong>{field.name}</strong><span>{field.explanation}</span></div>)}</div></section>}
            <div className="dono-guide-context-cards">
              <div><strong>Before you start</strong><span>{view === "page" ? pageHelp.beforeYouStart : "Confirm the selected organization, school, session, term, and role are correct for this task."}</span></div>
              <div><strong>When you finish</strong><span>{view === "page" ? pageHelp.successSignals?.join(" ") : "Look for a success message, a changed list, or an updated dashboard number before leaving the workspace."}</span></div>
              <div><strong>If you are blocked</strong><span>Read the page error, check the prerequisites and permissions, then open Support Centre with the exact message if the problem continues.</span></div>
            </div>
            {selectedControl && <section className="dono-guide-control-card" aria-live="polite"><div className="dono-guide-control-heading"><div><span className="dono-guide-kicker">You selected a control</span><h3>{selectedControl.title}</h3></div><button type="button" className="dono-guide-control-close" onClick={() => setSelectedControl(null)} aria-label="Close control explanation">×</button></div><div className="dono-guide-control-grid"><div><strong>What it means</strong><p>{selectedControl.what}</p></div><div><strong>How to use it</strong><p>{selectedControl.how}</p></div><div><strong>Why it helps you</strong><p>{selectedControl.benefit}</p></div><div><strong>What happens next</strong><p>{selectedControl.after}</p></div><div><strong>Who can use it</strong><p>{selectedControl.access}</p></div></div></section>}
            {view === "page" && <section className="dono-guide-detail-section"><h3>Available controls on this workflow</h3><p className="dono-guide-helper-text">The Guide stays closed while you work. Open it deliberately, then choose Explain when you want a lesson about one of these controls.</p><div className="dono-guide-control-list">{(Array.isArray(pageHelp.controls) ? pageHelp.controls : []).map((control, index) => <div key={`${pageHelp.key}-control-${index}`}><span>{index + 1}</span><p>{control}</p><button type="button" className="dono-guide-inline-action" onClick={() => explainControl(control)}>Explain</button></div>)}</div><h3 className="dono-guide-success-heading">How to know you completed it</h3><ul className="dono-guide-success-list">{(Array.isArray(pageHelp.successSignals) ? pageHelp.successSignals : []).map((signal) => <li key={signal}>{signal}</li>)}</ul></section>}
            <div className="dono-guide-step-card" aria-live="polite">
              <span className="dono-guide-step-number">Step {activeIndex + 1}</span>
              <h3>{currentStep?.title}</h3>
              <p>{currentStep?.detail}</p>
              {currentStep?.action && <button type="button" className="dono-guide-inline-action" onClick={() => openAction(currentStep.action)}>Open this workspace</button>}
            </div>
            <p className="dono-guide-next-info"><strong>Next:</strong> {view === "role" ? (activeIndex === activeSteps.length - 1 ? "Return to your dashboard and confirm the task is complete." : "Continue to the next role step.") : pageHelp.next}</p>

            <div className="dono-guide-progress">
              <span>Step {activeIndex + 1} of {activeSteps.length}</span>
              <div className="dono-guide-dots" aria-hidden="true">
                {activeSteps.map((_, index) => <span key={index} className={index <= activeIndex ? "is-active" : ""} />)}
              </div>
            </div>
            <div className="dono-guide-actions">
              <button type="button" className="dono-guide-skip" onClick={() => view === "role" ? finishTour() : setOpen(false)}>{view === "role" ? "Finish later" : "Close guide"}</button>
              <button type="button" className="dono-guide-next" onClick={nextStep}>{activeIndex + 1 === activeSteps.length ? (view === "role" ? "Complete tour" : "Done") : "Next step"}</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
