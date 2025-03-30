import { BN } from "@coral-xyz/anchor";
import DLMM, { autoFillYByStrategy, StrategyType } from "@meteora-ag/dlmm";
import { Keypair, PublicKey } from "@solana/web3.js";

export const meteoraInitLiquidity = async (
  poolAddress: string,
  totalRangeInterval: string,
  strategyType: string,
  inputTokenAmount: string,
  newBalancePosition: Keypair,
  publicKey: PublicKey,
  connection: any,
) => {
  if (!poolAddress) {
    console.log("No pool address selected");
    return;
  }

  const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));
  const activeBin = await dlmmPool.getActiveBin();
  const TOTAL_RANGE_INTERVAL = parseInt(totalRangeInterval);
  const minBinId = activeBin.binId - TOTAL_RANGE_INTERVAL;
  const maxBinId = activeBin.binId + TOTAL_RANGE_INTERVAL;

  const totalXAmount = new BN(parseInt(inputTokenAmount) * 10 ** 0);
  const totalYAmount = autoFillYByStrategy(
    activeBin.binId,
    dlmmPool.lbPair.binStep,
    totalXAmount,
    activeBin.xAmount,
    activeBin.yAmount,
    minBinId,
    maxBinId,
    parseInt(strategyType) as StrategyType,
  );

  const createPositionTx =
    await dlmmPool.initializePositionAndAddLiquidityByStrategy({
      positionPubKey: newBalancePosition.publicKey,
      user: publicKey,
      totalXAmount,
      totalYAmount,
      strategy: {
        maxBinId,
        minBinId,
        strategyType: parseInt(strategyType) as StrategyType,
      },
    });

  return createPositionTx.instructions;
};

export const meteoraRemoveLiquidity = async (
  connection: any,
  publicKey: PublicKey,
  poolAddress: string,
) => {
  if (!poolAddress) {
    console.log("No pool address selected");
    return;
  }

  const dlmmPool = await DLMM.create(connection, new PublicKey(poolAddress));
  const activeBin = await dlmmPool.getActiveBin();
  const { userPositions } =
    await dlmmPool.getPositionsByUserAndLbPair(publicKey);

  const binPubkey = userPositions[0]!.publicKey;
  const binData = userPositions[0]!.positionData.positionBinData;
  const fromBin = binData.at(0)?.binId;
  const toBin = binData.at(-1)?.binId;

  console.log("binData", binData);
  console.log("userPositions", userPositions);

  const removeLiquidityTx = await dlmmPool.removeLiquidity({
    user: publicKey,
    position: binPubkey,
    fromBinId: fromBin!,
    toBinId: toBin!,
    bps: new BN(100 * 100),
    shouldClaimAndClose: true,
  });

  try {
    for (let tx of Array.isArray(removeLiquidityTx)
      ? removeLiquidityTx
      : [removeLiquidityTx]) {
      return tx.instructions;
    }
  } catch (error) {}

  return;
};
