"use client";
import { useState, useEffect } from "react";
import { TOKENS } from "../../_constants/tokens";

interface JupiterNodeProps {
  data: {
    label: string;
    args: {
      sellingToken: string;
      buyingToken: string;
      swapAmount: string;
      slippage: string;
    };
    onRemove: () => void;
    isActive: boolean;
    setActive: () => void;
    groupId: number;
    orderId: number;
    updateLabel?: (newLabel: string) => void;
  };
}

export const JupiterNode = ({ data }: JupiterNodeProps) => {
  const { label, args, onRemove, isActive, setActive, groupId, orderId, updateLabel } = data;

  // Use the first token's id as default if not provided
  const [sellingToken, setSellingToken] = useState<string>(args.sellingToken || TOKENS[0]?.id || "SOL");
  const [buyingToken, setBuyingToken] = useState<string>(args.buyingToken || TOKENS[0]?.id || "USDC");
  const [swapAmount, setSwapAmount] = useState(args.swapAmount || "");
  const [slippage, setSlippage] = useState(args.slippage || "");
  const [activeState, setActiveState] = useState(isActive);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(label);

  // Sync local state with props when they change
  useEffect(() => {
    setActiveState(isActive);
  }, [isActive]);
  
  // Sync args with local state
  useEffect(() => {
    args.sellingToken = sellingToken;
    args.buyingToken = buyingToken;
    args.swapAmount = swapAmount;
    args.slippage = slippage;
  }, [sellingToken, buyingToken, swapAmount, slippage, args]);

  // Sync label state with props
  useEffect(() => {
    setLabelValue(label);
  }, [label]);

  const handleSwapAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSwapAmount(e.target.value);
    args.swapAmount = e.target.value;
  };

  const handleSlippageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlippage(e.target.value);
    args.slippage = e.target.value;
  };

  const handleIsActiveChange = () => {
    // Log current states before update
    console.log("JupiterNode handleIsActiveChange:");
    console.log("- Current local activeState:", activeState);
    console.log("- Current props isActive:", isActive);
    
    // Update local state first for immediate UI feedback
    setActiveState(!activeState);
    
    // Call parent component's setActive function to update node data
    console.log("- Calling setActive function...");
    setActive();
    
    // Log the expected new state
    console.log("- Expected new activeState:", !activeState);
  };

  const handleRemoveClick = () => {
    // Call parent component's onRemove function to remove the node
    onRemove();
  };

  // Functions for label editing
  const handleEditClick = () => {
    setIsEditingLabel(true);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelValue(e.target.value);
  };

  const handleLabelSave = () => {
    if (updateLabel && labelValue.trim() !== '') {
      updateLabel(labelValue);
    }
    setIsEditingLabel(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelSave();
    } else if (e.key === 'Escape') {
      // Reset to original label and exit edit mode
      setLabelValue(label);
      setIsEditingLabel(false);
    }
  };

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 text-black shadow-sm">
      <div className="absolute right-2 top-2 flex space-x-2">
        <button
          onClick={handleEditClick}
          className="text-blue-500 hover:text-blue-700"
          title="Edit Label"
        >
          ✎
        </button>
        <button
          onClick={handleRemoveClick}
          className="text-red-500 hover:text-red-700"
          title="Remove Node"
        >
          ✖
        </button>
      </div>
      <div className="absolute left-2 top-2 flex">
        <input
          type="checkbox"
          checked={activeState}
          onChange={handleIsActiveChange}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Active</label>
      </div>

      {isEditingLabel ? (
        <div className="mb-4 mt-4 flex items-center">
          <input
            type="text"
            value={labelValue}
            onChange={handleLabelChange}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-gray-300 p-1 font-bold text-black"
            autoFocus
          />
          <button
            onClick={handleLabelSave}
            className="ml-2 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      ) : (
        <h3 className="mb-4 mt-4 font-bold">{label}</h3>
      )}
      
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>Group: {groupId}</span>
        <span>Order: {orderId}</span>
      </div>

      <div className="mt-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selling Token
          </label>
          <select
            value={sellingToken}
            onChange={(e) => {
              setSellingToken(e.target.value);
              args.sellingToken = e.target.value;
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          >
            {TOKENS.map((token) => (
              <option key={`sell-${token.id}`} value={token.id}>
                {token.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buying Token
          </label>
          <select
            value={buyingToken}
            onChange={(e) => {
              setBuyingToken(e.target.value);
              args.buyingToken = e.target.value;
            }}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          >
            {TOKENS.map((token) => (
              <option key={`buy-${token.id}`} value={token.id}>
                {token.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Swap Amount
          </label>
          <input
            type="text"
            value={swapAmount}
            onChange={handleSwapAmountChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            placeholder="Enter amount to swap"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Slippage (%)
          </label>
          <input
            type="text"
            value={slippage}
            onChange={handleSlippageChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            placeholder="Enter slippage percentage"
          />
        </div>
      </div>
    </div>
  );
}; 