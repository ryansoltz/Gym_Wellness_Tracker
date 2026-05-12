import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { listExercises, createExercise, deleteExercise } from "../api/client";
import type { Exercise } from "../api/client";

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    listExercises()
      .then(setExercises)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createExercise({ name, muscle_group: muscleGroup || undefined, equipment: equipment || undefined });
      setName(""); setMuscleGroup(""); setEquipment("");
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add exercise.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this exercise?")) return;
    await deleteExercise(id);
    setExercises((prev) => prev.filter((e) => e.exercise_id !== id));
  }

  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase()) ||
    (e.muscle_group ?? "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Exercises</h2>
        <button style={styles.btnPrimary} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New Exercise"}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleAdd} style={styles.formCard}>
          <h3 style={{ fontWeight: 600, marginBottom: 14 }}>Add Exercise</h3>
          <label style={styles.label}>Name *</label>
          <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          <label style={styles.label}>Muscle Group</label>
          <input style={styles.input} value={muscleGroup} onChange={(e) => setMuscleGroup(e.target.value)} placeholder="e.g. Chest, Back…" />
          <label style={styles.label}>Equipment</label>
          <input style={styles.input} value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="e.g. Dumbell, Machine..." />
          <button style={styles.btnPrimary} type="submit" disabled={saving}>{saving ? "Saving…" : "Add"}</button>
        </form>
      )}

      <input
        style={{ ...styles.input, marginBottom: 16, maxWidth: 320 }}
        placeholder="Filter by name or muscle group…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      {loading ? <p style={{ color: "#6b7280" }}>Loading…</p> : (
        <div style={styles.grid}>
          {filtered.map((ex) => (
            <div key={ex.exercise_id} style={styles.card}>
              <div style={styles.exName}>{ex.name}</div>
              {ex.muscle_group && <div style={styles.tag}>{ex.muscle_group}</div>}
              {ex.equipment && <div style={styles.meta}>{ex.equipment}</div>}
              <button style={styles.btnDanger} onClick={() => handleDelete(ex.exercise_id)}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: 700 },
  error: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  formCard: { background: "#fff", borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 },
  label: { fontSize: 13, fontWeight: 500, color: "#374151" },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
  card: { background: "#fff", borderRadius: 10, padding: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  exName: { fontWeight: 600, marginBottom: 6 },
  tag: { display: "inline-block", background: "#ede9fe", color: "#4f46e5", borderRadius: 4, padding: "2px 8px", fontSize: 12, marginBottom: 4 },
  meta: { color: "#6b7280", fontSize: 13, marginBottom: 8 },
  btnPrimary: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, cursor: "pointer" },
  btnDanger: { marginTop: 8, background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 12 },
};
