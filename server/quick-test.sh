#!/bin/bash

# 🚀 Quick MedEarn Test Script
# For testing specific functionality without full cleanup

echo "🚀 Quick MedEarn Test Script"
echo "============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check server
echo -e "${BLUE}Checking server status...${NC}"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo "❌ Server is not running. Start with 'npm start'"
    exit 1
fi

echo ""
echo "Choose a test to run:"
echo "1. Show all articles preview (detailed)"
echo "2. Test search functionality"
echo "3. Show database statistics"
echo "4. Test ownership"
echo "5. Show health check"
echo "6. Run all quick tests"
echo "7. Exit"
echo ""

read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo ""
        echo "📄 All Articles Preview:"
        echo "========================"
        curl -s http://localhost:3000/api/articles/preview | jq -r '.[] | "📄 Article Details:" + "\n" + "   ID: " + .id + "\n" + "   File: " + .fileName + "\n" + "   Size: " + (.originalFileSize | tostring) + " bytes\n" + "   Upload: " + .uploadDate + "\n" + "   Owner: " + .owner.suiAddress + "\n" + "   Public: " + (.owner.isPublic | tostring) + "\n" + "   Tags: [" + (.tags | join(", ")) + "]\n" + "   Version: " + .version + "\n" + "---"'
        ;;
    2)
        echo ""
        echo "🔍 Search Test:"
        echo "==============="
        read -p "Enter search term: " search_term
        echo "Searching for: '$search_term'"
        results=$(curl -s "http://localhost:3000/api/articles/search?q=$search_term")
        count=$(echo "$results" | jq 'length')
        echo "Found $count results:"
        echo "$results" | jq -r '.[] | "   📄 " + .fileName + " (ID: " + .id + ")"'
        ;;
    3)
        echo ""
        echo "📊 Database Statistics:"
        echo "======================="
        stats=$(curl -s http://localhost:3000/api/stats)
        echo "$stats" | jq -r '
            "📊 Total Articles: " + (.totalArticles | tostring) + "\n" +
            "💾 Total Size: " + (.totalSize | tostring) + " bytes\n" +
            "📤 Upload Status: " + (.uploadStatus | to_entries | map(.key + ": " + (.value | tostring)) | join(", ")) + "\n" +
            "🔗 Blob Status: " + (.blobStatus | to_entries | map(.key + ": " + (.value | tostring)) | join(", ")) + "\n" +
            "🕒 Last Backup: " + .lastBackup
        '
        ;;
    4)
        echo ""
        echo "👤 Ownership Test:"
        echo "=================="
        owner_address=$(curl -s http://localhost:3000/api/articles | jq -r '.[0].owner.suiAddress')
        if [ "$owner_address" != "null" ] && [ "$owner_address" != "" ]; then
            echo "Testing ownership for: $owner_address"
            owned=$(curl -s "http://localhost:3000/api/articles/owner/$owner_address")
            count=$(echo "$owned" | jq 'length')
            echo "Found $count owned articles:"
            echo "$owned" | jq -r '.[] | "   📁 " + .fileName + " (ID: " + .id + ", Walrus: " + .walrus.overallStatus + ")"'
        else
            echo "No articles found to test ownership"
        fi
        ;;
    5)
        echo ""
        echo "🟢 Health Check:"
        echo "================="
        health=$(curl -s http://localhost:3000/api/health)
        echo "$health" | jq -r '
            "🟢 Status: " + .status + "\n" +
            "🕒 Timestamp: " + .timestamp + "\n" +
            "📝 Message: " + .message + "\n" +
            "🔑 Walrus: " + .walrusStatus + "\n" +
            "🌐 Network: " + .suiNetwork + "\n" +
            "📊 Database: " + (.database.totalArticles | tostring) + " articles, " + (.database.totalSize | tostring) + " bytes"
        '
        ;;
    6)
        echo ""
        echo "🧪 Running all quick tests..."
        echo "============================="
        
        echo ""
        echo "📄 All Articles Preview:"
        echo "========================"
        curl -s http://localhost:3000/api/articles/preview | jq -r '.[] | "📄 Article Details:" + "\n" + "   ID: " + .id + "\n" + "   File: " + .fileName + "\n" + "   Size: " + (.originalFileSize | tostring) + " bytes\n" + "   Upload: " + .uploadDate + "\n" + "   Owner: " + .owner.suiAddress + "\n" + "   Public: " + (.owner.isPublic | tostring) + "\n" + "   Tags: [" + (.tags | join(", ")) + "]\n" + "   Version: " + .version + "\n" + "---"'
        
        echo ""
        echo "🔍 Search Test (test):"
        echo "======================"
        test_results=$(curl -s "http://localhost:3000/api/articles/search?q=test")
        test_count=$(echo "$test_results" | jq 'length')
        echo "Found $test_count results for 'test':"
        echo "$test_results" | jq -r '.[] | "   📄 " + .fileName + " (ID: " + (.id | tostring) + ")"'
        
        echo ""
        echo "📊 Database Statistics:"
        echo "======================="
        stats=$(curl -s http://localhost:3000/api/stats)
        echo "$stats" | jq -r '
            "📊 Total Articles: " + (.totalArticles | tostring) + "\n" +
            "💾 Total Size: " + (.totalSize | tostring) + " bytes\n" +
            "📤 Upload Status: " + (.uploadStatus | to_entries | map(.key + ": " + (.value | tostring)) | join(", ")) + "\n" +
            "🔗 Blob Status: " + (.blobStatus | to_entries | map(.key + ": " + (.value | tostring)) | join(", ")) + "\n" +
            "🕒 Last Backup: " + .lastBackup
        '
        
        echo ""
        echo "👤 Ownership Test:"
        echo "=================="
        owner_address=$(curl -s http://localhost:3000/api/articles | jq -r '.[0].owner.suiAddress')
        if [ "$owner_address" != "null" ] && [ "$owner_address" != "" ]; then
            echo "Testing ownership for: $owner_address"
            owned=$(curl -s "http://localhost:3000/api/articles/owner/$owner_address")
            count=$(echo "$owned" | jq 'length')
            echo "Found $count owned articles:"
            echo "$owned" | jq -r '.[] | "   📁 " + .fileName + " (ID: " + .id + ", Walrus: " + .walrus.overallStatus + ")"'
        else
            echo "No articles found to test ownership"
        fi
        
        echo ""
        echo "🟢 Health Check:"
        echo "================="
        health=$(curl -s http://localhost:3000/api/health)
        echo "$health" | jq -r '
            "🟢 Status: " + .status + "\n" +
            "🕒 Timestamp: " + .timestamp + "\n" +
            "📝 Message: " + .message + "\n" +
            "🔑 Walrus: " + .walrusStatus + "\n" +
            "🌐 Network: " + .suiNetwork + "\n" +
            "📊 Database: " + (.database.totalArticles | tostring) + " articles, " + (.database.totalSize | tostring) + " bytes"
        '
        ;;
    7)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please enter 1-7."
        exit 1
        ;;
esac

echo ""
echo "✅ Test completed!"
