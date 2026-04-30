from datetime import datetime, timedelta
import re

class DateParser:
    """
    Parses various date formats and relative strings like '2 days ago'.
    """
    @staticmethod
    def parse(date_text: str):
        if not date_text:
            return datetime.now()
            
        text = date_text.lower().strip()
        
        # Handle relative dates
        if 'ago' in text:
            num = re.search(r'\d+', text)
            if num:
                days = int(num.group())
                return datetime.now() - timedelta(days=days)
        
        # Add more complex regex/date-info parsing here
        return datetime.now() # Fallback
