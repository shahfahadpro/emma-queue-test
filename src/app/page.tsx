"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface ComputeResult {
  id: string;
  operation: string;
  result: number | null;
  error: string | null;
  completedAt: string | null;
}

interface Job {
  id: string;
  numberA: number;
  numberB: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number;
  results: ComputeResult[];
}

export default function Home() {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [useLLM, setUseLLM] = useState(false);
  const [computing, setComputing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ComputeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollJobStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/jobs?jobId=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }

      const job: Job = await response.json();
      setProgress(job.progress);
      setResults(job.results);

      if (job.status === "COMPLETED" || job.status === "FAILED") {
        setComputing(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (err) {
      console.error("Error polling job status:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch job status"
      );
    }
  };

  const handleCompute = async () => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);

    if (isNaN(numA) || isNaN(numB)) {
      setError("Please enter valid numbers");
      return;
    }

    setComputing(true);
    setProgress(0);
    setResults([]);
    setError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numberA: numA,
          numberB: numB,
          useLLM,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create job");
      }

      const data = await response.json();
      const newJobId = data.jobId;

      pollJobStatus(newJobId);
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(newJobId);
      }, 500);
    } catch (err) {
      console.error("Error creating job:", err);
      setError(err instanceof Error ? err.message : "Failed to create job");
      setComputing(false);
    }
  };

  const getOperationLabel = (operation: string): string => {
    switch (operation) {
      case "add":
        return "A + B";
      case "subtract":
        return "A - B";
      case "multiply":
        return "A × B";
      case "divide":
        return "A ÷ B";
      default:
        return operation;
    }
  };

  const formatResult = (result: ComputeResult): string => {
    if (result.error) {
      return `Error: ${result.error}`;
    }
    if (result.result !== null) {
      return result.result.toString();
    }
    return "--";
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md bg-white flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
        <div className="px-6">
          <h2 className="text-xl leading-none font-semibold">
            Compute Queue Test
          </h2>
        </div>
        <div className="px-6 space-y-6">
          <div className="space-y-4">
            <Label htmlFor="a">Number A</Label>
            <Input
              id="a"
              type="number"
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="Enter number A"
              disabled={computing}
            />

            <Label htmlFor="b">Number B</Label>
            <Input
              id="b"
              type="number"
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder="Enter number B"
              disabled={computing}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useLLM"
              checked={useLLM}
              onChange={(e) => setUseLLM(e.target.checked)}
              disabled={computing}
              className="h-4 w-4 cursor-pointer"
            />
            <Label htmlFor="useLLM" className="text-sm cursor-pointer">
              Use AI (LLM) for computation
            </Label>
          </div>

          <Button
            onClick={handleCompute}
            disabled={!a || !b || computing}
            className="w-full"
          >
            {computing ? "Computing..." : "Compute"}
          </Button>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          {computing && (
            <>
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-gray-600">Progress: {progress}%</div>
            </>
          )}

          {(results.length > 0 || computing) && (
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium">Results:</h3>
              <div className="space-y-2 text-sm">
                {["add", "subtract", "multiply", "divide"].map((op) => {
                  const result = results.find((r) => r.operation === op);
                  return (
                    <div
                      key={op}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span>{getOperationLabel(op)}:</span>
                      <span
                        className={
                          result?.error
                            ? "text-red-600"
                            : result?.result !== null
                            ? "text-gray-900 font-medium"
                            : "text-gray-400"
                        }
                      >
                        {result ? formatResult(result) : "--"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
