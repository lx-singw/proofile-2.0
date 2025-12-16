import bcrypt

# Get the hashed password from DB (user id=32, dev12345678@example.com)
db_hash = b'$2b$12$J/JXfwMjdSkV4dNxbvnMp.42xJmOe4ckFQS58cOTxbqGDVN8sLZWK'

test_passwords = [
    'DevTest123!',
    'devtest123!',  
    'Dev123!',
    'Password123!',
    '',  # Empty
]

print("Testing password verification:")
for pwd in test_passwords:
    try:
        result = bcrypt.checkpw(pwd.encode('utf-8'), db_hash)
        print(f"Password '{pwd}': {result}")
    except Exception as e:
        print(f"Password '{pwd}': ERROR - {e}")
