import "./EmptyState.css";

export default function EmptyState({
    title = "Nothing Found",
    message = "There is no data available."
}) {
    return (
        <div className="empty-state">
            <div className="empty-icon">
                📂
            </div>

            <h2>{title}</h2>

            <p>{message}</p>
        </div>
    );
}
