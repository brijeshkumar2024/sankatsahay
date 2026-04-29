export default function AdminSidebar({ tabs, activeTab, onChange, onLogout }) {
  return (
    <aside className="glass rounded-2xl p-4">
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
