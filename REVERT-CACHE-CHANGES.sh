#!/bin/bash
# Revert cache-busting meta tags from HTML files

echo "Reverting automatic cache-busting changes..."

for file in /Users/matul/Desktop/Work/Gogrowsmart/dist-clean/*.html; do
    if [ -f "$file" ]; then
        # Remove the cache meta tags that were added
        sed -i '' 's|<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0"/>||g' "$file"
        sed -i '' 's|<meta http-equiv="Pragma" content="no-cache"/>||g' "$file"
        sed -i '' 's|<meta http-equiv="Expires" content="0"/>||g' "$file"
        sed -i '' 's|<meta name="version" content="[0-9]*"/>||g' "$file"
        echo "Reverted: $(basename $file)"
    fi
done

echo "All files reverted to original state."
