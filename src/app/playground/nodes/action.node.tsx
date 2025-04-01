"use client";
import { useState, useEffect } from "react";
import { Select, TextInput, Checkbox } from '@mantine/core';

// Define interfaces for the object structure
interface AccountOrArg {
  name: string;
  writable: boolean;
  [key: string]: any; // For any other properties that might exist
}

interface Instruction {
  name: string;
  accounts: (string | AccountOrArg)[];
  args: (string | AccountOrArg)[];
}

interface ActionNodeProps {
  data: {
    label: string;
    instructions: Instruction[];
    selectedInstruction: string | null;
    onSelectInstruction: (instructionName: string) => void;
    // Add storage for inputs
    accountInputs: { [key: string]: string };
    argInputs: { [key: string]: string };
    // Add callbacks to update the inputs
    onAccountInputChange: (key: string, value: string) => void;
    onArgInputChange: (key: string, value: string) => void;
    // Add group and order IDs
    groupId: number;
    orderId: number;
    // Add active state and actions
    isActive: boolean;
    setActive: () => void;
    onRemove: () => void;
    // Add a function to update the label
    updateLabel?: (newLabel: string) => void;
  };
}

export const ActionNode = ({ data }: ActionNodeProps) => {
  const { 
    label, 
    instructions, 
    selectedInstruction, 
    onSelectInstruction, 
    accountInputs, 
    argInputs, 
    onAccountInputChange, 
    onArgInputChange,
    groupId,
    orderId,
    isActive,
    setActive,
    onRemove,
    updateLabel
  } = data;

  // Keep track of selected instruction locally for the UI
  const [selected, setSelected] = useState(selectedInstruction);
  const [activeState, setActiveState] = useState(isActive);
  // Add state for label editing
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(label);

  // Sync local state with props when they change
  useEffect(() => {
    setActiveState(isActive);
  }, [isActive]);

  // Sync label state with props
  useEffect(() => {
    setLabelValue(label);
  }, [label]);

  const handleInstructionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const instructionName = e.target.value;
    setSelected(instructionName);
    onSelectInstruction(instructionName);
    
    // Log the selected instruction details for debugging
    const selectedInstr = instructions.find(instr => instr.name === instructionName);
    console.log("Selected instruction:", selectedInstr);
    if (selectedInstr) {
      console.log("Accounts:", selectedInstr.accounts);
      console.log("Args:", selectedInstr.args);
    }
  };

  const handleIsActiveChange = () => {
    // Log current states before update
    console.log("ActionNode handleIsActiveChange:");
    console.log("- Current local activeState:", activeState);
    console.log("- Current props isActive:", isActive);
    
    // Update local state first for immediate UI feedback
    setActiveState(!activeState);
    
    // Call parent component's setActive function to update node data
    console.log("- Calling setActive function...");
    setActive();
    
    // Log the expected new state
    console.log("- Expected new activeState:", !activeState);
  };

  const handleRemoveClick = () => {
    // Call parent component's onRemove function to remove the node
    onRemove();
  };

  // Functions for label editing
  const handleEditClick = () => {
    setIsEditingLabel(true);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLabelValue(e.target.value);
  };

  const handleLabelSave = () => {
    if (updateLabel && labelValue.trim() !== '') {
      updateLabel(labelValue);
    }
    setIsEditingLabel(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleLabelSave();
    } else if (e.key === 'Escape') {
      // Reset to original label and exit edit mode
      setLabelValue(label);
      setIsEditingLabel(false);
    }
  };

  // Helper function to get the name of an account or arg
  const getName = (item: string | AccountOrArg): string => {
    if (typeof item === 'string') {
      return item;
    }
    return item.name;
  };

  // Helper function to determine if an item is writable
  const isWritable = (item: string | AccountOrArg): boolean => {
    if (typeof item === 'string') {
      return true; // Assume string items are writable by default
    }
    return item.writable;
  };

  const currentInstruction = instructions.find((instr) => instr.name === selected);

  return (
    <div className="relative rounded-lg border border-gray-200 bg-white p-4 text-black shadow-sm">
      <div className="absolute right-2 top-2 flex space-x-2">
        <button
          onClick={handleEditClick}
          className="text-blue-500 hover:text-blue-700"
          title="Edit Label"
        >
          ✎
        </button>
        <button
          onClick={handleRemoveClick}
          className="text-red-500 hover:text-red-700"
          title="Remove Node"
        >
          ✖
        </button>
      </div>
      <div className="absolute left-2 top-2 flex">
        <Checkbox
          checked={activeState}
          onChange={handleIsActiveChange}
          size="xs"
          label="Active"
        />
      </div>

      {isEditingLabel ? (
        <div className="mb-4 mt-4 flex items-center">
          <input
            type="text"
            value={labelValue}
            onChange={handleLabelChange}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border border-gray-300 p-1 font-bold text-black"
            autoFocus
          />
          <button
            onClick={handleLabelSave}
            className="ml-2 rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      ) : (
        <h3 className="mb-4 mt-4 font-bold">{label}</h3>
      )}
      
      {/* Display group and order IDs */}
      <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
        <span>Group: {groupId}</span>
        <span>Order: {orderId}</span>
      </div>

      <div className="mb-4">
        <Select
          label="Instruction"
          placeholder="Select an instruction"
          value={selected || ""}
          onChange={(value) => {
            setSelected(value || "");
            onSelectInstruction(value || "");
          }}
          data={instructions.map((instr) => ({
            value: instr.name,
            label: instr.name
          }))}
        />
      </div>

      {currentInstruction && (
        <div className="mt-4">
          {currentInstruction.accounts.map((account, index) => {
            const name = getName(account);
            const writable = isWritable(account);
            
            return (
              <div key={`account-${name}-${index}`} className="mb-4">
                <TextInput
                  label={`${name} ${writable ? '(writable)' : '(read-only)'}`}
                  value={accountInputs[name] || ""}
                  onChange={(e) => onAccountInputChange(name, e.target.value)}
                  placeholder={`Enter ${name}`}
                  readOnly={!writable}
                />
              </div>
            );
          })}
          {currentInstruction.args.map((arg, index) => {
            const name = getName(arg);
            
            return (
              <div key={`arg-${name}-${index}`} className="mb-4">
                <TextInput
                  label={name}
                  value={argInputs[name] || ""}
                  onChange={(e) => onArgInputChange(name, e.target.value)}
                  placeholder={`Enter ${name}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}; 