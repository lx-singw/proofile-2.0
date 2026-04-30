import re

class SalaryParser:
    """
    Parses South African salary formats.
    Handles 'R15 000', '15k', 'R200k - R300k p.a.', etc.
    """
    @staticmethod
    def parse(salary_text: str):
        if not salary_text:
            return None, None
        
        # Clean text
        text = salary_text.lower().replace(" ", "").replace(",", "")
        
        # Look for numbers
        matches = re.findall(r'\d+', text)
        if not matches:
            return None, None
            
        values = []
        for m in matches:
            val = float(m)
            # Handle 'k' multiplier
            if 'k' in text:
                val *= 1000
            values.append(val)
            
        if len(values) == 1:
            return values[0], values[0]
        return min(values), max(values)
