import { Navigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function AdminRoute({ children }) {
  const { user, token } = useAppStore();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
