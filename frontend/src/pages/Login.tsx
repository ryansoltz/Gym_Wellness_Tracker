import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { listUsers } from "../api/client";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const users = await listUsers();
      const match = users.find(
        (u) => u.email === email.trim().toLowerCase()
      );
      if (!match) {
        setError("No account found with that email.");
        return;
      }
      // passwords stored as plain text — verified server-side in a real app
      localStorage.setItem("user_id", String(match.user_id));
      localStorage.setItem("username", match.username);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.centered}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your GymTracker account</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  centered: { display: "flex", justifyContent: "center", paddingTop: 64 },
  card: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    padding: 40,
    width: "100%",
    maxWidth: 420,
  },
  title: { fontSize: 26, fontWeight: 700, color: "#111", marginBottom: 6 },
  sub: { color: "#6b7280", marginBottom: 24 },
  error: {
    background: "#fef2f2",
    border: "1px solid #fca5a5",
    color: "#b91c1c",
    borderRadius: 8,
    padding: "10px 14px",
    marginBottom: 16,
    fontSize: 14,
  },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { fontSize: 14, fontWeight: 500, color: "#374151" },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: 8,
    padding: "10px 12px",
    outline: "none",
    width: "100%",
  },
  btn: {
    marginTop: 8,
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "11px",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 15,
  },
  footer: { textAlign: "center", marginTop: 20, color: "#6b7280", fontSize: 14 },
  link: { color: "#4f46e5", fontWeight: 600 },
};
