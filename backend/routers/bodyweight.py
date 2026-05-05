from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import datetime
from database import get_db

router = APIRouter()


class BodyWeightCreate(BaseModel):
    user_id: int
    weight_lbs: float
    logged_at: datetime | None = None


class BodyWeightUpdate(BaseModel):
    weight_lbs: float | None = None
    logged_at: datetime | None = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def log_bodyweight(payload: BodyWeightCreate, conn=Depends(get_db)):
    logged_at = payload.logged_at or datetime.utcnow()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO "BodyWeightLog" (user_id, weight_lbs, logged_at)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (payload.user_id, payload.weight_lbs, logged_at),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/user/{user_id}")
def list_bodyweight(user_id: int, limit: int = 90, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM "BodyWeightLog"
            WHERE user_id = %s
            ORDER BY logged_at DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        return cur.fetchall()


@router.get("/{log_id}")
def get_bodyweight(log_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('SELECT * FROM "BodyWeightLog" WHERE log_id = %s', (log_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return row


@router.put("/{log_id}")
def update_bodyweight(log_id: int, payload: BodyWeightUpdate, conn=Depends(get_db)):
    fields, values = [], []
    if payload.weight_lbs is not None:
        fields.append("weight_lbs = %s")
        values.append(payload.weight_lbs)
    if payload.logged_at is not None:
        fields.append("logged_at = %s")
        values.append(payload.logged_at)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(log_id)
    with conn.cursor() as cur:
        cur.execute(
            f'UPDATE "BodyWeightLog" SET {", ".join(fields)} WHERE log_id = %s RETURNING *',
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return row


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bodyweight(log_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "BodyWeightLog" WHERE log_id = %s RETURNING log_id', (log_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Log entry not found")
