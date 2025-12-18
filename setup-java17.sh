#!/bin/bash

echo "Setting up Java 17 environment for Android development..."

# Check if Java 17 is installed
if ! java -version 2>&1 | grep -q "17"; then
    echo "Java 17 not found. Please install Java 17 first."
    echo "Download from: https://adoptium.net/temurin/releases/?version=17"
    exit 1
fi

# Set JAVA_HOME to Java 17 (adjust path as needed)
# Common Java 17 installation paths:
# /usr/lib/jvm/java-17-openjdk
# /usr/lib/jvm/java-17-oracle
# /opt/java/jdk-17

echo "Please set JAVA_HOME to your Java 17 installation directory."
echo "Example: export JAVA_HOME=/usr/lib/jvm/java-17-openjdk"
echo ""
echo "Current JAVA_HOME: $JAVA_HOME"
echo ""

# Clean and rebuild the project
echo "Cleaning previous builds..."
cd android
./gradlew clean
echo ""
echo "Building with Java 17..."
./gradlew assembleDebug
echo ""
echo "Build completed! You can now run: npm run android"
cd ..
