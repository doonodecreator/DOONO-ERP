import "./EmptyState.css";

export default function EmptyState({
    title = "Nothing Found",
    message = "There is no data available.",
    action = null,
}) {
    return (
        <div className="empty-state">
            <div className="empty-icon">
                📂
            </div>

            <h2>{title}</h2>

            <p>{message}</p>
            {action && <div className="empty-action">{action}</div>}
        </div>
    );
}
