from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter()


class GoalCreate(BaseModel):
    user_id: int
    exercise_id: Optional[int] = None
    goal_type: str
    target_value: float
    target_date: Optional[date] = None


class GoalUpdate(BaseModel):
    exercise_id: Optional[int] = None
    goal_type: Optional[str] = None
    target_value: Optional[float] = None
    target_date: Optional[date] = None
    is_completed: Optional[bool] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO goal (user_id, exercise_id, goal_type, target_value, target_date, is_completed)
            VALUES (%s, %s, %s, %s, %s, FALSE)
            RETURNING *
            """,
            (payload.user_id, payload.exercise_id, payload.goal_type, payload.target_value, payload.target_date),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/user/{user_id}")
def list_goals(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM goal WHERE user_id = %s ORDER BY goal_id DESC", (user_id,))
        return cur.fetchall()


@router.get("/{goal_id}")
def get_goal(goal_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM goal WHERE goal_id = %s", (goal_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Goal not found")
    return row


@router.put("/{goal_id}")
def update_goal(goal_id: int, payload: GoalUpdate, conn=Depends(get_db)):
    fields, values = [], []
    for col, val in [
        ("exercise_id", payload.exercise_id),
        ("goal_type", payload.goal_type),
        ("target_value", payload.target_value),
        ("target_date", payload.target_date),
        ("is_completed", payload.is_completed),
    ]:
        if val is not None:
            fields.append(f"{col} = %s")
            values.append(val)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(goal_id)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE goal SET {', '.join(fields)} WHERE goal_id = %s RETURNING *",
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Goal not found")
    return row


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(goal_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM goal WHERE goal_id = %s RETURNING goal_id", (goal_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Goal not found")
