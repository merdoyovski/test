"use client";
import { useState, useEffect, useRef } from 'react';
import { sendMessageToOpenAI } from '../_services/openai';

export const AIChatPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current && 
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    try {
      const response = await sendMessageToOpenAI(message);
      console.log("response is:", response);
      
      if (response.type === 'transfer' && response.params.address && response.params.amount) {
        // Dispatch custom event for transfer node
        const event = new CustomEvent('createTransferNode', {
          detail: {
            address: response.params.address,
            amount: response.params.amount
          }
        });
        window.dispatchEvent(event);
      } else if (response.type === 'jupiter' && response.params.sellingToken && response.params.buyingToken) {
        // Dispatch custom event for jupiter node
        const event = new CustomEvent('createJupiterNode', {
          detail: {
            sellingToken: response.params.sellingToken,
            buyingToken: response.params.buyingToken,
            swapAmount: response.params.swapAmount || '',
            slippage: response.params.slippage || '1'
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
    } finally {
      setIsLoading(false);
      setMessage('');
      setIsOpen(false); // Close popup after generation
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="flex items-center justify-center rounded-full bg-gray-700 p-2 text-white hover:bg-gray-600"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          className="fixed right-4 top-16 w-80 rounded-lg bg-white p-4 shadow-lg z-50"
        >
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
      )}
    </div>
  );
}; 