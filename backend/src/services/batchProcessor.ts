import { Response } from "express";
import { CrmRecord, ImportResult, BatchProgress, BatchError } from "../types/crm";
import { chunkArray } from "./csvParser";
import { extractBatchWithAI } from "./aiExtractor";

const BATCH_SIZE = 10; // 10 rows is optimal for token limits
const MAX_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 3000;

/**
 * Sends an SSE event to the client.
 */
function sendSSE(
  res: Response,
  event: BatchProgress | BatchError | { type: string; [key: string]: unknown }
) {
  try {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  } catch {
    
  }
}

/**
 * Processes all CSV rows in batches with retry logic.
 * Streams progress events via SSE.
 * Returns the final ImportResult.
 */
export async function processBatches(
  rows: Record<string, string>[],
  res: Response
): Promise<ImportResult> {
  const batches = chunkArray(rows, BATCH_SIZE);
  const imported: CrmRecord[] = [];
  const skipped: Record<string, unknown>[] = [];
  let batchesFailed = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    const batchNumber = batchIdx + 1;
    let success = false;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        sendSSE(res, {
          type: "progress",
          batch: batchNumber,
          total_batches: batches.length,
          processed: imported.length + skipped.length,
          total_rows: rows.length,
          message:
            attempt === 1
              ? `Processing batch ${batchNumber} of ${batches.length}…`
              : `Retrying batch ${batchNumber} (attempt ${attempt}/${MAX_RETRIES})…`,
        } satisfies BatchProgress);

        const results = await extractBatchWithAI(batch);

        results.forEach((record, idx) => {
          if (record === null) {
            skipped.push(batch[idx]);
          } else {
            imported.push(record);
          }
        });

        success = true;
        break;
      } catch (err) {
        lastError = err as Error;
        const isLastAttempt = attempt === MAX_RETRIES;

        sendSSE(res, {
          type: "error",
          batch: batchNumber,
          message: `Batch ${batchNumber} failed: ${lastError.message}`,
          retrying: !isLastAttempt,
        } satisfies BatchError);

        if (!isLastAttempt) {
          
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    if (!success) {
      batchesFailed++;
      // Mark all rows in the failed batch as skipped
      batch.forEach((row) => skipped.push(row));
      console.error(`Batch ${batchNumber} permanently failed after ${MAX_RETRIES} attempts`);
    }

    // Free tier throttling: wait 3.5 seconds between batches to avoid rate limit spikes
    if (batchIdx < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 3500));
    }
  }

  const result: ImportResult = {
    imported,
    skipped,
    stats: {
      total: rows.length,
      imported: imported.length,
      skipped: skipped.length,
      batches_processed: batches.length,
      batches_failed: batchesFailed,
    },
  };

  return result;
}
