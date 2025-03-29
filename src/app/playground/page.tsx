"use client";

import { useNodesState, useEdgesState, addEdge } from "reactflow";
import { FlowArea } from "./Flowarea";
import { SideBar } from "./Sidebar";
import { useQuery } from "@tanstack/react-query";

import { useState, useEffect, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { WorkflowTabs, Workflow } from "./WorkflowTabs";

// Constants
const WORKFLOWS_KEY = "bflow_workflows";
const DEFAULT_WORKFLOW_NAME = "Untitled Workflow";

export default function Playground() {
  const [userAddress, setUserAddress] = useState("mert");
  /*  const { data, isLoading, error } = useQuery({
    queryKey: ["workflowAll", userAddress],
    queryFn: fetchWorkflowData,
  }); */

  // Workflow state
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>("");

  // Flow state per workflow
  const [workflowStates, setWorkflowStates] = useState<{
    [workflowId: string]: {
      nodes: any[];
      edges: any[];
    };
  }>({});

  // Active flow state (derived from active workflow)
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Initialize with one workflow if none exists
  useEffect(() => {
    // Check if we have any saved workflows
    const savedWorkflows = localStorage.getItem(WORKFLOWS_KEY);

    if (savedWorkflows) {
      // Load saved workflows
      const parsedWorkflows = JSON.parse(savedWorkflows) as Workflow[];
      setWorkflows(parsedWorkflows);

      // Set the first workflow as active
      if (parsedWorkflows.length > 0) {
        // Find active workflow or use the first one
        const activeWorkflow =
          parsedWorkflows.find((w) => w.isActive) || parsedWorkflows[0];

        if (activeWorkflow) {
          setActiveWorkflowId(activeWorkflow.id);

          // Mark the active workflow if not already marked
          if (!activeWorkflow.isActive) {
            const updatedWorkflows = parsedWorkflows.map((w) => ({
              ...w,
              isActive: w.id === activeWorkflow.id,
            }));
            setWorkflows(updatedWorkflows);
            localStorage.setItem(
              WORKFLOWS_KEY,
              JSON.stringify(updatedWorkflows),
            );
          }
        }
      }
    } else {
      // Create a new workflow if none exists
      const newWorkflowId = uuidv4();
      const initialWorkflow = {
        id: newWorkflowId,
        name: DEFAULT_WORKFLOW_NAME,
        isActive: true,
      };

      setWorkflows([initialWorkflow]);
      setActiveWorkflowId(newWorkflowId);
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify([initialWorkflow]));
    }
  }, []);

  // Load workflow state when active workflow changes
  useEffect(() => {
    if (!activeWorkflowId) return;

    // Check if we already have this workflow in memory
    if (workflowStates[activeWorkflowId]) {
      // Only update if the data is different to prevent unnecessary re-renders
      if (workflowStates[activeWorkflowId].nodes !== nodes) {
        setNodes(workflowStates[activeWorkflowId].nodes);
      }

      if (workflowStates[activeWorkflowId].edges !== edges) {
        setEdges(workflowStates[activeWorkflowId].edges);
      }
    } else {
      // Load from localStorage
      const storageKey = `bflow_workflow_${activeWorkflowId}`;
      const savedWorkflow = localStorage.getItem(storageKey);

      if (savedWorkflow) {
        try {
          const parsed = JSON.parse(savedWorkflow);

          // Only set nodes/edges if the data actually exists and is different
          const newNodes = parsed.nodes || [];
          const newEdges = parsed.edges || [];

          // Only update if there's a meaningful change to prevent circular updates
          if (JSON.stringify(nodes) !== JSON.stringify(newNodes)) {
            setNodes(newNodes);
          }

          if (JSON.stringify(edges) !== JSON.stringify(newEdges)) {
            setEdges(newEdges);
          }

          // Update in-memory state only if we don't already have it
          // This avoids redundant state updates
          if (!workflowStates[activeWorkflowId]) {
            setWorkflowStates((prev) => ({
              ...prev,
              [activeWorkflowId]: {
                nodes: newNodes,
                edges: newEdges,
              },
            }));
          }
        } catch (error) {
          console.error("Error parsing workflow data:", error);
          setNodes([]);
          setEdges([]);
        }
      } else {
        // New workflow, start with empty arrays
        setNodes([]);
        setEdges([]);
      }
    }
    // We need to use a more stable way to compare arrays instead of adding them directly
    // to avoid unnecessary updates
  }, [activeWorkflowId]);

  // Save workflow state when nodes or edges change
  useEffect(() => {
    if (!activeWorkflowId) return;

    // Skip initialization - only save when nodes/edges actually change
    // This is critical to prevent circular updates
    if (
      workflowStates[activeWorkflowId]?.nodes === nodes &&
      workflowStates[activeWorkflowId]?.edges === edges
    ) {
      return;
    }

    // Prevent calls during initialization
    const isInitialization =
      nodes.length === 0 &&
      edges.length === 0 &&
      (!workflowStates[activeWorkflowId] ||
        (workflowStates[activeWorkflowId].nodes.length === 0 &&
          workflowStates[activeWorkflowId].edges.length === 0));

    if (isInitialization) {
      return;
    }

    // Use a more efficient check to prevent over-updating
    const previousNodes = workflowStates[activeWorkflowId]?.nodes || [];
    const previousEdges = workflowStates[activeWorkflowId]?.edges || [];

    // Check if there's a meaningful change before updating state
    // This helps prevent unnecessary updates
    if (
      JSON.stringify(previousNodes) === JSON.stringify(nodes) &&
      JSON.stringify(previousEdges) === JSON.stringify(edges)
    ) {
      return;
    }

    // Debounce the save operation to avoid excessive updates
    const timeoutId = setTimeout(() => {
      // Update in-memory state
      setWorkflowStates((prev) => ({
        ...prev,
        [activeWorkflowId]: {
          nodes,
          edges,
        },
      }));

      // Save to localStorage
      const storageKey = `bflow_workflow_${activeWorkflowId}`;
      localStorage.setItem(storageKey, JSON.stringify({ nodes, edges }));
    }, 300); // Debounce for 300ms

    // Cleanup the timeout on unmount or when deps change
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, activeWorkflowId, workflowStates]);

  // Handle adding a new workflow
  const handleAddWorkflow = () => {
    const newWorkflowId = uuidv4();

    // Create initial empty state for the new workflow
    const initialWorkflowState = {
      nodes: [],
      edges: [],
    };

    // Save current workflow state first
    if (activeWorkflowId) {
      // Only save if there have been changes
      const hasChanged =
        !workflowStates[activeWorkflowId] ||
        JSON.stringify(workflowStates[activeWorkflowId].nodes) !==
          JSON.stringify(nodes) ||
        JSON.stringify(workflowStates[activeWorkflowId].edges) !==
          JSON.stringify(edges);

      if (hasChanged) {
        // Update the workflowStates directly
        setWorkflowStates((prev) => ({
          ...prev,
          [activeWorkflowId]: { nodes, edges },
          [newWorkflowId]: initialWorkflowState, // Add the new workflow state
        }));
      } else {
        // Just add the new workflow state
        setWorkflowStates((prev) => ({
          ...prev,
          [newWorkflowId]: initialWorkflowState,
        }));
      }
    } else {
      // Just add the new workflow state
      setWorkflowStates((prev) => ({
        ...prev,
        [newWorkflowId]: initialWorkflowState,
      }));
    }

    // Create the new workflow object
    const newWorkflow = {
      id: newWorkflowId,
      name: `${DEFAULT_WORKFLOW_NAME} ${workflows.length + 1}`,
      isActive: true, // Set as active immediately
    };

    // Update all workflows to make the new one active
    const updatedWorkflows = workflows
      .map((w) => ({
        ...w,
        isActive: false, // Deactivate all existing workflows
      }))
      .concat(newWorkflow);

    // Save workflows to localStorage
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(updatedWorkflows));

    // Create empty workflow file in localStorage
    localStorage.setItem(
      `bflow_workflow_${newWorkflowId}`,
      JSON.stringify(initialWorkflowState),
    );

    // Batch update states to minimize renders
    // First update state variables
    setWorkflows(updatedWorkflows);
    setNodes([]);
    setEdges([]);

    // Finally update active workflow ID
    setActiveWorkflowId(newWorkflowId);
  };

  // Handle selecting a workflow
  const handleSelectWorkflow = (workflowId: string) => {
    // Don't do anything if we're already on this workflow
    if (workflowId === activeWorkflowId) return;

    // Save current workflow state
    if (activeWorkflowId) {
      // Only update if this workflow exists in our state and has changed
      const hasChanged =
        !workflowStates[activeWorkflowId] ||
        JSON.stringify(workflowStates[activeWorkflowId].nodes) !==
          JSON.stringify(nodes) ||
        JSON.stringify(workflowStates[activeWorkflowId].edges) !==
          JSON.stringify(edges);

      if (hasChanged) {
        setWorkflowStates((prev) => ({
          ...prev,
          [activeWorkflowId]: {
            nodes,
            edges,
          },
        }));
      }
    }

    // Update active workflow
    setActiveWorkflowId(workflowId);

    // Update workflow active states
    const updatedWorkflows = workflows.map((w) => ({
      ...w,
      isActive: w.id === workflowId,
    }));

    setWorkflows(updatedWorkflows);
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(updatedWorkflows));
  };

  // Handle renaming a workflow
  const handleRenameWorkflow = (workflowId: string, newName: string) => {
    const updatedWorkflows = workflows.map((w) =>
      w.id === workflowId ? { ...w, name: newName } : w,
    );

    setWorkflows(updatedWorkflows);
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(updatedWorkflows));
  };

  // Handle saving workflows list to localStorage
  const saveWorkflowsToLocalStorage = (workflowsToSave: Workflow[]) => {
    localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflowsToSave));
  };

  // Handle closing a workflow tab
  const handleCloseWorkflow = useCallback(
    (workflowId: string) => {
      // Prevent closing the only tab
      if (workflows.length <= 1) {
        alert("Cannot close the only workflow tab");
        return;
      }

      // If we're closing the active workflow, we need to activate another one
      if (workflowId === activeWorkflowId) {
        const index = workflows.findIndex((w) => w.id === workflowId);
        const newActiveIndex = index === 0 ? 1 : index - 1;
        const newActiveWorkflow = workflows[newActiveIndex];

        if (newActiveWorkflow) {
          // Update active workflow
          setActiveWorkflowId(newActiveWorkflow.id);

          // Load the state of the new active workflow
          const workflowState = workflowStates[newActiveWorkflow.id];
          if (workflowState) {
            const { nodes: newNodes, edges: newEdges } = workflowState;
            setNodes(newNodes);
            setEdges(newEdges);
          }
        }
      }

      // Update workflows list
      setWorkflows((prevWorkflows) => {
        const updated = prevWorkflows.filter((w) => w.id !== workflowId);
        saveWorkflowsToLocalStorage(updated);
        return updated;
      });

      // Remove workflow state
      setWorkflowStates((prev) => {
        const updated = { ...prev };
        delete updated[workflowId];
        return updated;
      });

      // Remove workflow data from localStorage
      const WORKFLOW_STORAGE_KEY = "bflow-workflow-data";
      localStorage.removeItem(`${WORKFLOW_STORAGE_KEY}_${workflowId}`);
    },
    [activeWorkflowId, workflows, workflowStates, setNodes, setEdges],
  );

  // Handle connections
  const onConnect = (params: any) => {
    setEdges((eds) => addEdge(params, eds));
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <WorkflowTabs
        workflows={workflows}
        activeWorkflowId={activeWorkflowId}
        onSelectWorkflow={handleSelectWorkflow}
        onAddWorkflow={handleAddWorkflow}
        onRenameWorkflow={handleRenameWorkflow}
        onCloseWorkflow={handleCloseWorkflow}
      />
      <div className="flex flex-1 overflow-hidden">
        <FlowArea
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />
        <SideBar
          setNodes={setNodes}
          nodes={nodes}
          workflowId={activeWorkflowId}
        />
      </div>
    </div>
  );
}
