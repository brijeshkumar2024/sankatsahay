import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";
import useAppStore from "../../store/useAppStore";
import { api } from "../../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);

  const [email, setEmail] = useState("admin@sankatsahay.in");
  const [password, setPassword] = useState("NEXORA2025");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.adminLogin(email, password);
      localStorage.setItem("sankat-token", data.token);
      localStorage.setItem("sankat-user", JSON.stringify(data.user));
      setAuth(data.token, data.user);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-live">Secure Admin Access</p>
          <h1 className="mt-2 font-heading text-3xl uppercase tracking-wide">SankatSahay Command Login</h1>
          <p className="mt-1 text-sm text-muted">Use authorized admin credentials to access the control center.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm text-muted">
            Email
            <input
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text outline-none focus:border-live"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>

          <label className="block text-sm text-muted">
            Password
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text outline-none focus:border-live"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="rounded-lg border border-alert/40 bg-red-950/50 px-3 py-2 text-sm text-red-300">{error}</p>}

          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login as Admin"}
          </Button>
        </form>
      </Card>
    </main>
  );
}
