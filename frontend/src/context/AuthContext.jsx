import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [school, setSchool] = useState(null);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyContext = useCallback((ctx) => {
    setUser(ctx.user ?? null);
    setOrganization(ctx.organization ?? null);
    setSchool(ctx.school ?? null);
    setRoles(ctx.roles ?? []);
    setPermissions(ctx.permissions ?? []);
    setIsPlatformAdmin(!!ctx.is_platform_admin);
    setOnboardingStep(ctx.onboarding_step ?? null);
  }, []);

  const clearContext = useCallback(() => {
    setUser(null);
    setOrganization(null);
    setSchool(null);
    setRoles([]);
    setPermissions([]);
    setIsPlatformAdmin(false);
    setOnboardingStep(null);
  }, []);

  /**
   * The ONLY place that resolves "what does this user currently have."
   * Never build a user/school object by hand anywhere else in the app —
   * always ask the backend, so this can never drift from server state.
   */
  const refreshContext = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      clearContext();
      return null;
    }

    try {
      const response = await api.get("/me/context");
      applyContext(response.data);
      return response.data;
    } catch (e) {
      localStorage.removeItem("token");
      clearContext();
      return null;
    }
  }, [applyContext, clearContext]);

  useEffect(() => {
    refreshContext().finally(() => setLoading(false));
  }, [refreshContext]);

  /**
   * Call with just the token from /login or /register. Deliberately does
   * NOT accept a pre-built user object — context is always fetched fresh
   * right after, so the frontend can never show a stale/mismatched shape.
   */
  const login = useCallback(
    async (token) => {
      localStorage.setItem("token", token);
      return refreshContext();
    },
    [refreshContext]
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/logout");
    } catch (e) {
      // token may already be invalid — clear local state regardless
    }
    localStorage.removeItem("token");
    clearContext();
  }, [clearContext]);

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        school,
        roles,
        permissions,
        isPlatformAdmin,
        onboardingStep,
        loading,
        login,
        logout,
        refreshContext,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
