"use client";

import { useNodesState, useEdgesState, addEdge } from "reactflow";
import { FlowArea } from "./Flowarea";
import { SideBar } from "./Sidebar";
import { useQuery } from "@tanstack/react-query";
import { fetchWorkflowData } from "../services/workflow";
import { useState } from "react";

export default function Playground() {
  const [userAddress, setUserAddress] = useState("mert");
  const { data, isLoading, error } = useQuery({
    queryKey: ["workflowAll", userAddress], // Unique key to identify this data in the cache
    queryFn: fetchWorkflowData, // Function to fetch the data
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  return (
    <div className="flex h-screen w-full">
      <FlowArea
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
      ></FlowArea>
      <SideBar setNodes={setNodes} nodes={nodes}></SideBar>
    </div>
  );
}
