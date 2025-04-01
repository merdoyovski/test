"use client";
import { useState } from "react";
import {
  Textarea,
  Button,
  Stack,
  Text,
  Paper,
  ScrollArea,
} from "@mantine/core";
import { IconSend } from "@tabler/icons-react";
import { sendMessageToOpenAI } from "../_services/openai";

interface AIChatPopProps {
  onClose: () => void;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIChatPop({ onClose }: AIChatPopProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendMessageToOpenAI(input.trim());

      let assistantMessage: Message;
      if (
        response.type === "transfer" &&
        response.params.address &&
        response.params.amount
      ) {
        assistantMessage = {
          role: "assistant",
          content: `I'll help you create a transfer node to send ${response.params.amount} SOL to ${response.params.address}.`,
        };
      } else if (
        response.type === "jupiter" &&
        response.params.sellingToken &&
        response.params.buyingToken
      ) {
        assistantMessage = {
          role: "assistant",
          content: `I'll help you create a Jupiter swap node to swap ${response.params.swapAmount} ${response.params.sellingToken} to ${response.params.buyingToken}.`,
        };
      } else {
        assistantMessage = {
          role: "assistant",
          content:
            "I couldn't understand your request. Please try again with more specific details about the node you want to create.",
        };
      }

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col">
      <ScrollArea className="flex-1 p-4">
        <Stack gap="md">
          {messages.map((message, index) => (
            <Paper
              key={index}
              className={`p-3 ${
                message.role === "user"
                  ? "ml-auto bg-blue-50"
                  : "mr-auto bg-gray-50"
              }`}
              style={{ maxWidth: "80%" }}
            >
              <Text size="sm">{message.content}</Text>
            </Paper>
          ))}
          {isLoading && (
            <Paper
              className="mr-auto bg-gray-50 p-3"
              style={{ maxWidth: "80%" }}
            >
              <Text size="sm">Thinking...</Text>
            </Paper>
          )}
        </Stack>
      </ScrollArea>

      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="Ask me to create a node (e.g., 'Create a transfer node to send 1 SOL to address ABC123...' or 'Create a Jupiter swap to swap 10 SOL to USDC')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1"
            minRows={1}
            maxRows={4}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="self-end"
          >
            <IconSend size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
