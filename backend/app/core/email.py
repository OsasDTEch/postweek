"""
Email sending via Python stdlib smtplib + Gmail SMTP.
All sends are fire-and-forget from a background thread so they never
block a FastAPI request.
"""
import logging
import smtplib
import threading
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def _send(to: str, subject: str, html: str, plain: str) -> None:
    """Build a MIME message and deliver it via Gmail SMTP (TLS)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"PostWeek <{settings.SMTP_FROM}>"
    msg["To"] = to

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM, to, msg.as_string())
        logger.info("Email sent to %s — %s", to, subject)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to, exc)


def send_async(to: str, subject: str, html: str, plain: str) -> None:
    """Dispatch _send in a daemon thread so the HTTP response isn't delayed."""
    t = threading.Thread(target=_send, args=(to, subject, html, plain), daemon=True)
    t.start()


# ---------------------------------------------------------------------------
# Email templates
# ---------------------------------------------------------------------------

def send_verification_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    subject = "Verify your PostWeek email"
    plain = (
        f"Hi,\n\nClick the link below to verify your email address:\n\n{link}\n\n"
        "This link does not expire — you can verify at any time.\n\n"
        "— PostWeek by Wisdom\n"
        f"Questions? omonswisdom.ict@gmail.com"
    )
    html = f"""
<!DOCTYPE html>
<html>
<body style="font-family:Inter,system-ui,sans-serif;background:#f9fafb;padding:40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:40px 48px;">
          <tr>
            <td>
              <p style="font-size:22px;font-weight:700;color:#0c90e7;margin:0 0 24px;">PostWeek</p>
              <h1 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 12px;">
                Verify your email address
              </h1>
              <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 28px;">
                Click the button below to confirm your email and activate your account.
              </p>
              <a href="{link}"
                 style="display:inline-block;background:#0072c5;color:#fff;font-size:14px;
                        font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Verify email
              </a>
              <p style="font-size:12px;color:#9ca3af;margin:28px 0 0;line-height:1.5;">
                Or copy this link into your browser:<br/>
                <a href="{link}" style="color:#0c90e7;word-break:break-all;">{link}</a>
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;"/>
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                PostWeek by <strong>Wisdom</strong> ·
                <a href="mailto:omonswisdom.ict@gmail.com" style="color:#0c90e7;">
                  omonswisdom.ict@gmail.com
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    send_async(to, subject, html, plain)


def send_password_reset_email(to: str, token: str) -> None:
    link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    subject = "Reset your PostWeek password"
    plain = (
        f"Hi,\n\nWe received a request to reset your password.\n\n"
        f"Click the link below (valid for {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes):\n\n"
        f"{link}\n\n"
        "If you didn't request this, you can safely ignore this email.\n\n"
        "— PostWeek by Wisdom\n"
        f"Questions? omonswisdom.ict@gmail.com"
    )
    html = f"""
<!DOCTYPE html>
<html>
<body style="font-family:Inter,system-ui,sans-serif;background:#f9fafb;padding:40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:40px 48px;">
          <tr>
            <td>
              <p style="font-size:22px;font-weight:700;color:#0c90e7;margin:0 0 24px;">PostWeek</p>
              <h1 style="font-size:18px;font-weight:600;color:#111827;margin:0 0 12px;">
                Reset your password
              </h1>
              <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 8px;">
                This link expires in <strong>{settings.RESET_TOKEN_EXPIRE_MINUTES} minutes</strong>.
              </p>
              <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 28px;">
                Click below to choose a new password.
              </p>
              <a href="{link}"
                 style="display:inline-block;background:#0072c5;color:#fff;font-size:14px;
                        font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
                Reset password
              </a>
              <p style="font-size:12px;color:#9ca3af;margin:28px 0 0;line-height:1.5;">
                Or copy this link:<br/>
                <a href="{link}" style="color:#0c90e7;word-break:break-all;">{link}</a>
              </p>
              <p style="font-size:12px;color:#9ca3af;margin:16px 0 0;">
                If you didn't request a password reset, ignore this email — your account is safe.
              </p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px;"/>
              <p style="font-size:12px;color:#9ca3af;margin:0;">
                PostWeek by <strong>Wisdom</strong> ·
                <a href="mailto:omonswisdom.ict@gmail.com" style="color:#0c90e7;">
                  omonswisdom.ict@gmail.com
                </a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    send_async(to, subject, html, plain)
