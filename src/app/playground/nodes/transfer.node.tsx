"use client";
import { useState } from "react";

interface TransferNodeProps {
  data: {
    label: string;
    args: {
      address: string;
      amount: string;
    };
    onRemove: () => void;
    isActive: boolean;
    setActive: () => void;
  };
}

export const TransferNode = ({ data }: TransferNodeProps) => {
  const { label, args, onRemove, isActive, setActive } = data;

  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [activeState, setActiveState] = useState(isActive);

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    args["address"] = e.target.value;
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    args["amount"] = e.target.value;
  };

  const handleIsActiveChange = () => {
    setActiveState(!activeState);
    setActive();
  };

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 text-black shadow-sm">
      <button
        onClick={onRemove}
        className="absolute right-2 top-2 text-red-500 hover:text-red-700"
      >
        ✖
      </button>
      <div className="absolute left-2 top-2 flex">
        <input
          type="checkbox"
          checked={isActive}
          onChange={handleIsActiveChange}
          className="mr-2"
        />
        <label className="text-sm font-medium text-gray-700">Active</label>
      </div>

      <h3 className="mb-4 mt-4 font-bold">{label}</h3>

      <div className="mt-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Address to Send
          </label>
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            placeholder="Enter address"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm"
            placeholder="Enter amount"
          />
        </div>
      </div>
    </div>
  );
};
