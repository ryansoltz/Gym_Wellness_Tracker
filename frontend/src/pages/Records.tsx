import { useEffect, useState } from "react";
import { listPRs } from "../api/client";
import type { PersonalRecord } from "../api/client";

export default function Records() {
  const userId = Number(localStorage.getItem("user_id"));
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listPRs(userId)
      .then(setRecords)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const filtered = records.filter((r) =>
    r.exercise_name.toLowerCase().includes(filter.toLowerCase()) ||
    (r.muscle_group ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  // Group by exercise
  const grouped = filtered.reduce<Record<string, PersonalRecord[]>>((acc, r) => {
    (acc[r.exercise_name] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <h2 style={styles.heading}>Personal Records</h2>
      {error && <div style={styles.error}>{error}</div>}

      <input
        style={{ ...styles.input, marginBottom: 20, maxWidth: 320 }}
        placeholder="Filter by exercise or muscle group…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {loading ? (
        <p style={{ color: "#6b7280" }}>Loading…</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p style={{ color: "#6b7280" }}>No personal records yet. Log some sets to set PRs!</p>
      ) : (
        Object.entries(grouped).map(([exerciseName, prs]) => {
          const best = prs.reduce((a, b) => (a.weight_lbs >= b.weight_lbs ? a : b));
          return (
            <div key={exerciseName} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.exName}>{exerciseName}</div>
                  {best.muscle_group && <span style={styles.tag}>{best.muscle_group}</span>}
                </div>
                <div style={styles.bestBadge}>
                  🏆 {best.weight_lbs} lbs × {best.reps}
                </div>
              </div>

              <table style={styles.table}>
                <thead>
                  <tr>
                    {["Weight", "Reps", "Date"].map((h) => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prs
                    .sort((a, b) => new Date(b.achieved_date).getTime() - new Date(a.achieved_date).getTime())
                    .map((pr) => (
                      <tr key={pr.pr_id}>
                        <td style={styles.td}>{pr.weight_lbs} lbs</td>
                        <td style={styles.td}>{pr.reps}</td>
                        <td style={styles.td}>{pr.achieved_date}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  error: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px" },
  card: { background: "#fff", borderRadius: 10, padding: 18, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  exName: { fontWeight: 700, fontSize: 16, marginBottom: 4 },
  tag: { background: "#ede9fe", color: "#4f46e5", borderRadius: 4, padding: "2px 8px", fontSize: 12 },
  bestBadge: { background: "#fef9c3", color: "#854d0e", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 14 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "6px 12px", fontSize: 12, color: "#6b7280", borderBottom: "1px solid #e5e7eb" },
  td: { padding: "8px 12px", fontSize: 14, borderBottom: "1px solid #f3f4f6" },
};
