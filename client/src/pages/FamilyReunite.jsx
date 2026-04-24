import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import { api } from "../services/api";
import useSimulationFeed from "../hooks/useSimulationFeed";

// ── Demo family members — always shown as fallback ────────────────────────────
const DEMO_FAMILY = [
  { _id: "1", name: "Priya Sharma",  status: "MISSING",    lastSeen: "2 hours ago",  bloodGroup: "O+"  },
  { _id: "2", name: "Rahul Sharma",  status: "SAFE",       lastSeen: "Just now",     bloodGroup: "A+"  },
  { _id: "3", name: "Meera Sharma",  status: "FOUND",      lastSeen: "30 mins ago",  bloodGroup: "B+"  },
  { _id: "4", name: "Arjun Sharma",  status: "SOS ACTIVE", lastSeen: "1 hour ago",   bloodGroup: "AB+" },
];

function statusStyle(status) {
  if (status === "SAFE")       return "text-green-400 bg-green-900/30 border-green-700/40";
  if (status === "FOUND")      return "text-sky-400   bg-sky-900/30   border-sky-700/40";
  if (status === "SOS ACTIVE") return "text-red-400   bg-red-900/30   border-red-700/40 animate-pulse";
  return                              "text-red-400   bg-red-900/30   border-red-700/40";
}

export default function FamilyReunite() {
  const token    = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const user     = useAppStore((s) => s.user) || { name: "Demo User", familyPin: "NEXORA", bloodGroup: "O+" };
  const familySt = useAppStore((s) => s.familyStatus);
  const socket   = useSocket(token);
  useSimulationFeed(socket);

  const qrWrapRef = useRef(null);
  const [members,      setMembers]      = useState(DEMO_FAMILY);
  const [matches,      setMatches]      = useState([]);
  const [uploading,    setUploading]    = useState(false);
  const [imgPreview,   setImgPreview]   = useState(null);
  const [toast,        setToast]        = useState("");

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  const qrData = useMemo(() => JSON.stringify({
    userId:     user?._id || "NEXORA-DEMO-001",
    name:       user?.name || "Demo User",
    familyPin:  user?.familyPin || "NEXORA",
    bloodGroup: user?.bloodGroup || "O+",
    emergency:  "+91 98765 43210",
  }), [user]);

  // Load real family from API, fall back to demo data silently
  useEffect(() => {
    api.familyDashboard(user?.familyPin || "NEXORA")
      .then((d) => { if (d.members?.length) setMembers(d.members); })
      .catch(() => { /* keep DEMO_FAMILY */ });
  }, []);

  // Socket listener for live status updates
  useEffect(() => {
    if (!socket) return;
    socket.emit("join:family", user?.familyPin || "NEXORA");
    const onUpdate = (data) => {
      setMembers((prev) => prev.map((m) =>
        String(m._id) === String(data.memberId || data._id)
          ? { ...m, status: data.status }
          : m
      ));
    };
    socket.on("family:status-update", onUpdate);
    return () => socket.off("family:status-update", onUpdate);
  }, [socket, user]);

  // Mark Safe — optimistic update first, then API
  const markSafe = useCallback(async (memberId) => {
    // 1. Optimistic update
    setMembers((prev) => prev.map((m) => m._id === memberId ? { ...m, status: "SAFE" } : m));
    showToast("Marked as Safe ✓");

    // 2. Emit socket
    socket?.emit("family:status:update", {
      familyPin: user?.familyPin || "NEXORA",
      member: { _id: memberId, status: "SAFE" },
    });

    // 3. Try API (non-blocking)
    api.updateFamilyStatus(memberId, "SAFE").catch(() => {});
  }, [socket, user, showToast]);

  // Face upload with demo fallback
  const handleFaceUpload = useCallback(async (file) => {
    setUploading(true);
    setMatches([]);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setImgPreview(e.target.result);
    reader.readAsDataURL(file);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload  = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const result = await api.faceMatch(base64);
      setMatches(result.matches?.length ? result.matches : getDemoMatches());
    } catch {
      setMatches(getDemoMatches());
    } finally {
      setUploading(false);
    }
  }, []);

  const getDemoMatches = () => [
    { userId: "1", name: "Priya Sharma",  confidence: 87, familyPin: "NEXORA" },
    { userId: "3", name: "Meera Sharma",  confidence: 72, familyPin: "NEXORA" },
  ];

  const downloadQR = () => {
    const svg = qrWrapRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: "sankatsahay-qr.svg" });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-5xl space-y-4 p-4"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-green-500/40 bg-green-950/90 px-6 py-3 text-sm font-semibold text-green-300"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="font-heading text-2xl uppercase tracking-wide">Family Reunification</h2>
        <p className="text-sm text-muted">
          Separated: <span className="text-amber-400">{familySt.separatedCount}</span>
          &nbsp;·&nbsp;
          Reunited: <span className="text-green-400">{familySt.reunitedCount}</span>
        </p>
      </div>

      {/* ── QR + Face match ───────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* QR Card */}
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Emergency QR Card</p>
          <div id="qr-code" ref={qrWrapRef} className="mt-4 flex justify-center">
            <QRCodeSVG value={qrData} size={180} bgColor="transparent" fgColor="#10B981" />
          </div>
          <p className="mt-3 text-center font-mono text-lg text-green-400">{user?.familyPin || "NEXORA"}</p>
          <p className="mt-1 text-center text-xs text-muted">{user?.name || "Demo User"} · {user?.bloodGroup || "O+"}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="ghost" onClick={downloadQR}>Download QR</Button>
            <Button variant="ghost" onClick={() => globalThis.print()}>Print</Button>
          </div>
        </Card>

        {/* Face Match */}
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Face Match</p>

          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-5 text-sm text-muted transition hover:border-green-500/50 hover:text-text">
            {imgPreview
              ? <img src={imgPreview} alt="preview" className="h-24 w-24 rounded-xl object-cover" />
              : <span className="text-3xl">📷</span>
            }
            <span>{uploading ? "Analysing face…" : "Upload photo to find matches"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFaceUpload(f); }}
            />
          </label>

          {uploading && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted">
              <span className="animate-spin">⟳</span> Matching against database…
            </div>
          )}

          <div className="mt-3 space-y-2">
            {matches.map((m) => (
              <div key={m.userId} className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2">
                <div>
                  <p className="font-semibold">{m.name || m.userId}</p>
                  <p className="text-xs text-muted">Confidence: <span className="text-green-400">{m.confidence}%</span></p>
                  {m.familyPin && <p className="text-xs text-muted">PIN: {m.familyPin}</p>}
                </div>
                <Button
                  className="h-9 min-w-0 px-3 text-xs"
                  variant="ghost"
                  onClick={() => {
                    api.updateFamilyStatus(m.userId, "FOUND").catch(() => {});
                    setMembers((prev) => prev.map((mem) => mem._id === m.userId ? { ...mem, status: "FOUND" } : mem));
                    showToast(`${m.name} marked as FOUND ✓`);
                  }}
                >
                  Confirm Match
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Family status cards ───────────────────────────────────────── */}
      <Card>
        <p className="font-mono text-xs uppercase tracking-widest text-muted">Family Status</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {members.map((m) => (
            <div key={m._id} className="flex items-center justify-between rounded-xl border border-border bg-white/5 px-4 py-3">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-xs text-muted">
                  {m.bloodGroup && <span className="mr-2 text-amber-400">{m.bloodGroup}</span>}
                  {m.lastSeen || (m.updatedAt ? new Date(m.updatedAt).toLocaleTimeString() : "")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusStyle(m.status)}`}>
                  {m.status}
                </span>
                {m.status !== "SAFE" && m.status !== "FOUND" && (
                  <Button
                    className="h-8 min-w-0 px-3 text-xs"
                    variant="ghost"
                    onClick={() => markSafe(m._id)}
                  >
                    Mark Safe
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.main>
  );
}
