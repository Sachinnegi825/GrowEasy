import { ImportResult, SSEProgress } from "@/types/crm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

/**
 * Streams CSV import progress via SSE.
 * Calls onProgress for each batch update, onComplete when done.
 */
export async function streamImport(
  file: File,
  onProgress: (event: SSEProgress) => void,
  onComplete: (result: ImportResult) => void,
  onError: (message: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  // Use fetch with streaming response
  const response = await fetch(`${API_BASE}/import`, {
    method: "POST",
    body: formData,
    signal,
  });

  if (!response.ok) {
    const text = await response.text();
    onError(`Server error: ${response.status} — ${text}`);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    onError("No response stream available");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr) continue;

        try {
          const event: SSEProgress = JSON.parse(jsonStr);

          if (event.type === "complete" && event.data) {
            onComplete(event.data);
          } else if (event.type === "error_fatal") {
            onError(event.message ?? "Fatal error during processing");
          } else {
            onProgress(event);
          }
        } catch {
          // Skip malformed SSE events
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Export CRM records as CSV via the backend.
 * The server sets proper Content-Disposition headers so the browser
 * always saves the file with the correct filename.
 */
export async function exportCsvFromServer(
  records: any[],
  filename: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ records, filename }),
  });

  if (!response.ok) {
    throw new Error("Export failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 500);
}
