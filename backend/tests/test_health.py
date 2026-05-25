"""
Basic backend tests — run before each deployment to catch regressions.
"""
import pytest
import ast
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── Syntax Tests ──────────────────────────────────────────────────────────────

def test_server_py_syntax():
    with open("server.py") as f:
        ast.parse(f.read())

def test_core_py_syntax():
    with open("core.py") as f:
        ast.parse(f.read())

def test_all_routes_syntax():
    for fname in ["auth", "ledger", "export", "backup", "admin"]:
        with open(f"routes/{fname}.py") as f:
            ast.parse(f.read())

def test_security_py_syntax():
    if os.path.exists("security.py"):
        with open("security.py") as f:
            ast.parse(f.read())

# ── Import Tests ──────────────────────────────────────────────────────────────

def test_core_imports():
    import core
    assert hasattr(core, "db")
    assert hasattr(core, "hash_password")
    assert hasattr(core, "verify_password")
    assert hasattr(core, "create_access_token")

def test_password_functions():
    from core import hash_password, verify_password
    hashed = hash_password("testpassword123")
    assert verify_password("testpassword123", hashed)
    assert not verify_password("wrongpassword", hashed)

def test_jwt_functions():
    from core import create_access_token, create_refresh_token
    token = create_access_token("test_id", "test@test.com")
    assert isinstance(token, str) and len(token) > 20
    refresh = create_refresh_token("test_id")
    assert isinstance(refresh, str) and len(refresh) > 20

# ── Security Tests ────────────────────────────────────────────────────────────

def test_email_validation():
    if not os.path.exists("security.py"):
        pytest.skip("security.py not found")
    from security import validate_email
    ok, _ = validate_email("valid@example.com")
    assert ok
    fail, msg = validate_email("notanemail")
    assert not fail
    disposable, msg2 = validate_email("test@mailinator.com")
    assert not disposable

def test_password_strength():
    if not os.path.exists("security.py"):
        pytest.skip("security.py not found")
    from security import validate_password_strength
    ok, _ = validate_password_strength("Test1234")
    assert ok
    fail, msg = validate_password_strength("abc")
    assert not fail
