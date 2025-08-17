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
import { Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { base, baseSepolia, mainnet, flowTestnet } from "wagmi/chains";

export default function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const SUPPORTED_NETWORKS = [
    {
      chainId: 1,
      name: "Ethereum",
      chain: mainnet,
    },
    {
      chainId: 8453,
      name: "Base",
      chain: base,
    },
    {
      chainId: 84532,
      name: "Base Sepolia",
      chain: baseSepolia,
    },
    {
      chainId: 123,
      name: "Flow Testnet",
      chain: flowTestnet,
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
        (n) => n.chainId === parseInt(targetChainId)
      )?.chain;
      if (chain) {
        console.log(`Switching to network: ${chain.name} (${chain.id})`);
        switchChain({ chainId: chain.id });
      }
    } catch (error) {
      console.error("Failed to switch network:", error);
    }
  };

  const getCurrentNetworkName = () => {
    const network = SUPPORTED_NETWORKS.find((n) => n.chainId === chainId);
    return network?.name || "Unknown";
  };

  if (!isConnected) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        variant='outline'
        size='sm'
        className='text-sm'
      >
        {isConnecting ? "Connecting..." : "Connect"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='text-sm'>
          <Wallet className='h-4 w-4 mr-2' />
          {formatAddress(address || "")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-48' align='end'>
        {/* Network switching */}
        <DropdownMenuRadioGroup
          value={chainId?.toString() || ""}
          onValueChange={handleNetworkChange}
        >
          {SUPPORTED_NETWORKS.map((network) => (
            <DropdownMenuRadioItem
              key={network.chainId}
              value={network.chainId.toString()}
              disabled={isSwitching}
            >
              <div className='flex items-center gap-2'>{network.name}</div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Actions */}
        <div className='px-1 py-1'>
          <Button
            variant='outline'
            size='sm'
            onClick={handleDisconnect}
            className='w-full justify-start text-xs h-8 text-red-600 hover:text-red-700'
          >
            Disconnect
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
