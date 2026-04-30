from difflib import SequenceMatcher

class FuzzyMatcher:
    """
    Checks for semantic similarity between opportunities to prevent duplicates.
    """
    @staticmethod
    def similarity(a: str, b: str) -> float:
        if not a or not b:
            return 0.0
        return SequenceMatcher(None, a.lower(), b.lower()).ratio()

    @staticmethod
    def is_duplicate(title_a: str, desc_a: str, title_b: str, desc_b: str, threshold: float = 0.85) -> bool:
        title_sim = FuzzyMatcher.similarity(title_a, title_b)
        desc_sim = FuzzyMatcher.similarity(desc_a, desc_b)
        
        # Weighted similarity
        weighted_sim = (title_sim * 0.4) + (desc_sim * 0.6)
        return weighted_sim >= threshold
