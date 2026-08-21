"""
Student Affairs API — FastAPI entry point.
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.routers import auth, internal, tickets


async def seed_default_data():
    """Seed default data if they don't exist."""
    from sqlalchemy import select
    from app.models.user import User
    from app.security import hash_password

    async with AsyncSessionLocal() as db:
        # Seed admin user if none exists

        # Seed admin user if none exists
        admin_result = await db.execute(select(User).where(User.email == "admin@studentsaffairs.com"))
        admin_user = admin_result.scalars().first()

        if not admin_user:
            admin_user = User(
                name="Admin",
                email="admin@studentsaffairs.com",
                password=hash_password("admin123"),
                subscription_tier="premium",
                is_admin=True,
                is_active=True,
            )
            db.add(admin_user)
            await db.commit()
            print("[Student Affairs] Seeded default admin: admin@studentsaffairs.com / admin123")

        # Seed or upgrade Kassim admin user
        kassim_result = await db.execute(select(User).where(User.email == "kassimmusa322@gmail.com"))
        kassim_user = kassim_result.scalars().first()

        if not kassim_user:
            kassim_user = User(
                name="Kassim",
                email="kassimmusa322@gmail.com",
                password=hash_password("admin123"),
                subscription_tier="premium",
                is_admin=True,
                is_active=True,
            )
            db.add(kassim_user)
            await db.commit()
            print("[Student Affairs] Seeded admin user: kassimmusa322@gmail.com / admin123")
        else:
            if not kassim_user.is_admin:
                kassim_user.is_admin = True
                await db.commit()
                print("[Student Affairs] Upgraded user to admin: kassimmusa322@gmail.com")

        # Seed student Emily
        emily_result = await db.execute(select(User).where(User.email == "emily.wanjiru@student.uonbi.ac.ke"))
        emily = emily_result.scalars().first()
        if not emily:
            emily = User(
                name="Emily Wanjiru Kamau",
                email="emily.wanjiru@student.uonbi.ac.ke",
                password=hash_password("student123"),
                subscription_tier="free",
                is_admin=False,
                is_active=True,
                profile_picture="https://api.dicebear.com/7.x/initials/svg?seed=Emily",
            )
            db.add(emily)
            await db.commit()
            await db.refresh(emily)
            print("[Student Affairs] Seeded student Emily")

        # Seed lecturer Dr. Peter
        peter_result = await db.execute(select(User).where(User.email == "peter.otieno@uonbi.ac.ke"))
        peter = peter_result.scalars().first()
        if not peter:
            peter = User(
                name="Dr. Peter Otieno",
                email="peter.otieno@uonbi.ac.ke",
                password=hash_password("lecturer123"),
                subscription_tier="premium",
                is_admin=False,
                is_active=True,
                profile_picture="https://api.dicebear.com/7.x/initials/svg?seed=Peter",
            )
            db.add(peter)
            await db.commit()
            await db.refresh(peter)
            print("[Student Affairs] Seeded lecturer Dr. Peter")

        # Seed admin Prof. Kaleb
        kaleb_result = await db.execute(select(User).where(User.email == "kaleb.wambua@uonbi.ac.ke"))
        kaleb = kaleb_result.scalars().first()
        if not kaleb:
            kaleb = User(
                name="Prof. Kaleb Wambua",
                email="kaleb.wambua@uonbi.ac.ke",
                password=hash_password("admin123"),
                subscription_tier="premium",
                is_admin=True,
                is_active=True,
                profile_picture="https://api.dicebear.com/7.x/initials/svg?seed=Kaleb",
            )
            db.add(kaleb)
            await db.commit()
            await db.refresh(kaleb)
            print("[Student Affairs] Seeded admin Prof. Kaleb")

        # Seed tickets if none exist
        from app.models.ticket import Ticket
        from app.models.comment import Comment
        tickets_result = await db.execute(select(Ticket))
        existing_tickets = tickets_result.scalars().all()
        if not existing_tickets:
            t1 = Ticket(
                ticket_id="UON-1042",
                reg_number="CS/45231/2022",
                faculty="Faculty of Science & Technology",
                department="Computing & Informatics",
                unit_code="ICS 2101 — Data Structures & Algorithms",
                assessment_category="CAT",
                claimed_score=28,
                status="Submitted to Department/Lecturer",
                proof_attachment="cat2_docket_scan.pdf",
                student_id=emily.id,
            )
            db.add(t1)

            t2 = Ticket(
                ticket_id="UON-1039",
                reg_number="CS/45231/2022",
                faculty="Faculty of Science & Technology",
                department="Computing & Informatics",
                unit_code="ICS 2205 — Database Systems",
                assessment_category="Lab Report / Practical Score",
                claimed_score=18,
                status="Awaiting Student Response",
                proof_attachment="lab_sheet_pg2.jpg",
                student_id=emily.id,
                lecturer_id=peter.id,
            )
            db.add(t2)

            t3 = Ticket(
                ticket_id="UON-1031",
                reg_number="CS/40118/2021",
                faculty="Faculty of Science & Technology",
                department="Computing & Informatics",
                unit_code="ICS 2303 — Computer Networks",
                assessment_category="End of Semester Main Exam",
                claimed_score=71,
                verified_score=71,
                status="Cleared for SMS Update",
                proof_attachment="exam_slip.pdf",
                student_id=emily.id,
                lecturer_id=peter.id,
            )
            db.add(t3)

            t4 = Ticket(
                ticket_id="UON-1022",
                reg_number="CS/38890/2021",
                faculty="Faculty of Science & Technology",
                department="Computing & Informatics",
                unit_code="ICS 2401 — Software Engineering",
                assessment_category="CAT",
                claimed_score=25,
                status="Rejected — Insufficient Proof",
                proof_attachment="cat_photo.jpg",
                student_id=emily.id,
                lecturer_id=peter.id,
            )
            db.add(t4)
            await db.commit()
            await db.refresh(t2)
            await db.refresh(t4)

            # Seed comments
            c1 = Comment(
                ticket_id=t2.id,
                author_name="Dr. Peter Otieno",
                author_role="lecturer",
                message="Please re-upload a clearer image of page 2 of your lab attendance sheet — the signature is not legible.",
            )
            db.add(c1)

            c2 = Comment(
                ticket_id=t4.id,
                author_name="Dr. Peter Otieno",
                author_role="lecturer",
                message="The submitted image does not show the invigilator's stamp or docket number. Cannot verify against departmental records.",
            )
            db.add(c2)
            await db.commit()
            print("[UoN Clearinghouse] Seeded default ticket data")
        # Notices and support seeding disabled (archived)
        pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed data on startup."""
    # Import all models to register them with Base
    from app.models import user, setting, activity, ad, ticket, comment  # noqa: F401

    from sqlalchemy import text
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE tickets ADD COLUMN lecturer_name VARCHAR(255)"))
        except Exception as e:
            print(f"[Lifespan Startup] Migrate lecturer_name column skip: {e}")
        try:
            await conn.execute(text("ALTER TABLE tickets ADD COLUMN lecturer_email VARCHAR(255)"))
        except Exception as e:
            print(f"[Lifespan Startup] Migrate lecturer_email column skip: {e}")
        try:
            await conn.execute(text("ALTER TABLE tickets ADD COLUMN completed_elements VARCHAR(500)"))
        except Exception as e:
            print(f"[Lifespan Startup] Migrate completed_elements column skip: {e}")
    print("[UoN Clearinghouse] Database tables created")

    await seed_default_data()

    # Flush or schedule pending notifications on startup
    import asyncio
    from sqlalchemy import select
    from app.models.ticket import PendingLecturerNotification, Ticket
    from app.services.email_service import check_and_send_debounced_lecturer_notifications
    async with AsyncSessionLocal() as db:
        try:
            res = await db.execute(select(PendingLecturerNotification.lecturer_email).distinct())
            emails = res.scalars().all()
            for email in emails:
                ticket_res = await db.execute(select(Ticket.lecturer_name).where(Ticket.lecturer_email == email).limit(1))
                lec_name = ticket_res.scalar() or "Lecturer"
                asyncio.create_task(check_and_send_debounced_lecturer_notifications(email, lec_name, delay=10))
        except Exception as e:
            print(f"[Lifespan Startup] Skip notification flush: {e}")

    yield

    await engine.dispose()


app = FastAPI(
    title="UoN Academic Grievance Clearinghouse API",
    description="Backend API for managing missing marks claims and resolution comment threads",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────
@app.middleware("http")
async def dynamic_cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    # Echo back whatever headers the browser asks for
    requested_headers = request.headers.get("access-control-request-headers", "content-type, authorization")
    
    # Process preflight OPTIONS request
    if request.method == "OPTIONS" and origin:
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = requested_headers
        response.headers["Access-Control-Max-Age"] = "600"
        return response
        
    response = await call_next(request)
    
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = requested_headers
        
    return response

# ── Routers ──────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(internal.router)
app.include_router(tickets.router)

os.makedirs("media", exist_ok=True)
app.mount("/api/media", StaticFiles(directory="media"), name="media")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "UoN Clearinghouse API"}
