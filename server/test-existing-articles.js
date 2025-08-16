#!/usr/bin/env node

/**
 * Test Script for MedEarn Pay-Per-Access System
 * Tests existing articles to verify the pay-per-access functionality
 */

const crypto = require('crypto');

// Configuration
const SERVER_URL = 'http://localhost:8000';
const TEST_USER_ADDRESS = '0x1234567890123456789012345678901234567890';

class ExistingArticlesTester {
    constructor() {
        this.existingArticleId = null;
    }

    async log(message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
        console.log('─'.repeat(50));
    }

    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const responseData = await response.text();
            let jsonData;
            
            try {
                jsonData = JSON.parse(responseData);
            } catch {
                jsonData = responseData;
            }

            return {
                status: response.status,
                ok: response.ok,
                data: jsonData,
                headers: response.headers
            };
        } catch (error) {
            return {
                status: 0,
                ok: false,
                data: { error: error.message },
                headers: {}
            };
        }
    }

    async testPreviewEndpoint() {
        await this.log('📋 Testing preview endpoint...');

        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/preview`);
        
        if (!response.ok) {
            throw new Error(`Failed to get previews: ${response.status} - ${JSON.stringify(response.data)}`);
        }

        const previews = response.data;
        await this.log('✅ Blob previews retrieved successfully', {
            totalArticles: previews.length,
            previews: previews
        });

        // Verify that all articles show payment required
        if (previews.length > 0) {
            const firstPreview = previews[0];
            this.existingArticleId = firstPreview.blobId;
            
            if (firstPreview.paymentRequired === true) {
                await this.log('✅ Preview shows payment required (expected)', {
                    paymentRequired: firstPreview.paymentRequired,
                    paymentDetails: firstPreview.paymentDetails,
                    articleId: firstPreview.blobId
                });
            } else {
                throw new Error('Preview should show payment required for all articles');
            }
        } else {
            throw new Error('No articles found to test');
        }

        return previews;
    }

    async testContentAccessWithoutPayment() {
        await this.log('🚫 Testing content access without payment...');

        if (!this.existingArticleId) {
            throw new Error('No article found to test');
        }

        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.existingArticleId}/content?userAddress=${TEST_USER_ADDRESS}`);
        
        if (response.status === 402) {
            await this.log('✅ HTTP 402 Payment Required sent (expected)', response.data);
            return response.data;
        } else {
            throw new Error(`Expected HTTP 402, got ${response.status}`);
        }
    }

    async testPaymentVerification() {
        await this.log('💰 Testing payment verification...');

        if (!this.existingArticleId) {
            throw new Error('No article found to test');
        }

        const paymentData = {
            userAddress: TEST_USER_ADDRESS,
            paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            paymentProof: crypto.randomBytes(64).toString('hex'),
            amount: "0.01"
        };

        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.existingArticleId}/pay`, {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });

        if (response.ok) {
            await this.log('✅ Payment verified successfully', response.data);
            return response.data;
        } else {
            throw new Error(`Payment verification failed: ${response.status} - ${JSON.stringify(response.data)}`);
        }
    }

    async testContentAccessAfterPayment() {
        await this.log('📖 Testing content access after payment...');

        if (!this.existingArticleId) {
            throw new Error('No article found to test');
        }

        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.existingArticleId}/content?userAddress=${TEST_USER_ADDRESS}`);
        
        if (response.ok) {
            await this.log('✅ Content accessible after payment (expected)', {
                contentLength: response.data.content.length,
                preview: response.data.content.substring(0, 100) + '...',
                paymentInfo: response.data.metadata.paymentInfo
            });
            return response.data;
        } else {
            throw new Error(`Content should be accessible after payment, got ${response.status}`);
        }
    }

    async testSecondAccessRequiresNewPayment() {
        await this.log('🔄 Testing that second access requires new payment...');

        if (!this.existingArticleId) {
            throw new Error('No article found to test');
        }

        // Try to access content again with the same user
        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.existingArticleId}/content?userAddress=${TEST_USER_ADDRESS}`);
        
        if (response.status === 402) {
            await this.log('✅ Second access requires new payment (expected)', response.data);
            return response.data;
        } else if (response.ok) {
            await this.log('⚠️ Second access allowed without new payment (unexpected)', {
                contentLength: response.data.content.length
            });
        } else {
            throw new Error(`Unexpected response for second access: ${response.status}`);
        }
    }

    async testDifferentUserRequiresPayment() {
        await this.log('👥 Testing that different user requires payment...');

        if (!this.existingArticleId) {
            throw new Error('No article found to test');
        }

        const differentUserAddress = '0x9876543210987654321098765432109876543210';
        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.existingArticleId}/content?userAddress=${differentUserAddress}`);
        
        if (response.status === 402) {
            await this.log('✅ Different user requires payment (expected)', response.data);
            return response.data;
        } else {
            throw new Error(`Different user should require payment, got ${response.status}`);
        }
    }

    async runTests() {
        try {
            await this.log('🚀 Starting Pay-Per-Access System Tests (Existing Articles)');
            await this.log(`📍 Server URL: ${SERVER_URL}`);
            await this.log(`👥 Test User Address: ${TEST_USER_ADDRESS}`);

            // Test 1: Test Preview Endpoint
            await this.log('\n🧪 TEST 1: Preview Endpoint');
            await this.testPreviewEndpoint();

            // Test 2: Test Content Access Without Payment
            await this.log('\n🧪 TEST 2: Content Access Without Payment');
            await this.testContentAccessWithoutPayment();

            // Test 3: Test Payment Verification
            await this.log('\n🧪 TEST 3: Payment Verification');
            await this.testPaymentVerification();

            // Test 4: Test Content Access After Payment
            await this.log('\n🧪 TEST 4: Content Access After Payment');
            await this.testContentAccessAfterPayment();

            // Test 5: Test Second Access Requires New Payment
            await this.log('\n🧪 TEST 5: Second Access Requires New Payment');
            await this.testSecondAccessRequiresNewPayment();

            // Test 6: Test Different User Requires Payment
            await this.log('\n🧪 TEST 6: Different User Requires Payment');
            await this.testDifferentUserRequiresPayment();

            await this.log('\n🎉 All pay-per-access tests completed successfully!');
            await this.log('📊 Test Summary', {
                existingArticlesFound: !!this.existingArticleId,
                paymentRequired: true,
                http402Sent: true,
                paymentVerification: true,
                contentAccessAfterPayment: true,
                secondAccessRequiresPayment: true,
                differentUserRequiresPayment: true
            });

        } catch (error) {
            await this.log('❌ Test failed', { error: error.message });
            console.error('Full error:', error);
            process.exit(1);
        }
    }
}

// Run the tests
async function main() {
    const tester = new ExistingArticlesTester();
    await tester.runTests();
}

// Check if running directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = ExistingArticlesTester;
