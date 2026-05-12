import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { listWellness, logWellness, getWellnessCorrelation } from "../api/client";
import type { WellnessLog, WellnessCorrelation } from "../api/client";

type Tab = "log" | "history" | "correlation";

export default function Wellness() {
  const userId = Number(localStorage.getItem("user_id"));
  const [tab, setTab] = useState<Tab>("log");
  const [logs, setLogs] = useState<WellnessLog[]>([]);
  const [correlation, setCorrelation] = useState<WellnessCorrelation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [sleepHours, setSleepHours] = useState("");
  const [sleepQuality, setSleepQuality] = useState("");
  const [energyLevel, setEnergyLevel] = useState("");
  const [mood, setMood] = useState("");
  const [stressLevel, setStressLevel] = useState("");
  const [waterOz, setWaterOz] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (tab === "history") {
      setLoading(true);
      listWellness(userId).then(setLogs).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }
    if (tab === "correlation") {
      setLoading(true);
      getWellnessCorrelation(userId).then(setCorrelation).catch((e) => setError(e.message)).finally(() => setLoading(false));
    }
  }, [tab, userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setSaved(false);
    try {
      await logWellness({
        user_id: userId, date,
        sleep_hours: sleepHours ? Number(sleepHours) : undefined,
        sleep_quality: sleepQuality ? Number(sleepQuality) : undefined,
        energy_level: energyLevel ? Number(energyLevel) : undefined,
        mood: mood ? Number(mood) : undefined,
        stress_level: stressLevel ? Number(stressLevel) : undefined,
        water_oz: waterOz ? Number(waterOz) : undefined,
      });
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    padding: "8px 18px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: 14,
    background: tab === t ? "#4f46e5" : "#f3f4f6",
    color: tab === t ? "#fff" : "#374151",
  });

  return (
    <div>
      <h2 style={styles.heading}>Wellness</h2>
      {error && <div style={styles.error}>{error}</div>}

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button style={tabStyle("log")} onClick={() => setTab("log")}>Log Today</button>
        <button style={tabStyle("history")} onClick={() => setTab("history")}>History</button>
        <button style={tabStyle("correlation")} onClick={() => setTab("correlation")}>Correlation</button>
      </div>

      {tab === "log" && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Log Wellness</h3>
          {saved && <div style={styles.success}>Saved for {date}!</div>}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={styles.label}>Date</label>
              <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div style={styles.scaleRow}>
              {[
                { label: "Sleep Hours", val: sleepHours, set: setSleepHours, placeholder: "e.g. 7.5", step: "0.5", max: "24" },
                { label: "Sleep Quality (1–5)", val: sleepQuality, set: setSleepQuality, placeholder: "1–5", step: "1", max: "5" },
                { label: "Energy Level (1–5)", val: energyLevel, set: setEnergyLevel, placeholder: "1–5", step: "1", max: "5" },
                { label: "Mood (1–5)", val: mood, set: setMood, placeholder: "1–5", step: "1", max: "5" },
                { label: "Stress Level (1–10)", val: stressLevel, set: setStressLevel, placeholder: "1–10", step: "1", max: "10" },
                { label: "Water (oz)", val: waterOz, set: setWaterOz, placeholder: "e.g. 64", step: "1", max: "300" },
              ].map(({ label, val, set, placeholder, step, max }) => (
                <div key={label} style={{ flex: 1, minWidth: 150 }}>
                  <label style={styles.label}>{label}</label>
                  <input style={styles.input} type="number" value={val} onChange={(e) => set(e.target.value)}
                    placeholder={placeholder} step={step} min="0" max={max} />
                </div>
              ))}
            </div>
            <button style={styles.btnPrimary} type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          </form>
        </div>
      )}

      {tab === "history" && (
        loading ? <p style={{ color: "#6b7280" }}>Loading…</p> :
        logs.length === 0 ? <p style={{ color: "#6b7280" }}>No wellness logs yet.</p> : (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr>{["Date", "Sleep hrs", "Sleep Q", "Energy", "Mood", "Stress", "Water (oz)"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.log_id}>
                    <td style={styles.td}>{l.date}</td>
                    <td style={styles.td}>{l.sleep_hours ?? "—"}</td>
                    <td style={styles.td}>{l.sleep_quality ?? "—"}</td>
                    <td style={styles.td}>{l.energy_level ?? "—"}</td>
                    <td style={styles.td}>{l.mood ?? "—"}</td>
                    <td style={styles.td}>{l.stress_level ?? "—"}</td>
                    <td style={styles.td}>{l.water_oz ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "correlation" && (
        loading ? <p style={{ color: "#6b7280" }}>Loading…</p> :
        correlation.length === 0 ? <p style={{ color: "#6b7280" }}>No data yet. Log both wellness and workouts on the same days to see correlation.</p> : (
          <div style={styles.card}>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 14 }}>
              Compares your sleep/energy against workout volume (total lbs lifted) on matching days.
            </p>
            <table style={styles.table}>
              <thead>
                <tr>{["Date", "Sleep hrs", "Energy", "Mood", "Sessions", "Volume (lbs)", "Sets"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {correlation.map((r) => (
                  <tr key={r.date}>
                    <td style={styles.td}>{r.date}</td>
                    <td style={styles.td}>{r.sleep_hours ?? "—"}</td>
                    <td style={styles.td}>{r.energy_level ?? "—"}</td>
                    <td style={styles.td}>{r.mood ?? "—"}</td>
                    <td style={styles.td}>{r.session_count}</td>
                    <td style={styles.td}>{Number(r.total_volume_lbs).toLocaleString()}</td>
                    <td style={styles.td}>{r.total_sets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  error: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  success: { background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  card: { background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  cardTitle: { fontWeight: 600, marginBottom: 16, fontSize: 16 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px" },
  scaleRow: { display: "flex", gap: 12, flexWrap: "wrap" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 12px", fontSize: 12, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "9px 12px", fontSize: 14, borderBottom: "1px solid #f3f4f6" },
  btnPrimary: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" },
};
