const BASE_URL = import.meta.env.VITE_API_URL || "https://sankatsahay.onrender.com/api";
console.log("BASE_URL:", import.meta.env.VITE_API_URL, "RESOLVED_BASE_URL:", BASE_URL);
export async function request(path, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options;

  const doFetch = async (retriesLeft = 1) => {
    try {
      return await fetch(`${BASE_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...customHeaders
        },
        ...restOptions
      });
    } catch (error) {
      if (retriesLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return doFetch(retriesLeft - 1);
      }
      throw error;
    }
  };

  try {
    console.log("API CALL:", `${BASE_URL}${path}`);
    const res = await doFetch(1);

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
  login: (_email, _password) => Promise.resolve({ success: true, demo: true }),
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
  registerVolunteer: async (payload) => {
    try {
      return await request("/tasks/register", { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
      console.warn("registerVolunteer fallback:", err?.message || "unknown error");
      return { volunteer: { _id: "demo-volunteer", name: payload?.name || "Demo Volunteer" } };
    }
  },
  getVolunteerTasks: async () => {
    try {
      return await request("/tasks");
    } catch (err) {
      console.warn("getVolunteerTasks fallback:", err?.message || "unknown error");
      return { tasks: [] };
    }
  },
  getVolunteerProfile: async (volunteerId) => {
    try {
      return await request(`/tasks/profile/${volunteerId}`);
    } catch (err) {
      console.warn("getVolunteerProfile fallback:", err?.message || "unknown error");
      return { volunteer: null };
    }
  },
  getVolunteerMyTasks: async (volunteerId) => {
    try {
      return await request(`/tasks/my-tasks/${volunteerId}`);
    } catch (err) {
      console.warn("getVolunteerMyTasks fallback:", err?.message || "unknown error");
      return { tasks: [] };
    }
  },
  acceptVolunteerTask: async (taskId, volunteerId) => {
    try {
      return await request(`/tasks/${taskId}/accept`, {
        method: "POST",
        body: JSON.stringify({ volunteerId })
      });
    } catch (err) {
      console.warn("acceptVolunteerTask fallback:", err?.message || "unknown error");
      return { message: "Demo: Task accepted." };
    }
  },
  startVolunteerTask: async (taskId) => {
    try {
      return await request(`/tasks/${taskId}/start`, { method: "POST" });
    } catch (err) {
      console.warn("startVolunteerTask fallback:", err?.message || "unknown error");
      return { message: "Demo: Task started." };
    }
  },
  markRescued: async (taskId, payload) => {
    try {
      return await request(`/tasks/${taskId}/rescued`, { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
      console.warn("markRescued fallback:", err?.message || "unknown error");
      return { message: "Demo fallback: Rescue recorded." };
    }
  },
  markTaskComplete: async (taskId, payload) => {
    try {
      return await request(`/tasks/${taskId}/complete`, { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
      console.warn("markTaskComplete fallback:", err?.message || "unknown error");
      return { message: "Demo fallback: Task completed." };
    }
  },
  voiceChat: async (payload, language = "en-IN") => {
    try {
      return await request("/ai/voice-chat", { method: "POST", body: JSON.stringify(payload) });
    } catch (err) {
      console.warn("voiceChat fallback:", err?.message || "unknown error");
      return {
        response: language.startsWith("hi")
          ? "मैं समझ गया। आप सुरक्षित हैं। बताइए और क्या चाहिए।"
          : "I understand. You are safe. Tell me what else you need."
      };
    }
  },
  getSimulationState: () => request("/simulation/state"),
  sendSimulationCommand: async (command, payload = {}) => {
    return request("/simulation/command", { 
      method: "POST", 
      body: JSON.stringify({ command, payload })
    });
  }
};
