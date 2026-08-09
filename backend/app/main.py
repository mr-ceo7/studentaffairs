"""
WinviRahisi API — FastAPI entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.database import engine, Base, AsyncSessionLocal
from app.routers import auth, tips, payments, subscriptions, admin, campaigns, internal, tickets


async def seed_default_data():
    """Seed default subscription tiers if they don't exist."""
    from sqlalchemy import select
    from app.models.subscription import SubscriptionTier
    from app.models.user import User
    from app.security import hash_password

    async with AsyncSessionLocal() as db:
        # Check if tiers exist
        result = await db.execute(select(SubscriptionTier))
        existing = result.scalars().all()

        if not existing:
            tiers = [
                SubscriptionTier(
                    tier_id="standard",
                    name="Standard",
                    description="Access to GG (Both Teams to Score) tips",
                    price_2wk=500,
                    price_4wk=800,
                    categories=["free", "gg"],
                    popular=False,
                ),
                SubscriptionTier(
                    tier_id="premium",
                    name="Premium",
                    description="Access to GG + Over 2.5 tips + VIP analysis",
                    price_2wk=1000,
                    price_4wk=1800,
                    categories=["free", "gg", "over25"],
                    popular=True,
                ),
            ]
            for tier in tiers:
                db.add(tier)
            await db.commit()
            print("[WinviRahisi] Seeded default subscription tiers")

        # Seed admin user if none exists
        admin_result = await db.execute(select(User).where(User.email == "admin@winvirahisi.com"))
        admin_user = admin_result.scalars().first()

        if not admin_user:
            admin_user = User(
                name="Admin",
                email="admin@winvirahisi.com",
                password=hash_password("admin123"),
                subscription_tier="premium",
                is_admin=True,
                is_active=True,
            )
            db.add(admin_user)
            await db.commit()
            print("[WinviRahisi] Seeded default admin: admin@winvirahisi.com / admin123")

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
            print("[WinviRahisi] Seeded admin user: kassimmusa322@gmail.com / admin123")
        else:
            if not kassim_user.is_admin:
                kassim_user.is_admin = True
                await db.commit()
                print("[WinviRahisi] Upgraded user to admin: kassimmusa322@gmail.com")

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
            print("[WinviRahisi] Seeded student Emily")

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
            print("[WinviRahisi] Seeded lecturer Dr. Peter")

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
            print("[WinviRahisi] Seeded admin Prof. Kaleb")

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed data on startup."""
    # Import all models to register them with Base
    from app.models import user, tip, payment, subscription, setting, activity, ad, campaign, ticket, comment  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[UoN Clearinghouse] Database tables created")

    await seed_default_data()

    yield

    await engine.dispose()


app = FastAPI(
    title="UoN Academic Grievance Clearinghouse API",
    description="Backend API for managing missing marks claims and resolution comment threads",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(tips.router)
app.include_router(payments.router)
app.include_router(subscriptions.router)
app.include_router(admin.router)
app.include_router(campaigns.router)
app.include_router(internal.router)
app.include_router(tickets.router)

os.makedirs("media", exist_ok=True)
app.mount("/api/media", StaticFiles(directory="media"), name="media")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "UoN Clearinghouse API"}
