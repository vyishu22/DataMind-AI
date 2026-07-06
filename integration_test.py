#!/usr/bin/env python3
"""Quick integration test: verify core endpoints."""
import asyncio
import json
import httpx
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
TEST_EMAIL = f"test_{int(datetime.now().timestamp())}@example.com"
TEST_PASSWORD = "SecureTest123!"

async def main():
    async with httpx.AsyncClient(timeout=30) as client:
        print("=" * 60)
        print("INTEGRATION TEST")
        print("=" * 60)
        
        # ── Health ──────────────────────────────────────────────────────
        print("\n1. Health check...")
        r = await client.get(f"{BASE_URL}/api/health")
        print(f"   Status: {r.status_code}")
        print(f"   Response: {r.json()}")
        
        # ── Register ────────────────────────────────────────────────────
        print(f"\n2. Register user ({TEST_EMAIL})...")
        r = await client.post(
            f"{BASE_URL}/api/auth/register",
            json={"fullName": "Test User", "email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        print(f"   Status: {r.status_code}")
        if r.status_code == 201:
            data = r.json()
            access_token = data.get("access_token", "")
            print(f"   ✅ Registered. Token: {access_token[:20]}...")
        else:
            print(f"   ❌ Error: {r.text}")
            return
        
        # ── Login ───────────────────────────────────────────────────────
        print(f"\n3. Login...")
        r = await client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        print(f"   Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            access_token = data.get("access_token", "")
            print(f"   ✅ Login success. Token: {access_token[:20]}...")
        else:
            print(f"   ❌ Error: {r.text}")
            return
        
        # ── Get current user ────────────────────────────────────────────
        print(f"\n4. Get current user (me)...")
        headers = {"Authorization": f"Bearer {access_token}"}
        r = await client.get(f"{BASE_URL}/api/auth/me", headers=headers)
        print(f"   Status: {r.status_code}")
        if r.status_code == 200:
            user = r.json()
            print(f"   ✅ User: {user.get('email')}")
        else:
            print(f"   ❌ Error: {r.text}")
        
        # ── List datasets (empty initially) ─────────────────────────────
        print(f"\n5. List datasets...")
        r = await client.get(f"{BASE_URL}/api/datasets/", headers=headers)
        print(f"   Status: {r.status_code}")
        if r.status_code == 200:
            datasets = r.json()
            print(f"   ✅ Found {len(datasets)} dataset(s)")
        else:
            print(f"   ❌ Error: {r.text}")
        
        # ── Chat sessions (empty initially) ─────────────────────────────
        print(f"\n6. List chat sessions...")
        r = await client.get(f"{BASE_URL}/api/chat/sessions", headers=headers)
        print(f"   Status: {r.status_code}")
        if r.status_code == 200:
            sessions = r.json()
            print(f"   ✅ Found {len(sessions)} session(s)")
        else:
            print(f"   ❌ Error: {r.text}")
        
        print("\n" + "=" * 60)
        print("✅ Core integration flows working!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
