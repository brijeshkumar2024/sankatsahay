import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import { api } from "../services/api";
import useSimulationFeed from "../hooks/useSimulationFeed";
import useDemoFlow from "../hooks/useDemoFlow";

function statusColor(status) {
  if (status === "SAFE")  return "text-green-400 bg-green-900/30 border-green-700/40";
  if (status === "FOUND") return "text-sky-400   bg-sky-900/30   border-sky-700/40";
  return                         "text-red-400   bg-red-900/30   border-red-700/40";
}

export default function FamilyReunite() {
  const { currentStep, setWaitingForUser } = useDemoFlow();
  if (currentStep !== "family") return null;

  const token      = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const user       = useAppStore((s) => s.user) || { name: "Demo User", familyPin: "NEXORA", bloodGroup: "O+" };
  const familySt   = useAppStore((s) => s.familyStatus);
  const socket     = useSocket(token);
  useSimulationFeed(socket);

  const qrWrapRef     = useRef(null);

  const [members,   setMembers]   = useState([]);
  const [matches,   setMatches]   = useState([]);
  const [uploading, setUploading] = useState(false);

  const qrPayload = useMemo(
    () => JSON.stringify({ userId: user?._id || user?.id, name: user?.name, bloodGroup: user?.bloodGroup, familyPin: user?.familyPin || "NEXORA" }),
    [user]
  );

  useEffect(() => {
    api.familyDashboard(user?.familyPin || "NEXORA").then((d) => setMembers(d.members || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:family", user?.familyPin || "NEXORA");
    const onUpdate = (member) => {
      setMembers((prev) => prev.map((m) => (String(m._id) === String(member._id) ? { ...m, ...member } : m)));
    };
    socket.on("family:status-update", onUpdate);
    return () => socket.off("family:status-update", onUpdate);
  }, [socket, user]);

  const onFaceUpload = async (file) => {
    setUploading(true);
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject());
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const result = await api.faceMatch(base64);
    setMatches(result.matches || []);
    setUploading(false);
  };

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
    <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className="mx-auto max-w-5xl space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-wide">Family Reunification</h2>
          <p className="text-sm text-muted">
            Separated: <span className="text-amber-400">{familySt.separatedCount}</span>
            &nbsp;·&nbsp;
            Reunited: <span className="text-green-400">{familySt.reunitedCount}</span>
          </p>
        </div>
      </div>

      {/* ── Top row: QR + Face match ──────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Emergency QR Card</p>
          <div ref={qrWrapRef} className="mt-4 flex justify-center">
            <QRCodeSVG value={qrPayload} size={180} bgColor="transparent" fgColor="#f3f7fb" />
          </div>
          <p className="mt-3 text-center font-mono text-lg text-green-400">{user?.familyPin || "NEXORA"}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button variant="ghost" onClick={downloadQR}>Download QR</Button>
            <Button variant="ghost" onClick={() => globalThis.print()}>Print</Button>
          </div>
        </Card>

        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Face Match</p>
          <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted transition hover:border-live/50 hover:text-text">
            <span className="text-xl">Face Match Upload</span>
            {uploading ? "Analysing..." : "Upload photo to find matches"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFaceUpload(f); }}
            />
          </label>
          <div className="mt-3 space-y-2">
            {matches.map((m) => (
              <div key={m.userId} className="flex items-center justify-between rounded-lg border border-border bg-white/5 px-3 py-2">
                <div>
                  <p className="font-semibold">{m.name || m.userId}</p>
                  <p className="text-xs text-muted">Confidence: {m.confidence}%</p>
                </div>
                <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={() => api.updateFamilyStatus(m.userId, "FOUND")}>
                  Confirm
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Family member status ──────────────────────────────────────── */}
      {members.length > 0 && (
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Family Status</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {members.map((m) => (
              <div key={m._id} className="flex items-center justify-between rounded-xl border border-border bg-white/5 px-4 py-3">
                <div>
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted">
                    {new Date(m.updatedAt || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${statusColor(m.status)}`}>
                    {m.status}
                  </span>
                  {m.status !== "SAFE" && (
                    <Button className="h-8 min-w-0 px-3 text-xs" variant="ghost" onClick={() => api.updateFamilyStatus(m._id, "SAFE")}>
                      Mark Safe
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <p className="text-sm text-muted">Manual checkpoint</p>
        <Button
          className="mt-3"
          onClick={() => {
            setWaitingForUser(false);
            socket?.emit("demo:run-step", { step: "volunteer" });
          }}
        >
          Continue to Volunteer Assignment
        </Button>
      </Card>
    </motion.main>
  );
}
