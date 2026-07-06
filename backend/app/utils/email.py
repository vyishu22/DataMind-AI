"""Email sending utility (SMTP or console fallback for dev)."""
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

from app.core.config import settings

log = logging.getLogger(__name__)


def _build_html(subject: str, body_html: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = settings.EMAIL_FROM
    msg.attach(MIMEText(body_html, "html"))
    return msg


async def send_email(to: str, subject: str, body_html: str) -> None:
    """Send an email. Falls back to console log in development."""
    if not settings.SMTP_HOST or settings.ENVIRONMENT == "development":
        log.info("📧  [DEV EMAIL] To: %s | Subject: %s", to, subject)
        log.info("Body: %s", body_html[:300])
        return

    msg = _build_html(subject, body_html)
    msg["To"] = to
    try:
        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as s:
            s.login(settings.SMTP_USER, settings.SMTP_PASS)
            s.sendmail(settings.EMAIL_FROM, [to], msg.as_string())
        log.info("Email sent to %s", to)
    except Exception as exc:
        log.error("Failed to send email to %s: %s", to, exc)


async def send_verify_email(to: str, name: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"
    await send_email(
        to, "Verify your DataMind AI account",
        f"""
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#0f0f23;color:#e2e8f0;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px;text-align:center">
            <h1 style="margin:0;font-size:24px;color:#fff">🧠 DataMind AI</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#f1f5f9">Hi {name},</h2>
            <p style="color:#94a3b8;line-height:1.6">Verify your email address to activate your DataMind AI account and start analyzing your data with AI.</p>
            <a href="{url}" style="display:inline-block;margin:24px 0;background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:500;font-size:15px">Verify Email Address</a>
            <p style="color:#475569;font-size:12px">Link expires in 24 hours. If you didn't create an account, ignore this email.</p>
          </div>
        </div>
        """,
    )


async def send_reset_email(to: str, name: str, token: str) -> None:
    url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
    await send_email(
        to, "Reset your DataMind AI password",
        f"""
        <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#0f0f23;color:#e2e8f0;border-radius:16px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);padding:32px;text-align:center">
            <h1 style="margin:0;font-size:24px;color:#fff">🧠 DataMind AI</h1>
          </div>
          <div style="padding:32px">
            <h2 style="color:#f1f5f9">Hi {name},</h2>
            <p style="color:#94a3b8;line-height:1.6">We received a request to reset your password. Click the button below to set a new password.</p>
            <a href="{url}" style="display:inline-block;margin:24px 0;background:#6366f1;color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:500;font-size:15px">Reset Password</a>
            <p style="color:#475569;font-size:12px">This link expires in 1 hour. If you didn't request a password reset, ignore this email.</p>
          </div>
        </div>
        """,
    )
