#!/usr/bin/env python3
import requests
import sys

print("[*] Starting Session Hijacking Simulation")
print("[*] Target Vulnerability: Low Entropy Tokens (Math.random())")
print("-" * 50)

# In a real scenario, an attacker would either:
# 1. Steal the token via Cross-Site Scripting (XSS) because it's not stored in an httpOnly cookie.
# 2. Predict the token because Math.random() in JavaScript is not cryptographically secure 
#    and its state can be determined if enough consecutive outputs are observed.

print("[!] In the vulnerable backend, tokens are generated like this:")
print("    const sessionToken = Math.random().toString();")
print("    Example: '0.1234567890123456'\n")

print("[*] Simulating Token Prediction / Extraction...")

# Mocking a stolen or predicted token from an admin user
stolen_token = "0.9876543210987654" 

print(f"[!] Successfully extracted active session token: {stolen_token}")
print("[*] Attempting to access protected resources using the hijacked token...")

headers = {
    "Authorization": f"Bearer {stolen_token}",
    "Content-Type": "application/json"
}

# The simulation outputs the conceptual result.
# To make this fully functional against an endpoint, you would point it at a protected API route.
# Since our vulnerable admin route currently lacks auth completely, this script serves as a 
# demonstrative tool for your project presentation to explain the vulnerability.

print("\n[!] VULNERABILITY EXPLOITED! (Conceptually)")
print("[-] The attacker can now attach this token to their headers and impersonate the user.")
print("[-] Because the token is predictable and accessible to JavaScript, the session is hijacked.")

print("\n[✓] HOW THE SECURE BACKEND PREVENTS THIS:")
print("    1. Uses crypto.randomBytes(40).toString('hex') to generate mathematically secure tokens.")
print("    2. Stores the Refresh Token as a bcrypt hash in the database.")
print("    3. Sends the token to the frontend in an 'httpOnly' cookie, making it invisible to XSS attacks.")
