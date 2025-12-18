from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.core.config import settings
import time
import jwt # PyJWT

router = APIRouter(prefix="/.well-known", tags=["identity"])

@router.get("/openid-configuration")
async def get_oidc_config(request: Request):
    """
    OIDC Discovery Endpoint
    """
    base_url = str(request.base_url).rstrip("/")
    return {
        "issuer": base_url,
        "authorization_endpoint": f"{base_url}/api/v1/auth/authorize",
        "token_endpoint": f"{base_url}/api/v1/auth/token",
        "userinfo_endpoint": f"{base_url}/api/v1/identity/userinfo",
        "jwks_uri": f"{base_url}/api/v1/identity/jwks",
        "response_types_supported": ["code", "token", "id_token"],
        "subject_types_supported": ["public"],
        "id_token_signing_alg_values_supported": ["RS256"],
        "scopes_supported": ["openid", "profile", "email", "trust_score"],
        "claims_supported": ["sub", "name", "email", "trust_score", "is_gold_standard"]
    }

@router.get("/jwks")
async def get_jwks():
    """
    JSON Web Key Set for verifying ID tokens
    """
    # In production, this would return real public keys
    return {
        "keys": [
            {
                "kty": "RSA",
                "alg": "RS256",
                "use": "sig",
                "kid": "proofile-default-key-id",
                "n": "...", # Base64 encoded modulus
                "e": "AQAB"
            }
        ]
    }

identity_router = APIRouter(prefix="/identity", tags=["identity"])

@identity_router.get("/userinfo")
async def get_userinfo(
    current_user: User = Depends(get_current_user)
):
    """
    OIDC UserInfo endpoint providing verified claims.
    """
    # Check for gold-standard verifications
    is_gold = any(v.is_gold_standard for v in current_user.verifications)
    
    return {
        "sub": str(current_user.id),
        "name": current_user.full_name,
        "email": current_user.email,
        "username": current_user.username,
        "trust_score": current_user.trust_score,
        "is_gold_standard": is_gold,
        "profile_url": f"https://proofile.co/p/{current_user.username}"
    }

# Function to generate an ID Token (OIDC)
def generate_id_token(user: User, client_id: str, private_key: str):
    is_gold = any(v.is_gold_standard for v in user.verifications)
    payload = {
        "iss": "https://proofile.co",
        "sub": str(user.id),
        "aud": client_id,
        "exp": int(time.time()) + 3600,
        "iat": int(time.time()),
        "name": user.full_name,
        "email": user.email,
        "trust_score": user.trust_score,
        "is_gold_standard": is_gold
    }
    return jwt.encode(payload, private_key, algorithm="RS256", headers={"kid": "proofile-default-key-id"})
 Aurora
