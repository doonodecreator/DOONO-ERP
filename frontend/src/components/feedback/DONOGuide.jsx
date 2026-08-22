import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPrimaryRoleSlug } from "../../utils/role";
import { ARCHITECTURE_MODULES } from "../../config/architectureModules";
import { GUIDE_MODULE_KEYS, moduleGuide, pageGuideKey, roleGuide } from "../../config/guideKnowledge";
import "./DONOGuide.css";

const uniqueModules = GUIDE_MODULE_KEYS.map((key) => ({
  key,
  label: ARCHITECTURE_MODULES[key]?.label || key,
  page: ARCHITECTURE_MODULES[key]?.page || key,
})).filter((module, index, list) => list.findIndex((item) => item.key === module.key) === index);

export default function DONOGuide({ page = "dashboard", setPage }) {
  const { user, roles, isPlatformAdmin, isOrganizationOwner, school } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const roleHelp = useMemo(() => roleGuide(role), [role]);
  const currentPageKey = pageGuideKey(page);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("page");
  const [selectedModule, setSelectedModule] = useState(currentPageKey);
  const [stepIndex, setStepIndex] = useState(0);
  const [roleStepIndex, setRoleStepIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [tourComplete, setTourComplete] = useState(false);
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
    setSelectedModule(pageGuideKey(action));
    setStepIndex(0);
    setPage(action);
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
