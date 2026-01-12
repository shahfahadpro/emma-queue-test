import { PrismaClient } from "@prisma/client";
import { connectMongoDB, ComputeJobModel, ComputeResultModel } from "./mongodb";

const USE_MONGODB = !!process.env.MONGODB_URI;

if (typeof window === "undefined") {
  console.log(`Database: ${USE_MONGODB ? "MongoDB" : "SQLite"}`);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const db = {
  computeJob: {
    create: async (data: {
      numberA: number;
      numberB: number;
      status?: string;
      progress?: number;
    }) => {
      if (USE_MONGODB) {
        try {
          await connectMongoDB();
          const id = `job_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 11)}`;
          const job = await ComputeJobModel.create({
            _id: id,
            numberA: data.numberA,
            numberB: data.numberB,
            status: data.status || "PENDING",
            progress: data.progress || 0,
          });
          const jobObj = job.toObject();
          return {
            id: jobObj._id,
            numberA: jobObj.numberA,
            numberB: jobObj.numberB,
            status: jobObj.status,
            progress: jobObj.progress,
            createdAt: jobObj.createdAt,
            updatedAt: jobObj.updatedAt,
          };
        } catch (error) {
          const isProduction = process.env.NODE_ENV === "production";
          if (isProduction) {
            console.error("MongoDB connection failed in production:", error);
            throw error;
          }
          console.warn(
            "MongoDB connection failed, falling back to SQLite:",
            error
          );
          return await prisma.computeJob.create({ data });
        }
      } else {
        return await prisma.computeJob.create({ data });
      }
    },

    findUnique: async (args: { where: { id: string } }) => {
      if (USE_MONGODB) {
        await connectMongoDB();
        const job = await ComputeJobModel.findById(args.where.id);
        if (!job) return null;
        const results = await ComputeResultModel.find({
          jobId: args.where.id,
        }).sort({ createdAt: 1 });
        const jobObj = job.toObject();
        return {
          id: jobObj._id,
          numberA: jobObj.numberA,
          numberB: jobObj.numberB,
          status: jobObj.status,
          progress: jobObj.progress,
          createdAt: jobObj.createdAt,
          updatedAt: jobObj.updatedAt,
          results: results.map((r) => ({
            id: r._id,
            jobId: r.jobId,
            operation: r.operation,
            result: r.result,
            error: r.error,
            completedAt: r.completedAt,
            createdAt: r.createdAt,
          })),
        };
      } else {
        return await prisma.computeJob.findUnique({
          where: args.where,
          include: { results: { orderBy: { createdAt: "asc" } } },
        });
      }
    },

    update: async (args: {
      where: { id: string };
      data: { status?: string; progress?: number };
    }) => {
      if (USE_MONGODB) {
        await connectMongoDB();
        const job = await ComputeJobModel.findByIdAndUpdate(
          args.where.id,
          { ...args.data, updatedAt: new Date() },
          { new: true }
        );
        if (!job) {
          const exists = await ComputeJobModel.findById(args.where.id);
          if (!exists) {
            throw new Error(`Job not found: ${args.where.id}`);
          }
          throw new Error(`Failed to update job: ${args.where.id}`);
        }
        const jobObj = job.toObject();
        return {
          id: jobObj._id,
          numberA: jobObj.numberA,
          numberB: jobObj.numberB,
          status: jobObj.status,
          progress: jobObj.progress,
          createdAt: jobObj.createdAt,
          updatedAt: jobObj.updatedAt,
        };
      } else {
        return await prisma.computeJob.update(args);
      }
    },
  },

  computeResult: {
    create: async (data: {
      jobId: string;
      operation: string;
      result?: number | null;
      error?: string | null;
      completedAt?: Date | null;
    }) => {
      if (USE_MONGODB) {
        await connectMongoDB();
        const id = `result_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 11)}`;
        const result = await ComputeResultModel.create({
          _id: id,
          jobId: data.jobId,
          operation: data.operation,
          result: data.result ?? null,
          error: data.error ?? null,
          completedAt: data.completedAt || new Date(),
        });
        const resultObj = result.toObject();
        return {
          id: resultObj._id,
          jobId: resultObj.jobId,
          operation: resultObj.operation,
          result: resultObj.result,
          error: resultObj.error,
          completedAt: resultObj.completedAt,
          createdAt: resultObj.createdAt,
        };
      } else {
        return await prisma.computeResult.create({ data });
      }
    },

    findMany: async (args: { where: { jobId: string } }) => {
      if (USE_MONGODB) {
        await connectMongoDB();
        const results = await ComputeResultModel.find(args.where).sort({
          createdAt: 1,
        });
        return results.map((r) => {
          const rObj = r.toObject();
          return {
            id: rObj._id,
            jobId: rObj.jobId,
            operation: rObj.operation,
            result: rObj.result,
            error: rObj.error,
            completedAt: rObj.completedAt,
            createdAt: rObj.createdAt,
          };
        });
      } else {
        return await prisma.computeResult.findMany(args);
      }
    },
  },
};

export { prisma };
