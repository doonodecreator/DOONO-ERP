import { useEffect, useState } from "react";
import "./ScrollNavigator.css";

function getScrollState() {
  const documentElement = document.documentElement;
  const maxScroll = Math.max(0, documentElement.scrollHeight - window.innerHeight);
  const top = window.scrollY || documentElement.scrollTop || 0;
  const atTop = top <= 48;
  const atBottom = maxScroll <= 48 || top >= maxScroll - 48;
  return {
    canScroll: maxScroll > 120,
    atTop,
    atBottom,
    progress: maxScroll ? Math.min(100, Math.round((top / maxScroll) * 100)) : 0,
  };
}

export default function ScrollNavigator() {
  const [state, setState] = useState(() => ({ canScroll: false, atTop: true, atBottom: false, progress: 0 }));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setState(getScrollState()));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  if (!state.canScroll) return null;

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function continueDown() {
    window.scrollBy({ top: Math.max(280, Math.round(window.innerHeight * 0.72)), behavior: "smooth" });
  }

  return (
    <div className="dono-scroll-navigator" aria-label="Page scrolling controls">
      <div className="dono-scroll-progress" role="progressbar" aria-label="Page reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow={state.progress}>
        <span style={{ width: `${state.progress}%` }} />
      </div>
      {!state.atTop && <button type="button" className="dono-scroll-action dono-scroll-top" onClick={scrollToTop} aria-label="Back to top">↑ <span>Top</span></button>}
      {!state.atBottom && <button type="button" className="dono-scroll-action dono-scroll-continue" onClick={continueDown} aria-label="Continue down the page">↓ <span>Continue</span></button>}
    </div>
  );
}
