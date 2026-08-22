import "./SectionCard.css";

export default function SectionCard({ title, subtitle = "", actions = null, children, className = "" }) {
  return <section className={`section-card ${className}`.trim()}><header className="section-card-header"><div>{title && <h2 className="section-card-title">{title}</h2>}{subtitle && <p className="section-card-subtitle">{subtitle}</p>}</div>{actions && <div className="section-card-actions">{actions}</div>}</header><div className="section-card-body">{children}</div></section>;
}
