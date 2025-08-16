"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { apiClient, ArticleMetadata } from "@/lib/api";
import {
  uploadTransactionManager,
  BASE_SEPOLIA_CONFIG,
} from "@/lib/transactions";
import { web3 } from "@/lib/coinbase";

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("medical");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage("");
    }
  };

  const checkNetworkAndBalance = async () => {
    try {
      // Check if wallet is connected
      const accounts = await web3.eth.getAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("Please connect your wallet first");
      }

      const userAddress = accounts[0];

      // Check if on correct network
      const chainId = await web3.eth.getChainId();
      const expectedChainId = parseInt(BASE_SEPOLIA_CONFIG.chainId, 16);
      if (chainId !== BigInt(expectedChainId)) {
        throw new Error(
          `Please switch to ${BASE_SEPOLIA_CONFIG.chainName} network`
        );
      }

      // Check user balance
      const balanceInfo = await uploadTransactionManager.checkUserBalance(
        userAddress
      );
      if (!balanceInfo.hasEnoughBalance) {
        throw new Error(
          `Insufficient balance. You have ${balanceInfo.balance} ETH, but need ${balanceInfo.requiredFee} ETH for upload`
        );
      }

      return userAddress;
    } catch (error) {
      throw error;
    }
  };

  const processPayment = async (userAddress: string) => {
    try {
      setProcessingPayment(true);
      setMessage("Processing payment...");

      // Create file hash (simple hash for demo - in production use proper hashing)
      const fileHash = `${file?.name}-${Date.now()}`;

      const paymentResult =
        await uploadTransactionManager.sendUploadTransaction({
          fileHash,
          fileName: file?.name || "",
          userAddress,
        });

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || "Payment failed");
      }

      setMessage(
        `✅ Payment successful! Transaction: ${paymentResult.transactionHash}`
      );
      return paymentResult.transactionHash;
    } catch (error) {
      throw error;
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage("Please select a file");
      return;
    }

    if (!title.trim()) {
      setMessage("Please enter a title");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // Step 1: Check network and balance
      const userAddress = await checkNetworkAndBalance();

      // Step 2: Process payment
      const transactionHash = await processPayment(userAddress);

      // Step 3: Upload file to server
      setMessage("Payment successful! Uploading file...");

      const metadata: ArticleMetadata = {
        title: title.trim(),
        description: description.trim(),
        category: category,
      };

      const result = await apiClient.uploadArticle(file, metadata);

      if (result.success) {
        setMessage(
          `✅ Article uploaded successfully! Payment: ${transactionHash}`
        );
        // Reset form
        setFile(null);
        setTitle("");
        setDescription("");
        setCategory("medical");
        // Reset file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setMessage(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(
        `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-6'>Upload Article</h2>

      {/* Payment Info */}
      <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
        <h3 className='font-semibold text-blue-900 mb-2'>Upload Fee</h3>
        <p className='text-sm text-blue-700'>
          Upload fee: 0.001 ETH on Base Sepolia network
        </p>
        <p className='text-xs text-blue-600 mt-1'>
          Make sure your wallet is connected and you have sufficient balance
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* File Upload */}
        <div>
          <label
            htmlFor='file-input'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Article File
          </label>
          <input
            id='file-input'
            type='file'
            onChange={handleFileChange}
            accept='.txt,.md,.pdf,.doc,.docx'
            className='block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
          />
          {file && (
            <p className='mt-1 text-sm text-gray-600'>
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>

        {/* Title Input */}
        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Title *
          </label>
          <input
            id='title'
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Enter article title'
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            required
          />
        </div>

        {/* Description Input */}
        <div>
          <label
            htmlFor='description'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Description
          </label>
          <textarea
            id='description'
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='Enter article description'
            rows={3}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
        </div>

        {/* Category Select */}
        <div>
          <label
            htmlFor='category'
            className='block text-sm font-medium text-gray-700 mb-2'
          >
            Category
          </label>
          <select
            id='category'
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          >
            <option value='medical'>Medical</option>
            <option value='research'>Research</option>
            <option value='education'>Education</option>
            <option value='technology'>Technology</option>
            <option value='other'>Other</option>
          </select>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`p-3 rounded-md ${
              message.includes("✅")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Submit Button */}
        <Button
          type='submit'
          disabled={uploading || processingPayment || !file || !title.trim()}
          className='w-full'
        >
          {processingPayment
            ? "Processing Payment..."
            : uploading
            ? "Uploading..."
            : "Upload Article (0.001 ETH)"}
        </Button>
      </form>
    </div>
  );
}
