import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { QRCodeSVG } from "qrcode.react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useAppStore from "../store/useAppStore";
import useSocket from "../hooks/useSocket";
import { api } from "../services/api";
import useSimulationFeed from "../hooks/useSimulationFeed";

function getStatusBadgeClass(status) {
  if (status === "SAFE") return "bg-safe/20 text-safe";
  if (status === "FOUND") return "bg-live/20 text-live";
  return "bg-alert/20 text-alert";
}

export default function FamilyReunite() {
  const token = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const user = useAppStore((s) => s.user) || { name: "Demo User", familyPin: "NEXORA", bloodGroup: "O+" };
  const socket = useSocket(token);
  useSimulationFeed(socket);
  const familyStatus = useAppStore((s) => s.familyStatus);
  const simulation = useAppStore((s) => s.simulation);
  const qrWrapRef = useRef(null);

  const [members, setMembers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [uploading, setUploading] = useState(false);

  const qrPayload = useMemo(
    () => JSON.stringify({ userId: user?._id || user?.id, name: user?.name, bloodGroup: user?.bloodGroup, familyPin: user?.familyPin || "NEXORA" }),
    [user]
  );

  const loadFamily = async () => {
    const data = await api.familyDashboard(user?.familyPin || "NEXORA");
    setMembers(data.members || []);
  };

  useEffect(() => {
    loadFamily().catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join:family", user?.familyPin || "NEXORA");
    const handleStatusUpdate = (member) => {
      setMembers((prev) => prev.map((m) => (String(m._id) === String(member._id) ? { ...m, ...member } : m)));
      if (member.status === "FOUND") {
        confetti({ particleCount: 120, spread: 75, origin: { y: 0.7 } });
      }
    };
    socket.on("family:status-update", handleStatusUpdate);
    return () => socket.off("family:status-update", handleStatusUpdate);
  }, [socket, user]);

  const onFaceUpload = async (file) => {
    setUploading(true);
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Failed to read image as base64"));
      };
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
    const serializer = new XMLSerializer();
    const src = serializer.serializeToString(svg);
    const blob = new Blob([src], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sankatsahay-qr.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.main initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`mx-auto max-w-7xl space-y-4 p-4 ${simulation.phase >= 3 ? "panic-ui" : ""}`}>
      <div className="broadcast-banner rounded-xl px-4 py-3">
        <p className="text-xs text-red-100">REUNIFICATION MODE :: phase {simulation.phase}</p>
        <p className="mt-1 text-sm text-white">
          Separated: {familyStatus.separatedCount} | Reunited: {familyStatus.reunitedCount}
        </p>
      </div>
      <h2 className="font-heading text-3xl">Family Reunification</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Emergency QR Card</p>
          <div ref={qrWrapRef} className="mt-3 flex justify-center">
            <QRCodeSVG value={qrPayload} size={200} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={downloadQR}>Download QR</Button>
            <Button variant="ghost" onClick={() => globalThis.print()}>Print QR Card</Button>
          </div>
        </Card>

        <Card>
          <p className="text-sm text-muted">Face Match Upload</p>
          <input
            type="file"
            accept="image/*"
            className="mt-3 w-full"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFaceUpload(file);
            }}
          />
          <p className="mt-2 text-xs text-muted">{uploading ? "Analyzing face..." : "Upload child/elder image to find top 3 matches"}</p>
          <div className="mt-3 space-y-2">
            {matches.map((m) => (
              <div key={m.userId} className="rounded-lg border border-border bg-white/5 p-2">
                <p className="font-semibold">{m.name || m.userId}</p>
                <p className="text-sm text-muted">Confidence: {m.confidence}%</p>
                <Button className="mt-2" variant="ghost" onClick={() => api.updateFamilyStatus(m.userId, "FOUND")}>Confirm Match</Button>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm text-muted">Family PIN</p>
          <p className="mt-1 font-mono text-3xl text-live">{user?.familyPin || "NEXORA"}</p>
          <p className="mt-3 text-xs text-muted">
            Latest match: {familyStatus.latestMatch?.memberName || "Awaiting candidate"}
            {" "}
            {familyStatus.latestMatch?.confidence ? `(${familyStatus.latestMatch.confidence}%)` : ""}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="font-heading text-xl">Family Status Dashboard</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {members.map((m) => (
            <div key={m._id} className="rounded-xl border border-border bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{m.name}</p>
                <span className={`rounded-full px-3 py-1 text-xs ${getStatusBadgeClass(m.status)}`}>
                  {m.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">Last seen: {new Date(m.updatedAt || Date.now()).toLocaleString()}</p>
              <p className="font-mono text-xs text-muted">Map pin: {m.lastKnownLocation?.coordinates?.join(", ")}</p>
              <Button className="mt-3" variant="ghost" onClick={() => api.updateFamilyStatus(m._id, "SAFE")}>Mark as Safe</Button>
            </div>
          ))}
        </div>
      </Card>
    </motion.main>
  );
}
