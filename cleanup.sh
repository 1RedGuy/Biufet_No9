#!/bin/bash

# Script to remove unnecessary files from Git repository

echo "Cleaning up unnecessary files from the repository..."

# Remove from Git index but keep locally
git rm -r --cached .
git add .gitignore

# Remove common Python cache files
find . -name "__pycache__" -type d -exec git rm --cached -r {} +
find . -name "*.pyc" -exec git rm --cached {} +
find . -name "*.pyo" -exec git rm --cached {} +
find . -name "*.pyd" -exec git rm --cached {} +

# Remove virtual environment
git rm --cached -r backend/venv

# Remove database files
git rm --cached backend/db.sqlite3

# Remove Node.js modules and Next.js build files
git rm --cached -r frontend/node_modules
git rm --cached -r frontend/.next

# Remove OS-specific files
find . -name ".DS_Store" -exec git rm --cached {} +
find . -name "Thumbs.db" -exec git rm --cached {} +

# Remove environment files (be careful with this if you have templates that should stay)
git rm --cached backend/.env
git rm --cached frontend/.env

echo "Committing changes..."
git add .
git status

echo "Review the status above. If it looks good, commit with:"
echo "git commit -m \"Remove unnecessary files from repository\""
echo "git push origin <your-branch-name>" 