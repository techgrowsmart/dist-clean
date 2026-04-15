#!/bin/bash

# GrowSmart Signup Validation Test Script
# Tests all signup scenarios including duplicate prevention

echo "=========================================="
echo "GrowSmart Signup Validation Tests"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local status="$1"
    local message="$2"
    
    case $status in
        "SUCCESS") echo -e "${GREEN}# $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}# $message${NC}" ;;
        "ERROR") echo -e "${RED}# $message${NC}" ;;
        "INFO") echo -e "${BLUE}# $message${NC}" ;;
    esac
}

# Test data
BASE_URL="http://localhost:3000"
TEST_RESULTS=()

# Test functions
test_signup_scenario() {
    local test_name="$1"
    local email="$2"
    local name="$3"
    local phone="$4"
    local expected_status="$5"
    local expected_error="$6"
    
    echo "Testing: $test_name"
    echo "Email: $email, Name: $name, Phone: $phone"
    
    response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/signup" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"$email\", \"fullName\": \"$name\", \"phonenumber\": \"$phone\", \"role\": \"student\"}")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "$expected_status" ]; then
        if [ -n "$expected_error" ]; then
            if echo "$response_body" | grep -q "$expected_error"; then
                print_status "SUCCESS" "$test_name - Correct error response"
                TEST_RESULTS+=("PASS: $test_name")
            else
                print_status "ERROR" "$test_name - Wrong error message"
                TEST_RESULTS+=("FAIL: $test_name")
            fi
        else
            print_status "SUCCESS" "$test_name - Request successful"
            TEST_RESULTS+=("PASS: $test_name")
        fi
    else
        print_status "ERROR" "$test_name - Expected $expected_status, got $http_code"
        TEST_RESULTS+=("FAIL: $test_name")
    fi
    
    echo "Response: $response_body"
    echo ""
}

# Start enhanced backend server
print_status "INFO" "Starting enhanced backend server..."

if [ -f "backend-simple-signup.js" ]; then
    node backend-simple-signup.js &
    SERVER_PID=$!
    echo "Server PID: $SERVER_PID"
    sleep 2
    
    # Test server health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        print_status "SUCCESS" "Enhanced backend server is running"
    else
        print_status "ERROR" "Enhanced backend server failed to start"
        exit 1
    fi
else
    print_status "ERROR" "backend-simple-signup.js not found"
    exit 1
fi

echo ""
print_status "INFO" "Running signup validation tests..."
echo ""

# Test 1: Valid new user signup
test_signup_scenario \
    "Valid New User Signup" \
    "newuser@example.com" \
    "John Doe" \
    "+919876543210" \
    "200"

# Test 2: Duplicate email signup (should fail)
test_signup_scenario \
    "Duplicate Email Signup" \
    "newuser@example.com" \
    "Jane Doe" \
    "+919876543211" \
    "409" \
    "already registered"

# Test 3: Invalid email format
test_signup_scenario \
    "Invalid Email Format" \
    "invalid-email" \
    "Test User" \
    "+919876543212" \
    "400" \
    "Invalid email"

# Test 4: Empty name
test_signup_scenario \
    "Empty Name" \
    "test2@example.com" \
    "" \
    "+919876543213" \
    "400" \
    "Name is required"

# Test 5: Invalid phone number
test_signup_scenario \
    "Invalid Phone Number" \
    "test3@example.com" \
    "Test User" \
    "123" \
    "400" \
    "Phone number must be at least 10 digits"

# Test 6: Name with invalid characters
test_signup_scenario \
    "Invalid Name Characters" \
    "test4@example.com" \
    "Test123!@#" \
    "+919876543214" \
    "400" \
    "Name can only contain"

# Test 7: Duplicate phone number (should fail)
test_signup_scenario \
    "Duplicate Phone Number" \
    "test5@example.com" \
    "Another User" \
    "+919876543210" \
    "409" \
    "phone number is already registered"

# Test 8: Very long name
test_signup_scenario \
    "Very Long Name" \
    "test6@example.com" \
    "This is a very long name that exceeds the fifty character limit" \
    "+919876543215" \
    "400" \
    "Name must be less than 50 characters"

# Stop server
kill $SERVER_PID 2>/dev/null

echo ""
print_status "INFO" "Test Results Summary"
echo ""

PASS_COUNT=0
FAIL_COUNT=0

for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == PASS* ]]; then
        PASS_COUNT=$((PASS_COUNT + 1))
        echo "PASS: ${result#PASS: }"
    else
        FAIL_COUNT=$((FAIL_COUNT + 1))
        echo "FAIL: ${result#FAIL: }"
    fi
done

echo ""
echo "Total Tests: ${#TEST_RESULTS[@]}"
echo "Passed: $PASS_COUNT"
echo "Failed: $FAIL_COUNT"

if [ $FAIL_COUNT -eq 0 ]; then
    echo ""
    print_status "SUCCESS" "ALL TESTS PASSED - Signup validation is working correctly!"
    exit 0
else
    echo ""
    print_status "ERROR" "Some tests failed - Please review the implementation"
    exit 1
fi
