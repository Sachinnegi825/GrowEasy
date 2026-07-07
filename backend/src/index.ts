import "dotenv/config";
import express from "express";
import cors from "cors";
import importRouter from "./routes/import";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "GrowEasy CSV Importer API",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", importRouter);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[Error]", err.message);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`\n🚀 GrowEasy CSV Importer API running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});

export default app;
