import { useEffect, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DONOGuide from "../components/feedback/DONOGuide";
import Footer from "../components/layout/Footer";
import ScrollNavigator from "../components/layout/ScrollNavigator";
import SubscriptionRequiredNotice from "../components/feedback/SubscriptionRequiredNotice";
import "./DashboardLayout.css";

export default function DashboardLayout({ children, page, setPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [subscriptionNotice, setSubscriptionNotice] = useState(null);

  useEffect(() => {
    const handleSubscriptionRequired = (event) => setSubscriptionNotice(event.detail || {});
    window.addEventListener("dono:subscription-required", handleSubscriptionRequired);
    return () => window.removeEventListener("dono:subscription-required", handleSubscriptionRequired);
  }, []);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const pageRef = useRef(page);

  useEffect(() => {
    pageRef.current = page;
    const current = window.history.state;
    if (!current?.donoApp) {
      window.history.replaceState({ donoApp: true, page }, "", window.location.href);
    } else if (current.page !== page) {
      window.history.pushState({ donoApp: true, page }, "", window.location.href);
    }
  }, [page]);

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state?.donoApp && event.state.page) {
        pageRef.current = event.state.page;
        setPage(event.state.page);
        return;
      }

      window.history.pushState({ donoApp: true, page: pageRef.current }, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setPage]);

  return (
    <div className="dono-app-shell">
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      <div className="dono-app-column">
        <Navbar onMenuClick={() => setSidebarOpen((open) => !open)} onNavigate={setPage} menuOpen={sidebarOpen} />
        <main className="dono-dashboard-main">
            {!online && <div role="status" style={{ marginBottom: "12px", border: "1px solid #fbbf24", background: "#fffbeb", color: "#92400e", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", fontWeight: 600 }}>You are offline. Previously loaded pages remain available; changes will work only after the connection returns.</div>}

          {subscriptionNotice && (
            <SubscriptionRequiredNotice
              feature={subscriptionNotice.feature}
              message={subscriptionNotice.message}
              onUpgrade={() => { setSubscriptionNotice(null); setPage("subscriptions"); }}
              onDismiss={() => setSubscriptionNotice(null)}
            />
          )}
          {page !== "dashboard" && (
            <div style={{ marginBottom: "12px" }}>
              <button type="button" onClick={() => window.history.back()} style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#334155", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", fontWeight: 600 }}>
                ← Back
              </button>
            </div>
          )}
          {children}
          {!sidebarOpen && <>
            <ScrollNavigator />
            <DONOGuide page={page} setPage={setPage} />
          </>}
        </main>
        <Footer theme="light" withSidebar />
      </div>
    </div>
  );
}
