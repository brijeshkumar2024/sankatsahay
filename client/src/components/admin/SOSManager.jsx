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
    try {
      await api.updateSOSStatus(id, status);
      setItems((prev) => prev.map((item) => {
        if (item._id === id) return { ...item, status };
        return item;
      }));
    } catch (err) {
      setError("Update failed: " + err.message);
    }
  };

  const updatePriority = async (id, priority) => {
    try {
      await api.updateSOSPriority(id, priority);
      setItems((prev) => prev.map((item) => {
        if (item._id === id) return { ...item, priority };
        return item;
      }));
    } catch (err) {
      setError("Priority update failed: " + err.message);
    }
  };

  const triggerTestSOS = async () => {
    try {
      await api.triggerSilentSOS({
        coordinates: [20.2961, 85.8245], // Bhubaneswar center
        mode: "demo-test",
        disasterType: "Cyclone"
      });
      load(); // Refresh list
    } catch (err) {
      setError("Test SOS failed: " + err.message);
    }
  };

  const autoResolveAll = async () => {
    for (const item of items) {
      if (item.status !== "resolved") {
        await updateStatus(item._id, "resolved");
      }
    }
    load();
  };

  return (
    <Card>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-xl uppercase tracking-wide">SOS Management</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            className="h-9 px-3 text-xs" 
            variant="secondary" 
            onClick={triggerTestSOS}
          >
            🚨 Trigger Test SOS
          </Button>
          <Button 
            className="h-9 px-3 text-xs bg-green-600 hover:bg-green-700" 
            onClick={autoResolveAll}
          >
            ✅ Auto Resolve All
          </Button>
          <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={load}>
            Refresh
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted">Loading SOS cases...</p>}
      {error && <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="max-h-96 overflow-y-auto space-y-2 rounded-lg border">
        {!loading && items.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">No active SOS cases.</p>
            <p className="mt-2 text-xs text-muted-foreground">Use "Trigger Test SOS" to simulate</p>
          </div>
        )}
        {items.slice(0, 120).map((item) => {
          let priorityClass = "bg-yellow-500";
          if (item.priority === "critical") priorityClass = "bg-red-500";
          else if (item.priority === "high") priorityClass = "bg-orange-500";

          let statusClass = "bg-red-500/20 text-red-400";
          if (item.status === "resolved") statusClass = "bg-green-500/20 text-green-400";
          else if (item.status === "responding") statusClass = "bg-blue-500/20 text-blue-400";

          return (
            <div key={item._id} className="rounded-xl border border-border bg-gradient-to-r from-muted/50 to-white/10 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded-full ${priorityClass} animate-pulse`} />
                    <p className="font-semibold text-lg text-text">{item.disasterType || "Incident"}</p>
                  </div>
                  <p className="text-xs text-muted">Mode: <span className="font-mono">{item.mode || "manual"}</span></p>
                  <p className="text-xs text-muted">Priority: <span className="font-semibold uppercase">{item.priority || "high"}</span></p>
                  <p className="text-xs text-muted">
                    Status: <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusClass}`}>{item.status || "active"}</span> · {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-nowrap gap-1">
                  <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => updatePriority(item._id, "critical")}>
                    Critical
                  </Button>
                  <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => updatePriority(item._id, "high")}>
                    High
                  </Button>
                  <Button className="h-8 min-w-0 px-2 text-xs bg-blue-600 hover:bg-blue-700" onClick={() => updateStatus(item._id, "responding")}>
                    Respond
                  </Button>
                  <Button className="h-8 min-w-0 px-2 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(item._id, "resolved")}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
