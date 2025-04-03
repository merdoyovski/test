"use client";
import { useState, useEffect, useRef } from "react";
import {
  IconHome2,
  IconCode,
  IconSettings,
  IconLogout,
  IconWallet,
  IconRobot,
  IconX,
} from "@tabler/icons-react";
import {
  Center,
  Stack,
  Tooltip,
  UnstyledButton,
  Text,
  Modal,
  Button,
} from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { P5Sketch } from "./P5Sketch";
import { useDisclosure } from "@mantine/hooks";
import AIChatPop from "./AIChatPop";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

// Dynamically import the WalletMultiButton to avoid SSR issues
const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

interface NavbarLinkProps {
  icon: typeof IconHome2;
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

function NavbarLink({
  icon: Icon,
  label,
  href,
  active,
  onClick,
}: NavbarLinkProps) {
  return (
    <Tooltip
      label={label}
      position="right"
      transitionProps={{ transition: "slide-left", duration: 200 }}
    >
      <UnstyledButton
        component={Link}
        href={href}
        onClick={onClick}
        className={`flex h-[50px] w-[50px] items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-50 ${
          active ? "bg-blue-50 text-blue-700" : ""
        }`}
        data-active={active || undefined}
      >
        <Icon stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
}

const mockdata = [
  { icon: IconHome2, label: "Home", href: "/" },
  { icon: IconCode, label: "Playground", href: "/playground" },
  { icon: IconSettings, label: "Settings", href: "/settings" },
];

// Add a new component for displaying SOL balance
function BalanceDisplay() {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [solBalance, setSolBalance] = useState<number | null>(null);

  // Fetch and update SOL balance
  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }

    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / 1_000_000_000); // Convert lamports to SOL
      } catch (error) {
        console.error("Error fetching balance:", error);
        setSolBalance(null);
      }
    };

    fetchBalance();

    // Set up a balance refresh interval
    const intervalId = setInterval(fetchBalance, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  // Only show balance when connected
  if (solBalance === null) return null;

  return (
    <Tooltip
      label="SOL Balance"
      position="right"
      transitionProps={{ transition: "slide-left", duration: 200 }}
    >
      <div className="flex h-[50px] w-[50px] cursor-default items-center justify-center rounded-md bg-gray-50 text-gray-700">
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium">{solBalance.toFixed(2)}</span>
          <span className="text-[10px] text-gray-500">SOL</span>
        </div>
      </div>
    </Tooltip>
  );
}

// Update the WalletDropdown component to remove the balance display above the wallet icon
function WalletDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const [walletText, setWalletText] = useState("Connect");
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0 });

  // Update wallet text and fetch SOL balance based on connection status
  useEffect(() => {
    if (!publicKey) {
      setWalletText("Connect");
      setSolBalance(null);
      return;
    }

    setWalletText(
      publicKey.toBase58().slice(0, 4) + "..." + publicKey.toBase58().slice(-4),
    );

    // Fetch SOL balance
    const fetchBalance = async () => {
      try {
        const balance = await connection.getBalance(publicKey);
        setSolBalance(balance / 1_000_000_000); // Convert lamports to SOL
      } catch (error) {
        console.error("Error fetching balance:", error);
        setSolBalance(null);
      }
    };

    fetchBalance();

    // Set up a balance refresh interval
    const intervalId = setInterval(fetchBalance, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, [publicKey, connection]);

  // Update dropdown position based on button position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({ top: rect.top });
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <Tooltip
        label="Wallet"
        position="right"
        transitionProps={{ transition: "slide-left", duration: 200 }}
        disabled={isOpen}
      >
        <UnstyledButton
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex h-[50px] w-[50px] items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-50 ${
            isOpen ? "bg-blue-50 text-blue-700" : ""
          }`}
        >
          <IconWallet stroke={1.5} />
        </UnstyledButton>
      </Tooltip>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{
              type: "spring",
              duration: 0.2,
              stiffness: 300,
              damping: 20,
            }}
            className="fixed left-24 z-[1000] w-64 origin-top-left overflow-visible rounded-lg bg-white p-2 shadow-lg"
            style={{ top: dropdownPosition.top }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-md bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-medium text-gray-700">
                  {walletText}
                  {solBalance !== null && (
                    <div className="mt-1 text-xs font-normal text-gray-500">
                      {solBalance.toFixed(4)} SOL
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <IconX size={16} />
                </button>
              </div>
              <WalletMultiButton className="!h-10 !w-full !justify-center !rounded-md !bg-blue-600 !py-2 !text-sm !text-white hover:!bg-blue-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NavbarMinimal() {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const [chatOpened, { open: openChat, close: closeChat }] =
    useDisclosure(false);

  // Define colors, speeds, and background colors for different pages
  const getPageConfig = (path: string) => {
    switch (path) {
      case "/":
        return {
          color: "#4ade80", // Light green particles
          speed: 1,
          backgroundColor: "#12121233", // Charcoal gray with 20% opacity
          borderColor: "border-[#4ade80]", // Light green border
        };
      case "/playground":
        return {
          color: "#60a5fa", // Light blue particles
          speed: 1.5,
          backgroundColor: "#12121233", // Charcoal gray with 20% opacity
          borderColor: "border-[#60a5fa]", // Light blue border
        };
      case "/settings":
        return {
          color: "#f472b6", // Light pink particles
          speed: 0.8,
          backgroundColor: "#12121233", // Charcoal gray with 20% opacity
          borderColor: "border-[#f472b6]", // Light pink border
        };
      case "/wallet":
        return {
          color: "#fbbf24", // Light yellow particles
          speed: 1.2,
          backgroundColor: "#12121233", // Charcoal gray with 20% opacity
          borderColor: "border-[#fbbf24]", // Light yellow border
        };
      case "/chat":
        return {
          color: "#a78bfa", // Light purple particles
          speed: 1.3,
          backgroundColor: "#12121233", // Charcoal gray with 20% opacity
          borderColor: "border-[#a78bfa]", // Light purple border
        };
      default:
        return {
          color: "#4ade80", // Light green particles
          speed: 1,
          backgroundColor: "#12121233", // Charcoal gray with 20% opacity
          borderColor: "border-[#4ade80]", // Light green border
        };
    }
  };

  const currentConfig = getPageConfig(pathname);

  const links = mockdata.map((link) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={link.href === active}
      onClick={() => {
        setActive(link.href);
      }}
    />
  ));

  return (
    <div className={`flex h-screen border-r-4 border-charcoal-gray`}>
      <div
        className={`flex w-6 items-center justify-center ${currentConfig.borderColor.replace("border", "bg")}`}
      >
        <P5Sketch
          color={currentConfig.color}
          speed={currentConfig.speed}
          backgroundColor={currentConfig.backgroundColor}
        />
      </div>
      <nav className="flex w-20 flex-col bg-white p-4 pt-0">
        <div className="mt-1 flex flex-1 flex-col gap-4">
          <Text fw={700} size="lg" ta="center" className="mb-4">
            bFlow
          </Text>
          <Stack gap="md" justify="center">
            {links}
          </Stack>
        </div>

        <Stack gap="md" justify="center">
          <BalanceDisplay />
          <WalletDropdown />

          <NavbarLink
            icon={IconLogout}
            label="Logout"
            href="/logout"
            active={pathname === "/logout"}
            onClick={() => setActive("/logout")}
          />
        </Stack>
      </nav>
    </div>
  );
}

export default NavbarMinimal;
