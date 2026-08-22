import { Link } from "react-router-dom";
import "./PublicHeader.css";

export default function PublicHeader({ current = "home" }) {
  return (
    <header className="dono-public-header">
      <div className="dono-public-header-inner">
        <Link to="/home" className="dono-public-brand" aria-label="DOONO De Creator ERP home">
          <strong>DOONO</strong>
          <span>De Creator ERP</span>
        </Link>
        <nav className="dono-public-nav" aria-label="Public navigation">
          <Link className={current === "login" ? "is-active" : ""} to="/login">Sign in</Link>
          <Link className={`dono-public-nav-primary ${current === "register" ? "is-active" : ""}`} to="/register">Register school</Link>
        </nav>
      </div>
    </header>
  );
}
