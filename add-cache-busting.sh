#!/bin/bash
# Add cache-busting meta tags to all HTML files in dist-clean

CACHE_META='<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0"/><meta http-equiv="Pragma" content="no-cache"/><meta http-equiv="Expires" content="0"/><meta name="version" content="'$(date +%s)'"/>'

for file in /Users/matul/Desktop/Work/Gogrowsmart/dist-clean/*.html; do
    if [ -f "$file" ]; then
        # Add cache meta tags after the charset meta tag
        sed -i '' 's|<meta charSet="utf-8"/>|<meta charSet="utf-8"/>'"$CACHE_META"'|g' "$file"
        echo "Updated: $file"
    fi
done

echo "All HTML files updated with cache-busting meta tags"
