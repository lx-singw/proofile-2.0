class LocationParser:
    """
    Normalizes SA locations.
    Handles 'Sandton, Johannesburg', 'JHB', 'CPT', etc.
    """
    MAPPING = {
        "jhb": "Johannesburg",
        "cpt": "Cape Town",
        "pta": "Pretoria",
        "dbn": "Durban",
        "gaunteg": "Gauteng", # Common typo
    }

    @staticmethod
    def parse(location_text: str):
        if not location_text:
            return "Remote/TBD"
            
        clean = location_text.lower().strip()
        for key, val in LocationParser.MAPPING.items():
            if key in clean:
                return val
        
        return location_text # Return as is if no mapping matches
