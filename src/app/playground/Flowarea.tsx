"use client";
import { useMemo } from "react";
import ReactFlow, {
  Controls,
  Background,
  Connection,
  MiniMap,
} from "reactflow";
import { TransferNode } from "./nodes/transfer.node";
import { ActionNode } from "./nodes/action.node";
import { JupiterNode } from "./nodes/jupiter.node";
import { MeteoraNode } from "./nodes/meteora.node";
import "reactflow/dist/style.css";

const nodeTemplates = {
  actionNode: ActionNode,
  transferNode: TransferNode,
  jupiterNode: JupiterNode,
  meteoraNode: MeteoraNode,
};

export interface FlowAreaProps {
  nodes: any[];
  edges: any[];
  onNodesChange: (nodes: any[]) => void;
  onEdgesChange: (edges: any[]) => void;
  onConnect: (params: Connection) => void;
}

export const FlowArea = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: FlowAreaProps) => {
  const nodeTypes = useMemo(() => nodeTemplates, []);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Background />

       
      </ReactFlow>
    </div>
  );
};
