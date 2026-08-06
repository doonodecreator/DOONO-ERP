import "./PageHeader.css";

export default function PageHeader({
    title,
    subtitle = "",
    action = null
}) {
    return (
        <div className="page-header">
            <div className="page-header-text">
                <h1>{title}</h1>

                {subtitle && (
                    <p>{subtitle}</p>
                )}
            </div>

            {action && (
                <div className="page-header-action">
                    {action}
                </div>
            )}
        </div>
    );
}
