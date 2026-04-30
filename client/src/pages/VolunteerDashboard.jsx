import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import useSocket from "../hooks/useSocket";
import useAppStore from "../store/useAppStore";
import { api } from "../services/api";

const DEMO_TASKS = [
  { _id: "demo-1", type: "rescue", priority: "critical", title: "Rescue family trapped at Mahanadi riverbank", description: "Family of 4 stranded. Boat required.", location: { address: "Mahanadi Riverbank, Cuttack" }, requiredSkills: ["Boat Operation", "First Aid"], estimatedTime: "45 min", rewardCredits: 150, status: "open" },
  { _id: "demo-2", type: "medical", priority: "high", title: "Medical aid at Kalinga Stadium camp", description: "Elderly patients need insulin and BP medication.", location: { address: "Kalinga Stadium, Bhubaneswar" }, requiredSkills: ["Medical", "Pharmacy"], estimatedTime: "30 min", rewardCredits: 100, status: "open" },
  { _id: "demo-3", type: "food_delivery", priority: "medium", title: "Food distribution — 200 survivors at KIIT camp", description: "Distribute 200 food packets to registered survivors.", location: { address: "KIIT University, Patia" }, requiredSkills: ["Logistics"], estimatedTime: "1 hour", rewardCredits: 80, status: "open" },
  { _id: "demo-4", type: "evacuation", priority: "high", title: "Evacuate elderly residents from Puri coastal zone", description: "12 elderly residents need transport to shelter.", location: { address: "Marine Drive, Puri" }, requiredSkills: ["Driving", "First Aid"], estimatedTime: "2 hours", rewardCredits: 120, status: "open" },
  { _id: "demo-5", type: "search", priority: "critical", title: "Search for missing child — last seen Cuttack market", description: "8-year-old girl, Anaya Das, separated during flood evacuation.", location: { address: "College Square, Cuttack" }, requiredSkills: ["Search", "Communication"], estimatedTime: "Unknown", rewardCredits: 200, status: "open" },
];

const PRIORITY_STYLE = {
  critical: "bg-red-900/40 text-red-400 border-red-700/40",
  high:     "bg-amber-900/40 text-amber-400 border-amber-700/40",
  medium:   "bg-sky-900/40 text-sky-400 border-sky-700/40",
  low:      "bg-green-900/40 text-green-400 border-green-700/40",
};

const TYPE_ICON = {
  rescue:        "🚤",
  food_delivery: "🍱",
  medical:       "🏥",
  evacuation:    "🚗",
  shelter:       "🏠",
  search:        "🔍",
  other:         "📋",
};

function TrustBar({ score }) {
  const color = score >= 61 ? "bg-green-500" : score >= 31 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
    </div>
  );
}

// ── Rescue modal ──────────────────────────────────────────────────────────────
function RescueModal({ task, volunteerId, onClose, onDone }) {
  const [count,   setCount]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  const submit = async () => {
    setLoading(true);
    const pos = await new Promise((r) =>
      navigator.geolocation?.getCurrentPosition(
        (p) => r({ lat: p.coords.latitude, lng: p.coords.longitude }),
        ()  => r({ lat: 20.2961, lng: 85.8245 })
      )
    );
    const data = await api.markRescued(task._id, { volunteerId, survivorCount: count, ...pos });
    setMsg(data.message || "Rescue recorded!");
    setLoading(false);
    setTimeout(() => { onDone(); onClose(); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-bg p-6"
      >
        <h3 className="font-heading text-xl text-green-400">Mark Rescued 🚤</h3>
        <p className="mt-1 text-sm text-muted">{task.title}</p>

        <div className="mt-4">
          <label className="text-sm text-muted">How many survivors rescued?</label>
          <input
            type="number" min="1" max="100"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-2xl font-bold text-text focus:border-green-500 focus:outline-none"
          />
        </div>

        {msg && <p className="mt-3 text-center font-semibold text-green-400">{msg}</p>}

        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm text-muted hover:text-text">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-60"
          >
            {loading ? "Submitting…" : `Confirm ${count} Rescued — 3× Credits!`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Complete modal ────────────────────────────────────────────────────────────
function CompleteModal({ task, volunteerId, onClose, onDone }) {
  const [notes,   setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [msg,     setMsg]     = useState("");

  const submit = async () => {
    setLoading(true);
    const pos = await new Promise((r) =>
      navigator.geolocation?.getCurrentPosition(
        (p) => r({ lat: p.coords.latitude, lng: p.coords.longitude }),
        ()  => r({ lat: 20.2961, lng: 85.8245 })
      )
    );
    const data = await api.markTaskComplete(task._id, { volunteerId, notes, ...pos });
    setMsg(data.message || "Task completed!");
    setLoading(false);
    setTimeout(() => { onDone(); onClose(); }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4">
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-bg p-6"
      >
        <h3 className="font-heading text-xl text-sky-400">Mark Completed ✓</h3>
        <p className="mt-1 text-sm text-muted">{task.title}</p>

        <textarea
          placeholder="Task notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-4 w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-sm text-text placeholder-muted focus:border-sky-500 focus:outline-none"
        />

        {msg && <p className="mt-3 text-center font-semibold text-green-400">{msg}</p>}

        <div className="mt-4 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-sm text-muted hover:text-text">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 rounded-xl bg-sky-600 py-3 text-sm font-bold text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {loading ? "Submitting…" : `Complete — +${task.rewardCredits} Credits`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function VolunteerDashboard() {
  const navigate    = useNavigate();
  const token       = useAppStore((s) => s.token) || localStorage.getItem("sankat-token");
  const socket      = useSocket(token);
  const volunteerId = localStorage.getItem("volunteerId");
  const volunteerName = localStorage.getItem("volunteerName") || "Volunteer";

  const [profile,     setProfile]     = useState(null);
  const [openTasks,   setOpenTasks]   = useState([]);
  const [myTasks,     setMyTasks]     = useState([]);
  const [modal,       setModal]       = useState(null); // { type: 'rescue'|'complete', task }
  const [notification, setNotification] = useState("");
  const notifTimer = useRef(null);

  const showNotif = useCallback((msg) => {
    setNotification(msg);
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(""), 4000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [tasksData, profileData, myData] = await Promise.all([
        api.getVolunteerTasks(),
        volunteerId ? api.getVolunteerProfile(volunteerId) : Promise.resolve(null),
        volunteerId ? api.getVolunteerMyTasks(volunteerId) : Promise.resolve(null),
      ]);
      setOpenTasks(tasksData.tasks?.length ? tasksData.tasks : DEMO_TASKS);
      if (profileData) {
        setProfile(profileData.volunteer || null);
      }
      if (myData) {
        setMyTasks(myData.tasks || []);
      }
    } catch {
      // Fallback — show demo tasks if server unreachable
      setOpenTasks(DEMO_TASKS);
    }
  }, [volunteerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!socket) return;
    socket.on("task:assigned",  () => { loadData(); showNotif("New task assigned!"); });
    socket.on("task:completed", () => { loadData(); showNotif("Task completed — credits awarded!"); });
    socket.on("task:started",   () => loadData());
    return () => {
      socket.off("task:assigned");
      socket.off("task:completed");
      socket.off("task:started");
    };
  }, [socket, loadData, showNotif]);

  const acceptTask = async (taskId) => {
    if (!volunteerId) return;
    await api.acceptVolunteerTask(taskId, volunteerId);
    showNotif("Task accepted!");
    loadData();
  };

  const startTask = async (taskId) => {
    await api.startVolunteerTask(taskId);
    loadData();
  };

  const trustColor = !profile ? "text-muted" :
    profile.trustScore >= 61 ? "text-green-400" :
    profile.trustScore >= 31 ? "text-amber-400" : "text-red-400";

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-4xl space-y-4 p-4"
    >
      {/* Notification toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-1/2 top-20 z-50 -translate-x-1/2 rounded-xl border border-green-500/40 bg-green-950/90 px-6 py-3 text-sm font-semibold text-green-300"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-wide">{volunteerName}</h2>
            <p className="text-sm text-muted">Volunteer Dashboard</p>
          </div>
          {profile && (
            <div className="text-right">
              <p className={`font-mono text-3xl font-bold ${trustColor}`}>{profile.trustScore}</p>
              <p className="text-xs text-muted">Trust Score</p>
            </div>
          )}
        </div>
        {profile && <TrustBar score={profile.trustScore} />}

        {/* Stats row */}
        {profile && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border bg-white/5 py-3">
              <p className="font-mono text-2xl font-bold text-green-400">{profile.totalTasksCompleted}</p>
              <p className="text-xs text-muted">Tasks Done</p>
            </div>
            <div className="rounded-xl border border-border bg-white/5 py-3">
              <p className="font-mono text-2xl font-bold text-amber-400">{profile.credits}</p>
              <p className="text-xs text-muted">Credits</p>
            </div>
            <div className="rounded-xl border border-border bg-white/5 py-3">
              <p className="font-mono text-2xl font-bold text-sky-400">{profile.availability === "available" ? "✓" : "●"}</p>
              <p className="text-xs text-muted">{profile.availability}</p>
            </div>
          </div>
        )}
      </Card>

      {/* ── My active tasks ─────────────────────────────────────────────── */}
      {myTasks.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-amber-400">Active Task</p>
          {myTasks.map((task) => (
            <Card key={task._id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-2xl">{TYPE_ICON[task.type] || "📋"}</span>
                  <p className="mt-1 font-semibold">{task.title}</p>
                  <p className="text-sm text-muted">{task.location?.address}</p>
                  <span className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[task.priority]}`}>
                    {task.status.toUpperCase()}
                  </span>
                </div>
                <p className="font-mono text-sm text-amber-400">+{task.rewardCredits} cr</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {task.status === "assigned" && (
                  <button
                    onClick={() => startTask(task._id)}
                    className="rounded-xl border border-sky-500/40 bg-sky-950/40 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-950/60"
                  >
                    Start Task
                  </button>
                )}
                <button
                  onClick={() => setModal({ type: "rescue", task })}
                  className="rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500"
                >
                  Mark Rescued 🚤
                </button>
                <button
                  onClick={() => setModal({ type: "complete", task })}
                  className="rounded-xl border border-sky-500/40 bg-sky-950/40 py-3 text-sm font-semibold text-sky-300 hover:bg-sky-950/60"
                >
                  Mark Completed ✓
                </button>
                <button
                  onClick={() => socket?.emit("sos:silent", { userId: volunteerId, lat: 20.2961, lng: 85.8245, type: "volunteer-needs-help", timestamp: new Date().toISOString() })}
                  className="rounded-xl border border-red-500/40 bg-red-950/40 py-3 text-sm font-semibold text-red-300 hover:bg-red-950/60"
                >
                  Need Help 🆘
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Open tasks ──────────────────────────────────────────────────── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Available Tasks ({openTasks.length})</p>
          <button onClick={loadData} className="text-xs text-muted hover:text-text">↻ Refresh</button>
        </div>

        {openTasks.length === 0 && (
          <Card>
            <p className="text-center text-sm text-muted">No open tasks right now. Check back soon.</p>
          </Card>
        )}

        <div className="space-y-3">
          {openTasks.map((task) => (
            <Card key={task._id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{TYPE_ICON[task.type] || "📋"}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${PRIORITY_STYLE[task.priority]}`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold">{task.title}</p>
                  {task.description && <p className="mt-1 text-sm text-muted">{task.description}</p>}
                  <p className="mt-1 text-xs text-muted">📍 {task.location?.address}</p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(task.requiredSkills || []).map((s) => (
                      <span key={s} className="rounded-md border border-border bg-white/5 px-2 py-0.5 text-xs text-muted">{s}</span>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                    {task.estimatedTime && <span>⏱ {task.estimatedTime}</span>}
                    <span className="font-semibold text-amber-400">+{task.rewardCredits} credits</span>
                  </div>
                </div>

                <button
                  onClick={() => acceptTask(task._id)}
                  className="shrink-0 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-500"
                >
                  Accept
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Certificate ─────────────────────────────────────────────────── */}
      {profile && profile.totalTasksCompleted > 0 && (
        <Card>
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Achievement</p>
          <p className="mt-2 text-sm">
            {profile.totalTasksCompleted} task{profile.totalTasksCompleted !== 1 ? "s" : ""} completed ·{" "}
            <span className="text-amber-400">{profile.credits} credits earned</span>
          </p>
          <button
            onClick={() => window.print()}
            className="mt-3 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-2 text-sm text-amber-300 hover:bg-amber-950/60"
          >
            Download Certificate
          </button>
        </Card>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modal?.type === "rescue" && (
          <RescueModal
            task={modal.task}
            volunteerId={volunteerId}
            onClose={() => setModal(null)}
            onDone={loadData}
          />
        )}
        {modal?.type === "complete" && (
          <CompleteModal
            task={modal.task}
            volunteerId={volunteerId}
            onClose={() => setModal(null)}
            onDone={loadData}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
