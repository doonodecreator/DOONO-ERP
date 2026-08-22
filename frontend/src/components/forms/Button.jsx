import "./button.css";

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Saving…",
  children,
  type = "button",
  disabled = false,
  ...props
}) {
  return (
    <button
      {...props}
      type={type}
      className={`ui-button ui-button-${variant} ui-button-${size}${loading ? " is-loading" : ""}`}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
    >
      {loading ? loadingText : children}
    </button>
  );
}
