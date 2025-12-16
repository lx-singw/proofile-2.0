from .user import UserCreate, UserRead, UserUpdate, UserSettingsUpdate
from .token import Token, TokenData
from .profile import ProfileCreate, ProfileRead, ProfileUpdate
from .profile import ProfileResponse # Added ProfileResponse

# Opportunities (renamed from Jobs)
from .opportunity import (
    OpportunityCreate, OpportunityRead, OpportunityUpdate,
    OpportunityRecommendationRead, OpportunityDetailRead,
    # Backward compatibility aliases
    JobCreate, JobRead, JobUpdate, JobRecommendationRead, JobDetailRead
)