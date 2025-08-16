# 🧪 MedEarn Testing Guide

This guide explains how to test your MedEarn server using the provided test scripts.

## 📋 Prerequisites

Before running the tests, ensure you have:

1. **MedEarn server running** on port 3000 (`npm start`)
2. **jq installed** for JSON parsing (`brew install jq` on macOS)
3. **curl installed** for HTTP requests (usually pre-installed)

## 🚀 Test Scripts

### 1. **Comprehensive Test Script** (`test-medearn.sh`)

This script performs a complete end-to-end test of all MedEarn functionality:

#### **What it does:**
- ✅ **Database cleanup** - Removes all existing articles
- ✅ **Article uploads** - Creates and uploads 2 test articles
- ✅ **Preview display** - Shows detailed preview of all articles
- ✅ **Ownership verification** - Tests article ownership functionality
- ✅ **Search functionality** - Tests search with multiple queries
- ✅ **Statistics** - Shows database statistics
- ✅ **Individual retrieval** - Tests getting articles by ID
- ✅ **Public articles** - Tests public articles endpoint
- ✅ **Health check** - Tests server health endpoint
- ✅ **Cleanup** - Removes test files

#### **How to run:**
```bash
# Make sure server is running first
npm start

# In another terminal, run the comprehensive test
./test-medearn.sh
```

#### **Expected output:**
```
🚀 Starting MedEarn Comprehensive Test Suite...
================================================

[INFO] Checking if MedEarn server is running...
[SUCCESS] Server is running on port 3000

[INFO] Step 1: Cleaning up existing articles...
[INFO] Current articles in database: 2
[INFO] Deleting all existing articles...
[SUCCESS] Deleted article 1755307690968
[SUCCESS] Deleted article 1755307701649
[SUCCESS] Database cleaned successfully (0 articles remaining)

[INFO] Step 2: Uploading test articles...
[INFO] Creating test article 1...
[INFO] Uploading test-article-1.txt...
[SUCCESS] Article 1 uploaded successfully (ID: 1755307701649)
[INFO] Creating test article 2...
[INFO] Uploading test-article-2.txt...
[SUCCESS] Article 2 uploaded successfully (ID: 1755307701650)

[INFO] Step 3: Testing articles preview with detailed display...
[INFO] Fetching all articles preview...
[SUCCESS] Found 2 articles

📄 Article Details:
   ID: 1755307701649
   File: test-article-1.txt
   Size: 138 bytes
   Upload: 2025-08-16T01:28:10.968Z
   Owner: 0x71750511a12eb5da59064e961094079deb00ba8a0451e345048240efa68319b2
   Public: true
   Tags: []
   Version: 1.0.0
---
📄 Article Details:
   ID: 1755307701650
   File: test-article-2.txt
   Size: 156 bytes
   Upload: 2025-08-16T01:28:21.649Z
   Owner: 0x71750511a12eb5da59064e961094079deb00ba8a0451e345048240efa68319b2
   Public: true
   Tags: []
   Version: 1.0.0
---

... (more test results)

🎉 All tests completed successfully!
====================================
[SUCCESS] MedEarn system is working perfectly!
[SUCCESS] Database structure is clean and optimized
[SUCCESS] All API endpoints are functional
[SUCCESS] Walrus integration is working
[SUCCESS] Search functionality is enhanced
```

### 2. **Quick Test Script** (`quick-test.sh`)

This script provides an interactive menu for testing specific functionality without full cleanup:

#### **What it offers:**
1. **Show all articles preview** - Detailed display of all articles
2. **Test search functionality** - Interactive search with custom terms
3. **Show database statistics** - Current database stats
4. **Test ownership** - Verify article ownership
5. **Show health check** - Server health status
6. **Run all quick tests** - Execute all tests at once
7. **Exit** - Close the script

#### **How to run:**
```bash
# Make sure server is running first
npm start

# In another terminal, run the quick test
./quick-test.sh
```

#### **Example interaction:**
```
🚀 Quick MedEarn Test Script
=============================
✅ Server is running

Choose a test to run:
1. Show all articles preview (detailed)
2. Test search functionality
3. Show database statistics
4. Test ownership
5. Show health check
6. Run all quick tests
7. Exit

Enter your choice (1-7): 1

📄 All Articles Preview:
========================
📄 Article Details:
   ID: 1755307701649
   File: test-article-1.txt
   Size: 138 bytes
   Upload: 2025-08-16T01:28:10.968Z
   Owner: 0x71750511a12eb5da59064e961094079deb00ba8a0451e345048240efa68319b2
   Public: true
   Tags: []
   Version: 1.0.0
---
📄 Article Details:
   ID: 1755307701650
   File: test-article-2.txt
   Size: 156 bytes
   Upload: 2025-08-16T01:28:21.649Z
   Owner: 0x71750511a12eb5da59064e961094079deb00ba8a0451e345048240efa68319b2
   Public: true
   Tags: []
   Version: 1.0.0
---

✅ Test completed!
```

## 🔍 **Enhanced Preview Display**

Both scripts now show **comprehensive article details** instead of just basic info:

### **What's displayed:**
- 📄 **ID** - Unique article identifier
- 📁 **File** - Original filename
- 💾 **Size** - File size in bytes
- 🕒 **Upload** - Upload timestamp
- 👤 **Owner** - Sui address of owner
- 🌍 **Public** - Whether article is publicly accessible
- 🏷️ **Tags** - Article tags (if any)
- 📋 **Version** - Article version

### **Example output:**
```
📄 Article Details:
   ID: 1755307701649
   File: test-article-1.txt
   Size: 138 bytes
   Upload: 2025-08-16T01:28:10.968Z
   Owner: 0x71750511a12eb5da59064e961094079deb00ba8a0451e345048240efa68319b2
   Public: true
   Tags: []
   Version: 1.0.0
---
```

## 🧹 **Testing Workflow**

### **For Development/Testing:**
1. **Start server**: `npm start`
2. **Run comprehensive test**: `./test-medearn.sh`
3. **Verify all functionality works**

### **For Quick Checks:**
1. **Start server**: `npm start`
2. **Run quick test**: `./quick-test.sh`
3. **Choose specific tests to run**

### **For Continuous Testing:**
1. **Automate with CI/CD**: Use `test-medearn.sh` in your CI pipeline
2. **Scheduled testing**: Run tests periodically to ensure system health
3. **Pre-deployment**: Always run tests before deploying to production

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"Server is not running"**
   - Solution: Start server with `npm start`
   - Check if port 3000 is available

2. **"jq is required"**
   - Solution: Install jq (`brew install jq` on macOS)
   - Alternative: Use `apt-get install jq` on Ubuntu

3. **"Permission denied"**
   - Solution: Make scripts executable: `chmod +x *.sh`

4. **"Article not found" errors**
   - Solution: Check if articles exist in database
   - Run cleanup first: `./test-medearn.sh`

### **Debug Mode:**
To see detailed API responses, modify the scripts to remove `> /dev/null 2>&1` from curl commands.

## 📊 **Test Coverage**

The comprehensive test script covers:

- ✅ **API Endpoints**: All 10+ endpoints tested
- ✅ **Database Operations**: CRUD operations verified
- ✅ **Walrus Integration**: Upload and status checking
- ✅ **Search Functionality**: Multiple search queries tested
- ✅ **Ownership System**: Address-based ownership verification
- ✅ **Statistics**: Database stats accuracy verified
- ✅ **Error Handling**: Graceful error handling tested
- ✅ **Data Structure**: Clean, optimized structure verified

## 🎯 **Success Criteria**

Tests are considered successful when:

1. **All 10 test steps complete without errors**
2. **Database operations work correctly**
3. **API responses are valid JSON**
4. **Article uploads succeed with Walrus integration**
5. **Search returns expected results**
6. **Statistics are accurate**
7. **Cleanup removes all test artifacts**

## 🚀 **Next Steps**

After successful testing:

1. **Deploy to staging/production**
2. **Set up automated testing in CI/CD**
3. **Monitor system health with health checks**
4. **Add more specific tests as needed**

---

**Happy Testing! 🧪✨**
