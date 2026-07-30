useEffect(() => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (
    token &&
    token !== "undefined" &&
    storedUser &&
    storedUser !== "undefined"
  ) {
    try {
      setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to parse stored user", e);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  setLoading(false);
}, []);

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
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
