import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.email import send_password_reset_email, send_verification_email
from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_user_id_from_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail="An account with this email already exists")

    if len(body.password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Password must be at least 8 characters")

    verification_token = secrets.token_urlsafe(32)

    user = User(
        email=body.email.lower().strip(),
        hashed_password=hash_password(body.password),
        verification_token=verification_token,
        is_verified=False,
    )
    db.add(user)
    await db.flush()

    send_verification_email(user.email, verification_token)

    return MessageResponse(
        message="Account created. Check your email for a verification link."
    )


# ---------------------------------------------------------------------------
# Verify email
# ---------------------------------------------------------------------------

@router.get("/verify-email", response_model=MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.verification_token == token)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid or already used verification link")

    user.is_verified = True
    user.verification_token = None
    await db.flush()

    return MessageResponse(message="Email verified. You can now sign in.")


# ---------------------------------------------------------------------------
# Resend verification
# ---------------------------------------------------------------------------

@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Accepts an email address and resends the verification link if the account exists."""
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()

    # Always return 200 to avoid email enumeration
    if user and not user.is_verified:
        token = secrets.token_urlsafe(32)
        user.verification_token = token
        await db.flush()
        send_verification_email(user.email, token)

    return MessageResponse(message="If that email exists and is unverified, a new link has been sent.")


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                            detail="Account is deactivated")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Check your inbox or request a new verification link.",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ---------------------------------------------------------------------------
# Refresh tokens
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        user_id = get_user_id_from_token(body.refresh_token, expected_type="refresh")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired refresh token")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ---------------------------------------------------------------------------
# Forgot password
# ---------------------------------------------------------------------------

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email.lower().strip()))
    user = result.scalar_one_or_none()

    # Always 200 — no email enumeration
    if user and user.is_active:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )
        await db.flush()
        send_password_reset_email(user.email, token)

    return MessageResponse(
        message="If an account with that email exists, a reset link has been sent."
    )


# ---------------------------------------------------------------------------
# Reset password
# ---------------------------------------------------------------------------

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if len(body.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                            detail="Password must be at least 8 characters")

    result = await db.execute(select(User).where(User.reset_token == body.token))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid or expired reset link")

    if user.reset_token_expires_at and datetime.now(timezone.utc) > user.reset_token_expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Reset link has expired. Request a new one.")

    user.hashed_password = hash_password(body.new_password)
    user.reset_token = None
    user.reset_token_expires_at = None
    await db.flush()

    return MessageResponse(message="Password updated successfully. You can now sign in.")


# ---------------------------------------------------------------------------
# Me / delete account
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await db.delete(current_user)
