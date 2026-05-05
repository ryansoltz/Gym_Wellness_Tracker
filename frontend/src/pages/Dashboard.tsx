import { useEffect, useState } from "react";
import { getDashboardSummary, getRecentPRs } from "../api/client";
import type { DashboardSummary, PersonalRecord } from "../api/client";

export default function Dashboard() {
  const userId = Number(localStorage.getItem("user_id"));
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getDashboardSummary(userId), getRecentPRs(userId)])
      .then(([s, p]) => { setSummary(s); setPrs(p); })
      .catch((e) => setError(e.message));
  }, [userId]);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!summary) return <p style={{ color: "#6b7280" }}>Loading…</p>;

  const statCards = [
    { label: "Total Sessions", value: summary.total_sessions },
    { label: "This Week", value: summary.sessions_this_week },
    { label: "Active Goals", value: summary.active_goals },
    { label: "Exercises with PR", value: summary.exercises_with_pr },
    {
      label: "Lifetime Volume",
      value: `${(summary.lifetime_volume_lbs / 1000).toFixed(1)}k lbs`,
    },
    {
      label: "Current Weight",
      value: summary.latest_bodyweight
        ? `${summary.latest_bodyweight.weight_lbs} lbs`
        : "—",
    },
  ];

  return (
    <div>
      <h2 style={styles.heading}>Dashboard</h2>

      <div style={styles.grid}>
        {statCards.map((c) => (
          <div key={c.label} style={styles.statCard}>
            <div style={styles.statValue}>{c.value}</div>
            <div style={styles.statLabel}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent Personal Records</h3>
        {prs.length === 0 ? (
          <p style={{ color: "#6b7280" }}>No personal records yet. Log a workout to start!</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Exercise", "Weight", "Reps", "Date"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {prs.map((pr) => (
                <tr key={pr.pr_id}>
                  <td style={styles.td}>{pr.exercise_name}</td>
                  <td style={styles.td}>{pr.weight_lbs} lbs</td>
                  <td style={styles.td}>{pr.reps}</td>
                  <td style={styles.td}>{pr.achieved_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {summary.weekly_volume.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Volume — Last 7 Days</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100 }}>
            {summary.weekly_volume.map((d) => {
              const max = Math.max(...summary.weekly_volume.map((x) => x.volume_lbs), 1);
              const pct = (d.volume_lbs / max) * 100;
              return (
                <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", height: `${pct}%`, background: "#4f46e5", borderRadius: 4, minHeight: 4 }} />
                  <span style={{ fontSize: 11, color: "#6b7280" }}>{d.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 },
  statCard: { background: "#fff", borderRadius: 10, padding: "18px 16px", boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  statValue: { fontSize: 26, fontWeight: 700, color: "#4f46e5", marginBottom: 4 },
  statLabel: { fontSize: 13, color: "#6b7280" },
  section: { background: "#fff", borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 14 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "10px 12px", fontSize: 14, borderBottom: "1px solid #f3f4f6" },
};
