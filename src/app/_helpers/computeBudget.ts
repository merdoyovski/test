import { getSimulationComputeUnits } from "@solana-developers/helpers";
import {
  AddressLookupTableAccount,
  ComputeBudgetProgram,
  Connection,
  PublicKey,
  Signer,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

function decodeComputeUnitLimit(data: any[]) {
  return data[1] + (data[2] << 8) + (data[3] << 16) + (data[4] << 24);
}

export const mergeComputeBudget = (computeBudgets: any[]) => {
  let limitSum = 0;
  for (let i = 0; i < computeBudgets.length; i++) {
    limitSum += decodeComputeUnitLimit(computeBudgets[i]);
  }
  const modifyComputeUnits = ComputeBudgetProgram.setComputeUnitLimit({
    units: limitSum,
  });
  return modifyComputeUnits;
};

export async function buildOptimalTransaction(
  connection: Connection,
  instructions: Array<TransactionInstruction>,
  signer: PublicKey,
  lookupTables: Array<AddressLookupTableAccount>,
) {
  const [microLamports, units, recentBlockhash] = await Promise.all([
    100 /* Get optimal priority fees - https://solana.com/developers/guides/advanced/how-to-use-priority-fees*/,
    getSimulationComputeUnits(connection, instructions, signer, lookupTables),
    connection.getLatestBlockhash(),
  ]);

  instructions.unshift(
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports }),
  );
  if (units) {
    // probably should add some margin of error to units
    instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units }));
  }
  return {
    transaction: new VersionedTransaction(
      new TransactionMessage({
        instructions,
        recentBlockhash: recentBlockhash.blockhash,
        payerKey: signer,
      }).compileToV0Message(lookupTables),
    ),
    recentBlockhash,
  };
}
