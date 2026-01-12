import { task } from "@trigger.dev/sdk/v3";
import { db } from "../src/lib/db";
import { computeWithLLM } from "../src/lib/llm";

type JobOperation = "add" | "subtract" | "multiply" | "divide";

interface ComputeJobPayload {
  jobId: string;
  numberA: number;
  numberB: number;
  operation: JobOperation;
  useLLM?: boolean;
}

export const computeOperation = task({
  id: "compute-operation",
  queue: {
    concurrencyLimit: 4,
  },
  run: async (payload: ComputeJobPayload) => {
    const { jobId, numberA, numberB, operation, useLLM = false } = payload;

    try {
      await db.computeJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING" },
      });

      let result: number | undefined;
      let error: string | null = null;

      try {
        if (useLLM && process.env.GROQ_API_KEY) {
          try {
            result = await computeWithLLM(numberA, numberB, operation);
          } catch (llmError) {
            console.warn(
              `LLM computation failed, using direct computation:`,
              llmError
            );
          }
        }

        if (result === undefined) {
          switch (operation) {
            case "add":
              result = numberA + numberB;
              break;
            case "subtract":
              result = numberA - numberB;
              break;
            case "multiply":
              result = numberA * numberB;
              break;
            case "divide":
              if (numberB === 0) {
                throw new Error("Division by zero");
              }
              result = numberA / numberB;
              break;
            default:
              throw new Error(`Unknown operation: ${operation}`);
          }
        }

        if (result === undefined) {
          throw new Error("Computation failed: result is undefined");
        }

        await db.computeResult.create({
          jobId,
          operation,
          result,
          completedAt: new Date(),
        });
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        await db.computeResult.create({
          jobId,
          operation,
          error,
          completedAt: new Date(),
        });
      }

      const results = await db.computeResult.findMany({
        where: { jobId },
      });

      const progress = Math.min(results.length * 25, 100);
      await db.computeJob.update({
        where: { id: jobId },
        data: { progress },
      });

      if (results.length === 4) {
        const job = await db.computeJob.findUnique({
          where: { id: jobId },
        });

        if (job && job.status !== "COMPLETED" && job.status !== "FAILED") {
          const hasErrors = results.some(
            (r: { error: string | null }) => r.error !== null
          );
          await db.computeJob.update({
            where: { id: jobId },
            data: {
              status: hasErrors ? "FAILED" : "COMPLETED",
              progress: 100,
            },
          });
        }
      }

      return { success: true, result, error };
    } catch (error) {
      console.error(`Error processing job ${jobId}:`, error);
      await db.computeJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
        },
      });
      throw error;
    }
  },
});
