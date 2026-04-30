class ScamClassifier:
    """
    ML or Rule-based scam detection for opportunities.
    """
    RED_FLAGS = [
        "whatsapp for details",
        "pay a fee",
        "application fee",
        "send money",
        "deposit",
        "no experience needed",
        "easy money"
    ]

    @staticmethod
    def calculate_score(text: str) -> float:
        if not text:
            return 0.0
        
        text = text.lower()
        matches = sum(1 for flag in ScamClassifier.RED_FLAGS if flag in text)
        
        # Basic heuristic score
        score = min(matches * 0.2, 1.0)
        return score
