#!/bin/bash

# Script to update local IP address in configuration files
# Usage: ./update-local-ip.sh

echo "Updating local IP address for Gogrowsmart development..."

# Get current IP address (excluding localhost and loopback)
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$CURRENT_IP" ]; then
    echo "Error: Could not detect local IP address"
    exit 1
fi

echo "Detected IP: $CURRENT_IP"

# Update .env file
ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    sed -i '' "s/EXPO_PUBLIC_API_URL=http:\/\/[0-9.]\+:3000/EXPO_PUBLIC_API_URL=http:\/\/$CURRENT_IP:3000/" "$ENV_FILE"
    echo "Updated $ENV_FILE"
else
    echo "Warning: $ENV_FILE not found"
fi

# Update config.ts file
CONFIG_FILE="config.ts"
if [ -f "$CONFIG_FILE" ]; then
    sed -i '' "s/url = \"http:\/\/[0-9.]\+:3000\";/url = \"http:\/\/$CURRENT_IP:3000\";/" "$CONFIG_FILE"
    echo "Updated $CONFIG_FILE"
else
    echo "Warning: $CONFIG_FILE not found"
fi

echo "IP address update complete!"
echo "Make sure your backend server is running on http://$CURRENT_IP:3000"
