import mongoose from "mongoose";

let isConnected = false;

const ComputeJobSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    numberA: { type: Number, required: true },
    numberB: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
    },
    progress: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const ComputeResultSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    jobId: { type: String, required: true, index: true },
    operation: {
      type: String,
      enum: ["add", "subtract", "multiply", "divide"],
      required: true,
    },
    result: { type: Number, default: null },
    error: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const ComputeJobModel =
  mongoose.models.ComputeJob || mongoose.model("ComputeJob", ComputeJobSchema);

export const ComputeResultModel =
  mongoose.models.ComputeResult ||
  mongoose.model("ComputeResult", ComputeResultSchema);

export async function connectMongoDB() {
  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}
