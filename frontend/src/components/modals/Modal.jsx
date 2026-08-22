import { useEffect } from "react";
import "./Modal.css";

export default function Modal({
  open,
  title,
  description = "",
  onClose,
  children,
  footer = null,
  size = "md",
}) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section className={`ui-modal ui-modal-${size}`} role="dialog" aria-modal="true" aria-labelledby="ui-modal-title">
        <header className="ui-modal-header">
          <div>
            <h2 id="ui-modal-title" className="ui-modal-title">{title}</h2>
            {description && <p className="ui-modal-description">{description}</p>}
          </div>
          <button type="button" className="ui-icon-button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer && <footer className="ui-modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}
