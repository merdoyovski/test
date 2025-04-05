import { NextRequest, NextResponse } from "next/server";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Connection } from "@solana/web3.js";
import { GetQuote, BuildSwapTransaction } from "../../_services/jupiter";
import {
  meteoraInitLiquidity,
  meteoraRemoveLiquidity,
} from "../../_services/meteora"; // Assuming these functions exist
import { AddressLookupTableAccount } from "@solana/web3.js";
import { TOKENS } from "../../_constants/tokens"; // Assuming this exists

// Keep the existing GET endpoint
export async function GET() {
  return NextResponse.json({ message: "successful" });
}

// Add new POST endpoint to process transactions
export async function POST(request: NextRequest) {
  try {
    const { nodes, publicKey: userPublicKey } = await request.json();

    if (!nodes || !userPublicKey) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    // Create connection to Solana
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_URL || "https://api.mainnet-beta.solana.com",
    );

    const instructions: any[] = [];
    const extraSigners: Keypair[] = [];
    let addressLookupTableAccounts;

    // Process nodes
    for (const node of nodes) {
      if (!node.data.isActive) continue;

      if (node.type === "meteoraNode") {
        const {
          serviceType,
          poolAddress,
          totalRangeInterval,
          strategyType,
          inputTokenAmount,
        } = node.data.args;

        switch (serviceType) {
          case "addLiquidity": {
            const newBalancePosition = new Keypair();
            extraSigners.push(newBalancePosition);

            const meteoraIx = await meteoraInitLiquidity(
              poolAddress,
              totalRangeInterval,
              strategyType,
              inputTokenAmount,
              newBalancePosition,
              new PublicKey(userPublicKey),
              connection,
            );
            if (meteoraIx) instructions.push(...meteoraIx.slice(1));
            break;
          }
          case "removeLiquidity": {
            const meteoraIx = await meteoraRemoveLiquidity(
              connection,
              new PublicKey(userPublicKey),
              poolAddress,
            );
            if (meteoraIx) instructions.push(...meteoraIx.slice(1));
            break;
          }
        }
      } else if (node.type === "transferNode") {
        const { address, amount } = node.data.args;
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(userPublicKey),
            toPubkey: new PublicKey(address),
            lamports: amount,
          }),
        );
      } else if (node.type === "jupiterNode") {
        const { sellingToken, buyingToken, swapAmount, slippage } =
          node.data.args;
        const sellingTokenObj = TOKENS.find(
          (token) => token.id === sellingToken,
        );
        const buyingTokenObj = TOKENS.find((token) => token.id === buyingToken);

        if (sellingTokenObj && buyingTokenObj) {
          const quote = await GetQuote(
            sellingTokenObj?.address || "",
            buyingTokenObj?.address || "",
            swapAmount,
            slippage,
          );

          if (!quote) {
            console.error("Failed to get quote");
            continue;
          }

          const swapTx = await BuildSwapTransaction(quote, userPublicKey);
          if (!swapTx?.swapTransaction) {
            console.error("Failed to build swap transaction");
            continue;
          }

          const transactionBase64 = swapTx.swapTransaction;
          const jupTx = VersionedTransaction.deserialize(
            Buffer.from(transactionBase64, "base64"),
          );

          addressLookupTableAccounts = await Promise.all(
            jupTx.message.addressTableLookups.map(async (lookup) => {
              const accountInfo = await connection.getAccountInfo(
                lookup.accountKey,
              );
              if (!accountInfo) {
                throw new Error("Failed to get account info for lookup table");
              }
              return new AddressLookupTableAccount({
                key: lookup.accountKey,
                state: AddressLookupTableAccount.deserialize(accountInfo.data),
              });
            }),
          );

          const messages = TransactionMessage.decompile(jupTx.message, {
            addressLookupTableAccounts: addressLookupTableAccounts,
          });

          instructions.push(...messages.instructions.slice(2));
        }
      }
    }

    if (instructions.length === 0) {
      return NextResponse.json(
        { error: "No instructions to execute" },
        { status: 400 },
      );
    }

    // Get blockhash and create transaction
    const { blockhash } = await connection.getLatestBlockhash();
    const deserializedIx = new TransactionMessage({
      payerKey: new PublicKey(userPublicKey),
      instructions: instructions,
      recentBlockhash: blockhash,
    });

    const transaction = new VersionedTransaction(
      deserializedIx.compileToV0Message(addressLookupTableAccounts || []),
    );

    // Return transaction and extraSigners
    return NextResponse.json({
      transaction: Buffer.from(transaction.serialize()).toString("base64"),
      extraSigners: extraSigners.map((signer) => ({
        publicKey: signer.publicKey.toString(),
        secretKey: Array.from(signer.secretKey),
      })),
      blockhash,
    });
  } catch (error) {
    console.error("Transaction processing error:", error);
    return NextResponse.json(
      { error: "Failed to process transaction" },
      { status: 500 },
    );
  }
}
