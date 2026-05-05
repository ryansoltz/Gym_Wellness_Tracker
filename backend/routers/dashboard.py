from fastapi import APIRouter, Depends
from database import get_db

router = APIRouter()


@router.get("/user/{user_id}/summary")
def dashboard_summary(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                COUNT(DISTINCT ws.session_id) AS total_sessions,
                COALESCE(SUM(sl.weight_lbs * sl.reps), 0) AS lifetime_volume_lbs
            FROM workoutsession ws
            LEFT JOIN workoutexercise we ON we.session_id = ws.session_id
            LEFT JOIN setlog sl ON sl.workout_ex_id = we.workout_ex_id
            WHERE ws.user_id = %s
            """,
            (user_id,),
        )
        totals = cur.fetchone()

        cur.execute(
            """
            SELECT COUNT(*) AS sessions_this_week
            FROM workoutsession
            WHERE user_id = %s
              AND date >= date_trunc('week', CURRENT_DATE)
              AND date < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days'
            """,
            (user_id,),
        )
        week = cur.fetchone()

        cur.execute(
            """
            SELECT weight_lbs, date
            FROM bodyweightlog
            WHERE user_id = %s
            ORDER BY date DESC
            LIMIT 1
            """,
            (user_id,),
        )
        bw = cur.fetchone()

        cur.execute(
            "SELECT COUNT(*) AS active_goals FROM goal WHERE user_id = %s AND is_completed = FALSE",
            (user_id,),
        )
        goals = cur.fetchone()

        cur.execute(
            "SELECT COUNT(DISTINCT exercise_id) AS exercises_with_pr FROM personalrecord WHERE user_id = %s",
            (user_id,),
        )
        prs = cur.fetchone()

        cur.execute(
            """
            SELECT ws.date,
                   COALESCE(SUM(sl.weight_lbs * sl.reps), 0) AS volume_lbs
            FROM workoutsession ws
            LEFT JOIN workoutexercise we ON we.session_id = ws.session_id
            LEFT JOIN setlog sl ON sl.workout_ex_id = we.workout_ex_id
            WHERE ws.user_id = %s AND ws.date >= CURRENT_DATE - INTERVAL '6 days'
            GROUP BY ws.date
            ORDER BY ws.date ASC
            """,
            (user_id,),
        )
        weekly_volume = cur.fetchall()

        return {
            "total_sessions": totals["total_sessions"],
            "lifetime_volume_lbs": float(totals["lifetime_volume_lbs"]),
            "sessions_this_week": week["sessions_this_week"],
            "latest_bodyweight": dict(bw) if bw else None,
            "active_goals": goals["active_goals"],
            "exercises_with_pr": prs["exercises_with_pr"],
            "weekly_volume": [dict(r) for r in weekly_volume],
        }


@router.get("/user/{user_id}/recent-prs")
def recent_prs(user_id: int, limit: int = 5, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT pr.pr_id, pr.weight_lbs, pr.reps, pr.achieved_date,
                   e.name AS exercise_name, e.muscle_group
            FROM personalrecord pr
            JOIN exercise e ON e.exercise_id = pr.exercise_id
            WHERE pr.user_id = %s
            ORDER BY pr.achieved_date DESC, pr.pr_id DESC
            LIMIT %s
            """,
            (user_id, limit),
        )
        return cur.fetchall()


@router.get("/user/{user_id}/volume-by-muscle")
def volume_by_muscle(user_id: int, days: int = 30, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT e.muscle_group,
                   COALESCE(SUM(sl.weight_lbs * sl.reps), 0) AS volume_lbs,
                   COUNT(sl.set_id) AS total_sets
            FROM workoutsession ws
            JOIN workoutexercise we ON we.session_id = ws.session_id
            JOIN exercise e ON e.exercise_id = we.exercise_id
            LEFT JOIN setlog sl ON sl.workout_ex_id = we.workout_ex_id
            WHERE ws.user_id = %s AND ws.date >= CURRENT_DATE - INTERVAL '%s days'
            GROUP BY e.muscle_group
            ORDER BY volume_lbs DESC
            """,
            (user_id, days),
        )
        return cur.fetchall()


@router.get("/user/{user_id}/wellness-trend")
def wellness_trend(user_id: int, days: int = 14, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT date, sleep_hours, sleep_quality, energy_level, mood, water_oz
            FROM wellnesslog
            WHERE user_id = %s AND date >= CURRENT_DATE - INTERVAL '%s days'
            ORDER BY date ASC
            """,
            (user_id, days),
        )
        return cur.fetchall()
