# Compute Queue Test

A Next.js application that processes computational jobs asynchronously using a queue/worker system. Users input two numbers, and the system computes four operations (A+B, A-B, A×B, A÷B) with real-time progress updates.

## Technologies

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **Trigger.dev** - Background job processing
- **MongoDB/Mongoose** - Production database (SQLite for local)
- **Tailwind CSS + Shadcn/ui** - Styling
- **Zod** - Schema validation
- **Groq SDK** - Optional LLM integration

## Features

- Asynchronous job processing with Trigger.dev
- Real-time progress updates via polling
- Parallel operation execution
- Optional LLM-powered computation
- Automatic database switching (SQLite local, MongoDB production)
- Error handling and input validation
- Modern, responsive UI

## Requirements Status

### ✅ Completed Requirements

**Core Requirements:**

- ✅ Next.js framework with React and Node.js
- ✅ Single page with form to enter numbers A and B
- ✅ Store numbers A and B in database
- ✅ Real-time progress bar showing job execution progress
- ✅ Display output of compute jobs as they complete
- ✅ UI styled with Tailwind CSS and Shadcn/ui components
- ✅ Queue/Worker system for managing jobs (Trigger.dev)
- ✅ Execute computations (A+B, A-B, A×B, A÷B) in parallel
- ✅ Save results to database
- ✅ Database integration (SQLite for local, MongoDB for production)
- ✅ Scripts to run solution locally

**Optional Bonus Tasks:**

- ✅ LLM integration for computations (Groq API)
- ✅ Type safety for all API interactions (TypeScript + Zod)
- ✅ Multiple jobs executed in parallel
- ✅ Queue/task manager (Trigger.dev)
- ✅ MongoDB database support
- ✅ Clean, modern UI design

### ⏳ Pending Requirements

**Optional Bonus Tasks:**

- ⏳ Monorepo setup with Turbo
- ⏳ tRPC integration (Zod schemas implemented, but not tRPC)
- ⏳ Deploy application to public URL
- ⏳ Deploy on Railway
- ⏳ CI/CD pipeline using GitHub Actions
- ⏳ OAuth login with Microsoft Entra ID
- ⏳ Redis caching
- ⏳ Unit tests for front-end and back-end

## How It Works

1. **User submits** two numbers (A and B) via the form
2. **API creates** a job record in the database
3. **Trigger.dev enqueues** four operations (add, subtract, multiply, divide) in parallel
4. **Workers process** each operation and save results to the database
5. **Progress updates** to 25%, 50%, 75%, 100% as each operation completes
6. **Frontend polls** the API every 500ms to display real-time progress
7. **Results appear** as each operation completes

## Local Development

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create `.env` file**

   ```env
   DATABASE_URL="file:./dev.db"
   TRIGGER_SECRET_KEY="tr_dev_..."  # Get from Trigger.dev dashboard
   ```

3. **Initialize database**

   ```bash
   npm run db:generate
   npm run db:push
   ```

4. **Start development server** (Terminal 1)

   ```bash
   npm run dev
   ```

5. **Start Trigger.dev worker** (Terminal 2 - required for job processing)

   ```bash
   npx trigger.dev@latest dev
   ```

   **Note**: The Trigger.dev worker is required for local development. Without it, jobs will be created but won't be processed.

6. **Open browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

### Environment Variables

| Variable             | Required | Purpose                                                               |
| -------------------- | -------- | --------------------------------------------------------------------- |
| `DATABASE_URL`       | Yes      | SQLite database path                                                      |
| `TRIGGER_SECRET_KEY` | Yes      | Trigger.dev secret key (get from Trigger.dev dashboard)                  |
| `MONGODB_URI`        | No       | MongoDB connection string (if set, uses MongoDB instead of SQLite)        |
| `GROQ_API_KEY`       | Optional | Groq API key for LLM-powered computation                                  |

### Deployment Steps

1. **Set environment variables** in your hosting platform

   ```env
   DATABASE_URL="file:./dev.db"
   TRIGGER_SECRET_KEY="tr_dev_..."
   MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/dbname"
   ```

2. **Build the application**

   ```bash
   npm run build
   ```

3. **Deploy** to your platform and ensure Trigger.dev worker is running

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
emma-queue-test/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/jobs/          # API endpoints
│   │   └── page.tsx           # Main UI
│   ├── components/ui/         # Shadcn/ui components
│   └── lib/
│       ├── db.ts              # Database interface
│       ├── mongodb.ts         # MongoDB connection
│       ├── trigger.ts         # Trigger.dev helpers
│       └── llm.ts            # LLM integration
└── trigger/
    └── compute.ts             # Background job tasks
```
