"""Tests for email verification, resend verification, login email_verified field"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Skip all HTTP-based tests when no server URL is configured (e.g., in CI unit-test runs)
requires_server = pytest.mark.skipif(
    not BASE_URL,
    reason="REACT_APP_BACKEND_URL not set — skipping integration tests"
)

@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

def get_auth_token(session):
    """Login and return cookies/session with auth"""
    resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@khaata.com", "password": "admin123"})
    return resp

@requires_server
class TestLoginEmailVerified:
    """Login response must include email_verified field"""

    def test_login_returns_email_verified(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@khaata.com", "password": "admin123"})
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        data = resp.json()
        assert "email_verified" in data, "email_verified field missing from login response"
        print(f"PASS: email_verified={data['email_verified']}")


@requires_server
class TestVerifyEmailEndpoint:
    """GET /api/auth/verify-email?token="""

    def test_invalid_token_returns_400(self, session):
        resp = session.get(f"{BASE_URL}/api/auth/verify-email?token=invalid_token_xyz_123")
        assert resp.status_code == 400, f"Expected 400 got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "detail" in data
        print(f"PASS: Invalid token returns 400: {data['detail']}")

    def test_missing_token_returns_422_or_400(self, session):
        resp = session.get(f"{BASE_URL}/api/auth/verify-email")
        assert resp.status_code in [400, 422], f"Expected 400/422 got {resp.status_code}"
        print(f"PASS: Missing token returns {resp.status_code}")


@requires_server
class TestResendVerification:
    """POST /api/auth/resend-verification — requires auth"""

    def test_resend_requires_auth(self, session):
        resp = session.post(f"{BASE_URL}/api/auth/resend-verification")
        assert resp.status_code in [401, 403], f"Expected 401/403 got {resp.status_code}"
        print(f"PASS: Unauthenticated returns {resp.status_code}")

    def test_resend_with_auth(self, session):
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@khaata.com", "password": "admin123"})
        assert login_resp.status_code == 200
        # Use cookies from login (httpOnly cookies set by server)
        resp = session.post(f"{BASE_URL}/api/auth/resend-verification")
        # If user is already verified, returns 200 with "already verified" message
        # If not verified, returns 200 with "Verification email sent"
        assert resp.status_code == 200, f"Expected 200 got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert "message" in data
        assert "verified" in data["message"].lower() or "sent" in data["message"].lower()
        print(f"PASS: Resend returns 200: {data['message']}")


@requires_server
class TestRegistrationResponse:
    """Register response includes email_verified: false"""

    def test_register_returns_email_verified_false(self, session):
        import secrets as sec
        rand = sec.token_hex(4)
        email = f"test_{rand}@example.com"
        resp = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": email, "password": "TestPass@123", "name": "Test User"
        })
        assert resp.status_code == 200, f"Register failed: {resp.text}"
        data = resp.json()
        assert "email_verified" in data
        assert not data["email_verified"], f"Expected False, got {data['email_verified']}"
        print(f"PASS: Register returns email_verified=False for {email}")
        # Cleanup: no cleanup needed (test user)
