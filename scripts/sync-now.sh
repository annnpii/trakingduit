#!/bin/bash
# Manual sync script - untuk sync sekali aja
# 
# Usage: ./sync-now.sh [commit-message]
# 
# Example:
#   ./sync-now.sh "feat: add new feature"
#   ./sync-now.sh  # Will use default message

REPO_DIR="$(pwd)"
BRANCH="main"
COMMIT_MSG="${1:-chore: manual sync from $(hostname)}"

echo "🔄 Syncing repository..."

# Pull latest changes
echo "📥 Pulling from remote..."
git pull origin "$BRANCH"

# Check for changes
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Changes detected:"
    git status --short
    
    echo "➕ Staging changes..."
    git add .
    
    echo "💾 Committing..."
    git commit -m "$COMMIT_MSG"
    
    echo "🚀 Pushing to remote..."
    git push origin "$BRANCH"
    
    echo "✅ Sync complete! Vercel will auto-deploy."
else
    echo "✨ No changes to sync"
fi

echo "📊 Current status:"
git status
