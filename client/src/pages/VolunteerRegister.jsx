import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import { api } from "../services/api";

const SKILLS = [
  { id: "medical",      label: "Medical",          icon: "🏥" },
  { id: "rescue",       label: "Rescue",            icon: "🚤" },
  { id: "food",         label: "Food Distribution", icon: "🍱" },
  { id: "transport",    label: "Transport",         icon: "🚗" },
  { id: "tech",         label: "Tech Support",      icon: "💻" },
  { id: "translation",  label: "Translation",       icon: "🗣️" },
  { id: "counseling",   label: "Counseling",        icon: "🤝" },
  { id: "diving",       label: "Diving",            icon: "🤿" },
  { id: "construction", label: "Construction",      icon: "🔨" },
];

const LANGUAGES = [
  { id: "hi", label: "हिंदी" },
  { id: "en", label: "English" },
  { id: "or", label: "ଓଡ଼ିଆ" },
  { id: "bn", label: "বাংলা" },
  { id: "ta", label: "தமிழ்" },
  { id: "te", label: "తెలుగు" },
];

export default function VolunteerRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    skills: [], language: "hi", address: "",
    lat: null, lng: null,
  });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [locating, setLocating] = useState(false);

  const toggleSkill = (id) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(id) ? f.skills.filter((s) => s !== id) : [...f.skills, id],
    }));
  };

  const detectLocation = useCallback(() => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => { setLocating(false); setError("Location access denied. Using default Odisha coords."); }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { setError("Name and phone are required."); return; }
    if (form.skills.length === 0)  { setError("Select at least one skill."); return; }
    setLoading(true); setError("");

    try {
      const data = await api.registerVolunteer(form);

      localStorage.setItem("volunteerId",   data.volunteer._id);
      localStorage.setItem("volunteerName", data.volunteer.name);
      navigate("/volunteer-dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-4 p-4"
    >
      <div>
        <h2 className="font-heading text-2xl uppercase tracking-wide">Join as Volunteer</h2>
        <p className="text-sm text-muted">Register to receive rescue tasks and earn trust credits</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name + Phone */}
        <Card>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Personal Details</p>
          <div className="space-y-3">
            <input
              required
              placeholder="Full Name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-text placeholder-muted focus:border-live focus:outline-none"
            />
            <input
              required
              placeholder="Phone Number * (e.g. 9876543210)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-text placeholder-muted focus:border-live focus:outline-none"
            />
            <input
              type="email"
              placeholder="Email (optional)"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-text placeholder-muted focus:border-live focus:outline-none"
            />
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Your Skills *</p>
          <div className="grid grid-cols-3 gap-2">
            {SKILLS.map((s) => {
              const active = form.skills.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSkill(s.id)}
                  className={`rounded-xl border px-3 py-3 text-sm transition ${
                    active
                      ? "border-green-500 bg-green-900/40 text-green-400"
                      : "border-border bg-white/5 text-muted hover:border-border/80 hover:text-text"
                  }`}
                >
                  <span className="block text-xl">{s.icon}</span>
                  <span className="mt-1 block text-xs">{s.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Language */}
        <Card>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Preferred Language</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setForm((f) => ({ ...f, language: l.id }))}
                className={`rounded-lg border px-4 py-2 text-sm transition ${
                  form.language === l.id
                    ? "border-green-500 bg-green-900/40 text-green-400"
                    : "border-border bg-white/5 text-muted hover:text-text"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Location */}
        <Card>
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-muted">Location</p>
          <input
            placeholder="Area / Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="w-full rounded-xl border border-border bg-white/5 px-4 py-3 text-text placeholder-muted focus:border-live focus:outline-none"
          />
          <button
            type="button"
            onClick={detectLocation}
            disabled={locating}
            className="mt-3 w-full rounded-xl border border-sky-500/40 bg-sky-950/40 py-3 text-sm text-sky-300 transition hover:bg-sky-950/60 disabled:opacity-50"
          >
            {locating ? "Detecting…" : form.lat ? `✓ Location captured (${form.lat.toFixed(3)}, ${form.lng.toFixed(3)})` : "📍 Auto-detect My Location"}
          </button>
        </Card>

        {error && (
          <p className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-green-600 py-4 text-lg font-bold text-white transition hover:bg-green-500 disabled:opacity-60"
        >
          {loading ? "Registering…" : "Register as Volunteer →"}
        </button>
      </form>
    </motion.main>
  );
}
