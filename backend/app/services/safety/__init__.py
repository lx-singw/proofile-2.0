"""
Safety Package - Content moderation and fraud detection

Exports:
- text_filter: LLM-based content moderation
- ring_detector: Graph-based fraud detection
"""

from app.services.safety.text_filter import (
    filter_text,
    detect_pii,
    redact_pii,
    moderate_with_llm,
    TextFilterResult,
)

from app.services.safety.ring_detector import (
    detect_reciprocal_ratings,
    detect_rating_triangles,
    detect_velocity_anomaly,
    calculate_fraud_score,
    run_fraud_detection,
    RatingGraph,
    RatingEdge,
)

__all__ = [
    # Text filtering
    "filter_text",
    "detect_pii",
    "redact_pii",
    "moderate_with_llm",
    "TextFilterResult",
    # Fraud detection
    "detect_reciprocal_ratings",
    "detect_rating_triangles",
    "detect_velocity_anomaly",
    "calculate_fraud_score",
    "run_fraud_detection",
    "RatingGraph",
    "RatingEdge",
]
