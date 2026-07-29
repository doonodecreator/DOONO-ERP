import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";

export default function App() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return <h2 style={{ padding: 40 }}>Loading...</h2>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div
      style={{
        background: "white",
        color: "black",
        minHeight: "100vh",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>DONO School ERP</h1>

      <h2>✅ Login Successful</h2>

      <p>If you can see this page, the problem is NOT authentication.</p>

      <p>
        It means the crash is inside DashboardLayout, Sidebar, Navbar,
        or one of the imported dashboard components.
      </p>
    </div>
  );
}
