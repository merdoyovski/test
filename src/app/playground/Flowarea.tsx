"use client";
import { useMemo, useState } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { IconRobot, IconX } from "@tabler/icons-react";
import AIChatPop from "../_components/AIChatPop";

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

export default function FlowArea({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: FlowAreaProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const nodeTypes = useMemo(() => nodeTemplates, []);

  return (
    <div className="relative h-full w-full">
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

      {/* AI Assistant Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="absolute right-6 top-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition-all hover:bg-blue-600"
      >
        <IconRobot size={24} />
      </button>

      {/* Chat Area */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute right-6 top-20 z-50 h-[500px] w-[400px] overflow-hidden rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex items-center gap-2">
                <IconRobot size={20} className="text-blue-500" />
                <span className="font-medium">AI Assistant</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <IconX size={20} className="text-gray-500" />
              </button>
            </div>
            <AIChatPop onClose={() => setIsChatOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
