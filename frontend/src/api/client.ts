const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Users ────────────────────────────────────────────────────────────────────

export interface User {
  user_id: number;
  email: string;
  username: string;
  created_at: string;
}

export const createUser = (body: { email: string; password: string; username: string }) =>
  request<User>("/users/", { method: "POST", body: JSON.stringify(body) });

export const getUser = (userId: number) =>
  request<User>(`/users/${userId}`);

export const listUsers = () =>
  request<User[]>("/users/");

export const updateUser = (userId: number, body: Partial<{ email: string; username: string; password: string }>) =>
  request<User>(`/users/${userId}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteUser = (userId: number) =>
  request<void>(`/users/${userId}`, { method: "DELETE" });

// ── Exercises ────────────────────────────────────────────────────────────────

export interface Exercise {
  exercise_id: number;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
}

export const listExercises = (muscle_group?: string) =>
  request<Exercise[]>(`/exercises/${muscle_group ? `?muscle_group=${muscle_group}` : ""}`);

export const createExercise = (body: { name: string; muscle_group?: string; equipment?: string }) =>
  request<Exercise>("/exercises/", { method: "POST", body: JSON.stringify(body) });

export const deleteExercise = (exerciseId: number) =>
  request<void>(`/exercises/${exerciseId}`, { method: "DELETE" });

// ── Workout Sessions ─────────────────────────────────────────────────────────

export interface WorkoutSession {
  session_id: number;
  user_id: number;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export const createSession = (body: { user_id: number; date: string; duration_minutes?: number; notes?: string }) =>
  request<WorkoutSession>("/workouts/sessions", { method: "POST", body: JSON.stringify(body) });

export const listSessions = (userId: number) =>
  request<WorkoutSession[]>(`/workouts/sessions/user/${userId}`);

export const getSessionFull = (sessionId: number) =>
  request<WorkoutSession & { exercises: unknown[] }>(`/workouts/sessions/${sessionId}/full`);

export const deleteSession = (sessionId: number) =>
  request<void>(`/workouts/sessions/${sessionId}`, { method: "DELETE" });

// ── Sets ─────────────────────────────────────────────────────────────────────

export interface SetLog {
  set_id: number;
  workout_exercise_id: number;
  set_number: number;
  weight_lbs: number;
  reps: number;
  rpe: number | null;
  created_at: string;
}

export const addExerciseToSession = (body: { session_id: number; exercise_id: number; order_num?: number }) =>
  request<{ workout_exercise_id: number }>("/workouts/exercises-in-session", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const logSet = (body: {workout_exercise_id: number;set_number: number;weight_lbs: number;reps: number;rpe?: number}) =>
  request<{ set: SetLog; new_pr: boolean }>("/workouts/sets", {
    method: "POST",
    body: JSON.stringify(body),
  });
// ── Goals ────────────────────────────────────────────────────────────────────

export interface Goal {
  goal_id: number;
  user_id: number;
  exercise: string;
  target_value: number;
  deadline: string | null;
  status: string;
}

export const listGoals = (userId: number) =>
  request<Goal[]>(`/goals/user/${userId}`);

export const createGoal = (body: { user_id: number; exercise: string; target_value: number; deadline?: string}) =>
  request<Goal>("/goals/", { method: "POST", body: JSON.stringify(body) });

export const updateGoal = (goalId: number, body: Partial<{ exercise: string; target_value: number; deadline: string; status: string}>) =>
  request<Goal>(`/goals/${goalId}`, { method: "PUT", body: JSON.stringify(body) });

export const deleteGoal = (goalId: number) =>
  request<void>(`/goals/${goalId}`, { method: "DELETE" });

// ── Personal Records ─────────────────────────────────────────────────────────

export interface PersonalRecord {
  pr_id: number;
  user_id: number;
  exercise_id: number;
  exercise_name: string;
  muscle_group: string | null;
  weight_lbs: number;
  reps: number;
  achieved_on: string;
}

export const listPRs = (userId: number) =>
  request<PersonalRecord[]>(`/records/user/${userId}`);

// ── Body Weight ──────────────────────────────────────────────────────────────

export interface BodyWeightLog {
  log_id: number;
  user_id: number;
  weight_lbs: number;
  logged_at: string;
  notes: string | null;
}

export const listBodyWeight = (userId: number, limit = 90) =>
  request<BodyWeightLog[]>(`/bodyweight/user/${userId}?limit=${limit}`);

export const logBodyWeight = (body: { user_id: number; weight_lbs: number; notes?: string }) =>
  request<BodyWeightLog>("/bodyweight/", { method: "POST", body: JSON.stringify(body) });

export const deleteBodyWeight = (logId: number) =>
  request<void>(`/bodyweight/${logId}`, { method: "DELETE" });

// ── Wellness ─────────────────────────────────────────────────────────────────

export interface WellnessLog {
  log_id: number;
  user_id: number;
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  energy_level: number | null;
  mood: number | null;
  stress_level: number | null;
  water_oz: number | null;
}

export interface WellnessCorrelation extends WellnessLog {
  session_count: number;
  total_volume_lbs: number;
  total_reps: number;
  total_sets: number;
}

export const listWellness = (userId: number) =>
  request<WellnessLog[]>(`/wellness/user/${userId}`);

export const logWellness = (body: {
  user_id: number; date: string;
  sleep_hours?: number; sleep_quality?: number;
  energy_level?: number; mood?: number; water_oz?: number;
  stress_level?: number;
}) => request<WellnessLog>("/wellness/", { method: "POST", body: JSON.stringify(body) });

export const getWellnessCorrelation = (userId: number) =>
  request<WellnessCorrelation[]>(`/wellness/user/${userId}/correlation`);

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_sessions: number;
  lifetime_volume_lbs: number;
  sessions_this_week: number;
  latest_bodyweight: { weight_lbs: number; date: string } | null;
  active_goals: number;
  exercises_with_pr: number;
  weekly_volume: { date: string; volume_lbs: number }[];
}

export const getDashboardSummary = (userId: number) =>
  request<DashboardSummary>(`/dashboard/user/${userId}/summary`);

export const getRecentPRs = (userId: number) =>
  request<PersonalRecord[]>(`/dashboard/user/${userId}/recent-prs`);

export const getVolumeByMuscle = (userId: number, days = 30) =>
  request<{ muscle_group: string; volume_lbs: number; total_sets: number }[]>(
    `/dashboard/user/${userId}/volume-by-muscle?days=${days}`
  );