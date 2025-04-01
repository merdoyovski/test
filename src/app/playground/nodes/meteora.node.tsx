"use client";
import { useState, useEffect } from "react";
import { METEORA_POOLS } from "../../_constants/meteora.pools";
import { Select, TextInput, Radio, Text, Group, Checkbox } from '@mantine/core';

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
          <Select
            label="Pool"
            placeholder="Select a pool"
            value={METEORA_POOLS.find(pool => pool.address === poolAddress)?.id || ""}
            onChange={(value) => {
              const selectedPool = METEORA_POOLS.find(pool => pool.id === value);
              if (selectedPool) {
                setPoolAddress(selectedPool.address);
                args.poolAddress = selectedPool.address;
              }
            }}
            data={METEORA_POOLS.map((pool) => ({
              value: pool.id,
              label: pool.name
            }))}
          />
        </div>

        {serviceType === "addLiquidity" && (
          <>
            <div className="mb-4">
              <TextInput
                label="Total Range Interval"
                value={totalRangeInterval}
                onChange={(e) => {
                  setTotalRangeInterval(e.target.value);
                  args.totalRangeInterval = e.target.value;
                }}
                placeholder="Enter total range interval"
              />
            </div>

            <div className="mb-4">
              <Text size="sm" fw={500} mb="xs">Strategy Type</Text>
              <Radio.Group
                value={strategyType}
                onChange={(value) => {
                  setStrategyType(value);
                  args.strategyType = value;
                }}
              >
                <Group gap="xl">
                  <Radio value="0" label="Spot" size="sm" />
                  <Radio value="1" label="Curve" size="sm" />
                  <Radio value="2" label="Bid Ask" size="sm" />
                </Group>
              </Radio.Group>
            </div>

            <div className="mb-4">
              <TextInput
                label="Input Token Amount"
                value={inputTokenAmount}
                onChange={(e) => {
                  setInputTokenAmount(e.target.value);
                  args.inputTokenAmount = e.target.value;
                }}
                placeholder="Enter input token amount"
              />
            </div>
          </>
        )}

        {serviceType === "removeLiquidity" && (
          <div className="mb-4">
            <Text size="sm" c="dimmed" maw={200}>
              This operation will remove liquidity from your current position in the selected pool.
              No additional inputs are required.
            </Text>
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
        <Checkbox
          checked={activeState}
          onChange={handleIsActiveChange}
          size="xs"
          label="Active"
        />
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
          <Select
            label="Service Type"
            placeholder="Select a service"
            value={serviceType}
            onChange={(value) => {
              setServiceType(value || "");
              args.serviceType = value || "";
            }}
            data={[
              { value: "addLiquidity", label: "Add Liquidity" },
              { value: "removeLiquidity", label: "Remove Liquidity" }
            ]}
          />
        </div>

        {renderInputs()}
      </div>
    </div>
  );
}; 