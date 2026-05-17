import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { SchedulerService } from "./src/services/scheduler";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", service: "DutyGuard API" });
  });

  // Example API for Duty Generation
  app.post("/api/scheduler/generate", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ error: "Session ID required" });
      }
      const result = await SchedulerService.generateDuties(sessionId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/scheduler/critical-report", async (req, res) => {
    try {
      const { date, sessionType, startDate, endDate } = req.query;
      
      if (startDate && endDate) {
         const result = await SchedulerService.getCriticalSlotsRangeReport(startDate as string, endDate as string);
         return res.json(result);
      }

      if (!date || !sessionType) {
        return res.status(400).json({ error: "Either (startDate, endDate) or (date, sessionType) required" });
      }
      const result = await SchedulerService.getCriticalSlotsReport(date as string, sessionType as any);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
