import { Router, Request, Response } from "express";
import multer from "multer";
import { parseCsvBuffer } from "../services/csvParser";
import { processBatches } from "../services/batchProcessor";

const router = Router();

// Memory storage — no disk writes needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are accepted"));
    }
  },
});

/**
 * POST /api/import
 *
 * Accepts a CSV file, parses it, runs AI extraction in batches,
 * and streams progress events via Server-Sent Events (SSE).
 *
 * Final event: { type: "complete", data: ImportResult }
 */
router.post(
  "/import",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No CSV file uploaded" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
      const { rows, total } = parseCsvBuffer(req.file.buffer);

      if (total === 0) {
        res.write(
          `data: ${JSON.stringify({ type: "error_fatal", message: "The CSV file contains no data rows." })}\n\n`
        );
        res.end();
        return;
      }

      res.write(
        `data: ${JSON.stringify({ type: "start", total_rows: total })}\n\n`
      );

      const result = await processBatches(rows, res);

      res.write(
        `data: ${JSON.stringify({ type: "complete", data: result })}\n\n`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      res.write(
        `data: ${JSON.stringify({ type: "error_fatal", message })}\n\n`
      );
    } finally {
      res.end();
    }
  }
);

/**
 * POST /api/export
 *
 * Accepts an array of CRM records as JSON and returns a downloadable CSV file.
 */
router.post("/export", (req: Request, res: Response): void => {
  const { records, filename } = req.body;

  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({ error: "No records to export" });
    return;
  }

  const FIELDS = [
    "created_at", "name", "email", "country_code",
    "mobile_without_country_code", "company", "city", "state",
    "country", "lead_owner", "crm_status", "crm_note",
    "data_source", "possession_time", "description",
  ];

  const header = FIELDS.join(",");
  const rows = records.map((r: Record<string, unknown>) =>
    FIELDS.map((key) => {
      const v = String(r[key] ?? "").replace(/"/g, '""');
      return v.includes(",") || v.includes("\n") || v.includes('"') ? `"${v}"` : v;
    }).join(",")
  );
  const csvContent = "\uFEFF" + [header, ...rows].join("\n");

  const safeName = (filename || "groweasy_crm_import.csv").replace(/[^a-zA-Z0-9_.-]/g, "_");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${safeName}"`);
  res.send(csvContent);
});

export default router;
