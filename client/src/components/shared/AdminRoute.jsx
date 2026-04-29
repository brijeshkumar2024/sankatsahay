import { Navigate } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function AdminRoute({ children }) {
  // Demo bypass enabled: direct access to admin panel
  return children;
}
