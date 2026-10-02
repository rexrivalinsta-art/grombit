#!/usr/bin/env python3
"""
TrenchCrew Backend Bug-Fix Verification - Final Report
Runs all tests and generates a comprehensive report
"""
import requests
import time
from pymongo import MongoClient

BASE_URL = "https://content-206.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"
COLLECTION = "tc_users"

class TestReport:
    def __init__(self):
        self.results = []
        self.section = ""
    
    def set_section(self, name):
        self.section = name
        print(f"\n{'='*80}")
        print(f"{name}")
        print(f"{'='*80}")
    
    def log(self, test_name, passed, details=""):
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status} | {test_name}")
        if details:
            print(f"      {details}")
        self.results.append({
            'section': self.section,
            'test': test_name,
            'passed': passed,
            'details': details
        })
        return passed
    
    def summary(self):
        print(f"\n{'='*80}")
        print("FINAL TEST SUMMARY")
        print(f"{'='*80}")
        
        by_section = {}
        for r in self.results:
            sec = r['section']
            if sec not in by_section:
                by_section[sec] = {'passed': 0, 'failed': 0}
            if r['passed']:
                by_section[sec]['passed'] += 1
            else:
                by_section[sec]['failed'] += 1
        
        total_passed = sum(r['passed'] for r in self.results)
        total_failed = len(self.results) - total_passed
        
        print("\nBy Section:")
        for sec, counts in by_section.items():
            total = counts['passed'] + counts['failed']
            print(f"  {sec}: {counts['passed']}/{total} passed")
        
        print(f"\nOverall: {total_passed}/{len(self.results)} tests passed")
        
        if total_failed > 0:
            print(f"\nFailed Tests:")
            for r in self.results:
                if not r['passed']:
                    print(f"  ✗ {r['section']} - {r['test']}")
                    if r['details']:
                        print(f"    {r['details']}")
        
        return total_failed == 0

report = TestReport()

# ============================================================================
# TEST A — Persistence
# ============================================================================
report.set_section("TEST A — Persistence across signup/login")

timestamp = int(time.time() * 1000)
email = f"persist+{timestamp}@example.com"
password = "test1234"

print(f"\nA1. Signup with {email}")
try:
    resp = requests.post(f"{BASE_URL}/auth/signup", 
        json={"email": email, "password": password}, timeout=10)
    data = resp.json()
    user_id = data.get('user', {}).get('id')
    token = data.get('token')
    report.log("A1. Signup", resp.status_code == 200 and user_id, f"User ID: {user_id}")
except Exception as e:
    report.log("A1. Signup", False, f"Error: {e}")
    user_id = None
    token = None

if user_id:
    print(f"\nA2. MongoDB update: balance_sol=0.7, total_deposited=0.7")
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        coll = db[COLLECTION]
        result = coll.update_one({'id': user_id}, {'$set': {'balance_sol': 0.7, 'total_deposited': 0.7}})
        report.log("A2. MongoDB update", result.modified_count == 1, f"Modified: {result.modified_count}")
        client.close()
    except Exception as e:
        report.log("A2. MongoDB update", False, f"Error: {e}")
    
    print(f"\nA3. Login and verify persistence")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", 
            json={"email": email, "password": password}, timeout=10)
        data = resp.json()
        user = data.get('user', {})
        balance = user.get('balance_sol')
        total_dep = user.get('total_deposited')
        passed = balance == 0.7 and total_dep == 0.7
        report.log("A3. Login persistence", passed, 
                  f"balance_sol={balance}, total_deposited={total_dep}")
    except Exception as e:
        report.log("A3. Login persistence", False, f"Error: {e}")
    
    print(f"\nA4. GET /api/me")
    try:
        resp = requests.get(f"{BASE_URL}/me", 
            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        data = resp.json()
        user = data.get('user', {})
        balance = user.get('balance_sol')
        total_dep = user.get('total_deposited')
        passed = balance == 0.7 and total_dep == 0.7
        report.log("A4. GET /me persistence", passed, 
                  f"balance_sol={balance}, total_deposited={total_dep}")
    except Exception as e:
        report.log("A4. GET /me persistence", False, f"Error: {e}")

# ============================================================================
# TEST B — Trading floor protection (shortened to 18s)
# ============================================================================
report.set_section("TEST B — Trading floor protection")

timestamp = int(time.time() * 1000)
email = f"trader+{timestamp}@example.com"
password = "test1234"

print(f"\nB1. Create user with balance=1.0")
try:
    resp = requests.post(f"{BASE_URL}/auth/signup", 
        json={"email": email, "password": password}, timeout=10)
    data = resp.json()
    user_id = data.get('user', {}).get('id')
    token = data.get('token')
    
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    coll = db[COLLECTION]
    coll.update_one({'id': user_id}, {'$set': {'balance_sol': 1.0}})
    client.close()
    
    report.log("B1. User created", True, f"User ID: {user_id}")
except Exception as e:
    report.log("B1. User created", False, f"Error: {e}")
    user_id = None
    token = None

if token:
    print(f"\nB2. Start trading session")
    try:
        resp = requests.post(f"{BASE_URL}/trading/start", 
            json={"risk": "balanced"},
            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        data = resp.json()
        session = data.get('session', {})
        report.log("B2. Trading started", session.get('running') == True, 
                  f"Session ID: {session.get('id')}")
    except Exception as e:
        report.log("B2. Trading started", False, f"Error: {e}")
    
    print(f"\nB3. Poll trading state (6 polls over 18s)")
    balances = []
    violations = []
    
    try:
        for i in range(6):
            time.sleep(3)
            resp = requests.get(f"{BASE_URL}/trading/state", 
                headers={"Authorization": f"Bearer {token}"}, timeout=10)
            data = resp.json()
            session = data.get('session', {})
            current_balance = session.get('current_balance', 0)
            balances.append(current_balance)
            
            status = "OK" if current_balance >= 0.5 else "VIOLATION!"
            print(f"  Poll {i+1}/6: balance={current_balance:.6f} SOL [{status}]")
            
            if current_balance < 0.5:
                violations.append((i+1, current_balance))
        
        min_bal = min(balances)
        max_bal = max(balances)
        final_bal = balances[-1]
        
        passed = len(violations) == 0
        report.log("B3. Floor protection (>= 0.5)", passed, 
                  f"Min={min_bal:.6f}, Max={max_bal:.6f}, Final={final_bal:.6f}, Violations={len(violations)}")
    except Exception as e:
        report.log("B3. Floor protection", False, f"Error: {e}")
    
    print(f"\nB4. Stop trading session")
    try:
        resp = requests.post(f"{BASE_URL}/trading/stop", 
            headers={"Authorization": f"Bearer {token}"}, timeout=10)
        data = resp.json()
        session = data.get('session', {})
        report.log("B4. Trading stopped", session.get('running') == False)
    except Exception as e:
        report.log("B4. Trading stopped", False, f"Error: {e}")

# ============================================================================
# TEST C — Chat model picker (test 3 models + invalid)
# ============================================================================
report.set_section("TEST C — Chat model picker")

timestamp = int(time.time() * 1000)
email = f"chat+{timestamp}@example.com"
password = "test1234"

try:
    resp = requests.post(f"{BASE_URL}/auth/signup", 
        json={"email": email, "password": password}, timeout=10)
    token = resp.json().get('token')
except:
    token = None

if token:
    models_to_test = ["grok-bot-v4", "jev-typesafe", "crew-core", "fake-model-xyz"]
    
    for model in models_to_test:
        print(f"\nC. Testing model: {model}")
        try:
            resp = requests.post(f"{BASE_URL}/chat", 
                json={
                    "text": "scan low-cap pairs with volume",
                    "session_id": f"test-c-{model}",
                    "model": model
                },
                headers={"Authorization": f"Bearer {token}"}, timeout=15)
            data = resp.json()
            reply = data.get('reply', '')
            passed = resp.status_code == 200 and len(reply) > 0
            label = f"invalid model fallback" if model == "fake-model-xyz" else model
            report.log(f"C. Chat with {label}", passed, f"Reply: {len(reply)} chars")
        except Exception as e:
            report.log(f"C. Chat with {model}", False, f"Error: {e}")

# ============================================================================
# TEST D — Chat prompt leak check
# ============================================================================
report.set_section("TEST D — Chat prompt leak prevention")

timestamp = int(time.time() * 1000)
email = f"leak+{timestamp}@example.com"
password = "test1234"

try:
    resp = requests.post(f"{BASE_URL}/auth/signup", 
        json={"email": email, "password": password}, timeout=10)
    token = resp.json().get('token')
except:
    token = None

if token:
    prompts = [
        "find low-cap gems with volume",
        "any whale buys today?",
        "what's going on with memecoins on pump.fun?"
    ]
    
    forbidden_words = ['mock', 'simulated', 'fake']
    
    for idx, prompt in enumerate(prompts, 1):
        print(f"\nD{idx}. Testing prompt: '{prompt}'")
        try:
            resp = requests.post(f"{BASE_URL}/chat", 
                json={"text": prompt, "session_id": f"test-d-{idx}", "model": "crew-core"},
                headers={"Authorization": f"Bearer {token}"}, timeout=15)
            data = resp.json()
            reply = data.get('reply', '').lower()
            
            leaks = [word for word in forbidden_words if word in reply]
            passed = resp.status_code == 200 and len(leaks) == 0
            
            if leaks:
                report.log(f"D{idx}. Prompt leak check", passed, f"LEAKED: {leaks}")
            else:
                report.log(f"D{idx}. Prompt leak check", passed, "No forbidden words")
        except Exception as e:
            report.log(f"D{idx}. Prompt leak check", False, f"Error: {e}")

# ============================================================================
# TEST E — Regression smoke tests
# ============================================================================
report.set_section("TEST E — Regression smoke tests")

print(f"\nE1. GET /api/health")
try:
    resp = requests.get(f"{BASE_URL}/health", timeout=10)
    data = resp.json()
    report.log("E1. Health check", resp.status_code == 200 and data.get('ok'))
except Exception as e:
    report.log("E1. Health check", False, f"Error: {e}")

print(f"\nE2. GET /api/deposit-address")
try:
    resp = requests.get(f"{BASE_URL}/deposit-address", timeout=10)
    data = resp.json()
    expected = "GVhTVmoHJm56ZbhJarsbmjDUTLdZ1a6KqntJ14vT4dn6"
    report.log("E2. Deposit address", data.get('address') == expected, 
              f"Address: {data.get('address')}")
except Exception as e:
    report.log("E2. Deposit address", False, f"Error: {e}")

print(f"\nE3. GET /api/coins")
try:
    resp = requests.get(f"{BASE_URL}/coins", timeout=10)
    data = resp.json()
    coins = data.get('coins', [])
    report.log("E3. Coins endpoint", len(coins) > 0, f"{len(coins)} coins returned")
except Exception as e:
    report.log("E3. Coins endpoint", False, f"Error: {e}")

print(f"\nE4. GET /api/trading/risks")
try:
    resp = requests.get(f"{BASE_URL}/trading/risks", timeout=10)
    data = resp.json()
    risks = data.get('risks', [])
    report.log("E4. Trading risks", len(risks) == 3, f"{len(risks)} risk profiles")
except Exception as e:
    report.log("E4. Trading risks", False, f"Error: {e}")

# ============================================================================
# FINAL SUMMARY
# ============================================================================
success = report.summary()
exit(0 if success else 1)
