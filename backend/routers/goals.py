from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter()


class GoalCreate(BaseModel):
    user_id: int
    type: str
    target_value: float
    current_value: float = 0.0
    deadline: date | None = None


class GoalUpdate(BaseModel):
    type: str | None = None
    target_value: float | None = None
    current_value: float | None = None
    deadline: date | None = None
    status: str | None = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_goal(payload: GoalCreate, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "Goal" (user_id, type, target_value, current_value, deadline, status)
            VALUES (%s, %s, %s, %s, %s, 'active')
            RETURNING *
            """,
            (payload.user_id, payload.type, payload.target_value, payload.current_value, payload.deadline),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/user/{user_id}")
def list_goals(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            'SELECT * FROM "Goal" WHERE user_id = %s ORDER BY created_at DESC',
            (user_id,),
        )
        return cur.fetchall()


@router.get("/{goal_id}")
def get_goal(goal_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('SELECT * FROM "Goal" WHERE goal_id = %s', (goal_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Goal not found")
    return row


@router.put("/{goal_id}")
def update_goal(goal_id: int, payload: GoalUpdate, conn=Depends(get_db)):
    fields, values = [], []
    for col, val in [
        ("type", payload.type),
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
            f'UPDATE "Goal" SET {", ".join(fields)} WHERE goal_id = %s RETURNING *',
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
        cur.execute('DELETE FROM "Goal" WHERE goal_id = %s RETURNING goal_id', (goal_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Goal not found")
