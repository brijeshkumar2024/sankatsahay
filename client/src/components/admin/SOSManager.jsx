import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { api } from "../../services/api";

export default function SOSManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminSOS();
      setItems(data || []);
    } catch (err) {
      setError(err.message || "Failed to load SOS cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id, status) => {
    await api.updateSOSStatus(id, status);
    setItems((prev) => prev.map((item) => (item._id === id ? { ...item, status } : item)));
  };

  const updatePriority = async (id, priority) => {
    await api.updateSOSPriority(id, priority);
    setItems((prev) => prev.map((item) => (item._id === id ? { ...item, priority } : item)));
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-xl uppercase tracking-wide">SOS Management</h3>
        <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {loading && <p className="text-sm text-muted">Loading SOS cases...</p>}
      {error && <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="space-y-2">
        {!loading && items.length === 0 && <p className="text-sm text-muted">No SOS cases found.</p>}
        {items.slice(0, 120).map((item) => (
          <div key={item._id} className="rounded-xl border border-border bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-text">{item.disasterType || "Incident"}</p>
                <p className="text-xs text-muted">Mode: {item.mode || "manual"} · Priority: {item.priority || "high"}</p>
                <p className="text-xs text-muted">Status: {item.status} · {new Date(item.createdAt).toLocaleString()}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => updatePriority(item._id, "high")}>Prioritize</Button>
                <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => updateStatus(item._id, "responding")}>Approve</Button>
                <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => updateStatus(item._id, "resolved")}>Resolve</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
