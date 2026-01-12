import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { triggerComputeOperation } from "@/lib/trigger";
import { z } from "zod";

const createJobSchema = z.object({
  numberA: z.number(),
  numberB: z.number(),
  useLLM: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { numberA, numberB, useLLM } = createJobSchema.parse(body);

    const job = await db.computeJob.create({
      numberA,
      numberB,
      status: "PENDING",
      progress: 0,
    });

    const operations: Array<"add" | "subtract" | "multiply" | "divide"> = [
      "add",
      "subtract",
      "multiply",
      "divide",
    ];

    await Promise.all(
      operations.map((operation) =>
        triggerComputeOperation({
          jobId: job.id,
          numberA,
          numberB,
          operation,
          useLLM,
        })
      )
    );

    return NextResponse.json({ jobId: job.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const job = await db.computeJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}
