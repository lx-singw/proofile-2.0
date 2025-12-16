"""
Test Scoring - Unit tests for the reputation scoring engine

Tests:
- Weighted mean calculation
- Relationship weights (Manager > Peer > Unverified)
- Time decay
- Reciprocal dampening
- Dimension aggregation
"""

import pytest
from datetime import datetime, timedelta
from app.services.scoring.scoring_engine import (
    calculate_weighted_score,
    get_relationship_weight,
    get_time_decay,
    calculate_dimension_scores,
    get_trust_signals,
    RELATIONSHIP_WEIGHTS,
)


class TestRelationshipWeights:
    """Test relationship weight calculation."""
    
    def test_manager_has_highest_weight(self):
        """Verified manager should have weight 1.5."""
        weight = get_relationship_weight("manager", is_verified=True)
        assert weight == 1.5
    
    def test_peer_has_baseline_weight(self):
        """Verified peer should have weight 1.0."""
        weight = get_relationship_weight("peer", is_verified=True)
        assert weight == 1.0
    
    def test_unverified_has_low_weight(self):
        """Unverified raters should have low weight."""
        weight = get_relationship_weight("peer", is_verified=False)
        assert weight == 0.3
    
    def test_reciprocal_dampening(self):
        """Reciprocal ratings should be dampened by 0.8."""
        weight_normal = get_relationship_weight("peer", is_verified=True, is_reciprocal=False)
        weight_reciprocal = get_relationship_weight("peer", is_verified=True, is_reciprocal=True)
        
        assert weight_reciprocal == weight_normal * 0.8
    
    def test_manager_weight_greater_than_peer(self):
        """Manager weight should be greater than peer weight."""
        manager = get_relationship_weight("manager", is_verified=True)
        peer = get_relationship_weight("peer", is_verified=True)
        
        assert manager > peer


class TestTimeDecay:
    """Test time decay factors."""
    
    def test_recent_rating_no_decay(self):
        """Ratings less than 1 year old should have no decay."""
        recent = datetime.utcnow() - timedelta(days=100)
        decay = get_time_decay(recent)
        assert decay == 1.0
    
    def test_old_rating_partial_decay(self):
        """Ratings 1-3 years old should have 0.85 decay."""
        two_years = datetime.utcnow() - timedelta(days=730)
        decay = get_time_decay(two_years)
        assert decay == 0.85
    
    def test_very_old_rating_full_decay(self):
        """Ratings >3 years old should have 0.7 decay."""
        four_years = datetime.utcnow() - timedelta(days=1500)
        decay = get_time_decay(four_years)
        assert decay == 0.7
    
    def test_none_date_returns_one(self):
        """None date should return no decay."""
        decay = get_time_decay(None)
        assert decay == 1.0


class TestWeightedScoring:
    """Test the weighted scoring algorithm."""
    
    def test_single_rating(self):
        """Single rating should return that score."""
        ratings = [
            {"score": 4.5, "relationship": "peer", "is_verified": True, "is_reciprocal": False, "created_at": datetime.utcnow()}
        ]
        score, count = calculate_weighted_score(ratings)
        
        assert count == 1
        assert score == 4.5
    
    def test_manager_rating_weighted_higher(self):
        """Manager ratings should pull the average toward them."""
        ratings = [
            {"score": 5.0, "relationship": "peer", "is_verified": True, "is_reciprocal": False, "created_at": datetime.utcnow()},
            {"score": 3.0, "relationship": "manager", "is_verified": True, "is_reciprocal": False, "created_at": datetime.utcnow()},
        ]
        score, count = calculate_weighted_score(ratings)
        
        # Manager (3.0 × 1.5) + Peer (5.0 × 1.0) = 4.5 + 5.0 = 9.5
        # Weights: 1.5 + 1.0 = 2.5
        # Score = 9.5 / 2.5 = 3.8
        assert count == 2
        assert score == 3.8
    
    def test_empty_ratings_returns_zero(self):
        """Empty ratings should return 0."""
        score, count = calculate_weighted_score([])
        
        assert count == 0
        assert score == 0.0
    
    def test_unverified_rating_low_impact(self):
        """Unverified ratings should have minimal impact."""
        ratings = [
            {"score": 5.0, "relationship": "peer", "is_verified": True, "is_reciprocal": False, "created_at": datetime.utcnow()},
            {"score": 1.0, "relationship": "peer", "is_verified": False, "is_reciprocal": False, "created_at": datetime.utcnow()},
        ]
        score, count = calculate_weighted_score(ratings)
        
        # Verified (5.0 × 1.0) + Unverified (1.0 × 0.3) = 5.0 + 0.3 = 5.3
        # Weights: 1.0 + 0.3 = 1.3
        # Score = 5.3 / 1.3 ≈ 4.08
        assert count == 2
        assert score > 4.0  # Should be closer to 5 than 3


class TestDimensionScoring:
    """Test dimension-specific scoring."""
    
    def test_dimension_aggregation(self):
        """Dimensions should be aggregated correctly."""
        ratings = [
            {
                "score": 4.0,
                "relationship": "peer",
                "is_verified": True,
                "is_reciprocal": False,
                "created_at": datetime.utcnow(),
                "dimensions": {"communication": 5.0, "reliability": 4.0}
            },
            {
                "score": 4.5,
                "relationship": "manager",
                "is_verified": True,
                "is_reciprocal": False,
                "created_at": datetime.utcnow(),
                "dimensions": {"communication": 4.0, "technical": 5.0}
            },
        ]
        
        dim_scores = calculate_dimension_scores(ratings)
        
        assert "communication" in dim_scores
        assert "reliability" in dim_scores
        assert "technical" in dim_scores
        
        # Communication: (5.0 × 1.0 + 4.0 × 1.5) / (1.0 + 1.5) = 11 / 2.5 = 4.4
        assert dim_scores["communication"]["count"] == 2


class TestTrustSignals:
    """Test trust signal generation."""
    
    def test_top_rated_signal(self):
        """Scores >= 4.8 should get top_rated signal."""
        signals = get_trust_signals(
            global_score=4.9,
            manager_count=1,
            is_verified=False,
            dimension_scores={}
        )
        
        assert "top_rated" in signals
    
    def test_manager_endorsed_signal(self):
        """3+ manager ratings should get manager_endorsed signal."""
        signals = get_trust_signals(
            global_score=4.0,
            manager_count=3,
            is_verified=False,
            dimension_scores={}
        )
        
        assert "manager_endorsed" in signals
    
    def test_identity_verified_signal(self):
        """Verified users should get identity_verified signal."""
        signals = get_trust_signals(
            global_score=4.0,
            manager_count=0,
            is_verified=True,
            dimension_scores={}
        )
        
        assert "identity_verified" in signals
    
    def test_exceptional_dimension_signal(self):
        """Exceptional dimension scores should generate signals."""
        signals = get_trust_signals(
            global_score=4.0,
            manager_count=0,
            is_verified=False,
            dimension_scores={
                "communication": {"score": 5.0, "count": 5}
            }
        )
        
        assert "exceptional_communication" in signals
