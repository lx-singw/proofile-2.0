from .base import Base
from .user import User
from .profile import Profile

# Opportunities (renamed from Jobs)
from .opportunity import Opportunity, Job, FeedSignal, UserFeedState, OpportunityActivity  # Job is alias for backward compatibility
from .saved_opportunity import SavedOpportunity, SavedJob  # SavedJob is alias

from .activity import Activity
from .notification import Notification
from .social import Follow, Connection, ProfileStar, Endorsement, Rating, ProfileWatch
from .ai_chat import ChatSession, ChatMessage
from .verification import Verification
from .rating_request import RatingRequest
from .project_collaborator import ProjectCollaborator, CollaboratorStatus
from .peer_verification_request import PeerVerificationRequest, PeerVerificationStatus
from .trust_event import TrustEvent, VerificationAuditLog
from .document import Document, SkillAttempt

# Feed System Models
from .post import Post, PostType, PostVisibility
from .reaction import Reaction, ReactionType
from .comment import Comment

# Experience & Portfolio
from .experience import WorkExperience
from .portfolio import PortfolioItem

# Verified Reviews (Proofile trust graph edges)
from .verified_review import VerifiedReview

# Resumes
from .resume import Resume, ResumeVersion