import { useEffect, useState } from "react";
import { listSessions, getSessionFull, deleteSession } from "../api/client";
import type { WorkoutSession } from "../api/client";

export default function WorkoutHistory() {
  const userId = Number(localStorage.getItem("user_id"));
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [expanded, setExpanded] = useState<Record<number, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listSessions(userId)
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  async function toggleExpand(sessionId: number) {
    if (expanded[sessionId]) {
      setExpanded((prev) => { const n = { ...prev }; delete n[sessionId]; return n; });
    } else {
      const full = await getSessionFull(sessionId);
      setExpanded((prev) => ({ ...prev, [sessionId]: full }));
    }
  }

  async function handleDelete(sessionId: number) {
    if (!confirm("Delete this session?")) return;
    await deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
  }

  if (loading) return <p style={{ color: "#6b7280" }}>Loading…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2 style={styles.heading}>Workout History</h2>
      {sessions.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No sessions yet. Go log a workout!</p>
      ) : (
        sessions.map((s) => {
          const detail = expanded[s.session_id] as (typeof s & { exercises: { name: string; sets: { set_number: number; weight_lbs: number; reps: number }[] }[] }) | undefined;
          return (
            <div key={s.session_id} style={styles.card}>
              <div style={styles.row}>
                <div>
                  <div style={styles.date}>{s.date}</div>
                  {s.duration_minutes && (
                    <div style={styles.meta}>{s.duration_minutes} min</div>
                  )}
                  {s.notes && <div style={styles.meta}>{s.notes}</div>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={styles.btnGhost} onClick={() => toggleExpand(s.session_id)}>
                    {expanded[s.session_id] ? "Collapse" : "Details"}
                  </button>
                  <button style={styles.btnDanger} onClick={() => handleDelete(s.session_id)}>
                    Delete
                  </button>
                </div>
              </div>

              {detail && (
                <div style={{ marginTop: 14 }}>
                  {detail.exercises.map((ex: { name: string; sets: { set_number: number; weight_lbs: number; reps: number }[] }, i: number) => (
                    <div key={i} style={styles.exercise}>
                      <div style={styles.exName}>{ex.name}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {ex.sets.map((set) => (
                          <span key={set.set_number} style={styles.setChip}>
                            {set.weight_lbs} lbs × {set.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  card: { background: "#fff", borderRadius: 10, padding: 18, marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  date: { fontWeight: 600, fontSize: 16 },
  meta: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  btnGhost: { background: "#f3f4f6", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 },
  btnDanger: { background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 },
  exercise: { marginBottom: 10 },
  exName: { fontWeight: 600, fontSize: 14, marginBottom: 4 },
  setChip: { background: "#ede9fe", color: "#4f46e5", borderRadius: 6, padding: "3px 10px", fontSize: 13 },
};
