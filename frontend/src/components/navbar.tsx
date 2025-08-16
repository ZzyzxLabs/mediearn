"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PenSquare, Wallet, LogOut } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useEffect, useState } from "react";
import ConnectButton from "./connectButton";

export function Navbar() {
  const [serverStatus, setServerStatus] = useState<string>("");

  // Test server connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        const health = await apiClient.checkHealth();
        setServerStatus("🟢 Connected");
        console.log("Server health:", health);
      } catch (error) {
        setServerStatus("🔴 Disconnected");
        console.error("Server connection failed:", error);
      }
    };

    testConnection();
  }, []);

  return (
    <nav className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='w-full flex h-14 items-center justify-between px-6'>
        {/* Left side - Brand */}
        <div className='flex items-center'>
          <Link href='/' className='flex items-center'>
            <span className='font-bold text-xl'>Mediearn</span>
          </Link>
          {serverStatus && (
            <span className='ml-4 text-sm text-muted-foreground'>
              {serverStatus}
            </span>
          )}
        </div>

        {/* Right side - Actions */}
        <div className='flex items-center space-x-4'>
          <Link href='/upload'>
            <Button variant='ghost' size='sm' className='hidden sm:flex'>
              <PenSquare className='h-4 w-4 mr-2' />
              Write Post
            </Button>
          </Link>

          <Separator orientation='vertical' className='h-6 hidden sm:block' />

          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}
