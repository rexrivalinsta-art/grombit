#!/usr/bin/env python3
"""
TrenchCrew Launch Endpoints Test Suite
Tests the new pump.fun launch flow endpoints.
"""
import requests
import time
import sys
from pymongo import MongoClient

# Configuration
BASE_URL = "https://content-206.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

# Test results tracking
results = {
    'passed': [],
    'failed': [],
    'warnings': []
}

def log_pass(test_id, message):
    results['passed'].append(f"✓ {test_id}: {message}")
    print(f"✓ {test_id}: {message}")

def log_fail(test_id, message):
    results['failed'].append(f"✗ {test_id}: {message}")
    print(f"✗ {test_id}: {message}")

def log_warn(test_id, message):
    results['warnings'].append(f"⚠ {test_id}: {message}")
    print(f"⚠ {test_id}: {message}")

def get_mongo_client():
    return MongoClient(MONGO_URL)

def get_user_from_db(email):
    """Get user from MongoDB by email"""
    client = get_mongo_client()
    db = client[DB_NAME]
    user = db.tc_users.find_one({'email': email})
    client.close()
    return user

def update_user_balance(user_id, balance_sol):
    """Update user balance in MongoDB"""
    client = get_mongo_client()
    db = client[DB_NAME]
    db.tc_users.update_one({'id': user_id}, {'$set': {'balance_sol': balance_sol}})
    client.close()

# ============================================================
# L1. Auth happy path
# ============================================================
def test_l1_auth_happy_path():
    print("\n=== L1. Auth Happy Path ===")
    ts = int(time.time() * 1000)
    email = f"launch+{ts}@example.com"
    password = "test1234"
    
    # L1a. Signup
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={'email': email, 'password': password}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if 'token' in data and 'user' in data:
                token = data['token']
                user_id = data['user']['id']
                log_pass("L1a", f"Signup successful for {email}, got token and user_id={user_id}")
            else:
                log_fail("L1a", f"Signup returned 200 but missing token or user: {data}")
                return None, None
        else:
            log_fail("L1a", f"Signup failed with status {resp.status_code}: {resp.text[:200]}")
            return None, None
    except Exception as e:
        log_fail("L1a", f"Signup exception: {e}")
        return None, None
    
    # L1b. Login
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={'email': email, 'password': password}, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if 'token' in data:
                log_pass("L1b", f"Login successful for {email}")
                return data['token'], data['user']['id']
            else:
                log_fail("L1b", f"Login returned 200 but missing token: {data}")
                return None, None
        else:
            log_fail("L1b", f"Login failed with status {resp.status_code}: {resp.text[:200]}")
            return None, None
    except Exception as e:
        log_fail("L1b", f"Login exception: {e}")
        return None, None

# ============================================================
# L2. Insufficient balance guard
# ============================================================
def test_l2_insufficient_balance():
    print("\n=== L2. Insufficient Balance Guard ===")
    ts = int(time.time() * 1000)
    email = f"launch_nobal+{ts}@example.com"
    password = "test1234"
    
    # Signup user
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={'email': email, 'password': password}, timeout=10)
        if resp.status_code != 200:
            log_fail("L2", f"Signup failed: {resp.status_code} {resp.text[:200]}")
            return
        data = resp.json()
        token = data['token']
        user_id = data['user']['id']
        
        # Verify balance is 0
        user_db = get_user_from_db(email)
        if user_db:
            balance = float(user_db.get('balance_sol', 0.0))
            if balance != 0.0:
                log_warn("L2", f"User balance is {balance}, expected 0.0. Resetting to 0.")
                update_user_balance(user_id, 0.0)
        
        # Try to create launch with initial_buy_sol=0.1
        headers = {'Authorization': f'Bearer {token}'}
        launch_body = {
            'name': 'TestCoin',
            'symbol': 'TST',
            'metadata_uri': 'https://example.com/x.json',
            'initial_buy_sol': 0.1,
            'slippage_bps': 1000,
            'priority_fee_sol': 0.0005
        }
        resp = requests.post(f"{BASE_URL}/launch/create", json=launch_body, headers=headers, timeout=10)
        
        if resp.status_code == 400:
            detail = resp.json().get('detail', '')
            if 'Insufficient balance' in detail or 'insufficient balance' in detail.lower():
                log_pass("L2a", f"Correctly rejected with 400 'Insufficient balance': {detail}")
            else:
                log_fail("L2a", f"Got 400 but wrong message: {detail}")
        else:
            log_fail("L2a", f"Expected 400, got {resp.status_code}: {resp.text[:200]}")
        
        # Verify balance still 0 in DB
        user_db_after = get_user_from_db(email)
        if user_db_after:
            balance_after = float(user_db_after.get('balance_sol', 0.0))
            if balance_after == 0.0:
                log_pass("L2b", f"User balance unchanged (still 0.0) after failed create attempt")
            else:
                log_fail("L2b", f"User balance changed to {balance_after}, expected 0.0")
        else:
            log_fail("L2b", "Could not find user in DB after test")
            
    except Exception as e:
        log_fail("L2", f"Exception: {e}")

# ============================================================
# L3. Upload metadata smoke
# ============================================================
def test_l3_upload_metadata(token):
    print("\n=== L3. Upload Metadata Smoke ===")
    if not token:
        log_fail("L3", "No token provided, skipping")
        return
    
    # 1x1 PNG bytes
    png_hex = '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082'
    png_bytes = bytes.fromhex(png_hex)
    
    try:
        headers = {'Authorization': f'Bearer {token}'}
        files = {'file': ('test.png', png_bytes, 'image/png')}
        data = {
            'name': 'TestCoin',
            'symbol': 'TST',
            'description': 'hello'
        }
        resp = requests.post(f"{BASE_URL}/launch/upload", files=files, data=data, headers=headers, timeout=45)
        
        if resp.status_code == 200:
            try:
                json_data = resp.json()
                if json_data.get('ok') and 'uri' in json_data:
                    log_pass("L3", f"Upload successful, got URI: {json_data['uri'][:80]}")
                else:
                    log_fail("L3", f"Upload returned 200 but unexpected format: {json_data}")
            except Exception as e:
                log_fail("L3", f"Upload returned 200 but invalid JSON: {resp.text[:200]}")
        elif resp.status_code == 502:
            try:
                json_data = resp.json()
                detail = json_data.get('detail', '')
                log_pass("L3", f"Upload returned 502 (pump.fun IPFS may reject), clean JSON error: {detail[:150]}")
            except Exception as e:
                log_fail("L3", f"Upload returned 502 but invalid JSON: {resp.text[:200]}")
        else:
            log_fail("L3", f"Upload returned unexpected status {resp.status_code}: {resp.text[:200]}")
            
    except Exception as e:
        log_fail("L3", f"Exception: {e}")

# ============================================================
# L4. Create with sufficient balance but likely-failing on-chain
# ============================================================
def test_l4_create_with_balance():
    print("\n=== L4. Create with Sufficient Balance (Expected On-Chain Failure) ===")
    ts = int(time.time() * 1000)
    email = f"launch_bal+{ts}@example.com"
    password = "test1234"
    
    try:
        # Signup
        resp = requests.post(f"{BASE_URL}/auth/signup", json={'email': email, 'password': password}, timeout=10)
        if resp.status_code != 200:
            log_fail("L4", f"Signup failed: {resp.status_code} {resp.text[:200]}")
            return
        data = resp.json()
        token = data['token']
        user_id = data['user']['id']
        
        # Update balance to 1.0 SOL via MongoDB
        update_user_balance(user_id, 1.0)
        log_pass("L4a", f"User created and balance set to 1.0 SOL via MongoDB")
        
        # Verify balance in DB
        user_db = get_user_from_db(email)
        balance_before = float(user_db.get('balance_sol', 0.0))
        if balance_before != 1.0:
            log_fail("L4a", f"Balance in DB is {balance_before}, expected 1.0")
            return
        
        # Try to create launch
        headers = {'Authorization': f'Bearer {token}'}
        launch_body = {
            'name': 'TestCoin',
            'symbol': 'TST',
            'metadata_uri': 'https://example.com/meta.json',
            'initial_buy_sol': 0.0,
            'slippage_bps': 1000,
            'priority_fee_sol': 0.0005
        }
        resp = requests.post(f"{BASE_URL}/launch/create", json=launch_body, headers=headers, timeout=45)
        
        if resp.status_code == 502:
            try:
                json_data = resp.json()
                detail = json_data.get('detail', '')
                if 'Launch failed' in detail or 'underfunded' in detail or 'PumpPortal' in detail:
                    log_pass("L4b", f"Create returned 502 as expected (crew wallet empty or invalid URI): {detail[:200]}")
                else:
                    log_pass("L4b", f"Create returned 502 with detail: {detail[:200]}")
            except Exception as e:
                log_fail("L4b", f"Create returned 502 but invalid JSON: {resp.text[:200]}")
        elif resp.status_code == 200:
            log_warn("L4b", f"Create unexpectedly succeeded (200). This means crew wallet is funded. Response: {resp.text[:200]}")
        else:
            log_fail("L4b", f"Create returned unexpected status {resp.status_code}: {resp.text[:200]}")
        
        # CRITICAL: Verify balance unchanged after failure
        user_db_after = get_user_from_db(email)
        balance_after = float(user_db_after.get('balance_sol', 0.0))
        if balance_after == 1.0:
            log_pass("L4c", f"CRITICAL: User balance unchanged (still 1.0 SOL) after failed create - NO DEBIT ON FAILURE ✓")
        else:
            log_fail("L4c", f"CRITICAL: User balance changed to {balance_after}, expected 1.0 - BALANCE WAS DEBITED ON FAILURE!")
            
    except Exception as e:
        log_fail("L4", f"Exception: {e}")

# ============================================================
# L5. Launch history empty
# ============================================================
def test_l5_launch_history():
    print("\n=== L5. Launch History Empty ===")
    ts = int(time.time() * 1000)
    email = f"launch_hist+{ts}@example.com"
    password = "test1234"
    
    try:
        # Signup
        resp = requests.post(f"{BASE_URL}/auth/signup", json={'email': email, 'password': password}, timeout=10)
        if resp.status_code != 200:
            log_fail("L5", f"Signup failed: {resp.status_code} {resp.text[:200]}")
            return
        data = resp.json()
        token = data['token']
        
        # Get launch history
        headers = {'Authorization': f'Bearer {token}'}
        resp = requests.get(f"{BASE_URL}/launch/history", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if 'launches' in data and isinstance(data['launches'], list):
                if len(data['launches']) == 0:
                    log_pass("L5", "Launch history is empty as expected")
                else:
                    log_fail("L5", f"Launch history has {len(data['launches'])} items, expected 0")
            else:
                log_fail("L5", f"Launch history response missing 'launches' array: {data}")
        else:
            log_fail("L5", f"Launch history failed with status {resp.status_code}: {resp.text[:200]}")
            
    except Exception as e:
        log_fail("L5", f"Exception: {e}")

# ============================================================
# L6. Regression smoke
# ============================================================
def test_l6_regression(token):
    print("\n=== L6. Regression Smoke ===")
    
    # L6a. Health
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('ok'):
                log_pass("L6a", "GET /api/health returns 200 with ok=true")
            else:
                log_fail("L6a", f"GET /api/health returns 200 but ok is not true: {data}")
        else:
            log_fail("L6a", f"GET /api/health failed with status {resp.status_code}")
    except Exception as e:
        log_fail("L6a", f"Health check exception: {e}")
    
    # L6b. Me
    if token:
        try:
            headers = {'Authorization': f'Bearer {token}'}
            resp = requests.get(f"{BASE_URL}/me", headers=headers, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if 'id' in data and 'email' in data:
                    log_pass("L6b", "GET /api/me returns 200 with user data")
                else:
                    log_fail("L6b", f"GET /api/me returns 200 but missing user fields: {data}")
            else:
                log_fail("L6b", f"GET /api/me failed with status {resp.status_code}")
        except Exception as e:
            log_fail("L6b", f"Me endpoint exception: {e}")
    else:
        log_warn("L6b", "No token available, skipping /api/me test")
    
    # L6c. Chat
    if token:
        try:
            headers = {'Authorization': f'Bearer {token}'}
            chat_body = {'text': 'ping', 'session_id': 'r', 'model': 'crew-core'}
            resp = requests.post(f"{BASE_URL}/chat", json=chat_body, headers=headers, timeout=30)
            if resp.status_code == 200:
                data = resp.json()
                if 'reply' in data and len(data['reply']) > 0:
                    log_pass("L6c", f"POST /api/chat returns 200 with non-empty reply ({len(data['reply'])} chars)")
                else:
                    log_fail("L6c", f"POST /api/chat returns 200 but empty reply: {data}")
            else:
                log_fail("L6c", f"POST /api/chat failed with status {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            log_fail("L6c", f"Chat endpoint exception: {e}")
    else:
        log_warn("L6c", "No token available, skipping /api/chat test")

# ============================================================
# Main test runner
# ============================================================
def main():
    print("=" * 60)
    print("TrenchCrew Launch Endpoints Test Suite")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"MongoDB: {MONGO_URL}/{DB_NAME}")
    print("=" * 60)
    
    # L1. Auth happy path
    token, user_id = test_l1_auth_happy_path()
    
    # L2. Insufficient balance
    test_l2_insufficient_balance()
    
    # L3. Upload metadata (needs token from L1)
    test_l3_upload_metadata(token)
    
    # L4. Create with balance
    test_l4_create_with_balance()
    
    # L5. Launch history
    test_l5_launch_history()
    
    # L6. Regression
    test_l6_regression(token)
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"✓ PASSED: {len(results['passed'])}")
    for p in results['passed']:
        print(f"  {p}")
    
    if results['warnings']:
        print(f"\n⚠ WARNINGS: {len(results['warnings'])}")
        for w in results['warnings']:
            print(f"  {w}")
    
    if results['failed']:
        print(f"\n✗ FAILED: {len(results['failed'])}")
        for f in results['failed']:
            print(f"  {f}")
        print("\n" + "=" * 60)
        sys.exit(1)
    else:
        print("\n" + "=" * 60)
        print("ALL TESTS PASSED!")
        print("=" * 60)
        sys.exit(0)

if __name__ == '__main__':
    main()
