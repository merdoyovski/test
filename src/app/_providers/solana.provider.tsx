"use client";
import dynamic from "next/dynamic";
import React, { ReactNode, useMemo } from "react";
import { NextPage } from "next";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

type SolanaWalletProviderProps = {
  children: ReactNode;
};

const RPC_KEY = process.env.NEXT_PUBLIC_RPC_KEY || "";

const SolanaWalletProvider: NextPage<SolanaWalletProviderProps> = ({
  children,
}) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [],
    [], // Empty dependency array since nothing inside is changing
  );

  return (
    <ConnectionProvider endpoint={RPC_KEY}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;
