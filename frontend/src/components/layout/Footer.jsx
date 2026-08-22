import "./Footer.css";

export default function Footer({ theme = "light", withSidebar = false }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`dono-footer dono-footer-${theme}${withSidebar ? " dono-footer-with-sidebar" : ""}`} aria-label="DOONO De Creator ERP footer">
      <div className="dono-footer-inner">
        <div className="dono-footer-brand">
          <strong>DOONO De Creator ERP</strong>
          <span>School operations, simplified.</span>
        </div>
        <div className="dono-footer-meta">
          <span>© {year} DOONO De Creator ERP</span>
          <span className="dono-footer-separator" aria-hidden="true">•</span>
          <span>Secure multi-tenant school management</span>
        </div>
      </div>
    </footer>
  );
}
