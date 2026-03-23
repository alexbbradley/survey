#!/bin/bash
set -e

echo "→ Building..."
npm run build

echo ""
git status

echo ""
read -p "Commit message (blank to cancel): " msg
if [ -z "$msg" ]; then
  echo "Cancelled."
  exit 0
fi

git add -A
git commit -m "$msg"
git push origin main
echo ""
echo "✓ Pushed. SiteGround deploy running in the background."
