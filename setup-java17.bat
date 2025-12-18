@echo off
echo Setting up Java 17 environment for Android development...

REM Check if Java 17 is installed
java -version 2>&1 | findstr "17" >nul
if %errorlevel% neq 0 (
    echo Java 17 not found. Please install Java 17 first.
    echo Download from: https://adoptium.net/temurin/releases/?version=17
    pause
    exit /b 1
)

REM Set JAVA_HOME to Java 17 (adjust path as needed)
REM Common Java 17 installation paths:
REM C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot
REM C:\Program Files\Java\jdk-17
REM C:\Program Files\OpenJDK\jdk-17

echo Please set JAVA_HOME to your Java 17 installation directory.
echo Example: setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
echo.
echo Current JAVA_HOME: %JAVA_HOME%
echo.

REM Clean and rebuild the project
echo Cleaning previous builds...
cd android
call gradlew clean
echo.
echo Building with Java 17...
call gradlew assembleDebug
echo.
echo Build completed! You can now run: npm run android
cd ..

pause
