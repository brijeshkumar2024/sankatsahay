export default function AdminSidebar({ tabs, activeTab, onChange, onLogout, onTriggerEmergency, onStartSimulation, onAutoAssign }) {
  return (
    <aside className="glass rounded-2xl p-4 space-y-4">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-live">Admin Console</p>
        <nav className="mt-3 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                activeTab === tab.id
                  ? "border-live bg-live/10 text-live"
                  : "border-border bg-surface text-muted hover:border-live/40 hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="border-t border-border pt-4">
        <p className="font-mono text-xs uppercase tracking-widest text-live mb-3">Super Controls</p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onTriggerEmergency}
            className="w-full rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 animate-pulse"
          >
            🚨 Trigger Emergency
          </button>
          <button
            type="button"
            onClick={onStartSimulation}
            className="w-full rounded-lg border border-orange-500/60 bg-orange-500/10 px-3 py-2 text-xs font-semibold text-orange-400 transition hover:bg-orange-500/20"
          >
            ⚡ Start Simulation
          </button>
          <button
            type="button"
            onClick={onAutoAssign}
            className="w-full rounded-lg border border-blue-500/60 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
          >
            👥 Auto Assign
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-5 w-full rounded-lg border border-alert/60 bg-alert/10 px-3 py-2 text-sm font-semibold text-alert transition hover:bg-alert/20"
      >
        Logout
      </button>
    </aside>
  );
}
