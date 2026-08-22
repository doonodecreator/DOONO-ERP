import { Link } from "react-router-dom";
import PublicShell from "../components/layout/PublicShell";
import "./PublicHome.css";

export default function PublicHome() {
  return (
    <PublicShell current="home" className="dono-home-shell" footerTheme="dark">
      <section className="dono-home-hero" aria-labelledby="home-title">
        <div className="dono-home-eyebrow">Enterprise multi-branch school management</div>
        <h1 id="home-title">The operating system for modern schools</h1>
        <p>Automate student records, fee payments, results, timetables, communication, and multi-branch operations with DOONO De Creator ERP.</p>
        <div className="dono-home-actions">
          <Link to="/register" className="dono-home-primary-action">Register your school free</Link>
          <Link to="/login" className="dono-home-secondary-action">School login portal</Link>
        </div>
      </section>
    </PublicShell>
  );
}
