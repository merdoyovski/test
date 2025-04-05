// SideBar.tsx
"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Node } from "reactflow";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import {
  AddressLookupTableAccount,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BuildSwapTransaction, GetQuote } from "../_services/jupiter";
import { TOKENS } from "../_constants/tokens";

import {
  meteoraInitLiquidity,
  meteoraRemoveLiquidity,
} from "../_services/meteora";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Button,
  FileButton,
  Group,
  Stack,
  Text,
  Paper,
  ScrollArea,
  ActionIcon,
  rem,
} from "@mantine/core";
import {
  IconUpload,
  IconTrash,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconLoader2,
  IconCircleCheck,
  IconExternalLink,
  IconCross,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

// Define the localStorage key for saving workflow
const WORKFLOW_STORAGE_KEY = "bflow-workflow-data";
// Add a new storage key for global programs
const GLOBAL_PROGRAMS_STORAGE_KEY = "bflow-global-programs";

// Define interface for uploaded IDL files
interface UploadedFile {
  name: string; // Name is required and must be a string
  instructions: any[];
  timestamp: number; // For sorting/display purposes
}

// Define interface for the node in sidebar (for ordering)
interface SidebarNodeItem {
  id: string;
  type: "action" | "transfer" | "jupiter" | "meteora";
  name: string;
  groupId: number;
  orderId: number;
  fileData?: UploadedFile; // Only for action nodes
  isActive: boolean; // Add isActive property to track active state in sidebar
}

// Define interface for saved workflow data
interface WorkflowData {
  nodes: Node<any, string | undefined>[];
  sidebarNodes: SidebarNodeItem[];
  uploadedFiles: UploadedFile[];
  lastSaved: number; // Timestamp for when it was saved
}

// Type for flow nodes to ensure we handle orderId correctly
type FlowNodeData = {
  orderId: number;
  [key: string]: any;
};

export interface SideBarProps {
  nodes: Node<any, string | undefined>[];
  setNodes: Dispatch<SetStateAction<Node<any, string | undefined>[]>>;
  workflowId: string; // Add workflowId prop
}

// Update the ProgressSteps component with proper typing
interface ProgressStep {
  text: string;
  status: "pending" | "loading" | "complete";
}

const ProgressSteps = ({
  steps,
  signature,
}: {
  steps: ProgressStep[];
  signature?: string;
}) => {
  return (
    <div className="flex h-full w-full" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <motion.div className="relative flex h-5 w-5 items-center justify-center">
              <AnimatePresence mode="wait">
                {step.status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconLoader2
                      className="animate-spin text-blue-500"
                      size={16}
                    />
                  </motion.div>
                )}
                {step.status === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconCircleCheck className="text-green-500" size={16} />
                  </motion.div>
                )}
                {step.status === "pending" && (
                  <motion.div
                    key="pending"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="h-4 w-4"
                  />
                )}
              </AnimatePresence>
            </motion.div>
            <motion.span
              animate={{
                color:
                  step.status === "loading"
                    ? "rgb(59, 130, 246)"
                    : "currentColor",
                fontWeight: step.status === "loading" ? 500 : 400,
              }}
              transition={{ duration: 0.3 }}
            >
              {step.text}
            </motion.span>
          </div>
        ))}
      </div>
      <div className="ml-auto flex gap-2">
        <IconExternalLink
          size={20}
          stroke={1.5}
          className="transition-transform hover:scale-110"
          onClick={() => {
            if (!signature || signature === "") return;
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=mainnet`,
            );
          }}
        />
        <IconX
          size={20}
          stroke={1.5}
          className="transition-transform hover:scale-110"
          onClick={() => {
            toast.dismiss();
          }}
        />
      </div>
    </div>
  );
};

export const SideBar = ({ setNodes, nodes, workflowId }: SideBarProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [userAddress, setUserAddress] = useState("mert");
  const fileCounter = useRef(1);
  // State to store uploaded files
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  // State to track node order
  const [sidebarNodes, setSidebarNodes] = useState<SidebarNodeItem[]>([]);
  // State to track if we've loaded from localStorage
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const latestSignature = useRef("");
  // Create a workflow-specific storage key (memoized to prevent dependency issues)
  const getWorkflowStorageKey = useCallback(() => {
    return `${WORKFLOW_STORAGE_KEY}_${workflowId}`;
  }, [workflowId]);

  // Reset loading state when workflowId changes
  useEffect(() => {
    if (workflowId) {
      // Reset state for the new workflow
      setHasLoadedFromStorage(false);

      // Clear any existing state to prevent stale data
      if (sidebarNodes.length > 0) {
        setSidebarNodes([]);
      }

      if (uploadedFiles.length > 0) {
        setUploadedFiles([]);
      }
    }
  }, [workflowId]);

  // Utility function to toggle a node's active state
  const toggleNodeActive = (nodeId: string) => {
    // Update flow nodes
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isActive: !node.data.isActive,
            },
          };
        }
        return node;
      }),
    );

    // Update sidebar nodes
    setSidebarNodes((prevSidebarNodes) =>
      prevSidebarNodes.map((sidebarNode) => {
        if (sidebarNode.id === nodeId) {
          return { ...sidebarNode, isActive: !sidebarNode.isActive };
        }
        return sidebarNode;
      }),
    );
  };

  // Utility function to remove a node
  const removeNode = (nodeId: string) => {
    // Remove from flow nodes
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    // Remove from sidebar nodes
    setSidebarNodes((prevSidebarNodes) =>
      prevSidebarNodes.filter((node) => node.id !== nodeId),
    );

    // Reorder nodes after a short delay
    setTimeout(() => {
      // Sort current nodes
      const currentNodes = [...sidebarNodes].filter(
        (node) => node.id !== nodeId,
      );
      const sortedNodes = [...currentNodes].sort(
        (a, b) => a.orderId - b.orderId,
      );

      // Reassign order IDs
      const reorderedNodes = sortedNodes.map((node, index) => ({
        ...node,
        orderId: index + 1,
      }));

      // Update sidebar nodes
      setSidebarNodes(reorderedNodes);

      // Update flow nodes
      setNodes((prevFlowNodes) => {
        return prevFlowNodes.map((flowNode) => {
          const matchingSidebarNode = reorderedNodes.find(
            (sn) => sn.id === flowNode.id,
          );
          if (matchingSidebarNode) {
            return {
              ...flowNode,
              data: {
                ...flowNode.data,
                orderId: matchingSidebarNode.orderId,
              },
            };
          }
          return flowNode;
        });
      });
    }, 10);
  };

  // Utility function to update a node's label
  const updateNodeLabel = (nodeId: string, newLabel: string) => {
    // Update in flow nodes
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          };
        }
        return node;
      }),
    );

    // Update in sidebar nodes
    setSidebarNodes((prevSidebarNodes) =>
      prevSidebarNodes.map((sidebarNode) => {
        if (sidebarNode.id === nodeId) {
          return { ...sidebarNode, name: newLabel };
        }
        return sidebarNode;
      }),
    );
  };

  // Effect to load data from localStorage on first mount
  useEffect(() => {
    if (hasLoadedFromStorage || !workflowId) return;

    try {
      const storageKey = getWorkflowStorageKey();
      const savedData = localStorage.getItem(storageKey);

      // Load global programs
      const savedPrograms = localStorage.getItem(GLOBAL_PROGRAMS_STORAGE_KEY);

      // Set uploaded files from global storage if available
      if (savedPrograms) {
        const parsedPrograms = JSON.parse(savedPrograms) as UploadedFile[];
        setUploadedFiles(parsedPrograms || []);
      }

      if (savedData) {
        const parsedData = JSON.parse(savedData) as WorkflowData;

        // Set the sidebar nodes from storage
        setSidebarNodes(parsedData.sidebarNodes || []);

        // Reattach function references to the nodes before setting them
        const restoredNodes = parsedData.nodes.map((node) => {
          // Make a copy of the node
          const nodeWithFunctions = { ...node };

          // Reattach functions based on node type
          if (node.type === "actionNode") {
            // For action nodes, we need to reattach these functions
            nodeWithFunctions.data = {
              ...node.data,
              onSelectInstruction: (instructionName: string) => {
                // Update the node with the selected instruction
                setNodes((prevNodes) =>
                  prevNodes.map((n) => {
                    if (n.id === node.id) {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          selectedInstruction: instructionName,
                          accountInputs: {},
                          argInputs: {},
                        },
                      };
                    }
                    return n;
                  }),
                );
              },
              onAccountInputChange: (key: string, value: string) => {
                setNodes((prevNodes) =>
                  prevNodes.map((n) => {
                    if (n.id === node.id) {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          accountInputs: {
                            ...n.data.accountInputs,
                            [key]: value,
                          },
                        },
                      };
                    }
                    return n;
                  }),
                );
              },
              onArgInputChange: (key: string, value: string) => {
                setNodes((prevNodes) =>
                  prevNodes.map((n) => {
                    if (n.id === node.id) {
                      return {
                        ...n,
                        data: {
                          ...n.data,
                          argInputs: {
                            ...n.data.argInputs,
                            [key]: value,
                          },
                        },
                      };
                    }
                    return n;
                  }),
                );
              },
              setActive: () => toggleNodeActive(node.id),
              onRemove: () => removeNode(node.id),
              updateLabel: (newLabel: string) =>
                updateNodeLabel(node.id, newLabel),
            };
          } else if (node.type === "transferNode") {
            // For transfer nodes, reattach these functions
            nodeWithFunctions.data = {
              ...node.data,
              setActive: () => toggleNodeActive(node.id),
              onRemove: () => removeNode(node.id),
              updateLabel: (newLabel: string) =>
                updateNodeLabel(node.id, newLabel),
            };
          }

          return nodeWithFunctions;
        });

        // Set the flow nodes with reattached functions
        setNodes(restoredNodes);

        // Update the fileCounter to be higher than any existing counter
        const highestCounter = Math.max(
          0,
          ...parsedData.nodes.map((node) => {
            const match = node.data?.label?.match?.(/\((\d+)\)$/);
            return match ? parseInt(match[1]) : 0;
          }),
        );
        fileCounter.current = highestCounter + 1;

        console.log(
          "Successfully loaded workflow data with reattached functions",
        );
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
    }

    setHasLoadedFromStorage(true);
  }, [setNodes, hasLoadedFromStorage, workflowId, getWorkflowStorageKey]);

  // Modify saveWorkflow function to save global programs separately
  const saveWorkflow = useCallback(
    (notifyUser = true) => {
      if (!workflowId) return;

      try {
        // Save workflow-specific data
        const workflowData: WorkflowData = {
          nodes,
          sidebarNodes,
          uploadedFiles: [], // Don't store files with workflow anymore
          lastSaved: Date.now(),
        };

        const storageKey = getWorkflowStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(workflowData));

        // Save global programs separately
        //localStorage.setItem(GLOBAL_PROGRAMS_STORAGE_KEY, JSON.stringify(uploadedFiles));

        if (notifyUser) {
          alert(
            `Workflow saved successfully!\n- ${nodes.length} nodes\n- ${uploadedFiles.length} programs`,
          );
        }
      } catch (error) {
        console.error("Error saving workflow:", error);
        alert("Failed to save workflow.");
      }
    },
    [nodes, sidebarNodes, uploadedFiles, workflowId, getWorkflowStorageKey],
  );

  // Clear saved workflow data
  const clearSavedWorkflow = () => {
    if (
      confirm(
        "Are you sure you want to clear all saved workflow data? This cannot be undone.",
      )
    ) {
      const storageKey = getWorkflowStorageKey();
      localStorage.removeItem(storageKey);
      console.log("Workflow data cleared from localStorage");
      alert("Saved workflow data has been cleared.");
    }
  };

  // Effect to update flow nodes when sidebarNodes change
  useEffect(() => {
    // Skip if no sidebar nodes or if we're still loading
    if (sidebarNodes.length === 0 || !hasLoadedFromStorage) return;

    // Skip unnecessary updates by checking if all flow nodes already have correct order
    let needsUpdate = false;

    // First check if we actually need to update any nodes
    for (const flowNode of nodes) {
      const matchingSidebarNode = sidebarNodes.find(
        (node) => node.id === flowNode.id,
      );
      if (
        matchingSidebarNode &&
        (flowNode.data.orderId !== matchingSidebarNode.orderId ||
          flowNode.data.groupId !== matchingSidebarNode.groupId)
      ) {
        needsUpdate = true;
        break;
      }
    }

    // Only update if needed
    if (needsUpdate) {
      setNodes((prevFlowNodes) => {
        return prevFlowNodes.map((flowNode) => {
          // Find corresponding sidebar node by ID
          const matchingSidebarNode = sidebarNodes.find(
            (node) => node.id === flowNode.id,
          );

          // If found, update the order ID
          if (matchingSidebarNode) {
            return {
              ...flowNode,
              data: {
                ...flowNode.data,
                orderId: matchingSidebarNode.orderId,
                groupId: matchingSidebarNode.groupId,
              },
            };
          }

          // If not found, return the node unchanged
          return flowNode;
        });
      });
    }
  }, [sidebarNodes, hasLoadedFromStorage, nodes, setNodes]);

  // Updated getNextOrderId function with more logging
  const getNextOrderId = () => {
    console.log("Getting next order ID");

    // If there are no nodes yet, start with 1
    if (sidebarNodes.length === 0) {
      console.log("No nodes exist yet, starting with order ID 1");
      return 1;
    }

    // Check if we have sequential order IDs
    const orderedNodes = [...sidebarNodes].sort(
      (a, b) => a.orderId - b.orderId,
    );
    console.log(
      "Current node orders:",
      orderedNodes.map((n) => `${n.id}: ${n.orderId}`),
    );

    const hasGaps = orderedNodes.some(
      (node, index) => node.orderId !== index + 1,
    );

    if (hasGaps) {
      console.log("Found gaps in ordering, using length+1 instead");
      // Just use the length+1 as a simple solution
      return sidebarNodes.length + 1;
    }

    // Find the highest current order ID
    const highestOrderId = Math.max(
      ...sidebarNodes.map((node) => node.orderId),
    );
    console.log(
      `Highest order ID is ${highestOrderId}, returning ${highestOrderId + 1}`,
    );

    // The next order ID should be one higher than the current maximum
    return highestOrderId + 1;
  };

  // Updated toggleNodeActiveState function
  const toggleNodeActiveState = (nodeId: string) => {
    toggleNodeActive(nodeId);
  };

  // Updated reorderNodes to reuse the logic in removeNode
  const reorderNodes = (forceReorder = false) => {
    // Sort current nodes
    const sortedNodes = [...sidebarNodes].sort((a, b) => a.orderId - b.orderId);

    // Check if reordering is needed
    const needsReordering =
      forceReorder ||
      sortedNodes.some((node, index) => node.orderId !== index + 1);

    if (!needsReordering) {
      console.log("Nodes already properly ordered, skipping reorder");
      return;
    }

    // Reassign order IDs
    const reorderedNodes = sortedNodes.map((node, index) => ({
      ...node,
      orderId: index + 1,
    }));

    // Update sidebar nodes
    setSidebarNodes(reorderedNodes);

    // Update flow nodes in the next tick
    setTimeout(() => {
      setNodes((prevFlowNodes) => {
        return prevFlowNodes.map((flowNode) => {
          const matchingSidebarNode = reorderedNodes.find(
            (sn) => sn.id === flowNode.id,
          );
          if (matchingSidebarNode) {
            return {
              ...flowNode,
              data: {
                ...flowNode.data,
                orderId: matchingSidebarNode.orderId,
              },
            };
          }
          return flowNode;
        });
      });
    }, 10);
  };

  const handleAddTransferNode = (address: string = "", amount: string = "") => {
    const orderId = getNextOrderId();
    const newNodeId = `transfer-${orderId}`;
    const groupId = 1; // Default group
    const initialIsActive = true; // Set initial active state

    // Create a sidebar node item for tracking
    const sidebarNode: SidebarNodeItem = {
      id: newNodeId,
      type: "transfer",
      name: `Transfer ${orderId}`,
      groupId,
      orderId,
      isActive: initialIsActive, // Use the explicit variable
    };

    setSidebarNodes((prev) => [...prev, sidebarNode]);

    const transferNode: Node<any, string> = {
      id: newNodeId,
      type: "transferNode",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: `Transfer (${fileCounter.current++})`,
        isActive: initialIsActive,
        args: {
          address: address,
          amount: amount,
        },
        groupId,
        orderId,
        setActive: () => toggleNodeActive(newNodeId),
        onRemove: () => removeNode(newNodeId),
        updateLabel: (newLabel: string) => updateNodeLabel(newNodeId, newLabel),
      },
    };

    setNodes((prevNodes) => [...prevNodes, transferNode]);
  };

  // Modified to store the file data instead of creating a node immediately
  const handleFileUpload = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        if (e.target && typeof e.target.result === "string") {
          const json = JSON.parse(e.target.result);
          console.log("Parsed JSON file:", json);

          const instructions = json.instructions || [];

          // Create a new uploaded file entry
          const newFile: UploadedFile = {
            name: file.name || `File-${Date.now()}`, // Ensure name is always a string
            instructions,
            timestamp: Date.now(),
          };

          // Add to the list of uploaded files
          setUploadedFiles((prevFiles) => {
            // Check if this file already exists (by name)
            const exists = prevFiles.some((f) => f.name === newFile.name);
            if (exists) {
              alert(`Program "${newFile.name}" is already uploaded.`);
              return prevFiles;
            }

            const updatedFiles = [...prevFiles, newFile];
            console.log(
              `Added program "${newFile.name}" with ${instructions.length} instructions`,
            );

            // Save to global storage immediately within the state update callback
            localStorage.setItem(
              GLOBAL_PROGRAMS_STORAGE_KEY,
              JSON.stringify(updatedFiles),
            );
            console.log("Saved to global storage");
            const test = localStorage.getItem(GLOBAL_PROGRAMS_STORAGE_KEY);
            console.log("Test:", test);

            return updatedFiles;
          });
        }
      } catch (error) {
        console.error("Error parsing JSON file:", error);
        alert(`Error parsing file: ${error}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle creating an ActionNode when a file is clicked
  const handleCreateActionNode = (file: UploadedFile) => {
    const orderId = getNextOrderId();
    const newNodeId = `action-${orderId}`;
    const groupId = 1; // Default group
    const initialIsActive = true; // Set initial active state

    // Create a default display name that doesn't depend on file.name
    const defaultName = `Action ${fileCounter.current}`;

    // Create a sidebar node item for tracking
    const sidebarNode: SidebarNodeItem = {
      id: newNodeId,
      type: "action",
      name: defaultName,
      groupId,
      orderId,
      fileData: file,
      isActive: initialIsActive, // Use the explicit variable
    };

    setSidebarNodes((prev) => [...prev, sidebarNode]);

    const actionNode: Node<any, string> = {
      id: newNodeId,
      type: "actionNode",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: `${defaultName} (${fileCounter.current++})`,
        instructions: file.instructions,
        selectedInstruction: null,
        accountInputs: {},
        argInputs: {},
        groupId,
        orderId,
        isActive: initialIsActive,
        setActive: () => toggleNodeActive(newNodeId),
        onRemove: () => removeNode(newNodeId),
        updateLabel: (newLabel: string) => updateNodeLabel(newNodeId, newLabel),
        onSelectInstruction: (instructionName: string) => {
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              if (node.id === newNodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    selectedInstruction: instructionName,
                    accountInputs: {},
                    argInputs: {},
                  },
                };
              }
              return node;
            }),
          );
        },
        onAccountInputChange: (key: string, value: string) => {
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              if (node.id === newNodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    accountInputs: {
                      ...node.data.accountInputs,
                      [key]: value,
                    },
                  },
                };
              }
              return node;
            }),
          );
        },
        onArgInputChange: (key: string, value: string) => {
          setNodes((prevNodes) =>
            prevNodes.map((node) => {
              if (node.id === newNodeId) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    argInputs: {
                      ...node.data.argInputs,
                      [key]: value,
                    },
                  },
                };
              }
              return node;
            }),
          );
        },
      },
    };

    setNodes((prevNodes) => [...prevNodes, actionNode]);
  };

  const handleExecuteWorkflow = async () => {
    if (publicKey === null) {
      toast.error("No wallet connected");
      return;
    }

    // Define all steps
    const steps = [
      { text: "Creating Transaction", status: "pending" },
      { text: "Waiting for Signature", status: "pending" },
      { text: "Transaction Sent", status: "pending" },
      { text: "Confirming Transaction", status: "pending" },
    ] as const;

    // Update stepsCopy to explicitly match ProgressStep interface
    const stepsCopy: ProgressStep[] = steps.map((step) => ({
      text: step.text,
      status: step.status as "pending" | "loading" | "complete",
    }));

    // Create initial toast with first step loading
    if (stepsCopy[0]) {
      stepsCopy[0].status = "loading";
    }
    const toastRender = (
      <ProgressSteps steps={stepsCopy} signature={latestSignature.current} />
    );
    const toastId = toast.info(toastRender, {
      autoClose: false,
      icon: false, // Remove the info icon
      closeButton: false,
    });

    // Update toast helper function
    const updateSteps = (currentStepIndex: number, error?: boolean) => {
      if (error) {
        if (stepsCopy[currentStepIndex]) {
          stepsCopy[currentStepIndex].status = "pending";
        }
        toast.update(toastId, {
          type: "error",
          render: (
            <ProgressSteps
              steps={stepsCopy}
              signature={latestSignature.current}
            />
          ),
          autoClose: 5000,
          icon: false, // Remove icon
        });
        return;
      }

      // First mark the current step as complete
      if (stepsCopy[currentStepIndex]) {
        stepsCopy[currentStepIndex].status = "complete";
      }

      toast.update(toastId, {
        render: (
          <ProgressSteps
            steps={stepsCopy}
            signature={latestSignature.current}
          />
        ),
        icon: false, // Remove icon
      });

      // Wait at least 1 second before starting the next step
      if (stepsCopy[currentStepIndex + 1]) {
        setTimeout(() => {
          const nextStep = stepsCopy[currentStepIndex + 1];
          if (nextStep) {
            nextStep.status = "loading";
            toast.update(toastId, {
              render: (
                <ProgressSteps
                  steps={stepsCopy}
                  signature={latestSignature.current}
                />
              ),
              icon: false, // Remove icon
            });
          }
        }, 1000); // Ensure at least 1 second between steps
      }
    };

    try {
      // Call the transaction API endpoint to process nodes and create the transaction
      const response = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodes,
          publicKey: publicKey.toBase58(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process transaction");
      }

      const {
        transaction: transactionBase64,
        extraSigners,
        blockhash,
      } = await response.json();

      if (!transactionBase64) {
        throw new Error("No transaction returned from server");
      }

      updateSteps(0); // Complete Creating Transaction, start Waiting for Signature

      // Deserialize the transaction
      const transaction = VersionedTransaction.deserialize(
        Buffer.from(transactionBase64, "base64"),
      );

      // Convert extraSigners from JSON and sign the transaction
      if (extraSigners && extraSigners.length > 0) {
        for (const signerData of extraSigners) {
          const signer = Keypair.fromSecretKey(
            new Uint8Array(signerData.secretKey),
          );
          transaction.sign([signer]);
        }
      }

      // Wait for the previous step animation to complete
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const signature = await sendTransaction(transaction, connection);
      latestSignature.current = signature;

      // Update the toast with the signature immediately after obtaining it
      toast.update(toastId, {
        render: <ProgressSteps steps={stepsCopy} signature={signature} />,
        icon: false,
        closeButton: false,
      });

      updateSteps(1); // Complete Waiting for Signature, start Transaction Sent

      // Wait for animation before starting next step
      await new Promise((resolve) => setTimeout(resolve, 1200));
      updateSteps(2); // Complete Transaction Sent, start Confirming Transaction

      const confirmation = await connection.confirmTransaction(signature);

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      // Wait for the last step animation to complete
      await new Promise((resolve) => setTimeout(resolve, 1200));
      // All steps complete
      updateSteps(3);

      // Keep the external link but update auto-close
      setTimeout(() => {
        toast.update(toastId, {
          autoClose: 5000,
        });
      }, 1200);
    } catch (error) {
      console.error("Transaction error:", error);
      // Find the current loading step and mark it as error
      const currentLoadingIndex = stepsCopy.findIndex(
        (step) => step.status === "loading",
      );
      if (currentLoadingIndex !== -1) {
        updateSteps(currentLoadingIndex, true);
      }
    }
  };

  // Add handleAddJupiterNode function
  const handleAddJupiterNode = (
    sellingToken: string = TOKENS[0]?.id || "SOL",
    buyingToken: string = TOKENS[1]?.id || "USDC",
    swapAmount: string = "",
    slippage: string = "",
  ) => {
    const newCounter = nodes.length + 1;
    console.log("calling handleAddJupiterNode");
    console.log("sellingToken:", sellingToken);
    console.log("buyingToken:", buyingToken);
    console.log("swapAmount:", swapAmount);
    console.log("slippage:", slippage);

    const orderId = getNextOrderId();
    const newNodeId = `jupiter-${orderId}`;
    const groupId = 1; // Default group
    const initialIsActive = true; // Set initial active state

    // Create a sidebar node item for tracking
    const sidebarNode: SidebarNodeItem = {
      id: newNodeId,
      type: "jupiter",
      name: `Jupiter Swap ${orderId}`,
      groupId,
      orderId,
      isActive: initialIsActive, // Use the explicit variable
    };

    setSidebarNodes((prev) => [...prev, sidebarNode]);

    // Get the ids of the first two tokens from the TOKENS array
    const defaultSellingToken = TOKENS[0]?.id || "SOL";
    const defaultBuyingToken = TOKENS[1]?.id || "USDC";

    const jupiterNode: Node<any, string> = {
      id: newNodeId,
      type: "jupiterNode",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: `Jupiter Swap (${fileCounter.current++})`,
        isActive: initialIsActive,
        args: {
          sellingToken: sellingToken,
          buyingToken: buyingToken,
          swapAmount: swapAmount,
          slippage: slippage,
        },
        groupId,
        orderId,
        setActive: () => toggleNodeActive(newNodeId),
        onRemove: () => removeNode(newNodeId),
        updateLabel: (newLabel: string) => updateNodeLabel(newNodeId, newLabel),
      },
    };

    setNodes((prevNodes) => [...prevNodes, jupiterNode]);
  };

  // Add handleAddMeteoraNode function
  const handleAddMeteoraNode = () => {
    const newCounter = nodes.length + 1;

    const orderId = getNextOrderId();
    const newNodeId = `meteora-${orderId}`;
    const groupId = 1; // Default group
    const initialIsActive = true; // Set initial active state

    // Create a sidebar node item for tracking
    const sidebarNode: SidebarNodeItem = {
      id: newNodeId,
      type: "meteora",
      name: `Meteora LP ${orderId}`,
      groupId,
      orderId,
      isActive: initialIsActive, // Use the explicit variable
    };

    setSidebarNodes((prev) => [...prev, sidebarNode]);

    const meteoraNode: Node<any, string> = {
      id: newNodeId,
      type: "meteoraNode",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: {
        label: `Meteora LP (${fileCounter.current++})`,
        isActive: initialIsActive,
        args: {
          poolAddress: "",
          totalRangeInterval: "10",
          strategyType: "0", // Default to Spot
          inputTokenAmount: "",
        },
        groupId,
        orderId,
        setActive: () => toggleNodeActive(newNodeId),
        onRemove: () => removeNode(newNodeId),
        updateLabel: (newLabel: string) => updateNodeLabel(newNodeId, newLabel),
      },
    };

    setNodes((prevNodes) => [...prevNodes, meteoraNode]);
  };

  // Add event handlers for node creation
  useEffect(() => {
    const handleTransferNode = (event: CustomEvent) => {
      const { address, amount } = event.detail;
      handleAddTransferNode(address, amount);
    };

    const handleJupiterNode = (event: CustomEvent) => {
      const { sellingToken, buyingToken, swapAmount, slippage } = event.detail;
      handleAddJupiterNode(sellingToken, buyingToken, swapAmount, slippage);
    };

    window.addEventListener(
      "createTransferNode",
      handleTransferNode as EventListener,
    );
    window.addEventListener(
      "createJupiterNode",
      handleJupiterNode as EventListener,
    );

    return () => {
      window.removeEventListener(
        "createTransferNode",
        handleTransferNode as EventListener,
      );
      window.removeEventListener(
        "createJupiterNode",
        handleJupiterNode as EventListener,
      );
    };
  }, []);

  return (
    <div className="relative">
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -224 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -224 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="h-full w-56"
          >
            <Paper className="h-full border border-l-0 border-charcoal-gray p-6">
              <Stack gap="md">
                {/* File upload section */}
                <Text fw={600} ta="center" size="lg">
                  Actions
                </Text>

                <FileButton
                  onChange={handleFileUpload}
                  accept=".json"
                  multiple={false}
                >
                  {(props) => (
                    <Button
                      {...props}
                      variant="light"
                      leftSection={<IconUpload size={16} />}
                      fullWidth
                    >
                      Anchor IDL
                    </Button>
                  )}
                </FileButton>

                {/* Uploaded files section */}
                {uploadedFiles.length > 0 && (
                  <Stack gap="xs">
                    <Text fw={600} size="lg">
                      Available Programs ({uploadedFiles.length})
                    </Text>
                    <ScrollArea h={240}>
                      <Stack gap="xs">
                        {uploadedFiles.map((file, index) => {
                          const fileName = file.name || `File ${index + 1}`;
                          const displayName = fileName.includes(".")
                            ? fileName.split(".")[0]
                            : fileName;

                          return (
                            <Paper
                              key={`${fileName}-${index}`}
                              p="xs"
                              withBorder
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() => handleCreateActionNode(file)}
                            >
                              <Group justify="space-between">
                                <div>
                                  <Text fw={500}>{displayName}</Text>
                                  <Text size="xs" c="dimmed">
                                    {file.instructions.length} instructions •
                                    Added{" "}
                                    {new Date(file.timestamp).toLocaleString()}
                                  </Text>
                                </div>
                                <ActionIcon
                                  variant="subtle"
                                  color="red"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      confirm(
                                        `Remove program "${displayName}"?`,
                                      )
                                    ) {
                                      setUploadedFiles((prev) => {
                                        const updated = prev.filter(
                                          (_, i) => i !== index,
                                        );
                                        localStorage.setItem(
                                          GLOBAL_PROGRAMS_STORAGE_KEY,
                                          JSON.stringify(updated),
                                        );
                                        return updated;
                                      });
                                      setTimeout(
                                        () => saveWorkflow(false),
                                        100,
                                      );
                                    }
                                  }}
                                >
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    </ScrollArea>
                    <Button
                      variant="subtle"
                      color="red"
                      size="xs"
                      onClick={() => {
                        if (
                          confirm(
                            `Clear all ${uploadedFiles.length} programs? This cannot be undone.`,
                          )
                        ) {
                          setUploadedFiles([]);
                          localStorage.removeItem(GLOBAL_PROGRAMS_STORAGE_KEY);
                          setTimeout(() => saveWorkflow(false), 100);
                        }
                      }}
                    >
                      Clear All Programs
                    </Button>
                  </Stack>
                )}

                {/* Action Buttons */}
                <Button
                  variant="light"
                  color="blue"
                  fullWidth
                  onClick={() => handleAddTransferNode()}
                >
                  SOL Transfer
                </Button>

                <Button
                  variant="light"
                  color="blue"
                  fullWidth
                  onClick={() => handleAddJupiterNode()}
                >
                  Jupiter Swap
                </Button>

                <Button
                  variant="light"
                  color="blue"
                  fullWidth
                  onClick={handleAddMeteoraNode}
                >
                  Meteora DLMM
                </Button>

                {/* <Group gap="xs">
                  <Button
                    variant="filled"
                    color="blue"
                    fullWidth
                    onClick={() => saveWorkflow(true)}
                  >
                    Save Workflow
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    fullWidth
                    onClick={clearSavedWorkflow}
                  >
                    Clear Saved
                  </Button>
                </Group> */}

                <Button
                  variant="filled"
                  color="blue"
                  fullWidth
                  onClick={() => handleExecuteWorkflow()}
                >
                  Execute Workflow
                </Button>

                <ToastContainer
                  position="bottom-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                />
              </Stack>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SideBar;

/*


    <motion.button
        initial={false}
        animate={{
          x: isCollapsed ? 0 : 0,
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="border-1 absolute -top-2 right-0 z-10 flex h-6 w-6 translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-50"
      >
        {isCollapsed ? (
          <IconChevronRight size={16} className="text-gray-600" />
        ) : (
          <IconChevronLeft size={16} className="text-gray-600" />
        )}
      </motion.button>

      */
