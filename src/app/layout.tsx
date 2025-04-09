import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { type Metadata } from "next";

import SolanaWalletProvider from "@/app/_providers/solana.provider";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import { Notifications } from "@mantine/notifications";
import NavbarMinimal from "./_components/NavbarMinimal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { QueryProvider } from "./_providers/query.provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BFlow",
  description: "BFlow - Solana Workflow Builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body style={{ height: "100vh", margin: 0, padding: 0 }}>
        <QueryProvider>
          <SolanaWalletProvider>
            <MantineProvider>
              <Notifications />
              <div style={{ display: "flex", height: "100vh" }}>
                <NavbarMinimal />
                <main style={{ flex: 1, overflow: "hidden", height: "100vh" }}>
                  {children}
                </main>
              </div>
              <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
              />
            </MantineProvider>
          </SolanaWalletProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
