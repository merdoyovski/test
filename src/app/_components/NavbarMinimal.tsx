"use client";
import { useState } from "react";
import {
  IconHome2,
  IconCode,
  IconSettings,
  IconLogout,
  IconWallet,
  IconRobot,
} from "@tabler/icons-react";
import { Center, Stack, Tooltip, UnstyledButton, Text, Modal, Button } from "@mantine/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { P5Sketch } from "./P5Sketch";
import { useDisclosure } from "@mantine/hooks";
import AIChatPop from "./AIChatPop";

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

export function NavbarMinimal() {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const [chatOpened, { open: openChat, close: closeChat }] = useDisclosure(false);

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
    <div className={`border-charcoal-gray flex h-screen border-r-4`}>
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
          <NavbarLink
            icon={IconWallet}
            label="Wallet"
            href="/wallet"
            active={pathname === "/wallet"}
            onClick={() => setActive("/wallet")}
          />
          <Tooltip
            label="AI Chat"
            position="right"
            transitionProps={{ transition: "slide-left", duration: 200 }}
          >
            <UnstyledButton
              onClick={openChat}
              className={`flex h-[50px] w-[50px] items-center justify-center rounded-md text-gray-700 transition-colors hover:bg-gray-50 ${
                chatOpened ? "bg-blue-50 text-blue-700" : ""
              }`}
            >
              <IconRobot stroke={1.5} />
            </UnstyledButton>
          </Tooltip>
          <NavbarLink
            icon={IconLogout}
            label="Logout"
            href="/logout"
            active={pathname === "/logout"}
            onClick={() => setActive("/logout")}
          />
        </Stack>
      </nav>

      <Modal
        opened={chatOpened}
        onClose={closeChat}
        size="xl"
        title="AI Chat"
        centered
        classNames={{
          content: "p-0",
          header: "border-b border-gray-200",
        }}
      >
        <AIChatPop onClose={closeChat} />
      </Modal>
    </div>
  );
}

export default NavbarMinimal;
