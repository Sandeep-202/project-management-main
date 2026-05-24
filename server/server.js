import express from "express";
import "dotenv/config";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";

import { inngest, functions } from "./inngest/index.js";

import workspaceRouter from "./routes/workspaceRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";

import { protect } from "./middlewares/authMiddleware.js";

const app = express();

/* =========================
   MIDDLEWARES
========================= */

app.use(express.json());
app.use(cors());

/* Clerk Middleware */
app.use(clerkMiddleware());

/* =========================
   HEALTH CHECK
========================= */

app.get("/", (req, res) => {
  res.send("Server is live!");
});

/* =========================
   INNGEST ROUTE
========================= */

app.use("/api/inngest", serve({ client: inngest, functions }));

/* =========================
   API ROUTES
========================= */

app.use("/api/workspaces", workspaceRouter);

app.use("/api/projects", protect, projectRouter);

app.use("/api/tasks", protect, taskRouter);

app.use("/api/comments", protect, commentRouter);

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});