
import pytest
from app.services.suggestion_engine import SuggestionEngine
from app.models.profile import Profile
from app.models.user import User

def test_get_suggestions_new_user():
    # Setup: Empty user and profile
    user = User(id=1, full_name=None)
    profile = Profile(user_id=1, headline=None, summary=None, avatar_url=None)
    
    # Execute
    suggestions = SuggestionEngine.get_suggestions(user, profile)
    
    # Verify
    assert len(suggestions) == 3 # Should be capped at 3
    ids = [s["id"] for s in suggestions]
    assert "add_name" in ids
    assert "add_headline" in ids
    
def test_get_suggestions_partial_profile():
    # Setup: User with name and headline
    user = User(id=1, full_name="John Doe")
    profile = Profile(user_id=1, headline="Developer", summary=None, avatar_url=None)
    
    # Execute
    suggestions = SuggestionEngine.get_suggestions(user, profile)
    
    # Verify: Should verify missing pieces
    ids = [s["id"] for s in suggestions]
    assert "add_name" not in ids
    assert "add_headline" not in ids
    assert "add_photo" in ids
    assert "add_summary" in ids
    assert "add_experience" in ids

def test_get_suggestions_prioritizes_impact():
    # Setup: User with basics but no experience/skills
    user = User(id=1, full_name="John Doe")
    profile = Profile(
        user_id=1, 
        headline="Developer", 
        summary="I code.",
        avatar_url="http://example.com/pic.jpg"
    )
    
    # Execute
    suggestions = SuggestionEngine.get_suggestions(user, profile)
    
    # Verify: Experience (+30%) should be top priority logic-wise, checking existence
    ids = [s["id"] for s in suggestions]
    assert "add_experience" in ids
    assert "add_skills" in ids
