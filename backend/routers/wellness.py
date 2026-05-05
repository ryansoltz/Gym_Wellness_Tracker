from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter()


class WellnessCreate(BaseModel):
    user_id: int
    date: date
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None  # 1–5
    mood: Optional[int] = None           # 1–5
    energy_level: Optional[int] = None  # 1–5
    water_oz: Optional[int] = None


class WellnessUpdate(BaseModel):
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    mood: Optional[int] = None
    energy_level: Optional[int] = None
    water_oz: Optional[int] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_wellness_log(payload: WellnessCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO wellnesslog (user_id, date, sleep_hours, sleep_quality, mood, energy_level, water_oz)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (payload.user_id, payload.date, payload.sleep_hours, payload.sleep_quality,
             payload.mood, payload.energy_level, payload.water_oz),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/user/{user_id}")
def list_wellness(user_id: int, limit: int = 90, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM wellnesslog WHERE user_id = %s ORDER BY date DESC LIMIT %s",
            (user_id, limit),
        )
        return cur.fetchall()


@router.get("/user/{user_id}/date/{log_date}")
def get_wellness_by_date(user_id: int, log_date: date, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM wellnesslog WHERE user_id = %s AND date = %s ORDER BY wellness_id DESC LIMIT 1",
            (user_id, log_date),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Wellness log not found for this date")
    return row


@router.get("/{wellness_id}")
def get_wellness(wellness_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM wellnesslog WHERE wellness_id = %s", (wellness_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Wellness log not found")
    return row


@router.put("/{wellness_id}")
def update_wellness(wellness_id: int, payload: WellnessUpdate, conn=Depends(get_db)):
    fields, values = [], []
    for col, val in [
        ("sleep_hours", payload.sleep_hours),
        ("sleep_quality", payload.sleep_quality),
        ("mood", payload.mood),
        ("energy_level", payload.energy_level),
        ("water_oz", payload.water_oz),
    ]:
        if val is not None:
            fields.append(f"{col} = %s")
            values.append(val)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(wellness_id)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE wellnesslog SET {', '.join(fields)} WHERE wellness_id = %s RETURNING *",
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Wellness log not found")
    return row


@router.delete("/{wellness_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wellness(wellness_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM wellnesslog WHERE wellness_id = %s RETURNING wellness_id", (wellness_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Wellness log not found")


# ── Correlation endpoint ──────────────────────────────────────────────────────

@router.get("/user/{user_id}/correlation")
def wellness_workout_correlation(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                wl.date,
                wl.sleep_hours,
                wl.sleep_quality,
                wl.energy_level,
                wl.mood,
                wl.water_oz,
                COUNT(DISTINCT ws.session_id)              AS session_count,
                COALESCE(SUM(sl.weight_lbs * sl.reps), 0)  AS total_volume_lbs,
                COALESCE(SUM(sl.reps), 0)                   AS total_reps,
                COALESCE(COUNT(sl.set_id), 0)               AS total_sets
            FROM wellnesslog wl
            LEFT JOIN workoutsession ws
                ON ws.user_id = wl.user_id AND ws.date = wl.date
            LEFT JOIN workoutexercise we
                ON we.session_id = ws.session_id
            LEFT JOIN setlog sl
                ON sl.workout_ex_id = we.workout_ex_id
            WHERE wl.user_id = %s
            GROUP BY wl.date, wl.sleep_hours, wl.sleep_quality,
                     wl.energy_level, wl.mood, wl.water_oz
            ORDER BY wl.date DESC
            """,
            (user_id,),
        )
        return cur.fetchall()
