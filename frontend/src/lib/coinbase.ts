// lib/coinbase.ts
"use client"; // ensures this only runs on client side

import CoinbaseWalletSDK from "@coinbase/wallet-sdk";
import Web3 from "web3";

const APP_NAME = "My Awesome App";
const APP_LOGO_URL = "https://example.com/logo.png";
const APP_SUPPORTED_CHAIN_IDS: number[] = [8453, 84532];

// Initialize Coinbase Wallet SDK
export const coinbaseWallet = new CoinbaseWalletSDK({
  appName: APP_NAME,
  appLogoUrl: APP_LOGO_URL,
  appChainIds: APP_SUPPORTED_CHAIN_IDS,
});

// Initialize a Web3 Provider object
export const ethereum = coinbaseWallet.makeWeb3Provider();

// Initialize a Web3 object
export const web3 = new Web3(ethereum as any);
