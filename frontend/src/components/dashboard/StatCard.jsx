import "./StatCard.css";

export default function StatCard({ title, value, subtitle = "", color = "primary" }) {
  const variant = typeof color === "string" && color.startsWith("#") ? "custom" : color;
  const style = variant === "custom" ? { "--stat-accent": color } : undefined;

  return (
    <article className={`stat-card stat-card-${variant}`} style={style}>
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value ?? "—"}</div>
      {subtitle && <div className="stat-subtitle">{subtitle}</div>}
    </article>
  );
}
