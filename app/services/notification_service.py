from email.message import EmailMessage
import logging

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


async def send_status_change_email(
    employee_email: str,
    employee_name: str,
    old_state: str,
    new_state: str
):

    if not settings.smtp_email or not settings.smtp_password:
        logger.warning("SMTP credentials are not configured; email skipped.")
        return

    message = EmailMessage()

    message["From"] = settings.smtp_email

    message["To"] = employee_email

    message["Subject"] = "Employee Status Updated"

    message.set_content(
        f"""
Hello {employee_name},

Your employee status changed from:

{old_state} → {new_state}

Regards,
HR Team
"""
    )

    try:

        smtp = aiosmtplib.SMTP(
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            timeout=20
        )

        await smtp.connect()
        await smtp.login(
            settings.smtp_email,
            settings.smtp_password
        )
        await smtp.send_message(message)
        await smtp.quit()

    except Exception:
        logger.exception("Failed to send status change email.")