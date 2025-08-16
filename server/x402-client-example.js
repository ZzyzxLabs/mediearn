#!/usr/bin/env node

/**
 * x402 Client Example for MedEarn Server
 * Demonstrates how to implement the x402 payment protocol
 */

const crypto = require('crypto');

// Configuration
const SERVER_URL = 'http://localhost:8000';
const TEST_USER_ADDRESS = '0x1234567890123456789012345678901234567890';

class X402Client {
    constructor(serverUrl, userAddress) {
        this.serverUrl = serverUrl;
        this.userAddress = userAddress;
        this.paymentHistory = new Map();
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

    // Get article previews
    async getArticlePreviews() {
        await this.log('📋 Fetching article previews...');
        
        const response = await this.makeRequest(`${this.serverUrl}/api/blobs/preview`);
        
        if (!response.ok) {
            throw new Error(`Failed to get previews: ${response.status}`);
        }

        const articles = response.data;
        await this.log('✅ Article previews retrieved', {
            totalArticles: articles.length,
            articles: articles.map(a => ({
                title: a.title,
                price: a.paymentDetails.price,
                currency: a.paymentDetails.currency
            }))
        });

        return articles;
    }

    // Attempt to access article content
    async accessArticle(blobId) {
        await this.log(`📖 Attempting to access article: ${blobId}`);
        
        const response = await this.makeRequest(
            `${this.serverUrl}/api/blobs/${blobId}/content?userAddress=${this.userAddress}`
        );

        if (response.status === 200) {
            // User has already paid, return content
            await this.log('✅ Content accessible (already paid)', {
                contentLength: response.data.content.length,
                preview: response.data.content.substring(0, 100) + '...'
            });
            return { success: true, content: response.data };
        } else if (response.status === 402) {
            // Payment required - this is the x402 protocol response
            await this.log('💰 HTTP 402 Payment Required (x402 protocol)', response.data);
            return { success: false, paymentRequired: true, paymentInfo: response.data };
        } else {
            throw new Error(`Unexpected response: ${response.status}`);
        }
    }

    // Handle x402 payment flow
    async handleX402Payment(blobId, paymentInfo) {
        await this.log('💳 Processing x402 payment...', {
            price: paymentInfo.paymentDetails.price,
            currency: paymentInfo.paymentDetails.currency,
            network: paymentInfo.paymentDetails.network
        });

        // Step 1: Create payment payload (this would come from the x402 client library)
        const paymentPayload = await this.createX402PaymentPayload(paymentInfo);
        
        // Step 2: Submit payment payload to server (server will call Coinbase facilitator)
        const paymentResponse = await this.makeRequest(`${this.serverUrl}/api/blobs/${blobId}/pay`, {
            method: 'POST',
            body: JSON.stringify({
                userAddress: this.userAddress,
                paymentPayload: paymentPayload
            })
        });

        if (paymentResponse.ok) {
            await this.log('✅ Payment verified by Coinbase facilitator', paymentResponse.data);
            
            // Record payment in local history
            this.paymentHistory.set(blobId, {
                paymentId: paymentResponse.data.paymentId,
                amount: paymentInfo.paymentDetails.price,
                timestamp: new Date().toISOString()
            });
            
            return { success: true, paymentData: paymentResponse.data };
        } else {
            throw new Error(`Payment verification failed: ${paymentResponse.status}`);
        }
    }

    // Create x402 payment payload (simulated - in real implementation this comes from x402 client library)
    async createX402PaymentPayload(paymentInfo) {
        await this.log('🔏 Creating x402 payment payload...');
        
        // In a real x402 implementation, this would:
        // 1. Use the x402 client library to create payment
        // 2. Handle wallet connection and signing
        // 3. Return the payment payload that gets sent to facilitator
        
        // For demonstration, we'll create a simulated payload
        const payload = {
            // This is what the x402 client library would generate
            paymentRequest: {
                amount: paymentInfo.paymentDetails.price,
                currency: paymentInfo.paymentDetails.currency,
                recipient: paymentInfo.paymentDetails.paymentAddress,
                asset: paymentInfo.paymentDetails.assetAddress,
                network: paymentInfo.paymentDetails.network,
                nonce: paymentInfo.paymentDetails.nonce,
                expiresAt: paymentInfo.paymentDetails.expiresAt
            },
            // Client signature and wallet info
            clientSignature: `0x${crypto.randomBytes(64).toString('hex')}`,
            walletAddress: this.userAddress,
            timestamp: Date.now()
        };
        
        await this.log('✅ x402 payment payload created (simulated)', {
            amount: payload.paymentRequest.amount,
            network: payload.paymentRequest.network,
            recipient: payload.paymentRequest.recipient.substring(0, 20) + '...'
        });
        
        return JSON.stringify(payload);
    }

    // Complete article access flow with x402
    async accessArticleWithX402(blobId) {
        try {
            await this.log(`🚀 Starting x402 article access flow for: ${blobId}`);
            
            // Step 1: Try to access content
            const accessResult = await this.accessArticle(blobId);
            
            if (accessResult.success) {
                // User has already paid, show content
                return accessResult;
            } else if (accessResult.paymentRequired) {
                // Step 2: Handle x402 payment
                const paymentResult = await this.handleX402Payment(blobId, accessResult.paymentInfo);
                
                if (paymentResult.success) {
                    // Step 3: Now try to access content again
                    const finalAccess = await this.accessArticle(blobId);
                    
                    if (finalAccess.success) {
                        await this.log('🎉 Article access successful after x402 payment!');
                        return finalAccess;
                    } else {
                        throw new Error('Content still not accessible after payment');
                    }
                } else {
                    throw new Error('Payment processing failed');
                }
            }
        } catch (error) {
            await this.log('❌ x402 article access failed', { error: error.message });
            throw error;
        }
    }

    // Get payment history
    getPaymentHistory() {
        const history = Array.from(this.paymentHistory.entries()).map(([blobId, payment]) => ({
            blobId,
            ...payment
        }));
        
        return history;
    }
}

// Example usage
async function demonstrateX402Flow() {
    const client = new X402Client(SERVER_URL, TEST_USER_ADDRESS);
    
    try {
        await client.log('🚀 Starting x402 Protocol Demonstration');
        await client.log(`📍 Server: ${SERVER_URL}`);
        await client.log(`👤 User: ${TEST_USER_ADDRESS}`);

        // Step 1: Get available articles
        const articles = await client.getArticlePreviews();
        
        if (articles.length === 0) {
            await client.log('⚠️ No articles available for testing');
            return;
        }

        // Step 2: Try to access the first article
        const firstArticle = articles[0];
        await client.log(`📖 Testing x402 flow with: ${firstArticle.title}`);
        
        const result = await client.accessArticleWithX402(firstArticle.blobId);
        
        if (result.success) {
            await client.log('✅ x402 flow completed successfully!', {
                contentLength: result.content.content.length,
                paymentHistory: client.getPaymentHistory()
            });
        }

    } catch (error) {
        await client.log('❌ x402 demonstration failed', { error: error.message });
        console.error('Full error:', error);
    }
}

// Run the demonstration
if (require.main === module) {
    demonstrateX402Flow().catch(console.error);
}

module.exports = X402Client;
