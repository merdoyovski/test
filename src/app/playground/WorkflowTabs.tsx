"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

export interface Workflow {
  id: string;
  name: string;
  isActive: boolean;
}

interface WorkflowTabsProps {
  workflows: Workflow[];
  activeWorkflowId: string;
  onSelectWorkflow: (id: string) => void;
  onAddWorkflow: () => void;
  onRenameWorkflow: (id: string, newName: string) => void;
  onCloseWorkflow: (id: string) => void;
}

export const WorkflowTabs: React.FC<WorkflowTabsProps> = ({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  onAddWorkflow,
  onRenameWorkflow,
  onCloseWorkflow,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [walletText, setWalletText] = useState("Login");

  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  useEffect(() => {
    if (!publicKey) {
      setWalletText("Login");
    } else {
      setWalletText(
        publicKey.toBase58().slice(0, 4) +
          "..." +
          publicKey.toBase58().slice(-4),
      );
    }
  }, [publicKey]);
  const handleDoubleClick = useCallback((workflow: Workflow) => {
    setEditingTabId(workflow.id);
    setEditingName(workflow.name);
    // Focus on the input after it renders
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 10);
  }, []);

  const handleEditChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingName(e.target.value);
    },
    [],
  );

  const handleEditBlur = useCallback(() => {
    if (editingTabId && editingName.trim()) {
      onRenameWorkflow(editingTabId, editingName.trim());
    }
    setEditingTabId(null);
  }, [editingTabId, editingName, onRenameWorkflow]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleEditBlur();
      } else if (e.key === "Escape") {
        setEditingTabId(null);
      }
    },
    [handleEditBlur],
  );

  const handleClose = useCallback(
    (e: React.MouseEvent, workflowId: string) => {
      e.stopPropagation();
      onCloseWorkflow(workflowId);
    },
    [onCloseWorkflow],
  );

  const handleSelectWorkflow = useCallback(
    (workflowId: string) => {
      // Only trigger if this isn't already the active workflow
      if (workflowId !== activeWorkflowId) {
        onSelectWorkflow(workflowId);
      }
    },
    [activeWorkflowId, onSelectWorkflow],
  );

  const handleAddWorkflowClick = useCallback(() => {
    if (workflows.length >= 5) {
      toast.error("You can have a maximum of 5 workflows at a time.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      return;
    }
    onAddWorkflow();
  }, [workflows.length, onAddWorkflow]);

  return (
    <div className="relative flex items-center justify-between border-b border-gray-200 bg-charcoal-gray">
      <div className="flex items-center overflow-x-auto">
        {workflows.map((workflow, index) => (
          <React.Fragment key={workflow.id}>
            <div
              className={`mb-1 mr-1 mt-1 flex h-7 min-w-[120px] max-w-[200px] cursor-pointer select-none items-center rounded-md rounded-t-lg px-2 py-0.5 ${
                index === 0 ? "" : ""
              } ${
                workflow.id === activeWorkflowId
                  ? "border-b-0 border-gray-200 border-t-white bg-soft-black text-white"
                  : "bg-charcoal-gray text-white hover:bg-soft-black"
              }`}
              onClick={() => handleSelectWorkflow(workflow.id)}
              onDoubleClick={() => handleDoubleClick(workflow)}
            >
              {editingTabId === workflow.id ? (
                <input
                  ref={editInputRef}
                  value={editingName}
                  onChange={handleEditChange}
                  onBlur={handleEditBlur}
                  onKeyDown={handleEditKeyDown}
                  className="w-full bg-transparent outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex w-full items-center justify-center">
                  <div className="w-4"></div>
                  <span className="flex-1 truncate text-center text-sm">
                    {workflow.name}
                  </span>
                  <div className="ml-1 flex w-4 justify-center">
                    {workflows.length > 1 &&
                      workflow.id === activeWorkflowId && (
                        <button
                          className="text-gray-500 hover:text-gray-800"
                          onClick={(e) => handleClose(e, workflow.id)}
                        >
                          <X size={14} />
                        </button>
                      )}
                  </div>
                </div>
              )}
            </div>
            {index < workflows.length - 1 && (
              <div className="mx-2 flex items-center text-gray-400">|</div>
            )}
          </React.Fragment>
        ))}
        <button
          className="flex h-7 w-7 items-center justify-center rounded-sm text-gray-600 hover:bg-gray-200"
          onClick={handleAddWorkflowClick}
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
};
