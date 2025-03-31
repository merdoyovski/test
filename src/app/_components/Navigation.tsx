"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { AIChatPopup } from "./AIChatPopup";

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
    <nav className="bg-gray-800 p-4 flex items-center justify-between">
      {/* Left side: bFlow */}
      <div className="flex-shrink-0">
        <Link
          href="/"
          className="rounded-md px-3 py-2 text-xl font-bold text-gray-100"
        >
          bFlow
        </Link>
      </div>
      {/* Right side: navigation links & wallet button */}
      <div className="flex items-center space-x-4">
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
        <AIChatPopup />
        <WalletMultiButton className="wallet-custom" />
      </div>
    </nav>
  );
}
