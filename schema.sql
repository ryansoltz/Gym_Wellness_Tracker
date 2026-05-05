-- Gym & Wellness Tracker — full schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

CREATE TABLE IF NOT EXISTS "User" (
    user_id       SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Exercise" (
    exercise_id  SERIAL PRIMARY KEY,
    name         VARCHAR(100) NOT NULL UNIQUE,
    muscle_group VARCHAR(50),
    equipment    VARCHAR(50),
    description  TEXT
);

CREATE TABLE IF NOT EXISTS "WorkoutSession" (
    session_id       SERIAL PRIMARY KEY,
    user_id          INT         NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    date             DATE        NOT NULL,
    duration_minutes INT,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "WorkoutExercise" (
    workout_exercise_id SERIAL PRIMARY KEY,
    session_id          INT NOT NULL REFERENCES "WorkoutSession"(session_id) ON DELETE CASCADE,
    exercise_id         INT NOT NULL REFERENCES "Exercise"(exercise_id) ON DELETE CASCADE,
    order_num           INT
);

CREATE TABLE IF NOT EXISTS "SetLog" (
    set_id              SERIAL PRIMARY KEY,
    workout_exercise_id INT   NOT NULL REFERENCES "WorkoutExercise"(workout_exercise_id) ON DELETE CASCADE,
    set_number          INT   NOT NULL,
    weight_lbs          FLOAT NOT NULL,
    reps                INT   NOT NULL,
    rpe                 FLOAT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "PersonalRecord" (
    pr_id       SERIAL PRIMARY KEY,
    user_id     INT   NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    exercise_id INT   NOT NULL REFERENCES "Exercise"(exercise_id) ON DELETE CASCADE,
    weight_lbs  FLOAT NOT NULL,
    reps        INT   NOT NULL,
    achieved_on DATE  NOT NULL DEFAULT CURRENT_DATE,
    set_id      INT   REFERENCES "SetLog"(set_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS "Goal" (
    goal_id       SERIAL PRIMARY KEY,
    user_id       INT          NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    type          VARCHAR(100) NOT NULL,
    target_value  FLOAT        NOT NULL,
    current_value FLOAT        NOT NULL DEFAULT 0,
    deadline      DATE,
    status        VARCHAR(20)  NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "BodyWeightLog" (
    log_id     SERIAL PRIMARY KEY,
    user_id    INT   NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    weight_lbs FLOAT NOT NULL,
    logged_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "WellnessLog" (
    log_id        SERIAL PRIMARY KEY,
    user_id       INT   NOT NULL REFERENCES "User"(user_id) ON DELETE CASCADE,
    date          DATE  NOT NULL,
    sleep_hours   FLOAT,
    sleep_quality INT CHECK (sleep_quality BETWEEN 1 AND 10),
    energy_level  INT CHECK (energy_level  BETWEEN 1 AND 10),
    mood          INT CHECK (mood          BETWEEN 1 AND 10),
    stress_level  INT CHECK (stress_level  BETWEEN 1 AND 10),
    notes         TEXT,
    UNIQUE (user_id, date)
);

-- Seed a handful of common exercises so the Log Workout dropdown is populated
INSERT INTO "Exercise" (name, muscle_group, equipment) VALUES
    ('Barbell Back Squat',   'Legs',       'Barbell'),
    ('Barbell Bench Press',  'Chest',      'Barbell'),
    ('Deadlift',             'Back',       'Barbell'),
    ('Overhead Press',       'Shoulders',  'Barbell'),
    ('Barbell Row',          'Back',       'Barbell'),
    ('Pull-Up',              'Back',       'Bodyweight'),
    ('Dumbbell Curl',        'Arms',       'Dumbbell'),
    ('Tricep Pushdown',      'Arms',       'Cable'),
    ('Leg Press',            'Legs',       'Machine'),
    ('Romanian Deadlift',    'Legs',       'Barbell'),
    ('Incline Dumbbell Press','Chest',     'Dumbbell'),
    ('Lat Pulldown',         'Back',       'Cable'),
    ('Face Pull',            'Shoulders',  'Cable'),
    ('Plank',                'Core',       'Bodyweight'),
    ('Running',              'Cardio',     NULL)
ON CONFLICT (name) DO NOTHING;
