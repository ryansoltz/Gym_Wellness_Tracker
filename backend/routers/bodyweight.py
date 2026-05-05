from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from datetime import date
from database import get_db

router = APIRouter()


class BodyWeightCreate(BaseModel):
    user_id: int
    weight_lbs: float
    date: Optional[date] = None
    notes: Optional[str] = None


class BodyWeightUpdate(BaseModel):
    weight_lbs: Optional[float] = None
    date: Optional[date] = None
    notes: Optional[str] = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def log_bodyweight(payload: BodyWeightCreate, conn=Depends(get_db)):
    from datetime import date as date_type
    log_date = payload.date or date_type.today()
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO bodyweightlog (user_id, weight_lbs, date, notes)
            VALUES (%s, %s, %s, %s)
            RETURNING *
            """,
            (payload.user_id, payload.weight_lbs, log_date, payload.notes),
        )
        conn.commit()
        return cur.fetchone()


@router.get("/user/{user_id}")
def list_bodyweight(user_id: int, limit: int = 90, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM bodyweightlog
            WHERE user_id = %s
            ORDER BY date DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        return cur.fetchall()


@router.get("/{bw_log_id}")
def get_bodyweight(bw_log_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM bodyweightlog WHERE bw_log_id = %s", (bw_log_id,))
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return row


@router.put("/{bw_log_id}")
def update_bodyweight(bw_log_id: int, payload: BodyWeightUpdate, conn=Depends(get_db)):
    fields, values = [], []
    if payload.weight_lbs is not None:
        fields.append("weight_lbs = %s")
        values.append(payload.weight_lbs)
    if payload.date is not None:
        fields.append("date = %s")
        values.append(payload.date)
    if payload.notes is not None:
        fields.append("notes = %s")
        values.append(payload.notes)
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(bw_log_id)
    with conn.cursor() as cur:
        cur.execute(
            f"UPDATE bodyweightlog SET {', '.join(fields)} WHERE bw_log_id = %s RETURNING *",
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Log entry not found")
    return row


@router.delete("/{bw_log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bodyweight(bw_log_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute("DELETE FROM bodyweightlog WHERE bw_log_id = %s RETURNING bw_log_id", (bw_log_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Log entry not found")
