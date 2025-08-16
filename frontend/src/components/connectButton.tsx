"use client";

import { ethereum, web3 } from "@/lib/coinbase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, RefreshCw, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface Network {
  chainId: string;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
}

const SUPPORTED_NETWORKS: Network[] = [
  {
    chainId: "0x1",
    name: "Ethereum",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
  },
  {
    chainId: "0x2105",
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
  },
  {
    chainId: "0x14a34",
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
  },
];

export default function ConnectButton() {
  const [address, setAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<string>("");
  const [isSwitching, setIsSwitching] = useState(false);

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
      ethereum.disconnect();

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

  const switchNetwork = async (targetNetwork: Network) => {
    if (!ethereum) return;

    setIsSwitching(true);

    try {
      // Try to switch to the target network
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: targetNetwork.chainId }],
      });

      // Update the current chain ID
      setCurrentChainId(targetNetwork.chainId);
      console.log(`Switched to ${targetNetwork.name}`);
    } catch (switchError: unknown) {
      // This error code indicates that the chain has not been added to MetaMask
      if (
        switchError &&
        typeof switchError === "object" &&
        "code" in switchError &&
        switchError.code === 4902
      ) {
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
          setCurrentChainId(targetNetwork.chainId);
          console.log(`Added and switched to ${targetNetwork.name}`);
        } catch (addError) {
          console.error("Failed to add network:", addError);
        }
      } else {
        console.error("Failed to switch network:", switchError);
      }
    } finally {
      setIsSwitching(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (chainId: string) => {
    const normalizedChainId = chainId.toLowerCase();
    const network = SUPPORTED_NETWORKS.find(
      (n) => n.chainId.toLowerCase() === normalizedChainId
    );
    return network ? network.name : `Chain ${chainId}`;
  };

  const getCurrentNetwork = () => {
    return SUPPORTED_NETWORKS.find(
      (n) => n.chainId.toLowerCase() === currentChainId.toLowerCase()
    );
  };

  const handleNetworkChange = (chainId: string) => {
    const targetNetwork = SUPPORTED_NETWORKS.find(
      (n) => n.chainId.toLowerCase() === chainId.toLowerCase()
    );
    if (targetNetwork) {
      switchNetwork(targetNetwork);
    }
  };

  return (
    <div className='flex flex-col gap-2'>
      {!isConnected ? (
        <Button onClick={connectWallet} variant='outline' size='sm'>
          <Wallet className='h-4 w-4 mr-2' />
          Connect Wallet
        </Button>
      ) : (
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' className='flex-1'>
            <Wallet className='h-4 w-4 mr-2' />
            {formatAddress(address)}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                disabled={isSwitching}
                title='Switch Network'
                className='flex items-center gap-1'
              >
                <RefreshCw
                  className={`h-4 w-4 ${isSwitching ? "animate-spin" : ""}`}
                />
                <ChevronDown className='h-3 w-3' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56'>
              <DropdownMenuLabel>Select Network</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={currentChainId}
                onValueChange={handleNetworkChange}
              >
                {SUPPORTED_NETWORKS.map((network) => (
                  <DropdownMenuRadioItem
                    key={network.chainId}
                    value={network.chainId}
                    disabled={isSwitching}
                  >
                    {network.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={disconnectWallet}
            variant='outline'
            size='sm'
            title='Disconnect'
          >
            <LogOut className='h-4 w-4' />
          </Button>
        </div>
      )}
    </div>
  );
}
