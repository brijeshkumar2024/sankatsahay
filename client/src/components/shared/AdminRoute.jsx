import { Navigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";
import { DEMO_UI_MODE } from "../../store/useDemoStore";

export default function AdminRoute({ children }) {
  // In demo mode, bypass auth so judges can access admin without login
  if (DEMO_UI_MODE) return children;

  const { user, token } = useAppStore();
  if (!token) return <Navigate to="/" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
