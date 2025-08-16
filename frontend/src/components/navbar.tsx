"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PenSquare, Wallet, LogOut } from "lucide-react";
import Link from "next/link";
import { useWallet } from "@/hooks/useWallet";

export function Navbar() {
  const { address, connectWallet, disconnectWallet } = useWallet();

  return (
    <nav className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='w-full flex h-14 items-center justify-between px-6'>
        {/* Left side - Brand */}
        <div className='flex items-center'>
          <Link href='/' className='flex items-center'>
            <span className='font-bold text-xl'>Mediearn</span>
          </Link>
        </div>

        {/* Right side - Actions */}
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' size='sm' className='hidden sm:flex'>
            <PenSquare className='h-4 w-4 mr-2' />
            Write Post
          </Button>

          <Separator orientation='vertical' className='h-6 hidden sm:block' />

          <div>
            {address ? (
              <div className='flex items-center space-x-2'>
                <p>Connected: {address.slice(0, 6)}...</p>
                <Button variant='ghost' size='sm' onClick={disconnectWallet}>
                  <LogOut className='h-4 w-4' />
                </Button>
              </div>
            ) : (
              <Button variant='outline' size='sm' onClick={connectWallet}>
                <Wallet className='h-4 w-4 mr-2' />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
