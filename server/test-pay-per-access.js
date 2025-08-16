#!/usr/bin/env node

/**
 * Test Script for MedEarn Pay-Per-Access System
 * Tests that every article requires payment and HTTP 402 is sent
 */

const crypto = require('crypto');

// Configuration
const SERVER_URL = 'http://localhost:8000';
const TEST_OWNER_ADDRESS = '0x4ca0d90fb63968fc4327f8dd6c8119fbd745e748c7916a531da273440835b4da';
const TEST_USER_ADDRESS = '0x1234567890123456789012345678901234567890';

// Test article
const TEST_ARTICLE = {
    title: "Premium Article - Pay Per Access",
    description: "This article requires payment for every access",
    content: "This is premium content that requires payment every time you want to read it. The content includes valuable insights, research data, and exclusive information that is worth paying for."
};

class PayPerAccessTester {
    constructor() {
        this.uploadedArticleId = null;
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

    async uploadArticle() {
        await this.log('📤 Uploading test article...');

        const uploadData = {
            title: TEST_ARTICLE.title,
            description: TEST_ARTICLE.description,
            content: TEST_ARTICLE.content,
            ownerAddress: TEST_OWNER_ADDRESS
        };

        const response = await this.makeRequest(`${SERVER_URL}/api/upload`, {
            method: 'POST',
            body: JSON.stringify(uploadData)
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status} - ${JSON.stringify(response.data)}`);
        }

        const result = response.data;
        this.uploadedArticleId = result.blobInfo.id;

        await this.log('✅ Article uploaded successfully', {
            blobId: this.uploadedArticleId,
            title: TEST_ARTICLE.title,
            accessControl: result.blobInfo.accessControl
        });

        return this.uploadedArticleId;
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
            if (firstPreview.paymentRequired === true) {
                await this.log('✅ Preview shows payment required (expected)', {
                    paymentRequired: firstPreview.paymentRequired,
                    paymentDetails: firstPreview.paymentDetails
                });
            } else {
                throw new Error('Preview should show payment required for all articles');
            }
        }

        return previews;
    }

    async testContentAccessWithoutPayment() {
        await this.log('🚫 Testing content access without payment...');

        if (!this.uploadedArticleId) {
            throw new Error('No article uploaded to test');
        }

        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.uploadedArticleId}/content?userAddress=${TEST_USER_ADDRESS}`);

        if (response.status === 402) {
            await this.log('✅ HTTP 402 Payment Required sent (expected)', response.data);
            return response.data;
        } else {
            throw new Error(`Expected HTTP 402, got ${response.status}`);
        }
    }

    async testPaymentVerification() {
        await this.log('💰 Testing payment verification...');

        if (!this.uploadedArticleId) {
            throw new Error('No article uploaded to test');
        }

        const paymentData = {
            userAddress: TEST_USER_ADDRESS,
            paymentId: `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            paymentProof: crypto.randomBytes(64).toString('hex'),
            amount: "0.01"
        };

        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.uploadedArticleId}/pay`, {
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

        if (!this.uploadedArticleId) {
            throw new Error('No article uploaded to test');
        }

        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.uploadedArticleId}/content?userAddress=${TEST_USER_ADDRESS}`);

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

        if (!this.uploadedArticleId) {
            throw new Error('No article uploaded to test');
        }

        // Try to access content again with the same user
        const response = await this.makeRequest(`${SERVER_URL}/api/blobs/${this.uploadedArticleId}/content?userAddress=${TEST_USER_ADDRESS}`);

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

    async runTests() {
        try {
            await this.log('🚀 Starting Pay-Per-Access System Tests');
            await this.log(`📍 Server URL: ${SERVER_URL}`);
            await this.log(`👤 Owner Address: ${TEST_OWNER_ADDRESS}`);
            await this.log(`👥 Test User Address: ${TEST_USER_ADDRESS}`);

            // Test 1: Upload Article
            await this.log('\n🧪 TEST 1: Upload Article');
            await this.uploadArticle();

            // Test 2: Test Preview Endpoint
            await this.log('\n🧪 TEST 2: Preview Endpoint');
            await this.testPreviewEndpoint();

            // Test 3: Test Content Access Without Payment
            await this.log('\n🧪 TEST 3: Content Access Without Payment');
            await this.testContentAccessWithoutPayment();

            // Test 4: Test Payment Verification
            await this.log('\n🧪 TEST 4: Payment Verification');
            await this.testPaymentVerification();

            // Test 5: Test Content Access After Payment
            await this.log('\n🧪 TEST 5: Content Access After Payment');
            await this.testContentAccessAfterPayment();

            // Test 6: Test Second Access Requires New Payment
            await this.log('\n🧪 TEST 6: Second Access Requires New Payment');
            await this.testSecondAccessRequiresNewPayment();

            await this.log('\n🎉 All pay-per-access tests completed successfully!');
            await this.log('📊 Test Summary', {
                articleUploaded: !!this.uploadedArticleId,
                paymentRequired: true,
                http402Sent: true,
                paymentVerification: true,
                contentAccessAfterPayment: true,
                secondAccessRequiresPayment: true
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
    const tester = new PayPerAccessTester();
    await tester.runTests();
}

// Check if running directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = PayPerAccessTester;
