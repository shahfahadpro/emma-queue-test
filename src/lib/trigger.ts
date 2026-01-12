import { tasks } from "@trigger.dev/sdk/v3";
import { computeOperation } from "../../trigger/compute";

export { computeOperation };

export async function triggerComputeOperation(payload: {
  jobId: string;
  numberA: number;
  numberB: number;
  operation: "add" | "subtract" | "multiply" | "divide";
  useLLM?: boolean;
}) {
  return await tasks.trigger("compute-operation", payload);
}
