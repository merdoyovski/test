"use client";
import { useState } from 'react';
import { v4 as uuidv4 } from "uuid";
import { WorkflowTabs, Workflow } from "./WorkflowTabs";
import { FlowArea } from "./Flowarea";
import { Node, Edge, Connection, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';

// Constants
const WORKFLOWS_KEY = "bflow_workflows";
const DEFAULT_WORKFLOW_NAME = "Untitled Workflow";

interface WorkflowWithFlow extends Workflow {
  nodes: Node[];
  edges: Edge[];
}

export default function Flow() {
  const [userAddress, setUserAddress] = useState("mert");
  const [workflows, setWorkflows] = useState<WorkflowWithFlow[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(WORKFLOWS_KEY);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>("");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const handleSelectWorkflow = (id: string) => {
    setActiveWorkflowId(id);
    const workflow = workflows.find(w => w.id === id);
    if (workflow) {
      setNodes(workflow.nodes);
      setEdges(workflow.edges);
    }
  };

  const handleAddWorkflow = () => {
    const newWorkflow: WorkflowWithFlow = {
      id: uuidv4(),
      name: DEFAULT_WORKFLOW_NAME,
      isActive: true,
      nodes: [],
      edges: [],
    };
    setWorkflows([...workflows, newWorkflow]);
    setActiveWorkflowId(newWorkflow.id);
    setNodes([]);
    setEdges([]);
  };

  const handleRenameWorkflow = (id: string, newName: string) => {
    setWorkflows(workflows.map(w => 
      w.id === id ? { ...w, name: newName } : w
    ));
  };

  const handleCloseWorkflow = (id: string) => {
    setWorkflows(workflows.filter(w => w.id !== id));
    if (activeWorkflowId === id) {
      setActiveWorkflowId("");
      setNodes([]);
      setEdges([]);
    }
  };

  const onNodesChange = (changes: any) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onEdgesChange = (changes: any) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  const onConnect = (connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <WorkflowTabs
        workflows={workflows}
        activeWorkflowId={activeWorkflowId}
        onSelectWorkflow={handleSelectWorkflow}
        onAddWorkflow={handleAddWorkflow}
        onRenameWorkflow={handleRenameWorkflow}
        onCloseWorkflow={handleCloseWorkflow}
      />
      <div className="flex-1 overflow-hidden">
        <FlowArea
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />
      </div>
    </div>
  );
} 