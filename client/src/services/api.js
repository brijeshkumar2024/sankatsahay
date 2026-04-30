import { DEMO_MODE } from "../config/demoMode";

const BASE_URL = import.meta.env.VITE_API_URL;
const DEMO_ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "";
const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";

let adminLoginPromise = null;

async function tryDemoAdminLogin() {
  if (!DEMO_MODE || !DEMO_ADMIN_EMAIL || !DEMO_ADMIN_PASSWORD) return null;
  if (adminLoginPromise) return adminLoginPromise;

  adminLoginPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/admin-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD })
      });

      if (!res.ok) return null;

      const data = await res.json().catch(() => ({}));
      if (!data?.token) return null;

      localStorage.setItem("sankat-token", data.token);
      if (data.user) localStorage.setItem("sankat-user", JSON.stringify(data.user));
      return data.token;
    } catch {
      return null;
    } finally {
      adminLoginPromise = null;
    }
  })();

  return adminLoginPromise;
}

export async function request(path, options = {}, allowRetry = true) {
  const token = localStorage.getItem("sankat-token");
  const { headers: customHeaders = {}, ...restOptions } = options;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...customHeaders
      },
      ...restOptions
    });

    if (res.status === 401 && allowRetry && !path.startsWith("/auth/")) {
      const refreshedToken = await tryDemoAdminLogin();
      if (refreshedToken) {
        return request(path, options, false);
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}: Request failed` }));
      const errorMsg = err.message || "Request failed";
      console.error(`API ${path}:`, errorMsg, { status: res.status, statusText: res.statusText });
      throw new Error(errorMsg);
    }

    return res.json();
  } catch (error) {
    console.error(`API ${path} failed:`, error.message, error.stack);
    throw error;
  }
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
      console.warn("explainAdminDecision fallback:", err?.message || "unknown error");
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
      console.warn("aiExplain fallback:", err?.message || "unknown error");
      return { explanation: `AI ${type} analysis: Optimal action recommended based on current disaster severity.` };
    }
  },
  aiTrafficRoute: async (zoneCoords, disasterType) => {
    try {
      return await request("/ai/traffic-route", { method: "POST", body: JSON.stringify({ zoneCoords, disasterType }) });
    } catch (err) {
      console.warn("aiTrafficRoute fallback:", err?.message || "unknown error");
      // Mock realistic safe path for demo (Bhubaneswar safe route)
      return { routes: [[[20.2961, 85.8245], [20.35, 85.72], [20.52, 85.9]]] };
    }
  },
  aiChat: (message, language, context) => request("/ai/chat", { method: "POST", body: JSON.stringify({ message, language, context }) }),
  assignVolunteer: (payload) => request("/volunteer/assign", { method: "POST", body: JSON.stringify(payload) }),
  getSimulationState: (key = import.meta.env.VITE_SIMULATION_KEY || "sankat-demo-key") => 
    request(`/simulation/state?key=${encodeURIComponent(key)}`),
  sendSimulationCommand: async (command, payload = {}) => {
    const key = import.meta.env.VITE_SIMULATION_KEY || "sankat-demo-key";
    return request("/simulation/command", { 
      method: "POST", 
      headers: { "x-sim-key": key },
      body: JSON.stringify({ command, payload })
    });
  }
};
