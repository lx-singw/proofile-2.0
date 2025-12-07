#!/usr/bin/env python3
"""Create test jobs via API"""
import requests
import json

# Test jobs data
test_jobs = [
    {
        "title": "Senior Python Developer",
        "description": "We're looking for an experienced Python developer to join our team. Work with Django, PostgreSQL, and cloud infrastructure.",
        "company_name": "Tech Corp",
        "location": "Remote",
        "job_type": "full-time",
        "required_skills": ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
        "experience_level": "senior",
        "industry": "Technology",
        "salary_range": "$100k-$150k"
    },
    {
        "title": "Junior Frontend Developer",
        "description": "Join our frontend team and work with React and TypeScript. Great opportunity for entry-level developers.",
        "company_name": "StartupXYZ",
        "location": "New York, NY",
        "job_type": "full-time",
        "required_skills": ["JavaScript", "React", "TypeScript", "CSS", "HTML"],
        "experience_level": "entry",
        "industry": "Technology",
        "salary_range": "$60k-$80k"
    },
    {
        "title": "Full Stack Engineer",
        "description": "Work on both frontend and backend systems using Python and React. Build scalable web applications.",
        "company_name": "Digital Solutions",
        "location": "San Francisco, CA",
        "job_type": "full-time",
        "required_skills": ["Python", "React", "Node.js", "MongoDB", "Docker"],
        "experience_level": "mid",
        "industry": "Technology",
        "salary_range": "$90k-$130k"
    },
    {
        "title": "DevOps Engineer",
        "description": "Manage our cloud infrastructure and CI/CD pipelines. Experience with Kubernetes required.",
        "company_name": "Cloud Native Inc",
        "location": "Remote",
        "job_type": "full-time",
        "required_skills": ["Kubernetes", "Docker", "AWS", "Terraform", "Python"],
        "experience_level": "mid",
        "industry": "Technology",
        "salary_range": "$95k-$135k"
    }
]

BASE_URL = "http://localhost:8001/api/v1"

# NOTE: You'll need to be logged in as an employer to create jobs
# For testing, we can just verify the endpoints exist

print("Testing Sprint 2 endpoints...")
print("\n1. Checking jobs list endpoint:")
response = requests.get(f"{BASE_URL}/jobs/")
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print(f"   Jobs found: {len(response.json())}")

print("\nTest jobs data prepared (needs employer authentication to create)")
print(f"Created {len(test_jobs)} job templates")
