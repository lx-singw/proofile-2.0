"""
Tests for Trust Score Engine
"""

import pytest
from unittest.mock import MagicMock, patch, PropertyMock
from datetime import datetime


class MockVerification:
    """Mock verification model for testing"""
    def __init__(self, verification_type, status="verified", method="domain_email"):
        self.verification_type = verification_type
        self.status = status
        self.method = method
        self.metadata = {}


class MockUser:
    """Mock user model for testing"""
    def __init__(self, user_id=1):
        self.id = user_id
        self.trust_score = 0
        self.peer_rating_avg = 4.2


def create_mock_db_with_verifications(verifications_by_type: dict):
    """
    Create a mock database session that returns correct verifications.
    
    Args:
        verifications_by_type: Dict mapping verification_type to (status, count) for results
    """
    mock_db = MagicMock()
    
    def mock_query(*args):
        query_mock = MagicMock()
        filter_mock = MagicMock()
        
        def handle_filter(*args):
            # Return the filter mock for chaining
            return filter_mock
        
        query_mock.filter = handle_filter
        
        # For .first() - returns single verification or None
        filter_mock.first.return_value = None
        
        # For .count() - returns count
        filter_mock.count.return_value = 0
        
        return query_mock
    
    mock_db.query = mock_query
    return mock_db


class TestTrustScoreCalculation:
    """Test trust score calculation logic"""
    
    def test_empty_profile_score_is_zero(self):
        """User with no verifications should have score 0"""
        # Arrange
        mock_db = MagicMock()
        mock_user = MockUser()
        
        # Configure mock: no verifications found
        mock_db.query.return_value.filter.return_value.first.return_value = None
        mock_db.query.return_value.filter.return_value.count.return_value = 0
        
        # Act
        from app.services.trust_score_engine import calculate_trust_score
        score = calculate_trust_score(mock_db, mock_user)
        
        # Assert
        assert score == 0
    
    def test_identity_verified_adds_30_points(self):
        """Identity verification should add 30 points"""
        # Arrange
        mock_db = MagicMock()
        mock_user = MockUser()
        
        # Identity verification found
        identity_verification = MockVerification("identity", "verified")
        
        # Configure the chain to return properly
        filter_mock = MagicMock()
        filter_mock.first.return_value = identity_verification
        filter_mock.count.return_value = 0  # No employment/skills
        
        mock_db.query.return_value.filter.return_value = filter_mock
        
        # Act
        from app.services.trust_score_engine import calculate_trust_score
        score = calculate_trust_score(mock_db, mock_user)
        
        # Assert
        assert score >= 30
    
    def test_employment_verification_adds_points(self):
        """Each employment verification should add 15 points (max 40)"""
        # Arrange
        mock_db = MagicMock()
        mock_user = MockUser()
        
        # No identity verification
        identity_call = MagicMock()
        identity_call.first.return_value = None
        
        # No email/phone
        email_call = MagicMock()
        email_call.first.return_value = None
        
        phone_call = MagicMock()
        phone_call.first.return_value = None
        
        # 2 employment verifications
        employment_call = MagicMock()
        employment_call.count.return_value = 2
        
        # 0 skill verifications
        skills_call = MagicMock()
        skills_call.count.return_value = 0
        
        mock_db.query.return_value.filter.side_effect = [
            identity_call, email_call, phone_call, employment_call, skills_call
        ]
        
        # Act
        from app.services.trust_score_engine import calculate_trust_score
        score = calculate_trust_score(mock_db, mock_user)
        
        # Assert
        assert score >= 30  # 2 x 15 points
    
    def test_skill_verification_adds_points(self):
        """Each skill verification should add 5 points (max 20)"""
        # Arrange
        mock_db = MagicMock()
        mock_user = MockUser()
        
        # No identity
        identity_call = MagicMock()
        identity_call.first.return_value = None
        
        # No email/phone
        email_call = MagicMock()
        email_call.first.return_value = None
        phone_call = MagicMock()
        phone_call.first.return_value = None
        
        # No employment
        employment_call = MagicMock()
        employment_call.count.return_value = 0
        
        # 3 skill verifications
        skills_call = MagicMock()
        skills_call.count.return_value = 3
        
        mock_db.query.return_value.filter.side_effect = [
            identity_call, email_call, phone_call, employment_call, skills_call
        ]
        
        # Act
        from app.services.trust_score_engine import calculate_trust_score
        score = calculate_trust_score(mock_db, mock_user)
        
        # Assert
        assert score >= 15  # 3 x 5 points
    
    def test_max_score_is_100(self):
        """Score should never exceed 100"""
        # Arrange
        mock_db = MagicMock()
        mock_user = MockUser()
        
        # Identity verified (+30)
        identity_call = MagicMock()
        identity_call.first.return_value = MockVerification("identity", "verified")
        
        # Many employments - would be 60 pts but capped at 40
        employment_call = MagicMock()
        employment_call.count.return_value = 4
        
        # Many skills - would be 25 pts but capped at 20
        skills_call = MagicMock()
        skills_call.count.return_value = 5
        
        mock_db.query.return_value.filter.side_effect = [
            identity_call, employment_call, skills_call
        ]
        
        # Act
        from app.services.trust_score_engine import calculate_trust_score
        score = calculate_trust_score(mock_db, mock_user)
        
        # Assert
        assert score <= 100
    
    def test_pending_verifications_not_counted(self):
        """Pending verifications should not add points"""
        # Arrange
        mock_db = MagicMock()
        mock_user = MockUser()
        
        # All queries return nothing (pending not in verified filter)
        no_result = MagicMock()
        no_result.first.return_value = None
        no_result.count.return_value = 0
        
        mock_db.query.return_value.filter.return_value = no_result
        
        # Act
        from app.services.trust_score_engine import calculate_trust_score
        score = calculate_trust_score(mock_db, mock_user)
        
        # Assert
        assert score == 0


class TestTrustLevel:
    """Test trust level classification - matching actual implementation"""
    
    def test_elite_level_for_high_scores(self):
        """Score >= 91 should be elite"""
        from app.services.trust_score_engine import get_trust_level
        
        assert get_trust_level(100) == "elite"
        assert get_trust_level(95) == "elite"
        assert get_trust_level(91) == "elite"
    
    def test_high_level_for_scores_71_to_90(self):
        """Score 71-90 should be high"""
        from app.services.trust_score_engine import get_trust_level
        
        assert get_trust_level(90) == "high"
        assert get_trust_level(80) == "high"
        assert get_trust_level(71) == "high"
    
    def test_medium_level_for_scores_41_to_70(self):
        """Score 41-70 should be medium"""
        from app.services.trust_score_engine import get_trust_level
        
        assert get_trust_level(70) == "medium"
        assert get_trust_level(55) == "medium"
        assert get_trust_level(41) == "medium"
    
    def test_low_level_for_scores_0_to_40(self):
        """Score 0-40 should be low"""
        from app.services.trust_score_engine import get_trust_level
        
        assert get_trust_level(40) == "low"
        assert get_trust_level(25) == "low"
        assert get_trust_level(10) == "low"
        assert get_trust_level(0) == "low"


class TestUpdateUserTrustScore:
    """Test user trust score update functionality"""
    
    def test_updates_user_trust_score(self):
        """Should update user's trust_score attribute"""
        mock_db = MagicMock()
        mock_user = MockUser()
        
        # No verifications
        no_result = MagicMock()
        no_result.first.return_value = None
        no_result.count.return_value = 0
        mock_db.query.return_value.filter.return_value = no_result
        
        from app.services.trust_score_engine import update_user_trust_score
        
        new_score = update_user_trust_score(mock_db, mock_user)
        
        assert mock_user.trust_score == new_score
        mock_db.add.assert_called_with(mock_user)
        mock_db.commit.assert_called_once()
