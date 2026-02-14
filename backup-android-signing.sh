#!/bin/bash

echo "🔐 Android Signing Keys Backup & Restore Tool"
echo "============================================="
echo ""

# Configuration
BACKUP_DIR="android-signing-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="android-signing-backup-${TIMESTAMP}.tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to extract keystore information
extract_keystore_info() {
    local keystore_file=$1
    local password=$2
    local alias=$3
    
    if [[ ! -f "$keystore_file" ]]; then
        print_warning "Keystore file not found: $keystore_file"
        return
    fi
    
    print_header "Extracting info from $(basename $keystore_file)"
    
    # Try to get certificate info
    if keytool -list -v -keystore "$keystore_file" -storepass "$password" 2>/dev/null > /tmp/keystore_info.txt; then
        echo "✅ Successfully extracted info from $(basename $keystore_file)"
        
        # Extract SHA1
        SHA1=$(grep "SHA1:" /tmp/keystore_info.txt | head -1 | cut -d: -f2- | xargs)
        echo "SHA1: $SHA1"
        
        # Extract Alias
        if [[ -z "$alias" ]]; then
            ALIAS=$(grep "Alias name:" /tmp/keystore_info.txt | head -1 | cut -d: -f2- | xargs)
        else
            ALIAS="$alias"
        fi
        echo "Alias: $ALIAS"
        
        # Extract validity
        VALIDITY=$(grep "Valid from:" /tmp/keystore_info.txt | head -1)
        echo "Validity: $VALIDITY"
        
        # Save to backup info file
        echo "Keystore: $(basename $keystore_file)" >> "${BACKUP_DIR}/keystore-info.txt"
        echo "Password: $password" >> "${BACKUP_DIR}/keystore-info.txt"
        echo "Alias: $ALIAS" >> "${BACKUP_DIR}/keystore-info.txt"
        echo "SHA1: $SHA1" >> "${BACKUP_DIR}/keystore-info.txt"
        echo "Validity: $VALIDITY" >> "${BACKUP_DIR}/keystore-info.txt"
        echo "---" >> "${BACKUP_DIR}/keystore-info.txt"
        
    else
        print_error "Failed to extract info from $(basename $keystore_file) with password: $password"
    fi
    
    rm -f /tmp/keystore_info.txt
    echo ""
}

# Function to backup signing configuration
backup_signing_config() {
    print_header "Backing up Android signing configuration"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Copy gradle.properties
    if [[ -f "android/gradle.properties" ]]; then
        cp android/gradle.properties "$BACKUP_DIR/"
        print_status "Copied gradle.properties"
    fi
    
    # Copy app build.gradle
    if [[ -f "android/app/build.gradle" ]]; then
        cp android/app/build.gradle "$BACKUP_DIR/"
        print_status "Copied app build.gradle"
    fi
    
    # Copy debug keystore
    if [[ -f "android/app/debug.keystore" ]]; then
        cp android/app/debug.keystore "$BACKUP_DIR/"
        print_status "Copied debug.keystore"
    fi
    
    # Copy all production keystores found
    local keystore_files=(
        "temp.jks"
        "gogrowsmart_production.jks"
        "gogrowsmart_with_cert.jks"
        "gogrowsmart_exact.jks"
        "gogrowsmart_signing.jks"
        "upload-keystore.jks"
    )
    
    for keystore in "${keystore_files[@]}"; do
        if [[ -f "$keystore" ]]; then
            cp "$keystore" "$BACKUP_DIR/"
            print_status "Copied $keystore"
        fi
    done
    
    # Copy keystore info file if exists
    if [[ -f "keystore.txt" ]]; then
        cp keystore.txt "$BACKUP_DIR/"
        print_status "Copied keystore.txt"
    fi
    
    # Copy helper script
    if [[ -f "keystore-helper.sh" ]]; then
        cp keystore-helper.sh "$BACKUP_DIR/"
        print_status "Copied keystore-helper.sh"
    fi
}

# Function to extract information from all keystores
extract_all_keystore_info() {
    print_header "Extracting Keystore Information"
    
    # Initialize keystore info file
    echo "Android Keystore Information - $(date)" > "${BACKUP_DIR}/keystore-info.txt"
    echo "========================================" >> "${BACKUP_DIR}/keystore-info.txt"
    echo "" >> "${BACKUP_DIR}/keystore-info.txt"
    
    # Extract info from debug keystore
    extract_keystore_info "${BACKUP_DIR}/debug.keystore" "android" "androiddebugkey"
    
    # Try to extract from production keystores with common passwords
    local common_passwords=("android" "password" "gogrowsmart" "upload" "123456" "")
    local production_keystores=(
        "temp.jks"
        "gogrowsmart_production.jks"
        "gogrowsmart_with_cert.jks"
        "gogrowsmart_exact.jks"
        "gogrowsmart_signing.jks"
        "upload-keystore.jks"
    )
    
    for keystore in "${production_keystores[@]}"; do
        if [[ -f "${BACKUP_DIR}/$keystore" ]]; then
            for password in "${common_passwords[@]}"; do
                if keytool -list -keystore "${BACKUP_DIR}/$keystore" -storepass "$password" 2>/dev/null >/dev/null; then
                    extract_keystore_info "${BACKUP_DIR}/$keystore" "$password" ""
                    break
                fi
            done
        fi
    done
}

# Function to create restoration script
create_restoration_script() {
    print_header "Creating Restoration Script"
    
    cat > "${BACKUP_DIR}/restore-android-signing.sh" << 'EOF'
#!/bin/bash

echo "🔧 Android Signing Keys Restoration Tool"
echo "======================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# Function to restore android folder structure
restore_android_structure() {
    print_header "Restoring Android Folder Structure"
    
    # Create android directory structure
    mkdir -p android/app
    mkdir -p android/gradle
    mkdir -p android/app/src/main
    
    print_status "Created android directory structure"
}

# Function to restore signing configuration
restore_signing_config() {
    print_header "Restoring Signing Configuration"
    
    # Restore gradle.properties
    if [[ -f "gradle.properties" ]]; then
        cp gradle.properties android/
        print_status "Restored gradle.properties"
    else
        print_warning "gradle.properties not found in backup"
    fi
    
    # Restore app build.gradle
    if [[ -f "build.gradle" ]]; then
        cp build.gradle android/app/
        print_status "Restored app build.gradle"
    else
        print_warning "app build.gradle not found in backup"
    fi
    
    # Restore debug keystore
    if [[ -f "debug.keystore" ]]; then
        cp debug.keystore android/app/
        print_status "Restored debug.keystore"
    else
        print_warning "debug.keystore not found in backup"
    fi
}

# Function to restore production keystores
restore_production_keystores() {
    print_header "Restoring Production Keystores"
    
    local keystore_files=(
        "temp.jks"
        "gogrowsmart_production.jks"
        "gogrowsmart_with_cert.jks"
        "gogrowsmart_exact.jks"
        "gogrowsmart_signing.jks"
        "upload-keystore.jks"
    )
    
    for keystore in "${keystore_files[@]}"; do
        if [[ -f "$keystore" ]]; then
            cp "$keystore" ./
            print_status "Restored $keystore"
        fi
    done
}

# Function to setup gradle.properties for production signing
setup_production_signing() {
    print_header "Setting up Production Signing Configuration"
    
    # Check if we have keystore info
    if [[ -f "keystore-info.txt" ]]; then
        print_status "Found keystore information"
        echo ""
        echo "Available keystore information:"
        cat keystore-info.txt
        echo ""
        
        read -p "Do you want to configure production signing in gradle.properties? (y/n): " configure_signing
        
        if [[ $configure_signing == "y" || $configure_signing == "Y" ]]; then
            echo ""
            echo "Please enter the following information for your production keystore:"
            read -p "Keystore filename (e.g., gogrowsmart_production.jks): " keystore_file
            read -p "Key alias: " key_alias
            read -p "Store password: " store_password
            read -p "Key password: " key_password
            
            # Update gradle.properties
            if [[ -f "android/gradle.properties" ]]; then
                # Remove existing signing config if any
                sed -i.bak '/MYAPP_RELEASE_/d' android/gradle.properties
                
                # Add new signing config
                echo "" >> android/gradle.properties
                echo "# Production signing configuration" >> android/gradle.properties
                echo "MYAPP_RELEASE_STORE_FILE=$keystore_file" >> android/gradle.properties
                echo "MYAPP_RELEASE_KEY_ALIAS=$key_alias" >> android/gradle.properties
                echo "MYAPP_RELEASE_STORE_PASSWORD=$store_password" >> android/gradle.properties
                echo "MYAPP_RELEASE_KEY_PASSWORD=$key_password" >> android/gradle.properties
                print_status "Updated gradle.properties with production signing configuration"
            fi
        fi
    else
        print_warning "No keystore information found. You'll need to configure signing manually."
    fi
}

# Main restoration process
main() {
    print_status "Starting Android signing keys restoration..."
    echo ""
    
    restore_android_structure
    restore_signing_config
    restore_production_keystores
    setup_production_signing
    
    print_header "Restoration Complete"
    print_status "Android signing keys have been restored!"
    echo ""
    echo "Next steps:"
    echo "1. Review the restored configuration"
    echo "2. Test build with: ./gradlew assembleDebug"
    echo "3. Test release build with: ./gradlew assembleRelease"
    echo "4. Verify SHA1 fingerprints match Google Play Console"
    echo ""
    echo "Keystore information is available in: keystore-info.txt"
}

# Run main function
main
EOF
    
    chmod +x "${BACKUP_DIR}/restore-android-signing.sh"
    print_status "Created restoration script"
}

# Function to create backup archive
create_backup_archive() {
    print_header "Creating Backup Archive"
    
    tar -czf "$BACKUP_FILE" "$BACKUP_DIR"
    
    if [[ $? -eq 0 ]]; then
        print_status "Backup archive created: $BACKUP_FILE"
        
        # Show archive info
        echo ""
        echo "Archive contents:"
        tar -tzf "$BACKUP_FILE" | head -20
        if [[ $(tar -tzf "$BACKUP_FILE" | wc -l) -gt 20 ]]; then
            echo "... and $(($(tar -tzf "$BACKUP_FILE" | wc -l) - 20)) more files"
        fi
        
        # Show archive size
        echo ""
        echo "Archive size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        print_error "Failed to create backup archive"
        exit 1
    fi
}

# Function to show backup summary
show_backup_summary() {
    print_header "Backup Summary"
    
    echo "✅ Backup completed successfully!"
    echo ""
    echo "Backup archive: $BACKUP_FILE"
    echo "Backup directory: $BACKUP_DIR"
    echo ""
    echo "What was backed up:"
    echo "- All Android keystore files (*.jks, *.keystore)"
    echo "- Gradle configuration (gradle.properties, build.gradle)"
    echo "- Keystore information and certificates"
    echo "- Restoration script"
    echo ""
    echo "To restore:"
    echo "1. Extract the backup: tar -xzf $BACKUP_FILE"
    echo "2. Navigate to backup directory: cd $BACKUP_DIR"
    echo "3. Run restoration script: ./restore-android-signing.sh"
    echo ""
    echo "⚠️  IMPORTANT: Store this backup file securely!"
    echo "   - Keep it in multiple safe locations"
    echo "   - Don't commit to version control"
    echo "   - Share only with trusted team members"
}

# Main backup function
main_backup() {
    print_status "Starting Android signing keys backup..."
    echo ""
    
    backup_signing_config
    extract_all_keystore_info
    create_restoration_script
    create_backup_archive
    show_backup_summary
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the React Native project root directory"
    exit 1
fi

# Main execution
case "${1:-backup}" in
    "backup")
        main_backup
        ;;
    "restore")
        print_error "For restoration, please extract the backup and run the restore script"
        ;;
    *)
        echo "Usage: $0 [backup|restore]"
        echo "  backup  - Create backup of Android signing keys (default)"
        echo "  restore - Instructions for restoration"
        exit 1
        ;;
esac
