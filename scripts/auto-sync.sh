#!/bin/bash
# Auto-sync script untuk TrakingDuit
# Sync otomatis setiap perubahan ke GitHub & trigger Vercel deploy
# 
# Usage:
#   chmod +x auto-sync.sh
#   ./auto-sync.sh
#
# Atau jalankan di background:
#   nohup ./auto-sync.sh > sync.log 2>&1 &

# Configuration
REPO_DIR="$HOME/storage/shared/trakingduit"  # Ganti sesuai lokasi repo
BRANCH="main"
SYNC_INTERVAL=300  # 5 menit (dalam detik)
AUTO_COMMIT_MESSAGE="chore: auto-sync from $(hostname)"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Check if repo directory exists
if [ ! -d "$REPO_DIR" ]; then
    error "Repository directory not found: $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR" || exit 1

log "🚀 TrakingDuit Auto-Sync started"
log "Repository: $REPO_DIR"
log "Branch: $BRANCH"
log "Sync interval: $SYNC_INTERVAL seconds"

while true; do
    log "🔄 Starting sync cycle..."

    # 1. Fetch remote changes
    log "📥 Fetching remote changes..."
    if git fetch origin "$BRANCH"; then
        log "✅ Fetch successful"
    else
        error "Failed to fetch from remote"
        sleep $SYNC_INTERVAL
        continue
    fi

    # 2. Check for remote changes
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})
    BASE=$(git merge-base @ @{u})

    if [ "$LOCAL" = "$REMOTE" ]; then
        log "📍 Already up to date with remote"
    elif [ "$LOCAL" = "$BASE" ]; then
        # Remote has new commits
        log "⬇️  Remote has new changes, pulling..."
        if git pull origin "$BRANCH"; then
            log "✅ Pull successful"
        else
            error "Failed to pull from remote"
            sleep $SYNC_INTERVAL
            continue
        fi
    elif [ "$REMOTE" = "$BASE" ]; then
        # Local has new commits
        log "⬆️  Local has new changes, will push after checking local changes"
    else
        warn "Branches have diverged, attempting merge..."
        if git pull origin "$BRANCH" --no-edit; then
            log "✅ Merge successful"
        else
            error "Failed to merge, manual intervention required"
            sleep $SYNC_INTERVAL
            continue
        fi
    fi

    # 3. Check for local changes
    if [ -n "$(git status --porcelain)" ]; then
        log "📝 Local changes detected"
        
        # Show changed files
        git status --short
        
        # Add all changes
        log "➕ Adding changes..."
        git add .
        
        # Commit with auto message
        log "💾 Committing changes..."
        if git commit -m "$AUTO_COMMIT_MESSAGE"; then
            log "✅ Commit successful"
        else
            error "Failed to commit"
            sleep $SYNC_INTERVAL
            continue
        fi
        
        # Push to remote
        log "🚀 Pushing to remote..."
        if git push origin "$BRANCH"; then
            log "✅ Push successful - Vercel will auto-deploy"
        else
            error "Failed to push to remote"
            sleep $SYNC_INTERVAL
            continue
        fi
    else
        log "✨ No local changes"
    fi

    log "✅ Sync cycle complete"
    log "⏰ Next sync in $SYNC_INTERVAL seconds..."
    sleep $SYNC_INTERVAL
done
