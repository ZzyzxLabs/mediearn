"use client";

import { createWalletClient, custom } from "viem";
import { mainnet, base, baseSepolia } from "viem/chains";
import { useState, useEffect } from "react";

export interface Network {
  chainId: string;
  name: string;
  chain: any;
  rpcUrl: string;
  blockExplorer: string;
}

export const SUPPORTED_NETWORKS: Network[] = [
  {
    chainId: "0x1",
    name: "Ethereum",
    chain: mainnet,
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
  },
  {
    chainId: "0x2105",
    name: "Base",
    chain: base,
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
  },
  {
    chainId: "0x14a34",
    name: "Base Sepolia",
    chain: baseSepolia,
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
];

// Check if window.ethereum is available
const getEthereum = () => {
  if (typeof window !== "undefined" && window.ethereum) {
    return window.ethereum;
  }
  return null;
};

// Create wallet client
export const createViemWalletClient = () => {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("No Ethereum provider found");
  }

  return createWalletClient({
    transport: custom(ethereum),
  });
};

// Hook for wallet state management
export const useWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const connect = async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error("No Ethereum provider found");
    }

    setIsConnecting(true);
    try {
      // Request account access
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];

      // Get current chain ID
      const chainId = await ethereum.request({ method: "eth_chainId" });

      setAccount(account);
      setChainId(chainId);
      setIsConnected(true);

      return account;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
  };

  const switchNetwork = async (targetChainId: string) => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error("No Ethereum provider found");
    }

    try {
      // Try to switch to the target network
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetChainId }],
      });

      setChainId(targetChainId);
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        const targetNetwork = SUPPORTED_NETWORKS.find(
          (n) => n.chainId.toLowerCase() === targetChainId.toLowerCase()
        );

        if (targetNetwork) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: targetNetwork.chainId,
                  chainName: targetNetwork.name,
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: [targetNetwork.rpcUrl],
                  blockExplorerUrls: [targetNetwork.blockExplorer],
                },
              ],
            });
            setChainId(targetChainId);
            return true;
          } catch (addError) {
            console.error("Failed to add network:", addError);
            throw addError;
          }
        }
      }
      throw switchError;
    }
  };

  // Listen for account changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(chainId);
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    // Check if already connected
    ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
      }
    });

    ethereum.request({ method: "eth_chainId" }).then((chainId: string) => {
      setChainId(chainId);
    });

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  return {
    account,
    chainId,
    isConnecting,
    isConnected,
    connect,
    disconnect,
    switchNetwork,
  };
};
