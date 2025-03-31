"use client";
import { useState, useEffect } from 'react';
import { sendMessageToOpenAI } from '../_services/openai';

interface AIChatProps {
  onResponse: (response: string) => void;
  onAddTransferNode: (address: string, amount: string) => void;
  onAddJupiterNode: (sellingToken: string, buyingToken: string, swapAmount: string, slippage: string) => void;
}

export const AIChat = ({ onResponse, onAddTransferNode, onAddJupiterNode }: AIChatProps) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingDots(prev => {
          if (prev.length >= 3) return '';
          return prev + '.';
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await sendMessageToOpenAI(message);
      console.log("response is:", response);
      
      if (response.type === 'transfer' && response.params.address && response.params.amount) {
        onAddTransferNode(response.params.address, response.params.amount);
        onResponse('Created a transfer node to send ' + response.params.amount + ' SOL to ' + response.params.address);
      } else if (response.type === 'jupiter' && response.params.sellingToken && response.params.buyingToken) {
        onAddJupiterNode(
          response.params.sellingToken,
          response.params.buyingToken,
          response.params.swapAmount || '',
          response.params.slippage || '1'
        );
        onResponse('Created a Jupiter swap node to swap ' + response.params.swapAmount + ' ' + response.params.sellingToken + ' to ' + response.params.buyingToken);
      } else {
        onResponse('I couldn\'t understand your request. Please try again with more specific details about the node you want to create.');
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      onResponse('Error getting AI response. Please try again.');
    } finally {
      setIsLoading(false);
      setMessage('');
    }
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h2 className="mb-2 text-lg font-semibold">AI Assistant</h2>
      <div className="space-y-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask me to create a node (e.g., 'Create a transfer node to send 1 SOL to address ABC123...' or 'Create a Jupiter swap to swap 10 SOL to USDC')"
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={4}
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? `Generating${loadingDots}` : 'Generate'}
        </button>
      </div>
    </div>
  );
}; 