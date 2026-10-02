#!/usr/bin/env python3
"""Quick check for failed tests"""
import requests
import time
from pymongo import MongoClient

BASE_URL = "https://content-206.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"
COLLECTION = "tc_users"

print("="*80)
print("QUICK TEST A - Persistence Check")
print("="*80)

# A1. Signup
timestamp = int(time.time() * 1000)
email = f"persist+{timestamp}@example.com"
password = "test1234"

print(f"\nA1. Signup with {email}")
resp = requests.post(f"{BASE_URL}/auth/signup", 
    json={"email": email, "password": password}, timeout=10)
data = resp.json()
user_id = data.get('user', {}).get('id')
token = data.get('token')
print(f"✓ User ID: {user_id}")

# A2. MongoDB update
print(f"\nA2. MongoDB update: balance_sol=0.7, total_deposited=0.7")
client = MongoClient(MONGO_URL)
db = client[DB_NAME]
coll = db[COLLECTION]
result = coll.update_one({'id': user_id}, {'$set': {'balance_sol': 0.7, 'total_deposited': 0.7}})
print(f"✓ Modified count: {result.modified_count}")

# Verify
user_doc = coll.find_one({'id': user_id})
print(f"✓ Verified in DB: balance_sol={user_doc.get('balance_sol')}, total_deposited={user_doc.get('total_deposited')}")
client.close()

# A3. Login
print(f"\nA3. Login and check persistence")
resp = requests.post(f"{BASE_URL}/auth/login", 
    json={"email": email, "password": password}, timeout=10)
data = resp.json()
user = data.get('user', {})
balance = user.get('balance_sol')
total_dep = user.get('total_deposited')

if balance == 0.7 and total_dep == 0.7:
    print(f"✓ PASS: balance_sol={balance}, total_deposited={total_dep}")
else:
    print(f"✗ FAIL: Expected 0.7/0.7, got balance_sol={balance}, total_deposited={total_dep}")

# A4. GET /me
print(f"\nA4. GET /api/me")
resp = requests.get(f"{BASE_URL}/me", 
    headers={"Authorization": f"Bearer {token}"}, timeout=10)
data = resp.json()
user = data.get('user', {})
balance = user.get('balance_sol')
total_dep = user.get('total_deposited')

if balance == 0.7 and total_dep == 0.7:
    print(f"✓ PASS: balance_sol={balance}, total_deposited={total_dep}")
else:
    print(f"✗ FAIL: Expected 0.7/0.7, got balance_sol={balance}, total_deposited={total_dep}")

print("\n" + "="*80)
print("QUICK TEST B - Trading Floor (15s sample)")
print("="*80)

# B1. Create user
timestamp = int(time.time() * 1000)
email = f"trader+{timestamp}@example.com"
password = "test1234"

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
print(f"✓ User created with balance=1.0")

# B2. Start trading
resp = requests.post(f"{BASE_URL}/trading/start", 
    json={"risk": "balanced"},
    headers={"Authorization": f"Bearer {token}"}, timeout=10)
print(f"✓ Trading session started")

# B3. Poll for 15 seconds (5 polls)
print(f"\nB3. Polling for 15s (5 polls):")
balances = []
violations = []

for i in range(5):
    time.sleep(3)
    resp = requests.get(f"{BASE_URL}/trading/state", 
        headers={"Authorization": f"Bearer {token}"}, timeout=10)
    data = resp.json()
    session = data.get('session', {})
    current_balance = session.get('current_balance', 0)
    balances.append(current_balance)
    
    status = "OK" if current_balance >= 0.5 else "VIOLATION!"
    print(f"  Poll {i+1}/5: balance={current_balance:.6f} SOL [{status}]")
    
    if current_balance < 0.5:
        violations.append((i+1, current_balance))

min_bal = min(balances)
max_bal = max(balances)
final_bal = balances[-1]

print(f"\nSummary: Min={min_bal:.6f}, Max={max_bal:.6f}, Final={final_bal:.6f}")
if violations:
    print(f"✗ FAIL: {len(violations)} floor violations")
else:
    print(f"✓ PASS: No floor violations")

# B4. Stop
resp = requests.post(f"{BASE_URL}/trading/stop", 
    headers={"Authorization": f"Bearer {token}"}, timeout=10)
print(f"✓ Trading session stopped")
