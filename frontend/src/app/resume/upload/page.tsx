"use client";

import React, { useState, useEffect } from "react";

import ResumeDropzone from "@/components/resume/ResumeDropzone";
import { useRouter } from "next/navigation";
import { uploadResume, resumeService, analyzePublicResume } from "@/services/resumeService";
import { CheckCircle, FileText, TrendingUp, Target, Award, Zap, Search, SortDesc, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";
import FilePreview from "@/components/resume/FilePreview";
import useAuth from "@/hooks/useAuth";
import Link from "next/link";


export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recentResumes, setRecentResumes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name">("date");
  const [showPreview, setShowPreview] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch recent uploads only if user is authenticated
    if (user) {
      resumeService.list().then(resumes => {
        setRecentResumes(resumes.slice(0, 5));
      }).catch(err => {
        console.error("Failed to fetch recent resumes:", err);
      });
    }
  }, [user]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setShowPreview(true);
  };

  const handleUpload = async () => {
    console.log('handleUpload called. User:', user ? 'Logged In' : 'Anonymous');
    if (!file && !text) {
      toast.error("No file selected", "Please select a file or paste text");
      return;
    }

    setUploading(true);

    try {
      const safeFile: File | null = file || null;
      const safeText: string | null = text || null;

      if (!user) {
        console.log('Starting public analysis flow...');
        // Public flow
        const result = await analyzePublicResume(safeFile, safeText);
        console.log('Public analysis result:', result);
        localStorage.setItem('publicAnalysis', JSON.stringify(result));
        router.push('/resume/analysis/preview');
        return;
      }

      // Authenticated flow
      console.log('Starting authenticated upload flow...');
      const uploadPromise = uploadResume(safeFile, safeText);

      toast.promise(uploadPromise, {
        loading: "Uploading resume...",
        success: "Resume uploaded! Analyzing...",
        error: "Failed to upload resume",
      });

      const result = await uploadPromise;

      setUploading(false);
      if (result && result.resume_id) {
        router.push(`/resume/analysis/${result.resume_id}`);
      } else {
        toast.error("Upload failed", "Please try again");
      }
    } catch (err: any) {
      toast.error("Upload error", err.message || "Please try again");
      setUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!text.trim()) {
      toast.error("No text provided", "Please paste your resume text");
      return;
    }
    await handleUpload();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter and sort resumes
  const filteredResumes = recentResumes
    .filter(resume =>
      resume.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/start')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700"></div>
          
        </div>
      </header>

      <main className="max-w-5xl mx-auto py-12 px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900 dark:text-white">
            Upload & Refine Resume
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Get instant AI-powered insights & professional improvements
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <ResumeDropzone
            onFileSelect={handleFileSelect}
            uploading={uploading}
          />
        </div>

        {/* Text Paste Alternative */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            Or paste your resume text
          </h2>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-xl p-4 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
            placeholder="Paste your resume content here..."
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">
              {text.length} characters
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                onClick={() => setText("")}
              >
                Clear
              </button>
              <button
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={uploading || !text.trim()}
                onClick={handleTextUpload}
              >
                {uploading ? "Analyzing..." : "Analyze Text"}
              </button>
            </div>
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-8 shadow-lg border border-green-200 dark:border-green-800 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-600" />
            What happens next?
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: FileText, text: "Instant parsing of your resume structure" },
              { icon: TrendingUp, text: "AI-powered content analysis & scoring" },
              { icon: Target, text: "ATS optimization check" },
              { icon: Award, text: "Professional improvement suggestions" },
              { icon: CheckCircle, text: "Keyword & skills gap analysis" },
              { icon: Zap, text: "Format & design recommendations" }
            ].map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 pt-2">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Uploads */}
        {recentResumes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Uploads
              </h2>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "date" | "name")}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="date">Latest First</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>
            <div className="space-y-3">
              {filteredResumes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No resumes found</p>
              ) : (
                filteredResumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => router.push(`/resume/analysis/${resume.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {resume.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(resume.updated_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* File Preview Modal */}
      {showPreview && file && (
        <FilePreview
          file={file}
          onClose={() => {
            setShowPreview(false);
            setFile(null);
          }}
          onConfirm={() => {
            setShowPreview(false);
            handleUpload();
          }}
        />
      )}

      {/* Paywall Modal */}

    </div>
  );
}
