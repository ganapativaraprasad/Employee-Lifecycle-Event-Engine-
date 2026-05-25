from email.message import EmailMessage

import aiosmtplib

from app.core.config import settings


async def send_status_change_email(
    employee_email: str,
    employee_name: str,
    old_state: str,
    new_state: str
):

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

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.smtp_email,
        password=settings.smtp_password
    )