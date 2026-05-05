from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from database import get_db

router = APIRouter()


class ExerciseCreate(BaseModel):
    name: str
    muscle_group: Optional[str] = None
    exercise_type: Optional[str] = None


class ExerciseUpdate(BaseModel):
    name: Optional[str] = None
    muscle_group: Optional[str] = None
    exercise_type: Optional[str] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_exercise(payload: ExerciseCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO exercise (name, muscle_group, exercise_type)
            VALUES (%s, %s, %s)
            RETURNING exercise_id, name, muscle_group, exercise_type
            """,
            (payload.name, payload.muscle_group, payload.exercise_type),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/")
def list_exercises(muscle_group: Optional[str] = None, conn=Depends(get_db)):
    with conn.cursor() as cur:
        if muscle_group:
            cur.execute(
                "SELECT * FROM exercise WHERE muscle_group ILIKE %s ORDER BY name",
                (f"%{muscle_group}%",),
            )
        else:
            cur.execute("SELECT * FROM exercise ORDER BY name")
        return cur.fetchall()


@router.get("/{exercise_id}")
def get_exercise(exercise_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM exercise WHERE exercise_id = %s", (exercise_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return row


@router.put("/{exercise_id}")
def update_exercise(exercise_id: int, payload: ExerciseUpdate, conn=Depends(get_db)):
    fields, values = [], []
    for col, val in [
        ("name", payload.name),
        ("muscle_group", payload.muscle_group),
        ("exercise_type", payload.exercise_type),
    ]:
        if val is not None:
            fields.append(f"{col} = %s")
            values.append(val)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(exercise_id)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE exercise SET {', '.join(fields)} WHERE exercise_id = %s RETURNING *",
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return row


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(exercise_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM exercise WHERE exercise_id = %s RETURNING exercise_id", (exercise_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Exercise not found")
