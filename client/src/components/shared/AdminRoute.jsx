import { Navigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function AdminRoute({ children }) {
  // Optional bypass for demos, disabled by default.
  if (import.meta.env.VITE_ADMIN_DEMO_BYPASS === "true") return children;

  const { user, token } = useAppStore();
  const persistedToken = localStorage.getItem("sankat-token");
  const persistedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("sankat-user") || "null");
    } catch {
      return null;
    }
  })();

  const effectiveToken = token || persistedToken;
  const effectiveUser = user || persistedUser;

  if (!effectiveToken) return <Navigate to="/admin-login" replace />;
  if (effectiveUser?.role !== "admin") return <Navigate to="/admin-login" replace />;
  return children;
}
