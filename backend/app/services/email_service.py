"""
Email service — welcome & payment receipt emails rebranded for Student Affairs.
"""

import logging
from email.message import EmailMessage
try:
    import aiosmtplib
except ModuleNotFoundError:
    aiosmtplib = None

from app.config import settings

logger = logging.getLogger(__name__)


def _generate_html_template(title: str, body: str, cta_text: str = None, cta_url: str = None) -> str:
    """Generates a branded HTML email template for Student Affairs."""
    cta_html = ""
    if cta_text and cta_url:
        cta_html = f"""
        <div style="text-align: center; margin-top: 30px;">
            <a href="{cta_url}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">{cta_text}</a>
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin: 0; padding: 0; background-color: #0f0f23; font-family: 'Inter', sans-serif; color: #e4e4e7; line-height: 1.6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f0f23; padding: 40px 20px;">
            <tr><td align="center">
                <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a3e; border: 1px solid #2d2d5e; border-radius: 16px; max-width: 600px; width: 100%; margin: 0 auto; overflow: hidden;">
                    <tr><td style="padding: 30px 40px; border-bottom: 1px solid #2d2d5e; text-align: center; background-color: #141432;">
                        <h1 style="color: #6D86A1; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">STUDENT AFFAIRS</h1>
                        <p style="color: #a1a1aa; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Marks Verification & Academic Grievance Clearinghouse</p>
                    </td></tr>
                    <tr><td style="padding: 40px;">
                        <h2 style="color: #ffffff; margin-top: 0; font-size: 22px; font-weight: 700;">{title}</h2>
                        <div style="color: #d4d4d8; font-size: 16px; margin-bottom: 20px;">{body}</div>
                        {cta_html}
                    </td></tr>
                    <tr><td style="padding: 30px 40px; background-color: #141432; text-align: center; border-top: 1px solid #2d2d5e;">
                        <p style="color: #71717a; font-size: 13px; margin: 0;">© 2026 Student Affairs. All rights reserved.</p>
                    </td></tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>
    """


async def _send_smtp_email(to_email: str, subject: str, html_content: str):
    """Core function to dispatch emails via aiosmtplib."""
    if aiosmtplib is None:
        logger.warning(f"aiosmtplib is not installed. Skipping email to {to_email}")
        return

    smtp_email = settings.SMTP_USERNAME
    smtp_pass = settings.SMTP_PASSWORD
    from_email = settings.FROM_EMAIL or smtp_email

    if not smtp_pass:
        logger.warning(f"SMTP_PASSWORD not set. Simulating email to {to_email}")
        logger.info(f"Subject: {subject}")
        return

    message = EmailMessage()
    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(html_content, subtype="html")

    try:
        use_tls = True if settings.SMTP_PORT == 465 else False
        start_tls = True if settings.SMTP_PORT == 587 else False

        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_SERVER,
            port=settings.SMTP_PORT,
            username=smtp_email,
            password=smtp_pass,
            use_tls=use_tls,
            start_tls=start_tls,
        )
        logger.info(f"Successfully dispatched email to {to_email}")
    except Exception as e:
        logger.error(f"Failed to dispatch email to {to_email}: {e}")


async def send_payment_receipt_email(email: str, amount: float, method: str, transaction_id: str):
    """Sends a digital receipt."""
    subject = "Student Affairs VIP Receipt"
    body = f"""
    <p>Thank you for your purchase. Your transaction has been securely mapped to your account.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background-color: #0f0f23; border-radius: 8px; overflow: hidden;">
        <tr><td style="padding: 12px; border-bottom: 1px solid #2d2d5e; color: #a1a1aa;">Amount</td><td style="padding: 12px; border-bottom: 1px solid #2d2d5e; color: #ffffff; text-align: right; font-weight: bold;">{amount}</td></tr>
        <tr><td style="padding: 12px; border-bottom: 1px solid #2d2d5e; color: #a1a1aa;">Method</td><td style="padding: 12px; border-bottom: 1px solid #2d2d5e; color: #ffffff; text-align: right; font-weight: bold;">{method.upper()}</td></tr>
        <tr><td style="padding: 12px; color: #a1a1aa;">Transaction ID</td><td style="padding: 12px; color: #8b5cf6; text-align: right; font-family: monospace;">{transaction_id}</td></tr>
    </table>
    <p style="margin-top: 20px;">You can now access premium GG and Over 2.5 tips.</p>
    """
    html_content = _generate_html_template("Payment Successful", body, "Access Premium Tips", f"{settings.FRONTEND_URL}/tips")
    await _send_smtp_email(email, subject, html_content)


async def send_welcome_email(email: str, name: str):
    """Sends a warm onboarding email."""
    subject = "Welcome to Student Affairs! ⚽"
    body = f"""
    <p>Hello {name},</p>
    <p>Welcome to <strong>Student Affairs</strong> — your specialist platform for GG (Both Teams to Score) and Over 2.5 predictions.</p>
    <p>Our expert analysts deliver high-confidence picks daily. Subscribe to unlock premium predictions and start winning.</p>
    """
    html_content = _generate_html_template("Welcome to Student Affairs!", body, "View Today's Tips", settings.FRONTEND_URL)
    await _send_smtp_email(email, subject, html_content)


async def send_student_instant_notification(
    student_email: str,
    student_name: str,
    ticket_id: str,
    updated_by: str,
    status: str
):
    """Sends an instant email notification to the student when a lecturer replies or updates a ticket."""
    subject = f"Update on your Student Grievance Claim {ticket_id}"
    body = f"""
    <p>Hello {student_name},</p>
    <p>Your academic grievance claim <strong>{ticket_id}</strong> has been updated by <strong>{updated_by}</strong>.</p>
    <p>New Status: <strong style="color: #6D86A1;">{status}</strong></p>
    <p>Please log in to your portal to review comments or provide further details.</p>
    """
    html_content = _generate_html_template(
        "Grievance Ticket Update",
        body,
        "Access Student Portal",
        f"{settings.FRONTEND_URL}/clearance"
    )
    await _send_smtp_email(student_email, subject, html_content)


async def send_lecturer_summary_notification(
    lec_email: str,
    lec_name: str,
    ticket_details: list
):
    """Sends a summary email to a lecturer listing new tickets, with an auto-onboarding CTA link."""
    subject = f"New Student Grievance Claims Assigned to You"
    
    # Generate list of tickets in HTML
    tickets_html = "<ul style='padding-left: 20px; color: #d4d4d8; font-size: 15px;'>"
    for t in ticket_details:
        elements_str = t.get("completed_elements")
        elements_badge = ""
        if elements_str:
            elements_badge = f"<br/><span style='font-size: 12px; color: #6D86A1;'>✔ Submitted Deliverables: {elements_str}</span>"
        tickets_html += f"""
        <li style='margin-bottom: 12px;'>
            <strong>{t['ticket_id']}</strong>: {t['unit_code']} ({t['assessment_category']}) - Claimed Score: {t['claimed_score']}%
            <br/><span style='font-size: 13px; color: #a1a1aa;'>Submitted by: {t['student_name']} ({t['reg_number']})</span>
            {elements_badge}
        </li>
        """
    tickets_html += "</ul>"
    
    # CTA Link for auto-onboarding
    onboard_url = f"{settings.BACKEND_URL}/api/auth/onboard?email={lec_email}&name={lec_name}"
    
    body = f"""
    <p>Hello Dr./Prof. {lec_name},</p>
    <p>The following student academic grievance claims have been submitted under your unit(s):</p>
    {tickets_html}
    <p>Please click the button below to instantly access/log in to the Students Affairs Clearinghouse and view these tickets.</p>
    """
    html_content = _generate_html_template(
        "Student Grievance Notification",
        body,
        "Access Portal & View Tickets",
        onboard_url
    )
    await _send_smtp_email(lec_email, subject, html_content)


async def check_and_send_debounced_lecturer_notifications(lec_email: str, lec_name: str, delay: int = 21600):
    """Sleeps for a specified duration (6 hours by default), then fetches and sends all pending notifications for a lecturer."""
    import asyncio
    await asyncio.sleep(delay)
    
    from app.database import AsyncSessionLocal
    from app.models.ticket import PendingLecturerNotification, Ticket
    from app.models.user import User
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        # Retrieve all pending notifications for this email
        res = await db.execute(
            select(PendingLecturerNotification)
            .where(PendingLecturerNotification.lecturer_email == lec_email.lower().strip())
        )
        pending = res.scalars().all()
        if not pending:
            return
            
        ticket_details = []
        for p in pending:
            ticket_res = await db.execute(select(Ticket).where(Ticket.ticket_id == p.ticket_id))
            t = ticket_res.scalar_one_or_none()
            if t:
                # Fetch student name
                student_res = await db.execute(select(User).where(User.id == t.student_id))
                student = student_res.scalar_one_or_none()
                student_name = student.name if student else "Unknown Student"
                
                ticket_details.append({
                    "ticket_id": t.ticket_id,
                    "unit_code": t.unit_code,
                    "assessment_category": t.assessment_category,
                    "claimed_score": t.claimed_score,
                    "student_name": student_name,
                    "reg_number": t.reg_number,
                    "completed_elements": t.completed_elements
                })
        
        if ticket_details:
            await send_lecturer_summary_notification(lec_email, lec_name, ticket_details)
            
        # Clean up database records
        for p in pending:
            await db.delete(p)
        await db.commit()

