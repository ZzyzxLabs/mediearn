"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";
import { useAccount } from "wagmi";
import { getWalletClient } from "wagmi/actions";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";
import { createClient } from "viem";

const formSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    ),
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

export function UploadForm() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const { address, isConnected, connector, chainId } = useAccount();

  const config = createConfig({
    chains: [base, baseSepolia],
    client({ chain }) {
      return createClient({ chain, transport: http() });
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log("test started");
    setUploading(true);
    setMessage("");

    try {
      // Check if wallet is connected
      if (!isConnected || !address) {
        throw new Error("Please connect your wallet first");
      }

      // Read file content as text
      const content = await data.file.text();

      // Prepare upload data
      const uploadData = {
        title: data.title.trim(),
        content: content,
        ownerAddress: address,
        description: data.description || "",
      };

      const walletClient = await getWalletClient(config, {
        account: address,
        chainId: chainId,
        connector: connector,
      });

      if (!walletClient) {
        setMessage("Wallet client not available");
        return;
      }

      // Create fetchWithPayment wrapper using the wallet client
      const fetchWithPayment = wrapFetchWithPayment(
        fetch,
        walletClient as unknown as Parameters<typeof wrapFetchWithPayment>[1]
      );

      console.log("Making upload request with payment...", {
        url: "http://localhost:8000/api/upload",
        address,
        uploadData: {
          ...uploadData,
          content: `${uploadData.content.substring(0, 100)}...`,
        },
      });

      // Make the upload request with payment handling
      const response = await fetchWithPayment(
        "http://localhost:8000/api/upload",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(uploadData),
        }
      );

      console.log("Response received:", {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        // Handle 402 Payment Required specifically
        if (response.status === 402) {
          const errorData = await response.json();
          throw new Error(
            `Payment required: ${
              errorData.error || "Please complete payment to upload"
            }`
          );
        }

        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const result = await response.json();

      // Decode payment response if present
      const paymentResponseHeader = response.headers.get("x-payment-response");
      if (paymentResponseHeader) {
        try {
          const paymentResponse = decodeXPaymentResponse(paymentResponseHeader);
          console.log("Payment response:", paymentResponse);

          // Add payment info to success message
          if (result.success) {
            setMessage(
              `✅ Article uploaded successfully! Payment: ${
                paymentResponse.transaction || "Completed"
              }`
            );
          }
        } catch (paymentError) {
          console.error("Error decoding payment response:", paymentError);
          if (result.success) {
            setMessage("✅ Article uploaded successfully! (Payment completed)");
          }
        }
      } else if (result.success) {
        setMessage("✅ Article uploaded successfully!");
      }

      if (result.success) {
        // Reset form
        form.reset();
        // Reset file input
        const fileInput = document.getElementById(
          "file-input"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        setMessage(`❌ Upload failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error("Upload error:", error);

      // Handle specific payment errors
      if (error.response?.data?.error) {
        setMessage(`❌ Payment Error: ${error.response.data.error}`);
      } else {
        setMessage(
          `❌ Error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className='max-w-xl mx-auto p-6 border bg-card rounded-xl text-card-foreground shadow @container/card'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
          {/* File Upload */}
          <FormField
            control={form.control}
            name='file'
            render={({ field: { onChange, value, ...field } }) => (
              <FormItem>
                <FormLabel>Article File</FormLabel>
                <FormControl>
                  <Input
                    id='file-input'
                    type='file'
                    accept='.txt,.md,.pdf,.doc,.docx'
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        setMessage("");
                      }
                    }}
                    className='file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-primary/70 file:text-primary-foreground hover:file:bg-primary/90'
                    {...field}
                  />
                </FormControl>
                {value && (
                  <FormDescription>
                    Selected: {value.name} ({(value.size / 1024).toFixed(1)} KB)
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Title Input */}
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder='Enter article title' {...field} />
                </FormControl>
                <FormDescription>
                  A descriptive title for your article (max 100 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description Input */}
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Enter article description'
                    className='resize-none'
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Brief description of your article (max 500 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

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
          <Button type='submit' disabled={uploading} className='w-full'>
            {uploading ? "Uploading..." : "Upload Article ($0.01)"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
