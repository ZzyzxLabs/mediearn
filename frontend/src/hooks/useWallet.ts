import { useState, useEffect, useCallback } from "react";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

export function useWallet() {
  const [address, setAddress] = useState("");
  const [coinbaseWallet, setCoinbaseWallet] =
    useState<CoinbaseWalletSDK | null>(null);

  useEffect(() => {
    const wallet = new CoinbaseWalletSDK({
      appName: "Mediearn",
      appLogoUrl: "/x402-icon-blue.png",
    });
    setCoinbaseWallet(wallet);
  }, []);

  const connectWallet = useCallback(async () => {
    if (!coinbaseWallet) return;

    const ethereum = coinbaseWallet.makeWeb3Provider();
    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);
    } catch (error) {
      console.error("Connection failed:", error);
    }
  }, [coinbaseWallet]);

  const disconnectWallet = useCallback(async () => {
    if (!coinbaseWallet) return;

    const ethereum = coinbaseWallet.makeWeb3Provider();
    ethereum.disconnect();
    setAddress("");
  }, [coinbaseWallet]);

  return {
    address,
    connectWallet,
    disconnectWallet,
  };
}
