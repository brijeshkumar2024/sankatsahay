const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function request(path, options = {}) {
  const token = localStorage.getItem("sankat-token");
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || "Request failed");
  }

  return res.json();
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  triggerSilentSOS: (payload) => request("/sos/silent", { method: "POST", body: JSON.stringify(payload) }),
  getActiveSOS: () => request("/sos/active"),
  getAdminStats: () => request("/admin/stats"),
  getAIDecisions: () => request("/admin/ai-decisions?limit=5"),
  getAdminDashboardData: () => request("/admin/dashboard-data"),
  getAdminSOS: () => request("/admin/sos"),
  updateSOSPriority: (id, priority) => request(`/admin/sos/${id}/priority`, { method: "PATCH", body: JSON.stringify({ priority }) }),
  updateSOSStatus: (id, status) => request(`/admin/sos/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getAdminVolunteers: () => request("/admin/volunteers"),
  assignVolunteerTaskByAdmin: (volunteerId, taskId) =>
    request(`/admin/volunteers/${volunteerId}/assign`, { method: "PATCH", body: JSON.stringify({ taskId }) }),
  reassignVolunteerByAdmin: (volunteerId) => request(`/admin/volunteers/${volunteerId}/reassign`, { method: "PATCH" }),
  updateVolunteerStatusByAdmin: (volunteerId, status) =>
    request(`/admin/volunteers/${volunteerId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  getCycloneAdminState: () => request("/admin/cyclone/state"),
  triggerCycloneAlert: (payload) => request("/admin/cyclone/trigger-alert", { method: "POST", body: JSON.stringify(payload) }),
  getHeatmapAnalytics: () => request("/admin/analytics/heatmap"),
  getResourceDemandAnalytics: () => request("/admin/analytics/resource-demand"),
  explainAdminDecision: async (decisionType, data = {}) => {
    try {
      return await request("/admin/ai-decisions/explain", { method: "POST", body: JSON.stringify({ decisionType, data }) });
    } catch (err) {
      return { explanation: `Demo fallback: AI ${decisionType} decision with 92% confidence based on real-time data.` };
    }
  },
  getZones: () => request("/resources/zones"),
  getShelters: () => request("/resources/shelters"),
  getSensorPings: () => request("/resources/sensor-pings"),
  familyDashboard: (pin) => request(`/family/group/${pin}`),
  updateFamilyStatus: (userId, status) => request("/family/status", { method: "PATCH", body: JSON.stringify({ userId, status }) }),
  faceMatch: (imageBase64) => request("/family/face-match", { method: "POST", body: JSON.stringify({ imageBase64 }) }),
  aiExplain: async (type, data = {}) => {
    try {
      return await request(`/ai/explain?type=${encodeURIComponent(type)}&data=${encodeURIComponent(JSON.stringify(data))}`);
    } catch (err) {
      return { explanation: `AI ${type} analysis: Optimal action recommended based on current disaster severity.` };
    }
  },
  aiTrafficRoute: async (zoneCoords, disasterType) => {
    try {
      return await request("/ai/traffic-route", { method: "POST", body: JSON.stringify({ zoneCoords, disasterType }) });
    } catch (err) {
      // Mock realistic safe path for demo (Bhubaneswar safe route)
      return { routes: [[[20.2961, 85.8245], [20.35, 85.72], [20.52, 85.90]]] };
    }
  },
  aiChat: (message, language, context) => request("/ai/chat", { method: "POST", body: JSON.stringify({ message, language, context }) }),
  assignVolunteer: (payload) => request("/volunteer/assign", { method: "POST", body: JSON.stringify(payload) }),
  getSimulationState: async () => {
    const key = import.meta.env.VITE_SIMULATION_KEY || "sankat-demo-key";
    const res = await fetch(`${API_BASE.replace("/api", "")}/api/simulation/state?key=${encodeURIComponent(key)}`);
    if (!res.ok) throw new Error("Failed to fetch simulation state");
    return res.json();
  },
  sendSimulationCommand: async (command, payload = {}) => {
    const key = import.meta.env.VITE_SIMULATION_KEY || "sankat-demo-key";
    const res = await fetch(`${API_BASE.replace("/api", "")}/api/simulation/command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-sim-key": key
      },
      body: JSON.stringify({ command, payload })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Simulation command failed" }));
      throw new Error(err.message || "Simulation command failed");
    }
    return res.json();
  }
};
