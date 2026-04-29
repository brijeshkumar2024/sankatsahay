import { useEffect, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { api } from "../../services/api";

export default function VolunteerManager() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAdminVolunteers();
      setVolunteers(data || []);
    } catch (err) {
      setError(err.message || "Failed to load volunteers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setStatus = async (id, status) => {
    await api.updateVolunteerStatusByAdmin(id, status);
    setVolunteers((prev) => prev.map((v) => (v._id === id ? { ...v, availability: status } : v)));
  };

  const assignTask = async (id) => {
    const taskId = prompt("Enter task ID to assign");
    if (!taskId) return;
    await api.assignVolunteerTaskByAdmin(id, taskId);
    setVolunteers((prev) => prev.map((v) => (v._id === id ? { ...v, availability: "assigned", currentTask: taskId } : v)));
  };

  const reassign = async (id) => {
    await api.reassignVolunteerByAdmin(id);
    setVolunteers((prev) => prev.map((v) => (v._id === id ? { ...v, availability: "available", currentTask: null } : v)));
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-xl uppercase tracking-wide">Volunteer Management</h3>
        <Button className="h-9 min-w-0 px-3 text-xs" variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {loading && <p className="text-sm text-muted">Loading volunteers...</p>}
      {error && <p className="rounded-lg border border-alert/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>}

      <div className="space-y-2">
        {!loading && volunteers.length === 0 && <p className="text-sm text-muted">No volunteers found.</p>}
        {volunteers.slice(0, 120).map((v) => (
          <div key={v._id} className="rounded-xl border border-border bg-white/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-text">{v.name || v.userId?.name || "Volunteer"}</p>
                <p className="text-xs text-muted">Skills: {(v.skills || []).join(", ") || "N/A"}</p>
                <p className="text-xs text-muted">Location: {v.location?.coordinates?.[1]?.toFixed?.(4) || "-"}, {v.location?.coordinates?.[0]?.toFixed?.(4) || "-"}</p>
                <p className="text-xs text-muted">Status: {v.availability || "available"}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => assignTask(v._id)}>Assign</Button>
                <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => reassign(v._id)}>Reassign</Button>
                <Button className="h-8 min-w-0 px-2 text-xs" variant="ghost" onClick={() => setStatus(v._id, "busy")}>Mark Busy</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
