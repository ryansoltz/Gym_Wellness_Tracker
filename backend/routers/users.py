from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from database import get_db
import psycopg2

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: str | None = None
    password: str | None = None


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, conn=Depends(get_db)):
    hashed = pwd_context.hash(payload.password)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO "User" (email, password_hash, name)
                VALUES (%s, %s, %s)
                RETURNING user_id, email, name, created_at
                """,
                (payload.email, hashed, payload.name),
            )
            conn.commit()
            return cur.fetchone()
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")


@router.get("/")
def list_users(conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('SELECT user_id, email, name, created_at FROM "User" ORDER BY created_at DESC')
        return cur.fetchall()


@router.get("/{user_id}")
def get_user(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute(
            'SELECT user_id, email, name, created_at FROM "User" WHERE user_id = %s',
            (user_id,),
        )
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@router.put("/{user_id}")
def update_user(user_id: int, payload: UserUpdate, conn=Depends(get_db)):
    fields, values = [], []
    if payload.email is not None:
        fields.append("email = %s")
        values.append(payload.email)
    if payload.name is not None:
        fields.append("name = %s")
        values.append(payload.name)
    if payload.password is not None:
        fields.append("password_hash = %s")
        values.append(pwd_context.hash(payload.password))
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    values.append(user_id)
    with conn.cursor() as cur:
        cur.execute(
            f'UPDATE "User" SET {", ".join(fields)} WHERE user_id = %s '
            'RETURNING user_id, email, name, created_at',
            values,
        )
        conn.commit()
        row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return row


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, conn=Depends(get_db)):
    with conn.cursor() as cur:
        cur.execute('DELETE FROM "User" WHERE user_id = %s RETURNING user_id', (user_id,))
        conn.commit()
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail="User not found")
