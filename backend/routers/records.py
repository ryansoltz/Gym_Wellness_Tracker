from fastapi import APIRouter, Depends, HTTPException
from database import get_db

router = APIRouter()


@router.get("/user/{user_id}")
def list_prs(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pr.*, e.name AS exercise_name, e.muscle_group
            FROM "PersonalRecord" pr
            JOIN "Exercise" e ON e.exercise_id = pr.exercise_id
            WHERE pr.user_id = %s
            ORDER BY pr.achieved_on DESC
            """,
            (user_id,),
        )
        return cur.fetchall()


@router.get("/user/{user_id}/exercise/{exercise_id}")
def get_pr_for_exercise(user_id: int, exercise_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pr.*, e.name AS exercise_name
            FROM "PersonalRecord" pr
            JOIN "Exercise" e ON e.exercise_id = pr.exercise_id
            WHERE pr.user_id = %s AND pr.exercise_id = %s
            ORDER BY pr.weight_lbs DESC
            LIMIT 1
            """,
            (user_id, exercise_id),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No personal record found for this exercise")
    return row


@router.get("/user/{user_id}/history/{exercise_id}")
def pr_history(user_id: int, exercise_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pr.*, e.name AS exercise_name
            FROM "PersonalRecord" pr
            JOIN "Exercise" e ON e.exercise_id = pr.exercise_id
            WHERE pr.user_id = %s AND pr.exercise_id = %s
            ORDER BY pr.achieved_on ASC
            """,
            (user_id, exercise_id),
        )
        return cur.fetchall()


@router.delete("/{pr_id}", status_code=204)
def delete_pr(pr_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "PersonalRecord" WHERE pr_id = %s RETURNING pr_id', (pr_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="Personal record not found")
