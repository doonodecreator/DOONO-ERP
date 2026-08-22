import Footer from "./Footer";
import PublicHeader from "./PublicHeader";
import "./PublicShell.css";

export default function PublicShell({ children, current, className = "", footerTheme = "dark", showHeader = true }) {
  return (
    <div className={`dono-public-shell ${className}`.trim()}>
      {showHeader && <PublicHeader current={current} />}
      <main className="dono-public-shell-main">{children}</main>
      <Footer theme={footerTheme} />
    </div>
  );
}
