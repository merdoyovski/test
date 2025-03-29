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

const SolanaWalletProvider: NextPage<SolanaWalletProviderProps> = ({
  children,
}) => {
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [new UnsafeBurnerWalletAdapter()],
    [], // Empty dependency array since nothing inside is changing
  );

  return (
    <ConnectionProvider
      endpoint={
        "https://boldest-sleek-fog.solana-mainnet.quiknode.pro/32241d86eca0b027514e5334dd5dff7009d091d4/"
      }
    >
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default SolanaWalletProvider;
