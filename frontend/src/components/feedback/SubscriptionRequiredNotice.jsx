import Button from "../forms/Button";
import "./SubscriptionRequiredNotice.css";

export default function SubscriptionRequiredNotice({ feature, message, onUpgrade, onDismiss }) {
  return (
    <section className="subscription-required-notice" role="alert" aria-live="assertive">
      <div>
        <p className="subscription-required-kicker">Subscription access</p>
        <h2>{feature ? `${feature} is not included in your current access` : "This feature needs a subscription"}</h2>
        <p>{message || "Core school setup remains available. Choose a plan to unlock this module."}</p>
      </div>
      <div className="subscription-required-actions">
        <Button type="button" variant="primary" onClick={onUpgrade}>View plans</Button>
        <Button type="button" variant="ghost" onClick={onDismiss}>Dismiss</Button>
      </div>
    </section>
  );
}
