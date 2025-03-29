"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useEdges } from "reactflow";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-gray-800 p-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex space-x-4">
          <Link
            href="/"
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              isActive("/")
                ? "bg-gray-900 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            Home
          </Link>
          <Link
            href="/playground"
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              isActive("/playground")
                ? "bg-gray-900 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            Playground
          </Link>
          <Link
            href="/settings"
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              isActive("/settings")
                ? "bg-gray-900 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
          >
            Settings
          </Link>
        </div>
        <WalletMultiButton className="wallet-custom" />
      </div>
    </nav>
  );
}
