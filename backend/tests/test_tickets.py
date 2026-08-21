import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.ticket import Ticket, PendingLecturerNotification
from app.security import hash_password

@pytest.mark.asyncio
async def test_create_ticket_with_lecturer_details(client: AsyncClient, db_session: AsyncSession):
    # 1. Create a student user
    student = User(
        name="Alice Student",
        email="alice@student.uonbi.ac.ke",
        password=hash_password("student123"),
        subscription_tier="free",
        is_admin=False,
        is_active=True,
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)

    # Mock authenticate as student (FastAPI uses dependency get_current_user)
    # We can override get_current_user by adding it to dependency_overrides
    from app.dependencies import get_current_user
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: student

    # 2. Submit ticket payload
    payload = {
        "reg_number": "CS/45231/2022",
        "faculty": "Faculty of Science & Technology",
        "department": "Department of Computer Science",
        "unit_code": "ICS 2101 — Data Structures & Algorithms",
        "assessment_category": "CAT",
        "claimed_score": 28,
        "additional_notes": "My score is missing from the list.",
        "lecturer_name": "Dr. Peter Otieno",
        "lecturer_email": "peter.otieno@uonbi.ac.ke",
    }

    response = await client.post("/api/tickets", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["ticket_id"].startswith("UON-")
    assert data["lecturer_name"] == "Dr. Peter Otieno"
    assert data["lecturer_email"] == "peter.otieno@uonbi.ac.ke"
    assert data["lecturer_id"] is None  # Lecturer has not onboarded yet

    # 3. Verify PendingLecturerNotification was queued in DB
    res = await db_session.execute(select(PendingLecturerNotification))
    pending = res.scalars().all()
    assert len(pending) == 1
    assert pending[0].lecturer_email == "peter.otieno@uonbi.ac.ke"
    assert pending[0].ticket_id == data["ticket_id"]

    # Clean up override
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_lecturer_lazy_onboarding(client: AsyncClient, db_session: AsyncSession):
    # 1. Add a ticket targeting an un-onboarded lecturer
    ticket = Ticket(
        ticket_id="UON-9999",
        reg_number="CS/45231/2022",
        faculty="Faculty of Science & Technology",
        department="Department of Computer Science",
        unit_code="ICS 2101 — Data Structures",
        assessment_category="CAT",
        student_id=1,
        status="Submitted to Department/Lecturer",
        lecturer_name="Dr. Peter Otieno",
        lecturer_email="peter.otieno@uonbi.ac.ke",
    )
    db_session.add(ticket)
    await db_session.commit()

    # 2. Trigger the auto-onboarding CTA endpoint
    response = await client.get(
        "/api/auth/onboard",
        params={"email": "peter.otieno@uonbi.ac.ke", "name": "Dr. Peter Otieno"},
        follow_redirects=False,
    )
    
    # Assert redirect to frontend dashboard and cookie settings
    assert response.status_code == 307  # Redirect response
    assert response.headers["location"].endswith("/clearance")
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

    # 3. Verify that the lecturer user was created in the DB
    res_user = await db_session.execute(
        select(User).where(User.email == "peter.otieno@uonbi.ac.ke")
    )
    lec_user = res_user.scalar_one_or_none()
    assert lec_user is not None
    assert lec_user.name == "Dr. Peter Otieno"

    # 4. Verify that the ticket was automatically associated to this lecturer's ID
    res_ticket = await db_session.execute(
        select(Ticket).where(Ticket.ticket_id == "UON-9999")
    )
    updated_ticket = res_ticket.scalar_one()
    assert updated_ticket.lecturer_id == lec_user.id
