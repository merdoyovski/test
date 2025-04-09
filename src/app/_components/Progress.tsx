import {
  IconLoader2,
  IconCircleCheck,
  IconExternalLink,
  IconX,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

export interface ProgressStep {
  text: string;
  status: "pending" | "loading" | "complete";
}

export const ProgressSteps = ({
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
