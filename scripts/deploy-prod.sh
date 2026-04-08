#!/usr/bin/env bash
set -euo pipefail

# Build docs (mounted under /documentation/)
DOCS_BASE=/documentation/ yarn --cwd docs build
rsync -a --delete docs/.vitepress/dist/ marketing/public/documentation/

# Build Tailwind CSS for marketing (Tailwind v4 CLI)
node_modules/.bin/tailwindcss -i marketing/tailwind.input.css -o marketing/public/tailwind.css --minify

# Deploy marketing site to prod
firebase deploy --project prod --only hosting:marketing
