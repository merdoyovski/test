"use client";
import { useState, useEffect } from "react";
import { METEORA_POOLS } from "../../_constants/meteora.pools";

interface MeteoraNodeProps {
  data: {
    label: string;
    args: {
      serviceType: string;
      poolAddress: string;
      totalRangeInterval: string;
      strategyType: string;
      inputTokenAmount: string;
    };
    onRemove: () => void;
    isActive: boolean;
    setActive: () => void;
    groupId: number;
    orderId: number;
    updateLabel?: (newLabel: string) => void;
  };
}

export const MeteoraNode = ({ data }: MeteoraNodeProps) => {
  const { label, args, onRemove, isActive, setActive, groupId, orderId, updateLabel } = data;

  const [serviceType, setServiceType] = useState(args.serviceType || "");
  const [poolAddress, setPoolAddress] = useState(args.poolAddress || "");
  const [totalRangeInterval, setTotalRangeInterval] = useState(args.totalRangeInterval || "10");
  const [strategyType, setStrategyType] = useState(args.strategyType || "0");
  const [inputTokenAmount, setInputTokenAmount] = useState(args.inputTokenAmount || "");
  const [activeState, setActiveState] = useState(isActive);
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(label);

  useEffect(() => {
    setActiveState(isActive);
  }, [isActive]);
  
  useEffect(() => {
    args.serviceType = serviceType;
    args.poolAddress = poolAddress;
    args.totalRangeInterval = totalRangeInterval;
    args.strategyType = strategyType;
    args.inputTokenAmount = inputTokenAmount;
  }, [serviceType, poolAddress, totalRangeInterval, strategyType, inputTokenAmount, args]);

  useEffect(() => {
    setLabelValue(label);
  }, [label]);

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setServiceType(e.target.value);
    args.serviceType = e.target.value;
  };

  const handlePoolAddressChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedPool = METEORA_POOLS.find(pool => pool.id === e.target.value);
    if (selectedPool) {
      setPoolAddress(selectedPool.address);
      args.poolAddress = selectedPool.address;
    }
  };

  const handleTotalRangeIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTotalRangeInterval(e.target.value);
    args.totalRangeInterval = e.target.value;
  };

  const handleStrategyTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStrategyType(e.target.value);
    args.strategyType = e.target.value;
  };

  const handleInputTokenAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputTokenAmount(e.target.value);
    args.inputTokenAmount = e.target.value;
  };

  const handleIsActiveChange = () => {
    setActiveState(!activeState);
    setActive();
  };

  const handleRemoveClick = () => {
    onRemove();
  };

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
      setLabelValue(label);
      setIsEditingLabel(false);
    }
  };

  const renderInputs = () => {
    if (!serviceType) return null;

    return (
      <>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Pool
          </label>
          <select
            value={METEORA_POOLS.find(pool => pool.address === poolAddress)?.id || ""}
            onChange={handlePoolAddressChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          >
            <option value="" disabled>Select a pool</option>
            {METEORA_POOLS.map((pool) => (
              <option key={pool.id} value={pool.id}>
                {pool.name}
              </option>
            ))}
          </select>
        </div>

        {serviceType === "addLiquidity" && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Total Range Interval
              </label>
              <input
                type="text"
                value={totalRangeInterval}
                onChange={handleTotalRangeIntervalChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                placeholder="Enter total range interval"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategy Type
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="spot"
                    type="radio"
                    value="0"
                    checked={strategyType === "0"}
                    onChange={handleStrategyTypeChange}
                    className="mr-2"
                  />
                  <label htmlFor="spot" className="text-sm text-gray-700">
                    Spot
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="curve"
                    type="radio"
                    value="1"
                    checked={strategyType === "1"}
                    onChange={handleStrategyTypeChange}
                    className="mr-2"
                  />
                  <label htmlFor="curve" className="text-sm text-gray-700">
                    Curve
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="bidAsk"
                    type="radio"
                    value="2"
                    checked={strategyType === "2"}
                    onChange={handleStrategyTypeChange}
                    className="mr-2"
                  />
                  <label htmlFor="bidAsk" className="text-sm text-gray-700">
                    Bid Ask
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Input Token Amount
              </label>
              <input
                type="text"
                value={inputTokenAmount}
                onChange={handleInputTokenAmountChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
                placeholder="Enter input token amount"
              />
            </div>
          </>
        )}

        {serviceType === "removeLiquidity" && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 max-w-[200px]">
              This operation will remove liquidity from your current position in the selected pool.
              No additional inputs are required.
            </p>
          </div>
        )}
      </>
    );
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
          <label className="block text-sm font-medium text-gray-700">
            Service Type
          </label>
          <select
            value={serviceType}
            onChange={handleServiceTypeChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
          >
            <option value="" disabled>Select a service</option>
            <option value="addLiquidity">Add Liquidity</option>
            <option value="removeLiquidity">Remove Liquidity</option>
          </select>
        </div>

        {renderInputs()}
      </div>
    </div>
  );
}; 