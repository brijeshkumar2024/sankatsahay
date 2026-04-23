import { NavLink } from "react-router-dom";

const links = [
  ["/", "Home"],
  ["/sos", "SOS"],
  ["/dashboard", "Live Map"],
  ["/family", "Family"],
  ["/admin", "Admin"],
  ["/demo", "Demo"]
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="font-heading text-2xl uppercase tracking-[0.12em] text-text">SankatSahay</h1>
          <p className="font-mono text-xs text-muted">National Emergency Command Interface</p>
        </div>
        <nav className="flex gap-2 overflow-x-auto">
          {links.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm uppercase tracking-[0.06em] ${isActive ? "bg-live text-bg" : "glass text-text"}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
