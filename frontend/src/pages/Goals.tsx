import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { listGoals, createGoal, updateGoal, deleteGoal } from "../api/client";
import type { Goal } from "../api/client";

export default function Goals() {
  const userId = Number(localStorage.getItem("user_id"));
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [exercise, setExercise] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    listGoals(userId)
      .then(setGoals)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [userId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createGoal({ user_id: userId, exercise, target_value: Number(target), deadline: deadline || undefined });
      setExercise(""); setTarget(""); setDeadline("");
      setShowForm(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create goal.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(goal: Goal) {
    const updated = await updateGoal(goal.goal_id, { status: goal.status === "active" ? "completed" : "active",});
    setGoals((prev) => prev.map((g) => (g.goal_id === goal.goal_id ? updated : g)));
  }

  async function handleDelete(goalId: number) {
    if (!confirm("Delete this goal?")) return;
    await deleteGoal(goalId);
    setGoals((prev) => prev.filter((g) => g.goal_id !== goalId));
  }

  const active = goals.filter((g) => g.status === "active");
  const completed = goals.filter((g) => g.status === "completed");

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.heading}>Goals</h2>
        <button style={styles.btnPrimary} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New Goal"}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleAdd} style={styles.formCard}>
          <h3 style={{ fontWeight: 600, marginBottom: 14 }}>New Goal</h3>
          <label style={styles.label}>Exercise *</label>
          <input style={styles.input} value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="e.g. Bench Press, Run 5K…" required />
          <label style={styles.label}>Target Value *</label>
          <input style={styles.input} type="number" value={target} onChange={(e) => setTarget(e.target.value)} required />
          <label style={styles.label}>Deadline</label>
          <input style={styles.input} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          <button style={styles.btnPrimary} type="submit" disabled={saving}>{saving ? "Saving…" : "Add Goal"}</button>
        </form>
      )}

      {loading ? <p style={{ color: "#6b7280" }}>Loading…</p> : (
        <>
          <h3 style={styles.sectionTitle}>Active ({active.length})</h3>
          {active.length === 0 && <p style={styles.empty}>No active goals. Add one!</p>}
          {active.map((g) => <GoalCard key={g.goal_id} goal={g} onToggle={toggleComplete} onDelete={handleDelete} />)}

          {completed.length > 0 && (
            <>
              <h3 style={{ ...styles.sectionTitle, marginTop: 24 }}>Completed ({completed.length})</h3>
              {completed.map((g) => <GoalCard key={g.goal_id} goal={g} onToggle={toggleComplete} onDelete={handleDelete} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}

function GoalCard({ goal, onToggle, onDelete }: { goal: Goal; onToggle: (g: Goal) => void; onDelete: (id: number) => void }) {
  const done = goal.status === "completed";
  return (
    <div style={{ ...styles.card, opacity: done ? 0.7 : 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, textDecoration: done ? "line-through" : "none" }}>{goal.exercise}</div>
          <div style={styles.meta}>Target: {goal.target_value}</div>
          {goal.deadline && <div style={styles.meta}>Deadline: {goal.deadline}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={styles.btnGhost} onClick={() => onToggle(goal)}>
            {done ? "Reopen" : "Complete"}
          </button>
          <button style={styles.btnDanger} onClick={() => onDelete(goal.goal_id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  heading: { fontSize: 22, fontWeight: 700 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: "#374151", marginBottom: 10 },
  empty: { color: "#6b7280", marginBottom: 16 },
  error: { background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 14 },
  formCard: { background: "#fff", borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 10, maxWidth: 400 },
  label: { fontSize: 13, fontWeight: 500, color: "#374151" },
  input: { width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "9px 12px" },
  card: { background: "#fff", borderRadius: 10, padding: 16, marginBottom: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.07)" },
  meta: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  btnPrimary: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600, cursor: "pointer" },
  btnGhost: { background: "#f3f4f6", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 },
  btnDanger: { background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, padding: "5px 12px", cursor: "pointer", fontSize: 13 },
};
