export const GetQuote = async (
  inputTokenMint: string,
  outputTokenMint: string,
  amount: string,
  slippageBps: string,
) => {
  const quoteResponseWithParams = await (
    await fetch(
      `https://api.jup.ag/swap/v1/quote?inputMint=${inputTokenMint}&outputMint=${outputTokenMint}&amount=${amount}&slippageBps=${slippageBps}&restrictIntermediateTokens=true`,
    )
  ).json();

  return quoteResponseWithParams;
};

export const BuildSwapTransaction = async (
  quoteResponse: any,
  userPublicKey: string,
) => {
  const swapResponse = await (
    await fetch("https://api.jup.ag/swap/v1/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey: userPublicKey,
        dynamicComputeUnitLimit: true,
        dynamicSlippage: true,
        prioritizationFeeLamports: {
          priorityLevelWithMaxLamports: {
            maxLamports: 1000000,
            priorityLevel: "veryHigh",
          },
        },
      }),
    })
  ).json();

  return swapResponse;
};
