#!/usr/bin/env python3
import requests
import time
import sys

# Configuration
TARGET_URL = "http://localhost:3000/api/auth/login"
HEADERS = {"Content-Type": "application/json"}

print(f"[*] Starting Brute Force Attack Simulation against {TARGET_URL}")
print("[*] Simulating attacker trying common passwords...")

# Mock dictionary of common passwords
passwords_to_try = [
    "123456", "password", "12345678", "qwerty", 
    "12345", "123456789", "football", "1234", 
    "1234567", "baseball", "admin123", "wrongpassword"
]

target_email = "admin@example.com"

print(f"\n[!] Target Account: {target_email}")
print("-" * 50)

for i, pwd in enumerate(passwords_to_try, 1):
    payload = {
        "email": target_email,
        "password": pwd
    }
    
    try:
        response = requests.post(TARGET_URL, json=payload, headers=HEADERS)
        
        # Check if rate limited
        if response.status_code == 429:
            print(f"\n[✓] DEFENSE TRIGGERED! IP BLOCKED! (Attempt {i})")
            print(f"[-] Server Response: {response.text}")
            print("\n[*] The secure backend successfully stopped the attack.")
            sys.exit(0)
            
        if response.status_code == 200:
            print(f"\n[!] VULNERABILITY EXPLOITED! Login successful!")
            print(f"[-] Correct Password found: '{pwd}'")
            print(f"[-] Server Response: {response.text}")
            sys.exit(0)
            
        print(f"[{i}/{len(passwords_to_try)}] Failed attempt with password: '{pwd}' | Status: {response.status_code}")
        
        # Small delay to prevent crashing our local dev server too hard, 
        # but fast enough to trigger rate limits
        time.sleep(0.1)
        
    except requests.exceptions.ConnectionError:
        print("\n[!] Connection Error: Is the backend server running on port 3000?")
        sys.exit(1)

print("\n[*] Attack finished. Password not found in dictionary.")
