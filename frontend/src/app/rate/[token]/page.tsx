"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Star, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import reviewsService, { ReviewSubmitContext, ReviewSubmitPayload } from "@/services/reviewsService";
import { toast } from "sonner";

export default function RatePage() {
  const params = useParams();
  const token = params.token as string;
  const router = useRouter();

  const [context, setContext] = useState<ReviewSubmitContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [payload, setPayload] = useState<ReviewSubmitPayload>({
    reviewer_name: "",
    reviewer_title: "",
    reviewer_company: "",
    star_rating: 0,
    written_review: "",
    endorsed_skills: [],
  });
  
  const [skillsInput, setSkillsInput] = useState("");

  useEffect(() => {
    async function loadContext() {
      try {
        const data = await reviewsService.getReviewContext(token);
        setContext(data);
        if (data.reviewer_name) {
          setPayload(prev => ({ ...prev, reviewer_name: data.reviewer_name || "" }));
        }
      } catch (err: any) {
        setError(err?.detail || "Invalid or expired review link.");
      } finally {
        setLoading(false);
      }
    }
    if (token) loadContext();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payload.star_rating === 0) {
      toast.error("Please provide a star rating");
      return;
    }
    if (payload.written_review.length < 50) {
      toast.error("Review must be at least 50 characters");
      return;
    }

    try {
      setSubmitting(true);
      
      // Parse skills (comma separated)
      const skillsList = skillsInput
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0);
        
      const finalPayload = {
        ...payload,
        endorsed_skills: skillsList
      };

      await reviewsService.submitReview(token, finalPayload);
      setSubmitted(true);
      toast.success("Review submitted successfully!");
    } catch (err: any) {
      toast.error(err?.detail || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !context) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cannot Load Request</h1>
          <p className="text-gray-600 mb-6">{error || "Something went wrong"}</p>
          <Link href="/" className="cta-secondary">Return Home</Link>
        </div>
      </div>
    );
  }

  if (context.is_already_submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Review Already Submitted</h1>
          <p className="text-gray-600 mb-6">You have already submitted a review for this request.</p>
          <Link href="/" className="cta-secondary">Return Home</Link>
        </div>
      </div>
    );
  }

  if (context.is_expired) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600 mb-6">This review request has expired. Please ask the person to send a new request.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Your review for <strong>{context.reviewee_name}</strong> has been verified and added to their Proofile.
          </p>
          
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left border border-gray-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Build Your Own Trust Graph
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Get verified reviews from your colleagues and stand out to top employers.
            </p>
            <Link href="/register" className="cta-primary w-full text-center block">
              Create Your Free Proofile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const relationshipDisplay = context.relationship_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verify Working Relationship</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
            Your honest review helps build a verified professional identity for {context.reviewee_name}.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header context */}
          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-8 text-white">
            <div className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">You are reviewing</div>
            <div className="text-2xl font-bold mb-1">{context.reviewee_name}</div>
            {context.reviewee_headline && <div className="text-indigo-100 mb-6">{context.reviewee_headline}</div>}
            
            <div className="grid grid-cols-2 gap-4 border-t border-indigo-800 pt-6">
              <div>
                <div className="text-indigo-300 text-xs uppercase tracking-wider mb-1">Role</div>
                <div className="font-medium">{context.role_title}</div>
              </div>
              <div>
                <div className="text-indigo-300 text-xs uppercase tracking-wider mb-1">Company</div>
                <div className="font-medium">{context.company}</div>
              </div>
              <div>
                <div className="text-indigo-300 text-xs uppercase tracking-wider mb-1">Period</div>
                <div className="font-medium">{context.work_period}</div>
              </div>
              <div>
                <div className="text-indigo-300 text-xs uppercase tracking-wider mb-1">Your Relationship</div>
                <div className="font-medium">{relationshipDisplay}</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Identity */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">1. Verify Your Identity</h3>
              <p className="text-sm text-gray-500 -mt-4">This will be shown publicly to build trust.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={payload.reviewer_name}
                    onChange={(e) => setPayload({ ...payload, reviewer_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Current Title</label>
                  <input
                    type="text"
                    required
                    value={payload.reviewer_title}
                    onChange={(e) => setPayload({ ...payload, reviewer_title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Engineering Manager"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Current Company</label>
                  <input
                    type="text"
                    required
                    value={payload.reviewer_company}
                    onChange={(e) => setPayload({ ...payload, reviewer_company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            </div>

            {/* Rating & Review */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-gray-900 border-b pb-2">2. Your Assessment</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Overall Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPayload({ ...payload, star_rating: star })}
                      className="p-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
                    >
                      <Star 
                        className={`w-10 h-10 transition-colors ${
                          star <= payload.star_rating 
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-gray-200 hover:text-yellow-200"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-gray-700">Written Review</label>
                  <span className={`text-xs ${payload.written_review.length < 50 ? 'text-orange-500' : payload.written_review.length > 500 ? 'text-red-500' : 'text-green-600'}`}>
                    {payload.written_review.length} / 500 chars (Min 50)
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={payload.written_review}
                  onChange={(e) => setPayload({ ...payload, written_review: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder={`What was it like working with ${context.reviewee_name}? Focus on specific skills, impact, and reliability.`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endorse Specific Skills <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="e.g. React, Project Management, Communication (comma separated)"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Your review will be publicly verified
              </div>
              <button
                type="submit"
                disabled={submitting || payload.star_rating === 0 || payload.written_review.length < 50 || payload.written_review.length > 500}
                className="cta-primary bg-indigo-600 hover:bg-indigo-700 focus-visible:ring-indigo-500 disabled:bg-gray-300"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
