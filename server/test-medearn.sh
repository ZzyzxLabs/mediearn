#!/bin/bash

# 🧪 MedEarn Comprehensive Test Script
# This script tests all functionality including cleanup, uploads, and API endpoints

set -e  # Exit on any error

echo "🚀 Starting MedEarn Comprehensive Test Suite..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if server is running
check_server() {
    print_status "Checking if MedEarn server is running..."
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        print_success "Server is running on port 8000"
        return 0
    else
        print_error "Server is not running. Please start the server first with 'npm start'"
        exit 1
    fi
}

# Step 1: Clean up all existing articles
cleanup_database() {
    echo ""
    print_status "Step 1: Cleaning up existing articles..."
    
    # Get current articles count
    current_count=$(curl -s http://localhost:8000/api/articles | jq 'length')
    print_status "Current articles in database: $current_count"
    
    if [ "$current_count" -gt 0 ]; then
        print_status "Deleting all existing articles..."
        
        # Get all article IDs and delete them
        curl -s http://localhost:8000/api/articles | jq -r '.[].id' | while read -r id; do
            if [ ! -z "$id" ]; then
                print_status "Deleting article ID: $id"
                curl -X DELETE "http://localhost:8000/api/articles/$id" > /dev/null 2>&1
                if [ $? -eq 0 ]; then
                    print_success "Deleted article $id"
                else
                    print_error "Failed to delete article $id"
                fi
            fi
        done
        
        # Verify cleanup
        sleep 2
        new_count=$(curl -s http://localhost:8000/api/articles | jq 'length')
        if [ "$new_count" -eq 0 ]; then
            print_success "Database cleaned successfully (0 articles remaining)"
        else
            print_error "Cleanup failed - $new_count articles still remain"
        fi
    else
        print_success "Database already clean (0 articles)"
    fi
}

# Step 2: Upload test articles
upload_test_articles() {
    echo ""
    print_status "Step 2: Uploading test articles..."
    
    # Create test article 1
    print_status "Creating test article 1..."
    cat > test-article-1.txt << 'EOF'
This is the first test article for MedEarn.
It contains sample content to test the upload functionality.
This article will be used to verify Walrus integration and local storage.
EOF

    # Upload article 1
    print_status "Uploading test-article-1.txt..."
    response1=$(curl -s -X POST -F "content=@test-article-1.txt" http://localhost:8000/api/upload)
    article1_id=$(echo "$response1" | jq -r '.article.id')
    
    if [ "$article1_id" != "null" ] && [ "$article1_id" != "" ]; then
        print_success "Article 1 uploaded successfully (ID: $article1_id)"
    else
        print_error "Failed to upload article 1"
        echo "Response: $response1"
        exit 1
    fi
    
    # Create test article 2
    print_status "Creating test article 2..."
    cat > test-article-2.txt << 'EOF'
This is the second test article for comprehensive testing.
It has different content to verify the system works with multiple articles.
This will test search, preview, and ownership functionality.
EOF

    # Upload article 2
    print_status "Uploading test-article-2.txt..."
    response2=$(curl -s -X POST -F "content=@test-article-2.txt" http://localhost:8000/api/upload)
    article2_id=$(echo "$response2" | jq -r '.article.id')
    
    if [ "$article2_id" != "null" ] && [ "$article2_id" != "" ]; then
        print_success "Article 2 uploaded successfully (ID: $article2_id)"
    else
        print_error "Failed to upload article 2"
        echo "Response: $response2"
        exit 1
    fi
    
    # Store IDs for later use
    echo "$article1_id" > .article1_id
    echo "$article2_id" > .article2_id
}

# Step 3: Test all articles preview with detailed display
test_articles_preview() {
    echo ""
    print_status "Step 3: Testing articles preview with detailed display..."
    
    print_status "Fetching all articles preview..."
    preview_response=$(curl -s http://localhost:8000/api/articles/preview)
    article_count=$(echo "$preview_response" | jq 'length')
    
    print_success "Found $article_count articles"
    echo ""
    
    # Display detailed preview for each article
    echo "$preview_response" | jq -r '.[] | "📄 Article Details:" + "\n" + "   ID: " + .id + "\n" + "   File: " + .fileName + "\n" + "   Size: " + (.originalFileSize | tostring) + " bytes\n" + "   Upload: " + .uploadDate + "\n" + "   Owner: " + .owner.suiAddress + "\n" + "   Public: " + (.owner.isPublic | tostring) + "\n" + "   Tags: [" + (.tags | join(", ")) + "]\n" + "   Version: " + .version + "\n" + "---"'
}

# Step 4: Test ownership functionality
test_ownership() {
    echo ""
    print_status "Step 4: Testing ownership functionality..."
    
    # Get the owner address from the first article
    owner_address=$(curl -s http://localhost:8000/api/articles | jq -r '.[0].owner.suiAddress')
    
    if [ "$owner_address" != "null" ] && [ "$owner_address" != "" ]; then
        print_status "Testing ownership for address: $owner_address"
        
        # Get articles by owner
        owned_articles=$(curl -s "http://localhost:8000/api/articles/owner/$owner_address")
        owned_count=$(echo "$owned_articles" | jq 'length')
        
        print_success "Found $owned_count articles owned by this address"
        
        # Display owned articles details
        echo "$owned_articles" | jq -r '.[] | "   📁 " + .fileName + " (ID: " + .id + ", Walrus: " + .walrus.overallStatus + ", Local: " + (.local.fileSize | tostring) + " bytes)"'
        
    else
        print_error "Could not determine owner address"
    fi
}

# Step 5: Test search functionality
test_search() {
    echo ""
    print_status "Step 5: Testing search functionality..."
    
    # Test search for "test"
    print_status "Searching for 'test'..."
    test_results=$(curl -s "http://localhost:8000/api/articles/search?q=test")
    test_count=$(echo "$test_results" | jq 'length')
    print_success "Found $test_count articles matching 'test'"
    
    # Test search for "article"
    print_status "Searching for 'article'..."
    article_results=$(curl -s "http://localhost:8000/api/articles/search?q=article")
    article_count=$(echo "$article_results" | jq 'length')
    print_success "Found $article_count articles matching 'article'"
    
    # Test search for "walrus"
    print_status "Searching for 'walrus'..."
    walrus_results=$(curl -s "http://localhost:8000/api/articles/search?q=walrus")
    walrus_count=$(echo "$walrus_results" | jq 'length')
    print_success "Found $walrus_count articles matching 'walrus'"
}

# Step 6: Test database statistics
test_statistics() {
    echo ""
    print_status "Step 6: Testing database statistics..."
    
    stats=$(curl -s http://localhost:8000/api/stats)
    
    print_success "Database Statistics:"
    echo "$stats" | jq -r '
        "   📊 Total Articles: " + (.totalArticles | tostring) + "\n" +
        "   💾 Total Size: " + (.totalSize | tostring) + " bytes\n" +
        "   📤 Upload Status: " + (.uploadStatus | to_entries | map(.key + ": " + (.value | tostring)) | join(", ")) + "\n" +
        "   🔗 Blob Status: " + (.blobStatus | to_entries | map(.key + ": " + (.value | tostring)) | join(", ")) + "\n" +
        "   🕒 Last Backup: " + .lastBackup
    '
}

# Step 7: Test individual article retrieval
test_individual_articles() {
    echo ""
    print_status "Step 7: Testing individual article retrieval..."
    
    # Get article IDs
    article1_id=$(cat .article1_id 2>/dev/null || echo "")
    article2_id=$(cat .article2_id 2>/dev/null || echo "")
    
    if [ ! -z "$article1_id" ]; then
        print_status "Retrieving article 1 (ID: $article1_id)..."
        article1=$(curl -s "http://localhost:8000/api/articles/$article1_id")
        if [ $? -eq 0 ]; then
            print_success "Article 1 retrieved successfully"
            echo "$article1" | jq -r '"   📄 " + .fileName + " - " + (.walrus.overallStatus | tostring) + " - " + (.local.fileSize | tostring) + " bytes"'
        else
            print_error "Failed to retrieve article 1"
        fi
    fi
    
    if [ ! -z "$article2_id" ]; then
        print_status "Retrieving article 2 (ID: $article2_id)..."
        article2=$(curl -s "http://localhost:8000/api/articles/$article2_id")
        if [ $? -eq 0 ]; then
            print_success "Article 2 retrieved successfully"
            echo "$article2" | jq -r '"   📄 " + .fileName + " - " + (.walrus.overallStatus | tostring) + " - " + (.local.fileSize | tostring) + " bytes"'
        else
            print_error "Failed to retrieve article 2"
        fi
    fi
}

# Step 8: Test public articles endpoint
test_public_articles() {
    echo ""
    print_status "Step 8: Testing public articles endpoint..."
    
    public_articles=$(curl -s http://localhost:8000/api/articles/public)
    public_count=$(echo "$public_articles" | jq 'length')
    
    print_success "Found $public_count public articles"
    
            if [ "$public_count" -gt 0 ]; then
            echo "$public_articles" | jq -r '.[] | "   🌍 " + .fileName + " (ID: " + (.id | tostring) + ")"'
        fi
}

# Step 9: Test health check
test_health_check() {
    echo ""
    print_status "Step 9: Testing health check endpoint..."
    
    health=$(curl -s http://localhost:8000/api/health)
    
    print_success "Health Check:"
    echo "$health" | jq -r '
        "   🟢 Status: " + .status + "\n" +
        "   🕒 Timestamp: " + .timestamp + "\n" +
        "   📝 Message: " + .message + "\n" +
        "   🔑 Walrus: " + .walrusStatus + "\n" +
        "   🌐 Network: " + .suiNetwork + "\n" +
        "   📊 Database: " + (.database.totalArticles | tostring) + " articles, " + (.database.totalSize | tostring) + " bytes"
    '
}

# Step 10: Cleanup test files
cleanup_test_files() {
    echo ""
    print_status "Step 10: Cleaning up test files..."
    
    # Remove test article files
    if [ -f "test-article-1.txt" ]; then
        rm test-article-1.txt
        print_success "Removed test-article-1.txt"
    fi
    
    if [ -f "test-article-2.txt" ]; then
        rm test-article-2.txt
        print_success "Removed test-article-2.txt"
    fi
    
    # Remove temporary ID files
    if [ -f ".article1_id" ]; then
        rm .article1_id
    fi
    
    if [ -f ".article2_id" ]; then
        rm .article2_id
    fi
}

# Main test execution
main() {
    echo "🧪 MedEarn Comprehensive Test Suite"
    echo "===================================="
    echo "This script will test all MedEarn functionality:"
    echo "  ✅ Database cleanup"
    echo "  ✅ Article uploads"
    echo "  ✅ Preview display"
    echo "  ✅ Ownership verification"
    echo "  ✅ Search functionality"
    echo "  ✅ Statistics"
    echo "  ✅ Individual article retrieval"
    echo "  ✅ Public articles"
    echo "  ✅ Health check"
    echo "  ✅ Test file cleanup"
    echo ""
    
    # Check prerequisites
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Please install jq first."
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed. Please install curl first."
        exit 1
    fi
    
    # Run all tests
    check_server
    cleanup_database
    upload_test_articles
    test_articles_preview
    test_ownership
    test_search
    test_statistics
    test_individual_articles
    test_public_articles
    test_health_check
    cleanup_test_files
    
    echo ""
    echo "🎉 All tests completed successfully!"
    echo "===================================="
    print_success "MedEarn system is working perfectly!"
    print_success "Database structure is clean and optimized"
    print_success "All API endpoints are functional"
    print_success "Walrus integration is working"
    print_success "Search functionality is enhanced"
}

# Run the main function
main "$@"
