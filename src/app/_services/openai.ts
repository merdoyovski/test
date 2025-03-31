import OpenAI from 'openai';

// Initialize OpenAI client
/*
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});
*/
interface NodeCreationResponse {
  type: 'transfer' | 'jupiter' | null;
  params: {
    address?: string;
    amount?: string;
    sellingToken?: string;
    buyingToken?: string;
    swapAmount?: string;
    slippage?: string;
  };
}

export async function sendMessageToOpenAI(message: string): Promise<NodeCreationResponse> {
    return { type: null, params: {} };
   /*
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a workflow assistant that helps users create nodes in their workflow. 
          You can create two types of nodes:
          1. Transfer Node: For sending SOL to an address
          2. Jupiter Node: For swapping tokens
          
          When a user asks to create a node, analyze their request and return a JSON response with:
          - type: either 'transfer' or 'jupiter'
          - params: an object with the required parameters
          
          For transfer nodes, params should include:
          - address: the destination address
          - amount: the amount in SOL
          
          For jupiter nodes, params should include:
          - sellingToken: the token to sell (e.g., 'SOL', 'USDC')
          - buyingToken: the token to buy (e.g., 'SOL', 'USDC')
          - swapAmount: the amount to swap
          - slippage: the slippage tolerance (default: '1')
          
          If the request is unclear or not related to node creation, return type: null and empty params.`
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return { type: null, params: {} };
    }

    try {
      const response = JSON.parse(content);
      return response as NodeCreationResponse;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return { type: null, params: {} };
    }
  } catch (error) {
    console.error('Error sending message to OpenAI:', error);
    throw error;
  }
    */
} 