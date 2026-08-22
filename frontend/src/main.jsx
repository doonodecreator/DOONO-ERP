import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import "./App.css";
import "./styles/variables.css";
import "./styles/globals.css";
import "./styles/control-normalization.css";
import "./styles/layout.css";

import "./styles/components.css";
import "./styles/utilities.css";
import "./styles/animations.css";
import "./styles/responsive.css";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext.jsx";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline shell is an enhancement; authentication and API behavior remain unchanged if registration fails.
    });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
