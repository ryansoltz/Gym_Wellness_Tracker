from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter()


# ── Pydantic models ───────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    user_id: int
    date: date
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class SessionUpdate(BaseModel):
    date: Optional[date] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None


class WorkoutExerciseCreate(BaseModel):
    session_id: int
    exercise_id: int
    order_num: Optional[int] = 1


class SetLogCreate(BaseModel):
    workout_exercise_id: int
    set_number: int
    reps: int 
    weight_lbs: float
    rpe: Optional[float] = None



class SetLogUpdate(BaseModel):
    set_number: Optional[int] = None
    reps: Optional[int] = None
    weight_lbs: Optional[float] = None
    rpe: Optional[float] = None



# ── Helper: PR auto-detection ─────────────────────────────────────────────────

def _check_and_insert_pr(cur, user_id: int, exercise_id: int, weight_lbs: float, reps: int):
    cur.execute(
        """
        SELECT weight_lbs FROM personalrecord
        WHERE user_id = %s AND exercise_id = %s
        ORDER BY weight_lbs DESC
        LIMIT 1
        """,
        (user_id, exercise_id),
    )
    existing = cur.fetchone()

    if existing is None or weight_lbs > existing["weight_lbs"]:
        cur.execute(
            """
            INSERT INTO personalrecord (user_id, exercise_id, weight_lbs, reps, achieved_on)
            VALUES (%s, %s, %s, %s, CURRENT_DATE)
            """,
            (user_id, exercise_id, weight_lbs, reps),
        )
        return True

    return False


def _get_user_and_exercise_for_set(cur, workout_exercise_id: int):
    cur.execute(
        """
        SELECT ws.user_id, we.exercise_id
        FROM workoutexercise we
        JOIN workoutsession ws ON ws.session_id = we.session_id
        WHERE we.workout_exercise_id = %s
        """,
        (workout_exercise_id,),
    )
    return cur.fetchone()


# ── WorkoutSession CRUD ───────────────────────────────────────────────────────

@router.post("/sessions", status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO workoutsession (user_id, date, duration_minutes, notes)
            VALUES (%s, %s, %s, %s)
            RETURNING *
            """,
            (payload.user_id, payload.date, payload.duration_minutes, payload.notes),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/sessions/user/{user_id}")
def list_sessions(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM workoutsession WHERE user_id = %s ORDER BY date DESC",
            (user_id,),
        )
        return cur.fetchall()


@router.get("/sessions/{session_id}")
def get_session(session_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM workoutsession WHERE session_id = %s", (session_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return row


@router.get("/sessions/{session_id}/full")
def get_session_full(session_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM workoutsession WHERE session_id = %s", (session_id,))
        session = cur.fetchone()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")

        cur.execute(
            """
            SELECT we.workout_exercise_id, we.order_num,
                   e.exercise_id, e.name, e.muscle_group, e.equipment
            FROM workoutexercise we
            JOIN exercise e ON e.exercise_id = we.exercise_id
            WHERE we.session_id = %s
            ORDER BY we.order_num
            """,
            (session_id,),
        )
        exercises = cur.fetchall()

        result = dict(session)
        result["exercises"] = []
        for ex in exercises:
            cur.execute(
                "SELECT * FROM setlog WHERE workout_exercise_id = %s ORDER BY set_number",
                (ex["workout_exercise_id"],),
            )
            sets = cur.fetchall()
            ex_dict = dict(ex)
            ex_dict["sets"] = [dict(s) for s in sets]
            result["exercises"].append(ex_dict)

        return result


@router.put("/sessions/{session_id}")
def update_session(session_id: int, payload: SessionUpdate, conn=Depends(get_db)):
    fields, values = [], []
    for col, val in [("date", payload.date), ("duration_minutes", payload.duration_minutes), ("notes", payload.notes)]:
        if val is not None:
            fields.append(f"{col} = %s")
            values.append(val)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(session_id)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE workoutsession SET {', '.join(fields)} WHERE session_id = %s RETURNING *",
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return row


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(session_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM workoutsession WHERE session_id = %s RETURNING session_id", (session_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Session not found")


# ── WorkoutExercise CRUD ──────────────────────────────────────────────────────

@router.post("/exercises-in-session", status_code=status.HTTP_201_CREATED)
def add_exercise_to_session(payload: WorkoutExerciseCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO workoutexercise (session_id, exercise_id, order_num)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (payload.session_id, payload.exercise_id, payload.order_num),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/sessions/{session_id}/exercises")
def list_session_exercises(session_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT we.*, e.name, e.muscle_group, e.equipment
            FROM workoutexercise we
            JOIN exercise e ON e.exercise_id = we.exercise_id
            WHERE we.session_id = %s
            ORDER BY we.order_num
            """,
            (session_id,),
        )
        return cur.fetchall()


@router.delete("/exercises-in-session/{workout_exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_exercise_from_session(workout_exercise_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM workoutexercise WHERE workout_exercise_id = %s RETURNING workout_exercise_id",
            (workout_exercise_id,),
        )
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="WorkoutExercise not found")


# ── SetLog CRUD (with automatic PR detection) ─────────────────────────────────

@router.post("/sets", status_code=status.HTTP_201_CREATED)
def log_set(payload: SetLogCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO setlog (workout_exercise_id, set_number, reps, weight_lbs, rpe)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING *
            """,
            (payload.workout_exercise_id, payload.set_number, payload.reps, payload.weight_lbs, payload.rpe),
        )
        new_set = cur.fetchone()
        new_pr = False

        if payload.weight_lbs and payload.reps:
            context = _get_user_and_exercise_for_set(cur, payload.workout_exercise_id)
            if context:
                new_pr = _check_and_insert_pr(
                    cur,
                    context["user_id"],
                    context["exercise_id"],
                    payload.weight_lbs,
                    payload.reps,
                )

        conn.commit()
        return {"set": new_set, "new_pr": new_pr}


@router.get("/exercises-in-session/{workout_exercise_id}/sets")
def list_sets(workout_exercise_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM setlog WHERE workout_exercise_id = %s ORDER BY set_number",
            (workout_exercise_id,),
        )
        return cur.fetchall()


@router.get("/sets/{set_id}")
def get_set(set_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM setlog WHERE set_id = %s", (set_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Set not found")
    return row


@router.put("/sets/{set_id}")
def update_set(set_id: int, payload: SetLogUpdate, conn=Depends(get_db)):
    fields, values = [], []
    for col, val in [
        ("set_number", payload.set_number),
        ("reps", payload.reps),
        ("weight_lbs", payload.weight_lbs),
        ("rpe", payload.rpe),
    ]:
        if val is not None:
            fields.append(f"{col} = %s")
            values.append(val)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(set_id)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE setlog SET {', '.join(fields)} WHERE set_id = %s RETURNING *",
            values,
        )
        updated = cur.fetchone()
        if not updated:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Set not found")

        if payload.weight_lbs and payload.reps:
            context = _get_user_and_exercise_for_set(cur, updated["workout_exercise_id"])
            if context:
                _check_and_insert_pr(cur, context["user_id"], context["exercise_id"], updated["weight_lbs"], updated["reps"])

        conn.commit()
        return updated


@router.delete("/sets/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_set(set_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM setlog WHERE set_id = %s RETURNING set_id", (set_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Set not found")
