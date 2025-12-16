"""
Ring Detector - Graph-based fraud detection

Detects "review rings" where users collude to inflate ratings:
- A rates B, B rates A (reciprocal)
- A→B→C→A (triangle)
- A→B→C→D→A (larger cycles)

Uses graph traversal to find suspicious patterns.
"""

import logging
from typing import Dict, List, Set, Tuple, Optional
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)


class RatingEdge:
    """Represents a rating from one user to another."""
    
    def __init__(
        self,
        source_id: int,
        target_id: int,
        rating_id: int,
        score: float,
        created_at: datetime
    ):
        self.source_id = source_id
        self.target_id = target_id
        self.rating_id = rating_id
        self.score = score
        self.created_at = created_at


class RatingGraph:
    """Graph of ratings for fraud detection."""
    
    def __init__(self):
        self.edges: Dict[int, List[RatingEdge]] = defaultdict(list)
        self.reverse_edges: Dict[int, List[RatingEdge]] = defaultdict(list)
    
    def add_edge(self, edge: RatingEdge):
        """Add a rating edge to the graph."""
        self.edges[edge.source_id].append(edge)
        self.reverse_edges[edge.target_id].append(edge)
    
    def get_outgoing(self, user_id: int) -> List[RatingEdge]:
        """Get all ratings made by a user."""
        return self.edges.get(user_id, [])
    
    def get_incoming(self, user_id: int) -> List[RatingEdge]:
        """Get all ratings received by a user."""
        return self.reverse_edges.get(user_id, [])


def detect_reciprocal_ratings(
    graph: RatingGraph,
    time_window_days: int = 7
) -> List[Tuple[int, int, List[int]]]:
    """
    Detect reciprocal ratings (A rates B, B rates A) within a time window.
    
    Returns list of (user_a, user_b, rating_ids) tuples.
    """
    reciprocals = []
    checked_pairs: Set[Tuple[int, int]] = set()
    
    for source_id, edges in graph.edges.items():
        for edge in edges:
            target_id = edge.target_id
            pair = tuple(sorted([source_id, target_id]))
            
            if pair in checked_pairs:
                continue
            
            checked_pairs.add(pair)
            
            # Check if target rated source back
            target_edges = graph.get_outgoing(target_id)
            for reverse_edge in target_edges:
                if reverse_edge.target_id == source_id:
                    # Check time window
                    time_diff = abs((edge.created_at - reverse_edge.created_at).days)
                    if time_diff <= time_window_days:
                        reciprocals.append((
                            source_id,
                            target_id,
                            [edge.rating_id, reverse_edge.rating_id]
                        ))
                    break
    
    logger.info(f"Found {len(reciprocals)} reciprocal rating pairs")
    return reciprocals


def detect_rating_triangles(graph: RatingGraph) -> List[Tuple[int, int, int, List[int]]]:
    """
    Detect rating triangles (A→B→C→A).
    
    Returns list of (user_a, user_b, user_c, rating_ids) tuples.
    """
    triangles = []
    checked: Set[Tuple[int, int, int]] = set()
    
    for a, edges_from_a in graph.edges.items():
        for edge_ab in edges_from_a:
            b = edge_ab.target_id
            edges_from_b = graph.get_outgoing(b)
            
            for edge_bc in edges_from_b:
                c = edge_bc.target_id
                if c == a:
                    continue
                
                edges_from_c = graph.get_outgoing(c)
                
                for edge_ca in edges_from_c:
                    if edge_ca.target_id == a:
                        triangle = tuple(sorted([a, b, c]))
                        if triangle not in checked:
                            checked.add(triangle)
                            triangles.append((
                                a, b, c,
                                [edge_ab.rating_id, edge_bc.rating_id, edge_ca.rating_id]
                            ))
    
    logger.info(f"Found {len(triangles)} rating triangles")
    return triangles


def detect_velocity_anomaly(
    user_id: int,
    graph: RatingGraph,
    max_per_hour: int = 10
) -> Tuple[bool, int]:
    """
    Detect if a user is rating at an abnormal velocity.
    
    Returns (is_anomaly, count_in_hour).
    """
    edges = graph.get_outgoing(user_id)
    
    if not edges:
        return (False, 0)
    
    # Sort by time
    sorted_edges = sorted(edges, key=lambda e: e.created_at, reverse=True)
    
    # Count ratings in the last hour
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    
    count_in_hour = sum(1 for e in sorted_edges if e.created_at >= one_hour_ago)
    
    is_anomaly = count_in_hour > max_per_hour
    
    if is_anomaly:
        logger.warning(f"Velocity anomaly detected for user {user_id}: {count_in_hour} ratings in 1 hour")
    
    return (is_anomaly, count_in_hour)


def calculate_fraud_score(
    user_id: int,
    graph: RatingGraph,
    reciprocals: List[Tuple[int, int, List[int]]],
    triangles: List[Tuple[int, int, int, List[int]]]
) -> float:
    """
    Calculate a fraud score (0-100) for a user based on suspicious patterns.
    
    Higher score = more suspicious.
    """
    score = 0.0
    
    # Check reciprocal involvement
    reciprocal_count = sum(
        1 for r in reciprocals
        if user_id in (r[0], r[1])
    )
    score += min(reciprocal_count * 15, 45)  # Max 45 points
    
    # Check triangle involvement
    triangle_count = sum(
        1 for t in triangles
        if user_id in (t[0], t[1], t[2])
    )
    score += min(triangle_count * 20, 40)  # Max 40 points
    
    # Check velocity
    is_velocity_anomaly, _ = detect_velocity_anomaly(user_id, graph)
    if is_velocity_anomaly:
        score += 15
    
    return min(score, 100)


def build_graph_from_db(db) -> RatingGraph:
    """
    Build rating graph from database.
    """
    from app.models.rating import Rating
    
    graph = RatingGraph()
    
    ratings = db.query(Rating).filter(
        Rating.visibility == "public"
    ).all()
    
    for rating in ratings:
        if rating.author_id and rating.target_id:
            edge = RatingEdge(
                source_id=rating.author_id,
                target_id=rating.target_id,
                rating_id=rating.id,
                score=rating.overall_score,
                created_at=rating.created_at
            )
            graph.add_edge(edge)
    
    return graph


def run_fraud_detection(db) -> Dict:
    """
    Run complete fraud detection analysis.
    
    Returns summary of detected patterns.
    """
    logger.info("Starting fraud detection analysis...")
    
    graph = build_graph_from_db(db)
    
    reciprocals = detect_reciprocal_ratings(graph)
    triangles = detect_rating_triangles(graph)
    
    return {
        "reciprocal_pairs": len(reciprocals),
        "triangles": len(triangles),
        "reciprocals": reciprocals[:10],  # Top 10
        "triangles_detail": triangles[:10],  # Top 10
    }
