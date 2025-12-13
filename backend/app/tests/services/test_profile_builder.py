
import pytest
from unittest.mock import MagicMock, ANY
from app.services.profile_builder import UniversalProfileBuilder
from app.models.profile import Profile, ProfileState
from app.models.profile_data_source import DataSourceType

def test_ingest_data_creates_profile():
    # Setup
    mock_db = MagicMock()
    # Mock query returning None (no existing profile)
    mock_db.query.return_value.filter.return_value.first.return_value = None
    
    builder = UniversalProfileBuilder(mock_db)
    user_id = 1
    data = {
        "headline": "Software Engineer",
        "summary": "Experienced dev",
        "skills": ["Python", "React"]
    }
    
    # Execute
    profile = builder.ingest_data(user_id, DataSourceType.ONBOARDING, data)
    
    # Verify
    # 1. Check Data Source recorded
    mock_db.add.assert_any_call(ANY) # Should add ProfileDataSource
    
    # 2. Check Profile created and updated
    assert profile.user_id == user_id
    assert profile.headline == "Software Engineer"
    assert profile.summary == "Experienced dev"
    assert "Python" in profile.skills_data
    assert "React" in profile.skills_data
    
    # 3. Check completeness updated
    assert profile.completeness_score > 0
    assert profile.state != ProfileState.GHOST
    
def test_merge_data_logic():
    # Setup
    mock_db = MagicMock()
    existing_profile = Profile(
        user_id=1, 
        headline="Old Headline", 
        skills_data=["Java"]
    )
    mock_db.query.return_value.filter.return_value.first.return_value = existing_profile
    
    builder = UniversalProfileBuilder(mock_db)
    
    # New data with higher confidence (e.g. from resume)
    new_data = {
        "headline": "New Headline",
        "skills": ["Python"]
    }
    
    # Execute
    builder.ingest_data(1, DataSourceType.RESUME_UPLOAD, new_data, confidence=0.9)
    
    # Verify
    assert existing_profile.headline == "New Headline" # Should overwrite because confidence is high
    assert "Java" in existing_profile.skills_data # Should keep old
    assert "Python" in existing_profile.skills_data # Should have new
    
def test_merge_data_low_confidence_does_not_overwrite():
    # Setup
    mock_db = MagicMock()
    existing_profile = Profile(
        user_id=1, 
        headline="Strong Headline", 
        summary="Good summary"
    )
    mock_db.query.return_value.filter.return_value.first.return_value = existing_profile
    
    builder = UniversalProfileBuilder(mock_db)
    
    # Low confidence data
    new_data = {
        "headline": "Weak Headline"
    }
    
    # Execute
    builder.ingest_data(1, DataSourceType.SOCIAL_ACTION, new_data, confidence=0.5)
    
    
    # Verify
    assert existing_profile.headline == "Strong Headline" # Should NOT overwrite

def test_fuzzy_matching_experience():
    # Setup
    mock_db = MagicMock()
    builder = UniversalProfileBuilder(mock_db)
    
    current_list = [
        {"company": "Google", "title": "Software Engineer", "years": "2020-2022"}
    ]
    
    # New item: Similar but slightly different strings
    new_item = {"company": "google inc", "title": "software engineer", "years": "2020-2022", "description": "New desc"}
    
    # Execute
    merged = builder._merge_experience(current_list, [new_item], DataSourceType.RESUME_UPLOAD)
    
    # Verify
    assert len(merged) == 1 # Should identify as duplicate and merge
    assert merged[0]["company"] == "google inc" # Matches new item (latest wins)
    assert merged[0]["description"] == "New desc" # Enhanced with new data

def test_fuzzy_matching_different_items():
    # Setup
    mock_db = MagicMock()
    builder = UniversalProfileBuilder(mock_db)
    
    current_list = [
        {"company": "Google", "title": "Software Engineer"}
    ]
    
    # New item: Distinctly different
    new_item = {"company": "Amazon", "title": "Software Engineer"}
    
    # Execute
    merged = builder._merge_experience(current_list, [new_item], DataSourceType.RESUME_UPLOAD)
    
    # Verify
    assert len(merged) == 2 # Should append
