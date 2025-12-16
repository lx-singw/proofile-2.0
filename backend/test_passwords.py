#!/usr/bin/env python3
import sys
sys.path.insert(0, '/app')

from app.core.security import validate_password_strength

test_passwords = [
    'TestPass123!',
    'SprintTest2025!',
    'DebugTest123!@#',
    'ConsoleTest123!',
]

for pwd in test_passwords:
    try:
        validate_password_strength(pwd)
        print(f"✓ '{pwd}' - VALID")
    except Exception as e:
        print(f"✗ '{pwd}' - ERROR: {type(e).__name__}: {e}")
