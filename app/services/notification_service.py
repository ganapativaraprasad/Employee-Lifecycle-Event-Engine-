import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings


async def send_welcome_email(

    employee_email: str,
    employee_name: str
):

    sender_email = settings.smtp_email

    sender_password = settings.smtp_password

    subject = "Welcome to the Company"

    body = f"""
Hello {employee_name},

Welcome to the company.

Your onboarding process has been completed successfully.

We are excited to have you onboard.

Best Regards,
HR Team
"""

    message = MIMEMultipart()

    message["From"] = sender_email
    message["To"] = employee_email
    message["Subject"] = subject

    message.attach(
        MIMEText(body, "plain")
    )

    try:

        server = smtplib.SMTP(
            "smtp.gmail.com",
            587
        )

        server.starttls()

        server.login(
            sender_email,
            sender_password
        )

        server.sendmail(
            sender_email,
            employee_email,
            message.as_string()
        )

        server.quit()

        print("\nEMAIL SENT SUCCESSFULLY\n")

    except Exception as e:

        print(f"\nEMAIL FAILED: {e}\n")