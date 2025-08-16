"use client";

import { ethereum, web3 } from "@/lib/coinbase";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useState, useEffect } from "react";

export default function ConnectButton() {
  const [address, setAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string>("");

  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const accounts = (await ethereum.request({
          method: "eth_accounts",
        })) as string[];

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);

          // Get current chain ID
          const chainId = (await ethereum.request({
            method: "eth_chainId",
          })) as string;
          console.log("Retrieved chainId:", chainId);
          setCurrentChainId(chainId);
        }
      } catch (error) {
        console.error("Failed to check connection:", error);
      }
    };

    checkConnection();
  }, []);

  const connectWallet = async () => {
    try {
      // EIP-1102 style request
      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);
        console.log("User's address:", accounts[0]);

        // Get current chain ID
        const chainId = (await ethereum.request({
          method: "eth_chainId",
        })) as string;
        setCurrentChainId(chainId);

        // Optionally set the default account for web3.js
        web3.eth.defaultAccount = accounts[0];
      }
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const disconnectWallet = () => {
    if (!ethereum) return;

    try {
      // Try to disconnect using the ethereum provider
      if (ethereum.disconnect && typeof ethereum.disconnect === "function") {
        ethereum.disconnect();
      }

      // Reset local state
      setAddress("");
      setIsConnected(false);
      setCurrentChainId("");

      console.log("Wallet disconnected");
    } catch (error) {
      console.error("Disconnect failed:", error);
      // Still reset local state even if disconnect fails
      setAddress("");
      setIsConnected(false);
      setCurrentChainId("");
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (chainId: string) => {
    const normalizedChainId = chainId.toLowerCase();

    const networkMap: { [key: string]: string } = {
      "0x1": "Ethereum",
      "0x2105": "Base",
      "0x14a34": "Base Sepolia",
      "0x89": "Polygon",
      "0xa4b1": "Arbitrum",
      "0xa": "Optimism",
      "0x5": "Goerli",
      "0xaa36a7": "Sepolia",
    };

    const networkName = networkMap[normalizedChainId];

    return networkName || `Chain ${chainId}`;
  };

  return (
    <div className='flex flex-col gap-2'>
      <Button
        onClick={isConnected ? disconnectWallet : connectWallet}
        variant='outline'
        size='sm'
      >
        <Wallet className='h-4 w-4 mr-2' />
        {isConnected ? formatAddress(address) : "Connect Wallet"}
      </Button>

      {isConnected && currentChainId && (
        <div className='text-xs text-muted-foreground'>
          Network: {getNetworkName(currentChainId)}
        </div>
      )}
    </div>
  );
}
