import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { listExercises, createSession, addExerciseToSession, logSet } from "../api/client";
import type { Exercise } from "../api/client";

interface SetEntry { weight: string; reps: string; }
interface ExerciseEntry { exercise_id: number; sets: SetEntry[]; }

export default function LogWorkout() {
  const userId = Number(localStorage.getItem("user_id"));
  const navigate = useNavigate();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState<ExerciseEntry[]>([{ exercise_id: 0, sets: [{ weight: "", reps: "" }] }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { listExercises().then(setExercises); }, []);

  function addExercise() {
    setEntries((prev) => [...prev, { exercise_id: 0, sets: [{ weight: "", reps: "" }] }]);
  }

  function removeExercise(i: number) {
    setEntries((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addSet(exIdx: number) {
    setEntries((prev) => prev.map((ex, i) =>
      i === exIdx ? { ...ex, sets: [...ex.sets, { weight: "", reps: "" }] } : ex
    ));
  }

  function removeSet(exIdx: number, setIdx: number) {
    setEntries((prev) => prev.map((ex, i) =>
      i === exIdx ? { ...ex, sets: ex.sets.filter((_, si) => si !== setIdx) } : ex
    ));
  }

  function updateEntry(exIdx: number, field: "exercise_id", value: number): void;
  function updateEntry(exIdx: number, field: "set", setIdx: number, key: keyof SetEntry, value: string): void;
  function updateEntry(exIdx: number, field: string, ...args: unknown[]) {
    setEntries((prev) => prev.map((ex, i) => {
      if (i !== exIdx) return ex;
      if (field === "exercise_id") return { ...ex, exercise_id: args[0] as number };
      const [setIdx, key, value] = args as [number, keyof SetEntry, string];
      return { ...ex, sets: ex.sets.map((s, si) => si === setIdx ? { ...s, [key]: value } : s) };
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (entries.some((ex) => ex.exercise_id === 0)) {
      setError("Please select an exercise for each entry."); return;
    }
    setSaving(true);
    try {
      const session = await createSession({
        user_id: userId,
        date,
        duration_minutes: duration ? Number(duration) : undefined,
        notes: notes || undefined,
      });

      let newPrLogged = false;

      for (let order = 0; order < entries.length; order++) {
        const entry = entries[order];

        const { workout_exercise_id } = await addExerciseToSession({
          session_id: session.session_id,
          exercise_id: entry.exercise_id,
          order_num: order + 1,
        });

        for (let si = 0; si < entry.sets.length; si++) {
          const s = entry.sets[si];

          if (!s.weight || !s.reps) continue;

          const result = await logSet({
            workout_exercise_id,
            set_number: si + 1,
            weight_lbs: Number(s.weight),
            reps: Number(s.reps),
          });

          if (result.new_pr) {
            newPrLogged = true;
          }
        }
      }

      if (newPrLogged) {
        localStorage.setItem("new_pr_logged", "true");
      }

      navigate("/history");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save workout.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2 style={styles.heading}>Log Workout</h2>
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Session Details</h3>
          <div style={styles.row}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Date</label>
              <input style={styles.input} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Duration (min)</label>
              <input style={styles.input} type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <label style={styles.label}>Notes</label>
          <input style={styles.input} type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>

        {entries.map((entry, exIdx) => (
          <div key={exIdx} style={styles.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={styles.cardTitle}>Exercise {exIdx + 1}</h3>
              {entries.length > 1 && (
                <button type="button" style={styles.btnDanger} onClick={() => removeExercise(exIdx)}>Remove</button>
              )}
            </div>

            <select
              style={styles.input}
              value={entry.exercise_id}
              onChange={(e) => updateEntry(exIdx, "exercise_id", Number(e.target.value))}
              required
            >
              <option value={0}>— Select exercise —</option>
              {exercises.map((ex) => (
                <option key={ex.exercise_id} value={ex.exercise_id}>{ex.name}</option>
              ))}
            </select>

            <div style={{ marginTop: 12 }}>
              {entry.sets.map((set, si) => (
                <div key={si} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <span style={styles.setLabel}>Set {si + 1}</span>
                  <input
                    style={{ ...styles.input, width: 100 }}
                    type="number"
                    placeholder="lbs"
                    value={set.weight}
                    onChange={(e) => updateEntry(exIdx, "set", si, "weight", e.target.value)}
                  />
                  <input
                    style={{ ...styles.input, width: 80 }}
                    type="number"
                    placeholder="reps"
                    value={set.reps}
                    onChange={(e) => updateEntry(exIdx, "set", si, "reps", e.target.value)}
                  />
                  {entry.sets.length > 1 && (
                    <button type="button" style={styles.btnGhost} onClick={() => removeSet(exIdx, si)}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" style={styles.btnGhost} onClick={() => addSet(exIdx)}>+ Add Set</button>
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button type="button" style={styles.btnOutline} onClick={addExercise}>+ Add Exercise</button>
          <button type="submit" style={styles.btnPrimary} disabled={saving}>
            {saving ? "Saving…" : "Save Workout"}
          </button>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  error: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  card: { background: "#fff", borderRadius: 10, padding: 20, marginBottom: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  cardTitle: { fontWeight: 600, marginBottom: 14, fontSize: 15 },
  row: { display: "flex", gap: 12, marginBottom: 12 },
  label: { display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px", marginBottom: 2 },
  setLabel: { width: 48, fontSize: 13, color: "#6b7280", flexShrink: 0 },
  btnPrimary: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, cursor: "pointer" },
  btnOutline: { background: "#fff", color: "#4f46e5", border: "1px solid #4f46e5", borderRadius: 8, padding: "10px 20px", fontWeight: 600, cursor: "pointer" },
  btnGhost: { background: "#f3f4f6", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 },
  btnDanger: { background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 },
};
