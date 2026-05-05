from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter()


class WellnessCreate(BaseModel):
    user_id: int
    date: date
    sleep_hours: float | None = None
    sleep_quality: int | None = None   # 1–10
    energy_level: int | None = None    # 1–10
    mood: int | None = None            # 1–10
    stress_level: int | None = None    # 1–10
    notes: str | None = None


class WellnessUpdate(BaseModel):
    sleep_hours: float | None = None
    sleep_quality: int | None = None
    energy_level: int | None = None
    mood: int | None = None
    stress_level: int | None = None
    notes: str | None = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_wellness_log(payload: WellnessCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "WellnessLog"
                (user_id, date, sleep_hours, sleep_quality, energy_level, mood, stress_level, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id, date) DO UPDATE SET
                sleep_hours   = EXCLUDED.sleep_hours,
                sleep_quality = EXCLUDED.sleep_quality,
                energy_level  = EXCLUDED.energy_level,
                mood          = EXCLUDED.mood,
                stress_level  = EXCLUDED.stress_level,
                notes         = EXCLUDED.notes
            RETURNING *
            """,
            (
                payload.user_id,
                payload.date,
                payload.sleep_hours,
                payload.sleep_quality,
                payload.energy_level,
                payload.mood,
                payload.stress_level,
                payload.notes,
            ),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/user/{user_id}")
def list_wellness(user_id: int, limit: int = 90, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            'SELECT * FROM "WellnessLog" WHERE user_id = %s ORDER BY date DESC LIMIT %s',
            (user_id, limit),
        )
        return cur.fetchall()


@router.get("/user/{user_id}/date/{log_date}")
def get_wellness_by_date(user_id: int, log_date: date, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            'SELECT * FROM "WellnessLog" WHERE user_id = %s AND date = %s',
            (user_id, log_date),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Wellness log not found for this date")
    return row


@router.get("/{log_id}")
def get_wellness(log_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('SELECT * FROM "WellnessLog" WHERE log_id = %s', (log_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Wellness log not found")
    return row


@router.put("/{log_id}")
def update_wellness(log_id: int, payload: WellnessUpdate, conn=Depends(get_db)):
    fields, values = [], []
    for col, val in [
        ("sleep_hours", payload.sleep_hours),
        ("sleep_quality", payload.sleep_quality),
        ("energy_level", payload.energy_level),
        ("mood", payload.mood),
        ("stress_level", payload.stress_level),
        ("notes", payload.notes),
    ]:
        if val is not None:
            fields.append(f"{col} = %s")
            values.append(val)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(log_id)
    with conn.cursor() as cur:
        cur.execute(
            f'UPDATE "WellnessLog" SET {", ".join(fields)} WHERE log_id = %s RETURNING *',
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Wellness log not found")
    return row


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wellness(log_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "WellnessLog" WHERE log_id = %s RETURNING log_id', (log_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Wellness log not found")


# ── Correlation endpoint ──────────────────────────────────────────────────────

@router.get("/user/{user_id}/correlation")
def wellness_workout_correlation(user_id: int, conn=Depends(get_db)):
    """
    Joins WellnessLog with WorkoutSession and SetLog on matching dates.
    Returns per-date sleep/energy metrics alongside total workout volume
    (sum of weight_lbs * reps across all sets that day).
    """
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                wl.date,
                wl.sleep_hours,
                wl.sleep_quality,
                wl.energy_level,
                wl.mood,
                wl.stress_level,
                COUNT(DISTINCT ws.session_id)            AS session_count,
                COALESCE(SUM(sl.weight_lbs * sl.reps), 0) AS total_volume_lbs,
                COALESCE(SUM(sl.reps), 0)                AS total_reps,
                COALESCE(COUNT(sl.set_id), 0)            AS total_sets
            FROM "WellnessLog" wl
            LEFT JOIN "WorkoutSession" ws
                ON ws.user_id = wl.user_id AND ws.date = wl.date
            LEFT JOIN "WorkoutExercise" we
                ON we.session_id = ws.session_id
            LEFT JOIN "SetLog" sl
                ON sl.workout_exercise_id = we.workout_exercise_id
            WHERE wl.user_id = %s
            GROUP BY wl.date, wl.sleep_hours, wl.sleep_quality,
                     wl.energy_level, wl.mood, wl.stress_level
            ORDER BY wl.date DESC
            """,
            (user_id,),
        )
        return cur.fetchall()
