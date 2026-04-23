import { Navigate, Route, Routes } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/shared/Navbar";
import LanguageSwitcher from "./components/shared/LanguageSwitcher";
import AITransparencyPanel from "./components/shared/AITransparencyPanel";
import AdminRoute from "./components/shared/AdminRoute";
import useOffline from "./hooks/useOffline";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SOSPage from "./pages/SOSPage";
import FamilyReunite from "./pages/FamilyReunite";
import VolunteerHub from "./pages/VolunteerHub";
import ShelterFinder from "./pages/ShelterFinder";
import AdminPortal from "./pages/AdminPortal";
import ResourceTracker from "./pages/ResourceTracker";
import TouristSupport from "./pages/TouristSupport";
import OfflineMode from "./pages/OfflineMode";
import DemoRoute from "./pages/DemoRoute";
import SimulationControlPanel from "./pages/SimulationControlPanel";

export default function App() {
  const offline = useOffline();
  const location = useLocation();
  const isSimulationControl = location.pathname === "/sim-control";

  return (
    <div className="min-h-screen bg-bg text-text">
      {!isSimulationControl ? <Navbar /> : null}
      {!isSimulationControl && offline ? (
        <div className="mx-auto max-w-7xl rounded-lg border border-warn/40 bg-warn/20 px-4 py-2 text-sm text-warn">OFFLINE MODE - SMS fallback active</div>
      ) : null}
      {!isSimulationControl ? (
        <div className="mx-auto flex max-w-7xl justify-end px-4 pt-3">
          <LanguageSwitcher />
        </div>
      ) : null}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sos" element={<SOSPage />} />
          <Route path="/family" element={<FamilyReunite />} />
          <Route path="/volunteer" element={<VolunteerHub />} />
          <Route path="/shelter" element={<ShelterFinder />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPortal />
              </AdminRoute>
            }
          />
          <Route path="/resources" element={<ResourceTracker />} />
          <Route path="/tourist" element={<TouristSupport />} />
          <Route path="/offline" element={<OfflineMode />} />
          <Route path="/demo" element={<DemoRoute />} />
          <Route path="/sim-control" element={<SimulationControlPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      {!isSimulationControl ? (
        <footer className="mx-auto mt-8 max-w-7xl border-t border-border px-4 py-6 text-sm text-muted">
          Privacy First: Face data processed locally. No biometric storage. GDPR deletion supported.
        </footer>
      ) : null}
      {!isSimulationControl ? <AITransparencyPanel /> : null}
    </div>
  );
}
