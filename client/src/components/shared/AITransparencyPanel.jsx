import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import { api } from "../../services/api";

const LAST_SEEN_KEY = "ai_panel_last_seen";

function readLastSeenCount() {
  const raw = localStorage.getItem(LAST_SEEN_KEY);
  const parsed = Number.parseInt(raw || "0", 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function AITransparencyPanel() {
  const [open, setOpen] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [lastSeenCount, setLastSeenCount] = useState(() => readLastSeenCount());
  const [unreadCount, setUnreadCount] = useState(0);

  const markPanelAsSeen = (count) => {
    setLastSeenCount(count);
    localStorage.setItem(LAST_SEEN_KEY, String(count));
    setUnreadCount(0);
  };

  useEffect(() => {
    let mounted = true;
    const fetchDecisions = async () => {
      try {
        const data = await api.getAIDecisions();
        if (mounted) {
          const nextDecisions = Array.isArray(data) ? data : [];
          setDecisions(nextDecisions);

          if (open) {
            markPanelAsSeen(nextDecisions.length);
          } else if (nextDecisions.length > lastSeenCount) {
            setUnreadCount(nextDecisions.length - lastSeenCount);
          } else {
            setUnreadCount(0);
          }
        }
      } catch {
        if (mounted) setDecisions([]);
      }
    };

    fetchDecisions();
    const intervalId = setInterval(fetchDecisions, 30000);
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [open, lastSeenCount]);

  return (
    <>
      <button
        type="button"
        aria-label="Toggle AI Transparency Panel"
        onClick={() => {
          setOpen((current) => {
            const next = !current;
            if (next) {
              markPanelAsSeen(decisions.length);
            }
            return next;
          });
        }}
        className="fixed bottom-5 right-5 z-[70] flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/80 text-live shadow-glow backdrop-blur"
      >
        <Brain size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-alert text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.aside
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass fixed bottom-20 right-5 z-[69] w-[320px] rounded-2xl p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-heading text-sm text-text">AI Transparency Panel</h3>
              <span className="text-[10px] text-muted">last 5</span>
            </div>

            <div className="space-y-2">
              {decisions.length ? (
                decisions.map((d) => (
                  <div key={d.id} className="rounded-xl border border-border bg-white/5 p-2">
                    <p className="text-xs font-semibold text-live">{String(d.decisionType || "other").replaceAll("_", " ")}</p>
                    <p className="text-[11px] text-muted">{new Date(d.timestamp).toLocaleString()}</p>
                    <p className="text-[11px] text-safe">Confidence: {d.confidence}%</p>
                    <p className="line-clamp-2 text-[11px] text-text/90">{d.explanation || "No explanation available."}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted">No AI decisions available yet.</p>
              )}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
