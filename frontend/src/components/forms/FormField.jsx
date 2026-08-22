import "./forms.css";

export function FormField({ label, htmlFor, error, hint, required = false, children }) {
  return (
    <div className="ui-form-field">
      <label className="ui-form-label" htmlFor={htmlFor}>{label}{required && <span aria-hidden="true" className="ui-form-required"> *</span>}</label>
      {hint && <p className="ui-form-hint">{hint}</p>}
      {children}
      {error && <p className="ui-form-error" role="alert">{error}</p>}
    </div>
  );
}

export function FormActions({ children, sticky = false }) {
  return <div className={`ui-form-actions${sticky ? " ui-form-actions-sticky" : ""}`}>{children}</div>;
}

export function FieldError({ children }) {
  return children ? <p className="ui-form-error" role="alert">{children}</p> : null;
}
