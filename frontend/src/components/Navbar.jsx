import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { resolveMediaUrl } from "../services/api";
import { getPrimaryRoleSlug, formatRoleLabel } from "../utils/role";
import "./Navbar.css";

function noticeItems(response) {
  const value = response?.data?.data ?? response?.data ?? [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

export default function Navbar({ onMenuClick, onNavigate, menuOpen = false }) {
  const { user, roles, isPlatformAdmin, isOrganizationOwner, school, logout } = useAuth();
  const role = getPrimaryRoleSlug({ roles, isPlatformAdmin, isOrganizationOwner, school });
  const roleLabel = formatRoleLabel(role);
  const contextLabel = isPlatformAdmin ? "Platform workspace" : isOrganizationOwner ? "Organization workspace" : school?.name || "School workspace";
  const initial = user?.name?.charAt(0)?.toUpperCase() || "G";
  const [notices, setNotices] = useState([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    let active = true;

    api.get("/communications", { params: { type: "notice", per_page: 5 } })
      .then((response) => {
        if (active) setNotices(noticeItems(response));
      })
      .catch(() => {
        if (active) setNotices([]);
      });

    return () => {
      active = false;
    };
  }, [school?.id, role]);

  useEffect(() => {
    setAvatarFailed(false);
  }, [user?.avatar_url]);

  const unreadCount = notices.filter((notice) => !notice?.read_at).length;

  async function markNoticeRead(notice) {
    if (!notice?.id || notice.read_at) return false;
    try {
      await api.post(`/communications/${notice.id}/read`);
      setNotices((current) => Array.isArray(current) ? current.map((item) => item.id === notice.id ? { ...item, read_at: new Date().toISOString() } : item) : []);
      return true;
    } catch {
      return false;
    }
  }

  async function openNotice(notice) {
    await markNoticeRead(notice);
  }

  async function toggleNoticePanel() {
    const nextOpen = !noticeOpen;
    setNoticeOpen(nextOpen);
    if (!nextOpen) return;
    const unread = notices.filter((notice) => !notice?.read_at);
    await Promise.allSettled(unread.map((notice) => markNoticeRead(notice)));
  }

  return (
    <header className="dono-navbar">
      <div className="dono-navbar-left">
        <button type="button" onClick={onMenuClick} className="dono-menu-button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="dono-sidebar">
          <span aria-hidden="true">☰</span>
        </button>
        <button type="button" className="dono-navbar-brand" onClick={() => onNavigate?.("dashboard")} aria-label={`Open DOONO De Creator ERP dashboard. Current context: ${contextLabel}`}>
          <strong>DOONO</strong>
          <span>De Creator ERP</span>
          <small>{contextLabel}</small>
        </button>
      </div>

      <div className="dono-navbar-actions">
        <div className="dono-notice-menu">
          <button type="button" className="dono-navbar-icon" aria-label={`School notices${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={noticeOpen} onClick={toggleNoticePanel}>
            <svg className="dono-notice-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>
            {unreadCount > 0 && <span className="dono-notice-count">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          {noticeOpen && (
            <div className="dono-notice-popover" role="dialog" aria-label="School notices">
              <div className="dono-notice-popover-header"><strong>School notices</strong><span>{unreadCount ? `${unreadCount} unread` : "Up to date"}</span></div>
              {notices.length === 0 ? <p className="dono-notice-empty">No published school notices.</p> : <div className="dono-notice-list">{notices.map((notice) => <button type="button" className={`dono-notice-item${notice.read_at ? "" : " dono-notice-item-unread"}`} key={notice.id} onClick={() => openNotice(notice)}><strong>{notice.subject || "School notice"}</strong><span>{notice.body || ""}</span></button>)}</div>}
              <button type="button" className="dono-notice-view-all" onClick={() => { setNoticeOpen(false); onNavigate?.("notices"); }}>View all notices</button>
            </div>
          )}
        </div>
        <span className="dono-role-badge" title={roleLabel}>{roleLabel}</span>
        <button type="button" onClick={logout} className="dono-logout-button"><span className="dono-logout-full">Log out</span><span className="dono-logout-short" aria-hidden="true">Exit</span></button>
        <button type="button" className="dono-avatar" aria-label="Open My Profile" title="My Profile" onClick={() => onNavigate?.("profile")}>
          {user?.avatar_url && !avatarFailed ? <img src={resolveMediaUrl(user.avatar_url)} alt="" onError={() => setAvatarFailed(true)} /> : initial}
        </button>
      </div>
    </header>
  );
}
