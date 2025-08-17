"use client";

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
import {
  Wallet,
  RefreshCw,
  LogOut,
  ChevronDown,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

export default function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const SUPPORTED_NETWORKS = [
    {
      chainId: "0x1",
      name: "Ethereum",
      chain: base,
    },
    {
      chainId: "0x2105",
      name: "Base",
      chain: base,
    },
    {
      chainId: "0x14a34",
      name: "Base Sepolia",
      chain: baseSepolia,
    },
  ];

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      // Use the first available connector
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      } else {
        console.error("No connectors available");
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleNetworkChange = async (targetChainId: string) => {
    try {
      const chain = SUPPORTED_NETWORKS.find(
        (n) => n.chainId === targetChainId
      )?.chain;
      if (chain) {
        switchChain({ chainId: chain.id });
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
      } catch (error) {
        console.error("Failed to copy address:", error);
      }
    }
  };

  const getCurrentNetworkName = () => {
    const network = SUPPORTED_NETWORKS.find(
      (n) => n.chainId === chainId?.toString()
    );
    return network?.name || "Unknown";
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className='bg-blue-800 hover:bg-blue-900 text-white border border-blue-700 rounded-md px-3 py-2 text-sm font-medium transition-colors'
      >
        <Wallet className='h-4 w-4 mr-2' />
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>
    );
  }

  return (
    <div className='flex flex-col gap-2'>
      {/* Connected wallet info */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' className='flex items-center gap-2'>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
            <span className='text-sm'>{formatAddress(address || "")}</span>
            <ChevronDown className='h-3 w-3' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-64'>
          <DropdownMenuLabel className='flex items-center justify-between'>
            <span>Connected Wallet</span>
            <span className='text-xs text-muted-foreground'>
              {getCurrentNetworkName()}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Account info */}
          <div className='px-2 py-1'>
            <div className='text-sm font-mono'>{address}</div>
            <div className='text-xs text-muted-foreground mt-1'>
              Chain ID: {chainId}
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Actions */}
          <div className='px-2 py-1 space-y-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={copyAddress}
              className='w-full justify-start'
            >
              <Copy className='h-4 w-4 mr-2' />
              Copy Address
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDisconnect}
              className='w-full justify-start text-red-600 hover:text-red-700'
            >
              <LogOut className='h-4 w-4 mr-2' />
              Disconnect
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Network switching dropdown */}
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
            value={chainId?.toString() || ""}
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
    </div>
  );
}
