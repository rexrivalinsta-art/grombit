#!/usr/bin/env python3
"""
TrenchCrew Backend Bug-Fix Verification Test Suite
Tests persistence, trading floor protection, chat model picker, and prompt leak prevention
"""
import requests
import time
import asyncio
from pymongo import MongoClient

# Base URL from frontend/.env + /api prefix
BASE_URL = "https://content-206.preview.emergentagent.com/api"

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"
COLLECTION = "tc_users"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'

def log_test(name, passed, details=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"{status} | {name}")
    if details:
        print(f"      {details}")
    return passed

def log_section(title):
    print(f"\n{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.CYAN}{title}{Colors.END}")
    print(f"{Colors.CYAN}{'='*80}{Colors.END}")

# ============================================================================
# TEST A — Persistence across signup/login
# ============================================================================
def test_a_persistence():
    log_section("TEST A — Persistence across signup/login")
    results = []
    
    # A1. POST /api/auth/signup
    timestamp = int(time.time() * 1000)
    email = f"persist+{timestamp}@example.com"
    password = "test1234"
    
    print(f"\n{Colors.BLUE}A1. Signup with email={email}{Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", 
            json={"email": email, "password": password},
            timeout=10)
        data = resp.json()
        passed = resp.status_code == 200 and 'token' in data and 'user' in data
        user_id = data.get('user', {}).get('id')
        token = data.get('token')
        results.append(log_test("A1. Signup", passed, f"User ID: {user_id}"))
        
        if not passed:
            print(f"      ERROR: Status={resp.status_code}, Response={data}")
            return results
    except Exception as e:
        results.append(log_test("A1. Signup", False, f"Error: {e}"))
        return results
    
    # A2. Via pymongo, update tc_users: set balance_sol=0.7, total_deposited=0.7
    print(f"\n{Colors.BLUE}A2. Direct MongoDB update: balance_sol=0.7, total_deposited=0.7{Colors.END}")
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        coll = db[COLLECTION]
        
        result = coll.update_one(
            {'id': user_id},
            {'$set': {'balance_sol': 0.7, 'total_deposited': 0.7}}
        )
        passed = result.modified_count == 1
        results.append(log_test("A2. MongoDB update", passed, 
                               f"Modified count: {result.modified_count}"))
        
        # Verify the update
        user_doc = coll.find_one({'id': user_id})
        if user_doc:
            print(f"      Verified: balance_sol={user_doc.get('balance_sol')}, total_deposited={user_doc.get('total_deposited')}")
        
        client.close()
    except Exception as e:
        results.append(log_test("A2. MongoDB update", False, f"Error: {e}"))
        return results
    
    # A3. POST /api/auth/login → user object MUST show balance_sol=0.7, total_deposited=0.7
    print(f"\n{Colors.BLUE}A3. Login with same creds → verify balance persisted{Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", 
            json={"email": email, "password": password},
            timeout=10)
        data = resp.json()
        user = data.get('user', {})
        balance = user.get('balance_sol')
        total_dep = user.get('total_deposited')
        
        passed = (resp.status_code == 200 and 
                 balance == 0.7 and 
                 total_dep == 0.7)
        
        results.append(log_test("A3. Login persistence check", passed, 
                               f"balance_sol={balance}, total_deposited={total_dep}"))
        
        if not passed:
            print(f"      ERROR: Expected balance_sol=0.7, total_deposited=0.7")
            print(f"      Got: balance_sol={balance}, total_deposited={total_dep}")
    except Exception as e:
        results.append(log_test("A3. Login persistence check", False, f"Error: {e}"))
    
    # A4. GET /api/me → user.balance_sol=0.7, user.total_deposited=0.7
    print(f"\n{Colors.BLUE}A4. GET /api/me with bearer token → verify balance{Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/me", 
            headers={"Authorization": f"Bearer {token}"},
            timeout=10)
        data = resp.json()
        user = data.get('user', {})
        balance = user.get('balance_sol')
        total_dep = user.get('total_deposited')
        
        passed = (resp.status_code == 200 and 
                 balance == 0.7 and 
                 total_dep == 0.7)
        
        results.append(log_test("A4. GET /me persistence check", passed, 
                               f"balance_sol={balance}, total_deposited={total_dep}"))
        
        if not passed:
            print(f"      ERROR: Expected balance_sol=0.7, total_deposited=0.7")
            print(f"      Got: balance_sol={balance}, total_deposited={total_dep}")
    except Exception as e:
        results.append(log_test("A4. GET /me persistence check", False, f"Error: {e}"))
    
    return results

# ============================================================================
# TEST B — Trading floor protection (balance never drops below 50%)
# ============================================================================
def test_b_trading_floor():
    log_section("TEST B — Trading floor protection (balance >= 50% of starting)")
    results = []
    
    # B1. Create user, direct Mongo set balance_sol=1.0
    timestamp = int(time.time() * 1000)
    email = f"trader+{timestamp}@example.com"
    password = "test1234"
    
    print(f"\n{Colors.BLUE}B1. Create user and set balance_sol=1.0{Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", 
            json={"email": email, "password": password},
            timeout=10)
        data = resp.json()
        user_id = data.get('user', {}).get('id')
        token = data.get('token')
        
        # Direct MongoDB update
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        coll = db[COLLECTION]
        coll.update_one({'id': user_id}, {'$set': {'balance_sol': 1.0}})
        client.close()
        
        results.append(log_test("B1. User created with balance=1.0", True, 
                               f"User ID: {user_id}"))
    except Exception as e:
        results.append(log_test("B1. User creation", False, f"Error: {e}"))
        return results
    
    # B2. POST /api/trading/start risk=balanced
    print(f"\n{Colors.BLUE}B2. Start trading session with risk=balanced{Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/trading/start", 
            json={"risk": "balanced"},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10)
        data = resp.json()
        session = data.get('session', {})
        
        passed = resp.status_code == 200 and session.get('running') == True
        results.append(log_test("B2. Trading session started", passed, 
                               f"Session ID: {session.get('id')}"))
        
        if not passed:
            print(f"      ERROR: Status={resp.status_code}, Response={data}")
            return results
    except Exception as e:
        results.append(log_test("B2. Trading session start", False, f"Error: {e}"))
        return results
    
    # B3. Poll GET /api/trading/state every 3s for ~30s
    print(f"\n{Colors.BLUE}B3. Poll trading state every 3s for 30s → verify balance >= 0.5{Colors.END}")
    balances = []
    floor_violations = []
    
    try:
        for i in range(10):  # 10 polls over 30 seconds
            time.sleep(3)
            resp = requests.get(f"{BASE_URL}/trading/state", 
                headers={"Authorization": f"Bearer {token}"},
                timeout=10)
            data = resp.json()
            session = data.get('session', {})
            current_balance = session.get('current_balance', 0)
            balances.append(current_balance)
            
            print(f"      Poll {i+1}/10: balance={current_balance:.6f} SOL", end="")
            
            if current_balance < 0.5:
                floor_violations.append((i+1, current_balance))
                print(f" {Colors.RED}[FLOOR VIOLATION!]{Colors.END}")
            else:
                print(f" {Colors.GREEN}[OK]{Colors.END}")
        
        min_balance = min(balances)
        max_balance = max(balances)
        final_balance = balances[-1]
        
        passed = len(floor_violations) == 0
        results.append(log_test("B3. Floor protection (balance >= 0.5)", passed, 
                               f"Min={min_balance:.6f}, Max={max_balance:.6f}, Final={final_balance:.6f}"))
        
        if floor_violations:
            print(f"      {Colors.RED}FLOOR VIOLATIONS:{Colors.END}")
            for poll_num, bal in floor_violations:
                print(f"        Poll {poll_num}: balance={bal:.6f} < 0.5")
    except Exception as e:
        results.append(log_test("B3. Floor protection polling", False, f"Error: {e}"))
    
    # B4. POST /api/trading/stop
    print(f"\n{Colors.BLUE}B4. Stop trading session{Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/trading/stop", 
            headers={"Authorization": f"Bearer {token}"},
            timeout=10)
        data = resp.json()
        session = data.get('session', {})
        
        passed = resp.status_code == 200 and session.get('running') == False
        results.append(log_test("B4. Trading session stopped", passed))
    except Exception as e:
        results.append(log_test("B4. Trading session stop", False, f"Error: {e}"))
    
    return results

# ============================================================================
# TEST C — Chat with model picker
# ============================================================================
def test_c_chat_models():
    log_section("TEST C — Chat with model picker (cosmetic field)")
    results = []
    
    # Create a test user
    timestamp = int(time.time() * 1000)
    email = f"chat+{timestamp}@example.com"
    password = "test1234"
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", 
            json={"email": email, "password": password},
            timeout=10)
        token = resp.json().get('token')
    except Exception as e:
        print(f"      ERROR: Failed to create test user: {e}")
        return results
    
    # C1. Test with grok-bot-v4
    print(f"\n{Colors.BLUE}C1. Test chat with model='grok-bot-v4'{Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/chat", 
            json={
                "text": "scan low-cap pairs with volume",
                "session_id": "test-c",
                "model": "grok-bot-v4"
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=15)
        data = resp.json()
        reply = data.get('reply', '')
        
        passed = resp.status_code == 200 and len(reply) > 0
        results.append(log_test("C1. Chat with grok-bot-v4", passed, 
                               f"Reply length: {len(reply)} chars"))
    except Exception as e:
        results.append(log_test("C1. Chat with grok-bot-v4", False, f"Error: {e}"))
    
    # C2. Test all other models
    print(f"\n{Colors.BLUE}C2. Test chat with all model variants{Colors.END}")
    models = ["jev-typesafe", "dot-reasoner", "nebula-3", "vista-ultra", 
              "astra-6", "omega-mix", "crew-core"]
    
    for model in models:
        try:
            resp = requests.post(f"{BASE_URL}/chat", 
                json={
                    "text": "scan low-cap pairs with volume",
                    "session_id": f"test-c-{model}",
                    "model": model
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=15)
            data = resp.json()
            reply = data.get('reply', '')
            
            passed = resp.status_code == 200 and len(reply) > 0
            results.append(log_test(f"C2. Chat with {model}", passed, 
                                   f"Reply length: {len(reply)} chars"))
        except Exception as e:
            results.append(log_test(f"C2. Chat with {model}", False, f"Error: {e}"))
    
    # C3. Test invalid model (should fall back silently)
    print(f"\n{Colors.BLUE}C3. Test chat with invalid model 'fake-model-xyz'{Colors.END}")
    try:
        resp = requests.post(f"{BASE_URL}/chat", 
            json={
                "text": "scan low-cap pairs with volume",
                "session_id": "test-c-invalid",
                "model": "fake-model-xyz"
            },
            headers={"Authorization": f"Bearer {token}"},
            timeout=15)
        data = resp.json()
        reply = data.get('reply', '')
        
        passed = resp.status_code == 200 and len(reply) > 0
        results.append(log_test("C3. Chat with invalid model (fallback)", passed, 
                               f"Reply length: {len(reply)} chars"))
    except Exception as e:
        results.append(log_test("C3. Chat with invalid model", False, f"Error: {e}"))
    
    return results

# ============================================================================
# TEST D — Chat prompt must not leak 'mock'/'simulated'/'fake'
# ============================================================================
def test_d_chat_prompt_leak():
    log_section("TEST D — Chat prompt leak prevention")
    results = []
    
    # Create a test user
    timestamp = int(time.time() * 1000)
    email = f"leak+{timestamp}@example.com"
    password = "test1234"
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", 
            json={"email": email, "password": password},
            timeout=10)
        token = resp.json().get('token')
    except Exception as e:
        print(f"      ERROR: Failed to create test user: {e}")
        return results
    
    prompts = [
        "find low-cap gems with volume",
        "any whale buys today?",
        "what's going on with memecoins on pump.fun?"
    ]
    
    forbidden_words = ['mock', 'simulated', 'fake']
    
    for idx, prompt in enumerate(prompts, 1):
        print(f"\n{Colors.BLUE}D{idx}. Test prompt: '{prompt}'{Colors.END}")
        try:
            resp = requests.post(f"{BASE_URL}/chat", 
                json={
                    "text": prompt,
                    "session_id": f"test-d-{idx}",
                    "model": "crew-core"
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=15)
            data = resp.json()
            reply = data.get('reply', '').lower()
            
            # Check for forbidden words
            leaks = [word for word in forbidden_words if word in reply]
            
            passed = resp.status_code == 200 and len(leaks) == 0
            
            if leaks:
                results.append(log_test(f"D{idx}. Prompt leak check", passed, 
                                       f"{Colors.RED}LEAKED WORDS: {leaks}{Colors.END}"))
                print(f"      Reply excerpt: {reply[:200]}...")
            else:
                results.append(log_test(f"D{idx}. Prompt leak check", passed, 
                                       f"No forbidden words found"))
        except Exception as e:
            results.append(log_test(f"D{idx}. Prompt leak check", False, f"Error: {e}"))
    
    return results

# ============================================================================
# TEST E — Regression smoke tests
# ============================================================================
def test_e_regression():
    log_section("TEST E — Regression smoke tests")
    results = []
    
    # E1. GET /api/health
    print(f"\n{Colors.BLUE}E1. GET /api/health{Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        data = resp.json()
        passed = resp.status_code == 200 and data.get('ok') == True
        results.append(log_test("E1. Health check", passed))
    except Exception as e:
        results.append(log_test("E1. Health check", False, f"Error: {e}"))
    
    # E2. GET /api/deposit-address
    print(f"\n{Colors.BLUE}E2. GET /api/deposit-address{Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/deposit-address", timeout=10)
        data = resp.json()
        expected = "GVhTVmoHJm56ZbhJarsbmjDUTLdZ1a6KqntJ14vT4dn6"
        passed = resp.status_code == 200 and data.get('address') == expected
        results.append(log_test("E2. Deposit address", passed, 
                               f"Address: {data.get('address')}"))
    except Exception as e:
        results.append(log_test("E2. Deposit address", False, f"Error: {e}"))
    
    # E3. GET /api/coins
    print(f"\n{Colors.BLUE}E3. GET /api/coins{Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/coins", timeout=10)
        data = resp.json()
        coins = data.get('coins', [])
        passed = resp.status_code == 200 and len(coins) > 0
        results.append(log_test("E3. Coins endpoint", passed, 
                               f"Returned {len(coins)} coins"))
    except Exception as e:
        results.append(log_test("E3. Coins endpoint", False, f"Error: {e}"))
    
    # E4. GET /api/trading/risks
    print(f"\n{Colors.BLUE}E4. GET /api/trading/risks{Colors.END}")
    try:
        resp = requests.get(f"{BASE_URL}/trading/risks", timeout=10)
        data = resp.json()
        risks = data.get('risks', [])
        passed = resp.status_code == 200 and len(risks) == 3
        results.append(log_test("E4. Trading risks", passed, 
                               f"Returned {len(risks)} risk profiles"))
    except Exception as e:
        results.append(log_test("E4. Trading risks", False, f"Error: {e}"))
    
    return results

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def main():
    print(f"\n{Colors.CYAN}{'='*80}{Colors.END}")
    print(f"{Colors.CYAN}TrenchCrew Backend Bug-Fix Verification Test Suite{Colors.END}")
    print(f"{Colors.CYAN}Base URL: {BASE_URL}{Colors.END}")
    print(f"{Colors.CYAN}{'='*80}{Colors.END}")
    
    all_results = []
    
    # Run all test suites
    all_results.extend(test_a_persistence())
    all_results.extend(test_b_trading_floor())
    all_results.extend(test_c_chat_models())
    all_results.extend(test_d_chat_prompt_leak())
    all_results.extend(test_e_regression())
    
    # Summary
    log_section("TEST SUMMARY")
    passed = sum(all_results)
    total = len(all_results)
    failed = total - passed
    
    print(f"\n{Colors.CYAN}Total Tests: {total}{Colors.END}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed}{Colors.END}")
    
    if failed == 0:
        print(f"\n{Colors.GREEN}{'='*80}{Colors.END}")
        print(f"{Colors.GREEN}ALL TESTS PASSED ✓{Colors.END}")
        print(f"{Colors.GREEN}{'='*80}{Colors.END}")
    else:
        print(f"\n{Colors.RED}{'='*80}{Colors.END}")
        print(f"{Colors.RED}SOME TESTS FAILED ✗{Colors.END}")
        print(f"{Colors.RED}{'='*80}{Colors.END}")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
