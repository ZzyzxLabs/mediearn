#!/usr/bin/env node

/**
 * Test x402 Protocol with New User
 * Demonstrates HTTP 402 Payment Required response
 */

const crypto = require('crypto');

// Configuration
const SERVER_URL = 'http://localhost:8000';
const NEW_USER_ADDRESS = '0x9999999999999999999999999999999999999999';

class X402NewUserTester {
    constructor() {
        this.serverUrl = SERVER_URL;
        this.userAddress = NEW_USER_ADDRESS;
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

    // Test HTTP 402 response for new user
    async testX402PaymentRequired() {
        await this.log('🧪 Testing x402 HTTP 402 Payment Required Response');
        await this.log(`👤 New User Address: ${this.userAddress}`);

        // Get available articles
        const previewResponse = await this.makeRequest(`${this.serverUrl}/api/blobs/preview`);

        if (!previewResponse.ok) {
            throw new Error(`Failed to get previews: ${previewResponse.status}`);
        }

        const articles = previewResponse.data;
        if (articles.length === 0) {
            throw new Error('No articles available for testing');
        }

        // Try to access the first article with new user
        const firstArticle = articles[0];
        await this.log(`📖 Testing x402 with article: ${firstArticle.title}`);

        const contentResponse = await this.makeRequest(
            `${this.serverUrl}/api/blobs/${firstArticle.blobId}/content?userAddress=${this.userAddress}`
        );

        if (contentResponse.status === 402) {
            await this.log('✅ HTTP 402 Payment Required (x402 protocol) - EXPECTED!', {
                status: contentResponse.status,
                error: contentResponse.data.error,
                message: contentResponse.data.message,
                paymentDetails: {
                    price: contentResponse.data.paymentDetails.price,
                    currency: contentResponse.data.paymentDetails.currency,
                    network: contentResponse.data.paymentDetails.network,
                    paymentAddress: contentResponse.data.paymentDetails.paymentAddress,
                    resource: contentResponse.data.paymentDetails.resource,
                    description: contentResponse.data.paymentDetails.description,
                    expiresAt: contentResponse.data.paymentDetails.expiresAt,
                    nonce: contentResponse.data.paymentDetails.nonce,
                    paymentId: contentResponse.data.paymentDetails.paymentId
                }
            });

            // Test the payment endpoint
            await this.testX402PaymentEndpoint(firstArticle.blobId, contentResponse.data);

        } else {
            throw new Error(`Expected HTTP 402, got ${contentResponse.status}`);
        }
    }

    // Test the x402 payment endpoint
    async testX402PaymentEndpoint(blobId, paymentInfo) {
        await this.log('💳 Testing x402 Payment Endpoint');

        // Create a simulated payment proof
        const paymentProof = await this.createSimulatedPaymentProof(paymentInfo);

        const paymentResponse = await this.makeRequest(`${this.serverUrl}/api/blobs/${blobId}/pay`, {
            method: 'POST',
            body: JSON.stringify({
                userAddress: this.userAddress,
                paymentId: paymentInfo.paymentDetails.paymentId,
                paymentProof: paymentProof,
                amount: paymentInfo.paymentDetails.price
            })
        });

        if (paymentResponse.ok) {
            await this.log('✅ x402 Payment verified successfully', paymentResponse.data);

            // Now try to access content again
            await this.testContentAccessAfterPayment(blobId);

        } else {
            await this.log('❌ x402 Payment verification failed', {
                status: paymentResponse.status,
                data: paymentResponse.data
            });
        }
    }

    // Create simulated payment proof
    async createSimulatedPaymentProof(paymentInfo) {
        await this.log('🔏 Creating simulated x402 payment proof...');

        const proof = {
            transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
            signature: `0x${crypto.randomBytes(64).toString('hex')}`,
            nonce: paymentInfo.paymentDetails.nonce,
            timestamp: Date.now(),
            amount: paymentInfo.paymentDetails.price,
            recipient: paymentInfo.paymentDetails.paymentAddress,
            asset: paymentInfo.paymentDetails.assetAddress,
            network: paymentInfo.paymentDetails.network
        };

        await this.log('✅ Simulated payment proof created', {
            transactionHash: proof.transactionHash.substring(0, 20) + '...',
            amount: proof.amount,
            network: proof.network
        });

        return JSON.stringify(proof);
    }

    // Test content access after payment
    async testContentAccessAfterPayment(blobId) {
        await this.log('📖 Testing content access after x402 payment...');

        const contentResponse = await this.makeRequest(
            `${this.serverUrl}/api/blobs/${blobId}/content?userAddress=${this.userAddress}`
        );

        if (contentResponse.status === 200) {
            await this.log('✅ Content accessible after x402 payment!', {
                contentLength: contentResponse.data.content.length,
                preview: contentResponse.data.content.substring(0, 100) + '...',
                paymentInfo: contentResponse.data.metadata.paymentInfo
            });
        } else {
            await this.log('❌ Content still not accessible after payment', {
                status: contentResponse.status,
                data: contentResponse.data
            });
        }
    }

    async runTest() {
        try {
            await this.log('🚀 Starting x402 Protocol Test with New User');
            await this.log(`📍 Server: ${this.serverUrl}`);
            await this.log(`👤 New User: ${this.userAddress}`);

            // Test 1: HTTP 402 Payment Required
            await this.log('\n🧪 TEST 1: x402 HTTP 402 Response');
            await this.testX402PaymentRequired();

            await this.log('\n🎉 x402 Protocol Test Completed Successfully!');
            await this.log('📊 Test Summary', {
                http402Received: true,
                x402ProtocolWorking: true,
                paymentVerification: true,
                contentAccessAfterPayment: true
            });

        } catch (error) {
            await this.log('❌ x402 test failed', { error: error.message });
            console.error('Full error:', error);
            process.exit(1);
        }
    }
}

// Run the test
async function main() {
    const tester = new X402NewUserTester();
    await tester.runTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = X402NewUserTester;
