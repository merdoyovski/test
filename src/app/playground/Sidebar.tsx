// SideBar.tsx
"use client";
import React, { useRef, useState, useEffect } from "react";
import type { Node, Edge } from "reactflow";
import { Keypair, VersionedTransaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TOKENS } from "../_constants/solana.tokens";
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
} from "@mantine/core";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveWorkflow } from "../api/workflowApi";
import { actionTypeMap, EnumActionType } from "../_constants/node.types";
import { ProgressStep, ProgressSteps } from "../_components/Progress";
import { emptyGuid } from "../_constants/constants";

// Define interface for uploaded IDL files
interface UploadedFile {
  name: string;
  instructions: any[];
  timestamp: number;
}

// Define interface for the node in sidebar (for ordering)
interface SidebarNodeItem {
  id: string;
  type: "action" | "transfer" | "jupiter" | "meteora";
  name: string;
  groupId: number;
  orderId: number;
  fileData?: UploadedFile;
  isActive: boolean;
}

interface SideBarProps {
  setNodes: (nodes: Node[]) => void;
  nodes: Node[];
  workflowId: string;
  workflowName: string;
}

// Update the ProgressSteps component with proper typing

export const SideBar = ({
  setNodes,
  nodes,
  workflowId,
  workflowName,
}: SideBarProps) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const fileCounter = useRef(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [sidebarNodes, setSidebarNodes] = useState<SidebarNodeItem[]>([]);

  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  const latestSignature = useRef("");

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

  // Utility function to remove a node
  const removeNode = (nodeId: string) => {
    setNodes((prevNodes: Node[]) =>
      prevNodes.filter((node: Node) => node.id !== nodeId),
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

  const handleAddTransferNode = (address: string = "", amount: string = "") => {
    const orderId = getNextOrderId();
    const newNodeId = "tbdOnServer";
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
            name: file.name || `File-${Date.now()}`,
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
    const newNodeId = "tbdOnServer";
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

    setNodes((prevNodes: any) => [...prevNodes, jupiterNode]);
  };

  // Add handleAddMeteoraNode function
  const handleAddMeteoraNode = () => {
    const newCounter = nodes.length + 1;

    const orderId = getNextOrderId();
    const newNodeId = "tbdOnServer";
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

  const handleSaveWorkflow = async () => {
    console.log("nodes for post: ", nodes);

    try {
      const workflowData = {
        ID: workflowId === "tbdOnServer" ? emptyGuid : workflowId,
        Name: workflowName,
        Actions: nodes.map((node) => ({
          Type: actionTypeMap[node.type!] ?? EnumActionType.NONE,
          Name: node.data?.label,
          Node: JSON.stringify(node),
        })),
      };

      await saveWorkflow(workflowData);
      toast.success("Workflow saved successfully!");
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast.error("Failed to save workflow");
    }
  };

  return (
    <div className="relative">
      <AnimatePresence>
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
                                    confirm(`Remove program "${displayName}"?`)
                                  ) {
                                    setUploadedFiles((prev) => {
                                      const updated = prev.filter(
                                        (_, i) => i !== index,
                                      );
                                      return updated;
                                    });
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

              <Button
                variant="filled"
                color="blue"
                fullWidth
                onClick={() => handleExecuteWorkflow()}
              >
                Execute Workflow
              </Button>

              <Button
                variant="filled"
                color="blue"
                fullWidth
                onClick={handleSaveWorkflow}
              >
                Save Workflow
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
