
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
    
    # Verify: Now returns up to 5 suggestions (basic + category-specific)
    assert len(suggestions) == 5  # Updated from 3 to 5 max
    ids = [s["id"] for s in suggestions]
    assert "add_name" in ids
    # Basic identity suggestions come first
    assert "add_photo" in ids
    assert "add_headline" in ids
    
def test_get_suggestions_partial_profile():
    # Setup: User with name and headline
    user = User(id=1, full_name="John Doe")
    profile = Profile(user_id=1, headline="Developer", summary=None, avatar_url=None)
    
    # Execute
    suggestions = SuggestionEngine.get_suggestions(user, profile)
    
    # Verify: Should suggest missing pieces
    ids = [s["id"] for s in suggestions]
    assert "add_name" not in ids
    assert "add_headline" not in ids
    assert "add_photo" in ids
    # Note: add_summary is no longer included in basic suggestions
    # Category-specific suggestions take priority
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
    
    # Verify: Experience (+30%) should be top priority for Jobs users
    ids = [s["id"] for s in suggestions]
    assert "add_experience" in ids
    assert "add_skills" in ids


def test_get_suggestions_training_user():
    """Test that training users get education-first suggestions"""
    user = User(id=1, full_name="Jane Doe", opportunity_preference="training_skills_programs")
    profile = Profile(user_id=1, headline=None, summary=None, avatar_url=None)
    
    suggestions = SuggestionEngine.get_suggestions(user, profile)
    
    ids = [s["id"] for s in suggestions]
    # Training users should get education-focused suggestions
    assert "add_education" in ids
    assert "add_certifications" in ids

