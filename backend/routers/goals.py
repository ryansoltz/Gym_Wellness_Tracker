from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter()


class GoalCreate(BaseModel):
    user_id: int
    exercise: str
    target_value: float
    current_value: Optional[float] = 0
    deadline: Optional[date] = None
    status: Optional[str] = "active"


class GoalUpdate(BaseModel):
    exercise: Optional[str] = None
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    deadline: Optional[date] = None
    status: Optional[str] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO goal (user_id, exercise, target_value, current_value, deadline, status)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (payload.user_id, payload.exercise, payload.target_value, payload.current_value, payload.deadline, payload.status,),
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
        ("exercise", payload.exercise),
        ("target_value", payload.target_value),
        ("current_value", payload.current_value),
        ("deadline", payload.deadline),
        ("status", payload.status),
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
