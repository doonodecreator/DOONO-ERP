import "./Alert.css";

export default function Alert({ variant = "info", children, action = null }) {
  return <div className={`ui-alert ui-alert-${variant}`} role={variant === "error" ? "alert" : "status"}><span>{children}</span>{action && <span className="ui-alert-action">{action}</span>}</div>;
}
