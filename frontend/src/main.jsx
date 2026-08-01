import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./App.css";

import "./styles/components.css";
import "./styles/utilities.css";
import "./styles/animations.css";
import "./styles/responsive.css";

import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
