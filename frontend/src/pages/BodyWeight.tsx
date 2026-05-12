import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { listBodyWeight, logBodyWeight, deleteBodyWeight } from "../api/client";
import type { BodyWeightLog } from "../api/client";

export default function BodyWeight() {
  const userId = Number(localStorage.getItem("user_id"));
  const [logs, setLogs] = useState<BodyWeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    listBodyWeight(userId)
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [userId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await logBodyWeight({ user_id: userId, weight_lbs: Number(weight) });
      setWeight("");
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log weight.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(bwLogId: number) {
    await deleteBodyWeight(bwLogId);
    setLogs((prev) => prev.filter((l) => l.log_id !== bwLogId));
  }

  const latest = logs[0];
  const previous = logs[1];
  const diff = latest && previous ? (latest.weight_lbs - previous.weight_lbs).toFixed(1) : null;

  return (
    <div>
      <h2 style={styles.heading}>Body Weight</h2>
      {error && <div style={styles.error}>{error}</div>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        {latest && (
          <div style={styles.statCard}>
            <div style={styles.statValue}>{latest.weight_lbs} lbs</div>
            <div style={styles.statLabel}>Current</div>
          </div>
        )}
        {diff !== null && (
          <div style={styles.statCard}>
            <div style={{ ...styles.statValue, color: Number(diff) <= 0 ? "#16a34a" : "#dc2626" }}>
              {Number(diff) > 0 ? "+" : ""}{diff} lbs
            </div>
            <div style={styles.statLabel}>vs. Previous</div>
          </div>
        )}
        {logs.length > 1 && (
          <div style={styles.statCard}>
            <div style={styles.statValue}>{logs[logs.length - 1].weight_lbs} lbs</div>
            <div style={styles.statLabel}>Starting ({logs[logs.length - 1].logged_at})</div>
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} style={styles.formRow}>
        <input
          style={{ ...styles.input, width: 160 }}
          type="number"
          step="0.1"
          placeholder="Weight (lbs)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
        />
        <button style={styles.btnPrimary} type="submit" disabled={saving}>
          {saving ? "Logging…" : "Log Weight"}
        </button>
      </form>

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading…</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No entries yet. Log your first weight above.</p>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Date", "Weight", ""].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.log_id}>
                  <td style={styles.td}>{log.logged_at}</td>
                  <td style={styles.td}><strong>{log.weight_lbs}</strong> lbs</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <button style={styles.btnDanger} onClick={() => handleDelete(log.log_id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  error: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  statCard: { background: "#fff", borderRadius: 10, padding: "18px 20px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)", minWidth: 140 },
  statValue: { fontSize: 28, fontWeight: 700, color: "#4f46e5", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#6b7280" },
  formRow: { display: "flex", gap: 10, alignItems: "center", marginBottom: 24 },
  input: { border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px" },
  card: { background: "#fff", borderRadius: 10, padding: 4, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 16px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "10px 16px", fontSize: 14, borderBottom: "1px solid #f3f4f6" },
  btnPrimary: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, cursor: "pointer" },
  btnDanger: { background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 },
};
