import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/shared/Navbar";
import DemoBanner from "./components/shared/DemoBanner";
import DemoStepIndicator from "./components/shared/DemoStepIndicator";
import AdminRoute from "./components/shared/AdminRoute";
import VoiceAI from "./components/ai/VoiceAI";
import useOffline from "./hooks/useOffline";
import useSocket from "./hooks/useSocket";
import useAppStore from "./store/useAppStore";
import { useDemoFlowSync } from "./hooks/useDemoFlow";
import { DEMO_UI_MODE } from "./store/useDemoStore";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SOSPage from "./pages/SOSPage";
import FamilyReunite from "./pages/FamilyReunite";
import VolunteerHub from "./pages/VolunteerHub";
import VolunteerRegister from "./pages/VolunteerRegister";
import VolunteerDashboard from "./pages/VolunteerDashboard";
import ShelterFinder from "./pages/ShelterFinder";
import AdminPortal from "./pages/AdminPortal";
import AdminLogin from "./components/admin/AdminLogin";
import ResourceTracker from "./pages/ResourceTracker";
import OfflineMode from "./pages/OfflineMode";
import DemoRoute from "./pages/DemoRoute";
import SimulationControlPanel from "./pages/SimulationControlPanel";

export default function App() {
  const offline  = useOffline();
  const location = useLocation();
  const navigate = useNavigate();
  const isSimControl = location.pathname === "/sim-control";
  const isAdminLogin = location.pathname === "/admin-login";

  const token  = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);
  useDemoFlowSync(socket);

  // Story mode auto-navigation
  useEffect(() => {
    if (!socket) return;
    const onNavigate = ({ path }) => navigate(path);
    socket.on("demo:navigate", onNavigate);
    return () => socket.off("demo:navigate", onNavigate);
  }, [socket, navigate]);

  return (
    <div className="min-h-screen bg-bg text-text">
      {!isSimControl && !isAdminLogin && <Navbar />}

      {/* Single offline notice */}
      {!isSimControl && !isAdminLogin && offline && (
        <div className="mx-auto max-w-7xl px-4 pt-2">
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/60 px-4 py-2 text-sm text-amber-200">
            OFFLINE MODE — SMS fallback active
          </div>
        </div>
      )}

      {/* Single top banner — replaces all per-page broadcast banners */}
      {!isSimControl && !isAdminLogin && (
        <div className="mx-auto max-w-7xl px-4 pt-3">
          <DemoBanner />
        </div>
      )}

      {/* Step indicator — subtle dot progress + Prev/Next */}
      {!isSimControl && !isAdminLogin && DEMO_UI_MODE && <DemoStepIndicator />}

      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sos"       element={<SOSPage />} />
          <Route path="/family"    element={<FamilyReunite />} />
          <Route path="/volunteer"           element={<VolunteerHub />} />
          <Route path="/volunteer-register"  element={<VolunteerRegister />} />
          <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
          <Route path="/shelter"   element={<ShelterFinder />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPortal />
              </AdminRoute>
            }
          />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/resources"   element={<ResourceTracker />} />
          <Route path="/offline"     element={<OfflineMode />} />
          <Route path="/demo"        element={<DemoRoute />} />
          <Route path="/sim-control" element={<SimulationControlPanel />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      {!isSimControl && !isAdminLogin && (
        <footer className="mx-auto mt-8 max-w-7xl border-t border-border px-4 py-4 text-xs text-muted">
          Face data processed locally · No biometric storage · GDPR deletion supported
        </footer>
      )}

      {/* VoiceAI — global floating button on every page */}
      {!isSimControl && !isAdminLogin && (
        <VoiceAI
          onSOSTrigger={() => navigate("/sos")}
          onPanicDetected={() => {}}
        />
      )}
    </div>
  );
}
