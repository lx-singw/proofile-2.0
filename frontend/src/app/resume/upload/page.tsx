"use client";

import React, { useState } from "react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { useRouter } from "next/navigation";

export default function ResumeUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setError(null);
  };

  const handleUpload = async () => {
    setUploading(true);
    setError(null);
    try {
      // TODO: Call backend API to upload and parse resume
      // Simulate upload
      setTimeout(() => {
        setUploading(false);
        router.push("/resume/analysis/1"); // Example: redirect to analysis page
      }, 1500);
    } catch (err) {
      setError("Failed to upload. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 flex items-center justify-between px-6 py-4">
        <ProofileLogo size={32} showWordmark={true} />
        <div className="flex items-center gap-4">
          <a href="/help" className="text-sm text-gray-500 hover:text-green-600">Help</a>
          <a href="/profile" className="text-sm text-gray-500 hover:text-green-600">Profile</a>
        </div>
      </header>
      <main className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-2">Upload & Refine Resume</h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">Get instant AI-powered insights & improvements</p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8 shadow">
          <div className="mb-4">
            <label className="block font-medium mb-2">Drag & Drop Your Resume</label>
            <input type="file" accept=".pdf,.doc,.docx,.txt,.rtf,.odt" onChange={handleFileChange} className="block w-full border border-dashed border-gray-300 rounded p-2" />
            <div className="text-xs text-gray-500 mt-2">Supported formats: PDF, DOCX, TXT, RTF, ODT. Max size: 10 MB.</div>
          </div>
          <div className="mb-4">
            <label className="block font-medium mb-2">Or paste your resume text:</label>
            <textarea value={text} onChange={handleTextChange} rows={6} className="w-full border rounded p-2" placeholder="Paste your resume here..." />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Characters: {text.length}</span>
              <button type="button" className="text-green-600 hover:underline" onClick={() => setText("")}>Clear</button>
            </div>
          </div>
          {error && <div className="text-red-600 mb-2">{error}</div>}
          <button
            className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700 transition disabled:opacity-50"
            disabled={uploading || (!file && !text)}
            onClick={handleUpload}
          >
            {uploading ? "Uploading..." : "Analyze Resume"}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow mb-8">
          <h2 className="text-lg font-semibold mb-2">What happens next?</h2>
          <ul className="list-disc ml-6 text-gray-600 dark:text-gray-300 text-sm space-y-1">
            <li>Instant parsing of your resume structure</li>
            <li>AI-powered content analysis & scoring</li>
            <li>ATS optimization check</li>
            <li>Professional improvement suggestions</li>
            <li>Keyword & skills gap analysis</li>
            <li>Format & design recommendations</li>
          </ul>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow">
          <h2 className="text-lg font-semibold mb-2">Recent Uploads</h2>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>Marketing_Resume.pdf <span className="text-xs text-gray-400">Analyzed 2 hours ago</span></li>
            <li>John_Doe_CV_2024.docx <span className="text-xs text-gray-400">Analyzed yesterday</span></li>
          </ul>
        </div>
      </main>
    </div>
  );
}
