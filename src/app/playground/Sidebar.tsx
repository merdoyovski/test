// SideBar.tsx

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Dispatch, SetStateAction } from "react";
import type { Node } from "reactflow";
import { fetchWorkflowData, saveWorkflow } from "../services/workflow";

export interface SideBarProps {
  nodes: Node<any, string | undefined>[];
  setNodes: Dispatch<SetStateAction<Node<any, string | undefined>[]>>;
}

export const SideBar = ({ setNodes, nodes }: SideBarProps) => {
  const [userAddress, setUserAddress] = useState("mert");
  const fileCounter = useRef(1);

  const handleAddTransferNode = () => {
    const newCounter = nodes.length + 1;
    const newNodeId = `transfer-${newCounter}`;

    const transferNode: Node<any, string> = {
      id: newNodeId,
      type: "transferNode",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: `Transfer (${fileCounter.current++})`,
        isActive: false,
        args: {
          address: "",
          amount: "",
        },

        setActive: () => {
          //setNodes((prevNodes) => toggleNodeActiveState(prevNodes, newNodeId));
        },

        onRemove: () => {
          //setNodes((prevNodes) => removeNodeById(prevNodes, newNodeId));
        },
      },
    };

    setNodes((prevNodes) => [...prevNodes, transferNode]);
  };

  return (
    <div className="w-96 border-l border-gray-200 p-6 text-black">
      <h1 className="items-centered mb-4 flex w-full justify-center text-2xl font-bold">
        bFlow
      </h1>
      <h2 className="mb-2 text-lg font-semibold">Actions</h2>
      <div className="mb-6">
        <label
          htmlFor="file-upload"
          className="flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
        >
          Add Action From IDL
        </label>
        <input id="file-upload" type="file" accept=".json" className="hidden" />
      </div>
      <div
        className="flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
        onClick={handleAddTransferNode}
      >
        Send Transfer
      </div>
      <div className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"></div>

      <div
        className="mt-4 flex cursor-pointer items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100"
        onClick={() => {
          console.log(nodes);
        }}
      >
        Log
      </div>
    </div>
  );
};
