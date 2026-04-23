import { NavLink } from "react-router-dom";
import useDemoFlow from "../../hooks/useDemoFlow";
import { DEMO_MODE, DEMO_FEATURE_STEPS } from "../../config/demoMode";

const DEFAULT_LINKS = [
  ["/", "Home"],
  ["/dashboard", "Map"],
  ["/sos", "SOS"],
  ["/family", "Family"],
  ["/volunteer", "Volunteer"],
  ["/admin", "Admin"]
];

export default function Navbar() {
  const { currentStep } = useDemoFlow();
  const links = DEMO_MODE
    ? [
      ["/dashboard", "Map"],
      ["/sos", "SOS"],
      ["/family", "Family"],
      ["/volunteer", "Volunteer"],
      ["/admin", "Resolution"]
    ]
    : DEFAULT_LINKS;

  const displayIndex = Math.max(1, DEMO_FEATURE_STEPS.indexOf(currentStep) + 1);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div>
          <h1 className="font-heading text-xl uppercase tracking-[0.12em] text-text">SankatSahay</h1>
          <p className="font-mono text-xs text-muted">Emergency command demo</p>
          {DEMO_MODE ? <p className="font-mono text-xs text-live">Step {displayIndex} / 5</p> : null}
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
