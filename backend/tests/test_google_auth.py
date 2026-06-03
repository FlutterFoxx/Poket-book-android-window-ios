"""
Tests for custom Google OAuth (no Emergent auth) and Settings email verification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

# Skip HTTP tests when no server URL configured (CI unit-test runs)
requires_server = pytest.mark.skipif(
    not BASE_URL,
    reason="REACT_APP_BACKEND_URL not set — skipping integration tests"
)

def get_token(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json().get("access_token")
    return None

@requires_server
class TestGoogleOAuth:
    """Google OAuth endpoints"""

    def test_google_login_returns_url(self):
        r = requests.get(f"{BASE_URL}/api/auth/google/login")
        assert r.status_code == 200
        data = r.json()
        assert "url" in data
        assert "accounts.google.com" in data["url"]
        print(f"Google OAuth URL starts with: {data['url'][:60]}")

    def test_google_login_url_has_correct_client_id(self):
        r = requests.get(f"{BASE_URL}/api/auth/google/login")
        assert r.status_code == 200
        url = r.json()["url"]
        assert "190943738344" in url  # Our own Google client ID
        # emergentagent.com is the deployment domain (valid redirect_uri), not Emergent auth
        assert "client_id=190943738344" in url  # Uses our own Google credentials

    def test_google_callback_exists_without_code(self):
        """Callback endpoint should exist and handle missing code gracefully (redirect)"""
        r = requests.get(f"{BASE_URL}/api/auth/google/callback", allow_redirects=False)
        # Should redirect to /login?error=... (302/307) not 404
        assert r.status_code in [302, 307, 400]

    def test_google_callback_with_error_param(self):
        """Callback with error param should redirect gracefully"""
        r = requests.get(f"{BASE_URL}/api/auth/google/callback?error=access_denied", allow_redirects=False)
        assert r.status_code in [302, 307]


@requires_server
class TestSettingsEmailVerification:
    """Settings page email verification flow"""

    def test_resend_verification_endpoint(self):
        token = get_token("admin@khaata.com", "admin123")
        assert token, "Login failed"
        r = requests.post(
            f"{BASE_URL}/api/auth/resend-verification",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert r.status_code == 200
        print(f"Resend verification: {r.json()}")

    def test_login_admin_email_unverified(self):
        token = get_token("admin@khaata.com", "admin123")
        assert token, "Login failed"
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        data = r.json()
        print(f"admin email_verified: {data.get('email_verified')}")
        # This user should be unverified
        assert data.get("email_verified") == False
