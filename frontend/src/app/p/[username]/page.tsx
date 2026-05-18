"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle2, 
  MapPin, 
  Briefcase, 
  Star, 
  Award, 
  Share2, 
  Github, 
  Linkedin,
  ShieldCheck,
  Calendar,
  Building2,
  ExternalLink
} from "lucide-react";
import reviewsService, { PublicProfile } from "@/services/reviewsService";
import { format } from "date-fns";

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await reviewsService.getPublicProfile(username);
        setProfile(data);
      } catch (err: any) {
        setError(err?.detail || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
          This profile doesn't exist or is currently set to private.
        </p>
        <Link href="/" className="cta-primary">
          Return Home
        </Link>
      </div>
    );
  }

  // Calculate score color based on tier
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 ring-purple-200 dark:ring-purple-800/30";
    if (score >= 70) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 ring-green-200 dark:ring-green-800/30";
    if (score >= 40) return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-blue-200 dark:ring-blue-800/30";
    return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 ring-gray-200 dark:ring-gray-700";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Elite Trust";
    if (score >= 70) return "High Trust";
    if (score >= 40) return "Verified";
    return "Building Trust";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans selection:bg-green-200 dark:selection:bg-green-900">
      {/* Premium Hero Section */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 pt-20 pb-16 relative overflow-hidden">
        {/* Abstract background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[150%] rounded-full bg-gradient-to-br from-green-100 to-transparent blur-3xl transform rotate-12"></div>
          <div className="absolute top-[10%] -right-[10%] w-[40%] h-[120%] rounded-full bg-gradient-to-bl from-blue-100 to-transparent blur-3xl transform -rotate-12"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-gray-100 dark:bg-gray-800 overflow-hidden border-4 border-white dark:border-gray-900 shadow-xl">
                {profile.profile_photo_url ? (
                  <Image 
                    src={profile.profile_photo_url} 
                    alt={profile.full_name || profile.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-300 dark:text-gray-600 bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                    {profile.full_name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Trust Score Badge */}
              <div className={`absolute -bottom-4 -right-4 px-3 py-2 rounded-2xl ring-1 shadow-lg backdrop-blur-md flex flex-col items-center justify-center ${getScoreColor(profile.proofile_score)}`}>
                <span className="text-2xl font-black leading-none">{profile.proofile_score}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mt-1">{getScoreLabel(profile.proofile_score)}</span>
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                  {profile.full_name || `@${profile.username}`}
                  {profile.proofile_score >= 70 && (
                    <CheckCircle2 className="w-7 h-7 text-green-500 fill-green-100 dark:fill-green-900/30" />
                  )}
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 font-medium mt-2 max-w-2xl">
                  {profile.headline || "Professional"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                {profile.city && (
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-2.5 py-1 rounded-md">
                    <MapPin className="w-4 h-4" />
                    {profile.city}
                  </div>
                )}
                {profile.industry && (
                  <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800/50 px-2.5 py-1 rounded-md">
                    <Briefcase className="w-4 h-4" />
                    {profile.industry}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button className="cta-primary !py-2.5 !text-sm flex-1 md:flex-none">
                  Contact
                </button>
                <button className="cta-secondary !py-2.5 !px-4 hover:border-gray-300 shadow-sm" title="Share Profile">
                  <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                {(profile.github_url || profile.linkedin_url) && (
                  <div className="flex items-center gap-2 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        <Github className="w-5 h-5" />
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-[#0A66C2] transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-10 max-w-3xl">
              <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">About</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {profile.bio}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Left Column (Work History & Reviews) */}
          <div className="md:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Briefcase className="w-6 h-6 text-green-600" />
                Verified Work History
              </h2>

              {profile.experiences.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
                  <p className="text-gray-500 dark:text-gray-400">No work history added yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {profile.experiences.map((exp) => (
                    <div key={exp.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                      {/* Entry Header */}
                      <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {exp.title}
                              {exp.is_verified && (
                                <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-md">
                                  <ShieldCheck className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </h3>
                            <div className="text-lg font-medium text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
                              <Building2 className="w-4 h-4 opacity-50" />
                              {exp.company}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(exp.start_date), "MMM yyyy")} – {exp.is_current ? "Present" : exp.end_date ? format(new Date(exp.end_date), "MMM yyyy") : ""}
                          </div>
                        </div>
                        
                        {exp.description && (
                          <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                            {exp.description}
                          </p>
                        )}
                      </div>

                      {/* Reviews Section */}
                      {exp.reviews && exp.reviews.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 sm:p-8">
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            {exp.reviews.length} Verified {exp.reviews.length === 1 ? 'Review' : 'Reviews'}
                          </h4>
                          
                          <div className="space-y-6">
                            {exp.reviews.map((review) => (
                              <div key={review.id} className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                      {review.reviewer_name}
                                      {review.reviewer_has_proofile && (
                                        <CheckCircle2 className="w-4 h-4 text-blue-500" title="Has Proofile" />
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                      {review.reviewer_title} at {review.reviewer_company}
                                    </div>
                                    <div className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">
                                      Relationship: {review.relationship_type.replace('_', ' ')}
                                    </div>
                                  </div>
                                  <div className="flex gap-1 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star} 
                                        className={`w-4 h-4 ${star <= review.star_rating ? "text-yellow-500 fill-yellow-500" : "text-gray-200 dark:text-gray-700"}`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-[15px] leading-relaxed italic">
                                  "{review.written_review}"
                                </p>
                                {review.endorsed_skills && review.endorsed_skills.length > 0 && (
                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {review.endorsed_skills.map((skill, idx) => (
                                      <span key={idx} className="text-xs font-medium px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-md flex items-center gap-1 border border-green-100 dark:border-green-800/30">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {skill}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (Skills & Trust Details) */}
          <div className="space-y-8">
            
            {/* Verified Skills */}
            <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-500" />
                Verified Skills
              </h2>
              
              {Object.keys(profile.verified_skills).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">No skills verified by reviewers yet.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(profile.verified_skills)
                    .sort(([, a], [, b]) => b - a)
                    .map(([skill, count]) => (
                    <div key={skill} className="flex justify-between items-center group">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{skill}</span>
                      <span className="flex items-center gap-1 text-sm font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-800/50">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Self-reported Skills */}
            {profile.skills_data && profile.skills_data.length > 0 && (
              <section className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                  Self-Reported Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills_data.filter(s => !profile.verified_skills[s]).map((skill, idx) => (
                    <span key={idx} className="text-sm px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Proofile Score Breakdown (Optional transparency module) */}
            {profile.score_breakdown && profile.total_reviews > 0 && (
              <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                
                <h2 className="text-lg font-bold mb-1">Trust Score Details</h2>
                <p className="text-gray-400 text-xs mb-5">How this score is calculated</p>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                    <span className="text-gray-300 flex flex-col">
                      <span>Verified Reviews (25%)</span>
                      <span className="text-[10px] text-gray-500">{profile.total_reviews} reviews</span>
                    </span>
                    <span className="font-mono font-medium">+{profile.score_breakdown.review_count_component}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                    <span className="text-gray-300 flex flex-col">
                      <span>Average Rating (30%)</span>
                      <span className="text-[10px] text-gray-500">{profile.avg_rating} stars</span>
                    </span>
                    <span className="font-mono font-medium">+{profile.score_breakdown.star_rating_component}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-b border-gray-700/50 pb-2">
                    <span className="text-gray-300 flex flex-col">
                      <span>Reviewer Authority (25%)</span>
                      <span className="text-[10px] text-gray-500">Based on titles</span>
                    </span>
                    <span className="font-mono font-medium">+{profile.score_breakdown.seniority_component}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-gray-300">Profile Base (20%)</span>
                    <span className="font-mono font-medium">+{profile.score_breakdown.completeness_component + profile.score_breakdown.cross_platform_component}</span>
                  </div>
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
