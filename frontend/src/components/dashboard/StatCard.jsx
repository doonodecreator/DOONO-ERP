import "./StatCard.css";

export default function StatCard({
    title,
    value,
    subtitle = "",
    color = "#2563eb",
}) {
    return (
        <div
            className="stat-card"
            style={{
                borderTop: `4px solid ${color}`,
            }}
        >
            <div className="stat-title">
                {title}
            </div>

            <div className="stat-value">
                {value}
            </div>

            {subtitle && (
                <div className="stat-subtitle">
                    {subtitle}
                </div>
            )}
        </div>
    );
}
