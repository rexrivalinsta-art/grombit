#!/usr/bin/env python3
"""
TrenchCrew Backend API Test Suite
Tests all backend endpoints in priority order
"""
import requests
import time
import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

# Base URL from frontend/.env
BASE_URL = "https://content-206.preview.emergentagent.com/api"

# MongoDB connection for manual balance update
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_test(name, passed, details=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} | {name}")
    if details:
        print(f"      {details}")
    return passed

def test_health():
    """Priority 1: GET /api/health"""
    print(f"\n{Colors.BLUE}=== Test 1: Health Check ==={Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        data = resp.json()
        passed = resp.status_code == 200 and data.get('ok') == True and 'ts' in data
        return log_test("GET /api/health", passed, f"Response: {data}")
    except Exception as e:
        return log_test("GET /api/health", False, f"Error: {e}")

def test_deposit_address():
    """Priority 2: GET /api/deposit-address"""
    print(f"\n{Colors.BLUE}=== Test 2: Deposit Address ==={Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/deposit-address", timeout=10)
        data = resp.json()
        expected = "GVhTVmoHJm56ZbhJarsbmjDUTLdZ1a6KqntJ14vT4dn6"
        passed = resp.status_code == 200 and data.get('address') == expected
        return log_test("GET /api/deposit-address", passed, f"Address: {data.get('address')}")
    except Exception as e:
        return log_test("GET /api/deposit-address", False, f"Error: {e}")

def test_auth_flow():
    """Priority 3: Complete auth flow"""
    print(f"\n{Colors.BLUE}=== Test 3: Auth Flow ==={Colors.END}")
    
    # Generate unique email with timestamp
    timestamp = int(time.time())
    email = f"test+{timestamp}@example.com"
    password = "test1234"
    
    results = []
    token = None
    
    # 3a. Signup with unique email
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", 
            json={"email": email, "password": password},
            headers={"Content-Type": "application/json"},
            timeout=10)
        data = resp.json()
        passed = resp.status_code == 200 and 'token' in data and 'user' in data
        token = data.get('token')
        if not passed:
            print(f"      DEBUG: Status={resp.status_code}, Response={data}")
        results.append(log_test("POST /api/auth/signup (new user)", passed, 
                               f"User ID: {data.get('user', {}).get('id')}"))
    except Exception as e:
        results.append(log_test("POST /api/auth/signup (new user)", False, f"Error: {e}"))
    
    # 3b. Login with same credentials
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        }, timeout=10)
        data = resp.json()
        passed = resp.status_code == 200 and 'token' in data and 'user' in data
        if passed and not token:
            token = data.get('token')
        results.append(log_test("POST /api/auth/login (correct creds)", passed))
    except Exception as e:
        results.append(log_test("POST /api/auth/login (correct creds)", False, f"Error: {e}"))
    
    # 3c. Signup with same email (should fail)
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={
            "email": email,
            "password": password
        }, timeout=10)
        passed = resp.status_code == 400
        results.append(log_test("POST /api/auth/signup (duplicate email)", passed, 
                               f"Status: {resp.status_code}, Expected: 400"))
    except Exception as e:
        results.append(log_test("POST /api/auth/signup (duplicate email)", False, f"Error: {e}"))
    
    # 3d. Login with wrong password
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": "wrongpassword123"
        }, timeout=10)
        passed = resp.status_code == 401
        results.append(log_test("POST /api/auth/login (wrong password)", passed, 
                               f"Status: {resp.status_code}, Expected: 401"))
    except Exception as e:
        results.append(log_test("POST /api/auth/login (wrong password)", False, f"Error: {e}"))
    
    # 3e. GET /api/me with Bearer token
    if token:
        try:
            resp = requests.get(f"{BASE_URL}/me", 
                              headers={"Authorization": f"Bearer {token}"}, 
                              timeout=10)
            data = resp.json()
            passed = resp.status_code == 200 and 'user' in data and data.get('session') is None
            results.append(log_test("GET /api/me (with token)", passed, 
                                   f"User email: {data.get('user', {}).get('email')}"))
        except Exception as e:
            results.append(log_test("GET /api/me (with token)", False, f"Error: {e}"))
    else:
        results.append(log_test("GET /api/me (with token)", False, "No token available"))
    
    # 3f. GET /api/me without token
    try:
        resp = requests.get(f"{BASE_URL}/me", timeout=10)
        passed = resp.status_code == 401
        results.append(log_test("GET /api/me (no token)", passed, 
                               f"Status: {resp.status_code}, Expected: 401"))
    except Exception as e:
        results.append(log_test("GET /api/me (no token)", False, f"Error: {e}"))
    
    return all(results), token, email

def test_coins():
    """Priority 4: GET /api/coins"""
    print(f"\n{Colors.BLUE}=== Test 4: Coins Endpoint ==={Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/coins", timeout=15)
        data = resp.json()
        coins = data.get('coins', [])
        passed = resp.status_code == 200 and len(coins) >= 1
        return log_test("GET /api/coins", passed, 
                       f"Returned {len(coins)} coins. First: {coins[0].get('symbol') if coins else 'N/A'}")
    except Exception as e:
        return log_test("GET /api/coins", False, f"Error: {e}")

def test_trading_risks():
    """Priority 5: GET /api/trading/risks"""
    print(f"\n{Colors.BLUE}=== Test 5: Trading Risks ==={Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/trading/risks", timeout=10)
        data = resp.json()
        risks = data.get('risks', [])
        passed = resp.status_code == 200 and len(risks) == 3
        risk_ids = [r.get('id') for r in risks]
        return log_test("GET /api/trading/risks", passed, 
                       f"Risks: {', '.join(risk_ids)}")
    except Exception as e:
        return log_test("GET /api/trading/risks", False, f"Error: {e}")

def test_trading_start_no_balance(token):
    """Priority 6: POST /api/trading/start with balance=0"""
    print(f"\n{Colors.BLUE}=== Test 6: Trading Start (No Balance) ==={Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/trading/start", 
                           json={"risk": "balanced"},
                           headers={"Authorization": f"Bearer {token}"}, 
                           timeout=10)
        data = resp.json()
        passed = resp.status_code == 400 and "Deposit at least 0.01 SOL" in data.get('detail', '')
        return log_test("POST /api/trading/start (balance=0)", passed, 
                       f"Error: {data.get('detail')}")
    except Exception as e:
        return log_test("POST /api/trading/start (balance=0)", False, f"Error: {e}")

def test_deposit_verify_invalid():
    """Priority 7: POST /api/deposit/verify with invalid signature"""
    print(f"\n{Colors.BLUE}=== Test 7: Deposit Verify (Invalid Signature) ==={Colors.END}")
    
    # Create a new user for this test
    timestamp = int(time.time())
    email = f"deposit_test+{timestamp}@example.com"
    password = "test1234"
    
    try:
        # Signup
        resp = requests.post(f"{BASE_URL}/auth/signup", json={
            "email": email,
            "password": password
        }, timeout=10)
        token = resp.json().get('token')
        
        # Try to verify invalid signature
        resp = requests.post(f"{BASE_URL}/deposit/verify", 
                           json={"tx_signature": "invalid_signature_123"},
                           headers={"Authorization": f"Bearer {token}"}, 
                           timeout=15)
        data = resp.json()
        detail = data.get('detail', '')
        passed = resp.status_code == 400 and len(detail) > 0
        return log_test("POST /api/deposit/verify (invalid sig)", passed, 
                       f"Error: {detail}")
    except Exception as e:
        return log_test("POST /api/deposit/verify (invalid sig)", False, f"Error: {e}")

def test_withdraw_insufficient_balance(token):
    """Priority 8: POST /api/withdraw with balance=0"""
    print(f"\n{Colors.BLUE}=== Test 8: Withdraw (Insufficient Balance) ==={Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/withdraw", 
                           json={
                               "destination": "GVhTVmoHJm56ZbhJarsbmjDUTLdZ1a6KqntJ14vT4dn6",
                               "amount_sol": 0.001
                           },
                           headers={"Authorization": f"Bearer {token}"}, 
                           timeout=10)
        data = resp.json()
        passed = resp.status_code == 400 and "Insufficient balance" in data.get('detail', '')
        return log_test("POST /api/withdraw (balance=0)", passed, 
                       f"Error: {data.get('detail')}")
    except Exception as e:
        return log_test("POST /api/withdraw (balance=0)", False, f"Error: {e}")

def test_chat(token):
    """Priority 9: POST /api/chat with Emergent LLM"""
    print(f"\n{Colors.BLUE}=== Test 9: Chat with CREW ==={Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/chat", 
                           json={"text": "say hello in one short line"},
                           headers={"Authorization": f"Bearer {token}"}, 
                           timeout=30)
        data = resp.json()
        reply = data.get('reply', '')
        passed = resp.status_code == 200 and len(reply) > 0
        return log_test("POST /api/chat", passed, 
                       f"Reply: {reply[:100]}..." if len(reply) > 100 else f"Reply: {reply}")
    except Exception as e:
        return log_test("POST /api/chat", False, f"Error: {e}")

async def credit_user_balance(user_id: str, amount: float):
    """Helper to manually credit user balance via MongoDB"""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    users_coll = db['tc_users']
    await users_coll.update_one(
        {'id': user_id},
        {'$set': {'balance_sol': amount}}
    )
    client.close()

def test_trading_engine_mock():
    """Priority 10: Trading engine mock run with manual balance credit"""
    print(f"\n{Colors.BLUE}=== Test 10: Trading Engine Mock Run ==={Colors.END}")
    
    results = []
    
    # 10a. Create new user
    timestamp = int(time.time())
    email = f"trader+{timestamp}@example.com"
    password = "test1234"
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json={
            "email": email,
            "password": password
        }, timeout=10)
        data = resp.json()
        token = data.get('token')
        user_id = data.get('user', {}).get('id')
        passed = resp.status_code == 200 and token and user_id
        results.append(log_test("10a. Create trader user", passed, f"User ID: {user_id}"))
        
        if not passed:
            return False
        
        # 10b. Credit balance via MongoDB
        try:
            asyncio.run(credit_user_balance(user_id, 1.0))
            results.append(log_test("10b. Credit balance (MongoDB)", True, "Set balance_sol=1.0"))
        except Exception as e:
            results.append(log_test("10b. Credit balance (MongoDB)", False, f"Error: {e}"))
            return False
        
        # 10c. Start trading
        resp = requests.post(f"{BASE_URL}/trading/start", 
                           json={"risk": "balanced"},
                           headers={"Authorization": f"Bearer {token}"}, 
                           timeout=10)
        data = resp.json()
        session = data.get('session', {})
        passed = resp.status_code == 200 and session.get('running') == True
        results.append(log_test("10c. POST /api/trading/start", passed, 
                               f"Session ID: {session.get('id')}, Running: {session.get('running')}"))
        
        if not passed:
            return False
        
        # 10d. Wait 10 seconds and check state
        print(f"      {Colors.YELLOW}Waiting 10 seconds for trades...{Colors.END}")
        time.sleep(10)
        
        resp = requests.get(f"{BASE_URL}/trading/state", 
                          headers={"Authorization": f"Bearer {token}"}, 
                          timeout=10)
        data = resp.json()
        session = data.get('session', {})
        logs = session.get('logs', [])
        trades = session.get('trades', [])
        passed = resp.status_code == 200 and len(logs) > 0
        results.append(log_test("10d. GET /api/trading/state (after 10s)", passed, 
                               f"Logs: {len(logs)}, Trades: {len(trades)}"))
        
        # 10e. Stop trading
        resp = requests.post(f"{BASE_URL}/trading/stop", 
                           headers={"Authorization": f"Bearer {token}"}, 
                           timeout=10)
        data = resp.json()
        session = data.get('session', {})
        passed = resp.status_code == 200 and session.get('running') == False
        results.append(log_test("10e. POST /api/trading/stop", passed, 
                               f"Running: {session.get('running')}, Final balance: {session.get('current_balance')}"))
        
        return all(results)
        
    except Exception as e:
        results.append(log_test("Trading engine mock", False, f"Error: {e}"))
        return False

def main():
    print(f"\n{Colors.BLUE}{'='*60}")
    print("TrenchCrew Backend API Test Suite")
    print(f"Base URL: {BASE_URL}")
    print(f"{'='*60}{Colors.END}\n")
    
    all_results = []
    
    # Priority 1: Health
    all_results.append(test_health())
    
    # Priority 2: Deposit address
    all_results.append(test_deposit_address())
    
    # Priority 3: Auth flow
    auth_passed, token, email = test_auth_flow()
    all_results.append(auth_passed)
    
    # Priority 4: Coins
    all_results.append(test_coins())
    
    # Priority 5: Trading risks
    all_results.append(test_trading_risks())
    
    # Priority 6: Trading start with no balance
    if token:
        all_results.append(test_trading_start_no_balance(token))
    else:
        print(f"{Colors.RED}Skipping trading start test (no token){Colors.END}")
        all_results.append(False)
    
    # Priority 7: Deposit verify with invalid signature
    all_results.append(test_deposit_verify_invalid())
    
    # Priority 8: Withdraw with insufficient balance
    if token:
        all_results.append(test_withdraw_insufficient_balance(token))
    else:
        print(f"{Colors.RED}Skipping withdraw test (no token){Colors.END}")
        all_results.append(False)
    
    # Priority 9: Chat
    if token:
        all_results.append(test_chat(token))
    else:
        print(f"{Colors.RED}Skipping chat test (no token){Colors.END}")
        all_results.append(False)
    
    # Priority 10: Trading engine mock
    all_results.append(test_trading_engine_mock())
    
    # Summary
    passed = sum(all_results)
    total = len(all_results)
    
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"Test Summary: {passed}/{total} tests passed")
    print(f"{'='*60}{Colors.END}\n")
    
    if passed == total:
        print(f"{Colors.GREEN}✓ All tests passed!{Colors.END}\n")
        return 0
    else:
        print(f"{Colors.RED}✗ Some tests failed{Colors.END}\n")
        return 1

if __name__ == "__main__":
    exit(main())
