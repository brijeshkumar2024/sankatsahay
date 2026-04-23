import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Navbar from "./components/shared/Navbar";
import AdminRoute from "./components/shared/AdminRoute";
import useOffline from "./hooks/useOffline";
import useSocket from "./hooks/useSocket";
import useAppStore from "./store/useAppStore";
import useDemoFlow, { useDemoFlowSync } from "./hooks/useDemoFlow";
import { DEMO_MODE } from "./config/demoMode";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SOSPage from "./pages/SOSPage";
import FamilyReunite from "./pages/FamilyReunite";
import VolunteerHub from "./pages/VolunteerHub";
import ShelterFinder from "./pages/ShelterFinder";
import AdminPortal from "./pages/AdminPortal";
import ResourceTracker from "./pages/ResourceTracker";
import OfflineMode from "./pages/OfflineMode";
import DemoRoute from "./pages/DemoRoute";
import SimulationControlPanel from "./pages/SimulationControlPanel";

export default function App() {
  const offline = useOffline();
  const location = useLocation();
  const isSimulationControl = location.pathname === "/sim-control";
  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket = useSocket(token);
  useDemoFlowSync(socket);
  const { currentStep } = useDemoFlow();

  return (
    <div className="min-h-screen bg-bg text-text">
      {!isSimulationControl ? <Navbar /> : null}
      {!isSimulationControl && offline ? (
        <div className="mx-auto max-w-7xl rounded-lg border border-warn/40 bg-warn/20 px-4 py-2 text-sm text-warn">OFFLINE MODE - SMS fallback active</div>
      ) : null}

      {DEMO_MODE && !isSimulationControl ? (
        <div className="mx-auto mt-2 max-w-7xl rounded-md border border-live/40 bg-black/30 px-4 py-2 text-sm">
          Step indicator: <span className="font-mono text-live">{currentStep}</span>
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        <Routes>
          {DEMO_MODE ? <Route path="/" element={<Navigate to="/dashboard" replace />} /> : <Route path="/" element={<Home />} />}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sos" element={<SOSPage />} />
          <Route path="/family" element={<FamilyReunite />} />
          <Route path="/volunteer" element={<VolunteerHub />} />
          <Route path="/admin" element={DEMO_MODE ? <AdminPortal /> : <AdminRoute><AdminPortal /></AdminRoute>} />
          {!DEMO_MODE ? <Route path="/shelter" element={<ShelterFinder />} /> : null}
          {!DEMO_MODE ? <Route path="/resources" element={<ResourceTracker />} /> : null}
          {!DEMO_MODE ? <Route path="/offline" element={<OfflineMode />} /> : null}
          {!DEMO_MODE ? <Route path="/demo" element={<DemoRoute />} /> : null}
          <Route path="/sim-control" element={<SimulationControlPanel />} />
          <Route path="*" element={<Navigate to={DEMO_MODE ? "/dashboard" : "/"} replace />} />
        </Routes>
      </AnimatePresence>

      {!isSimulationControl ? (
        <footer className="mx-auto mt-8 max-w-7xl border-t border-border px-4 py-6 text-sm text-muted">
          Privacy First: Face data processed locally. No biometric storage. GDPR deletion supported.
        </footer>
      ) : null}
    </div>
  );
}
