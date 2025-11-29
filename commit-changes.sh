#!/bin/bash

# Resume Builder Templates - Git Commit Script
# Run this script in WSL: bash commit-changes.sh

echo "🔍 Checking git status..."
git status

echo ""
echo "📦 Staging all changes..."
git add .

echo ""
echo "✍️ Creating commit..."
git commit -m "feat: Implement all resume templates with dynamic theming

- Add Creative and Tech Minimalist templates
- Implement template selector in builder header
- Add SummaryForm component for professional summary
- Support dynamic theme switching across all templates
- Improve error logging for dashboard API calls
- Fix network error by removing NEXT_PUBLIC_API_URL override

Changes include:
- New templates: CreativeTemplate.tsx, MinimalTemplate.tsx
- Updated ModernTemplate with dynamic theming
- BuilderHeader with template dropdown selector
- SummaryForm for professional summary editing
- Enhanced error logging in API client and hooks
- Removed incorrect NEXT_PUBLIC_API_URL from .env"

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✅ Done! Changes pushed to GitHub."
