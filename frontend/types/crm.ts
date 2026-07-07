export type CrmStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE";

export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots";

export interface CrmRecord {
  created_at?: string | null;
  name?: string | null;
  email?: string | null;
  country_code?: string | null;
  mobile_without_country_code?: string | null;
  company?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  lead_owner?: string | null;
  crm_status?: CrmStatus | null;
  crm_note?: string | null;
  data_source?: DataSource | null;
  possession_time?: string | null;
  description?: string | null;
}

export interface ImportStats {
  total: number;
  imported: number;
  skipped: number;
  batches_processed: number;
  batches_failed: number;
}

export interface ImportResult {
  imported: CrmRecord[];
  skipped: Record<string, unknown>[];
  stats: ImportStats;
}

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  total: number;
}

export type WizardStep = "upload" | "preview" | "confirm" | "result";

export interface SSEProgress {
  type: "start" | "progress" | "error" | "error_fatal" | "complete";
  batch?: number;
  total_batches?: number;
  processed?: number;
  total_rows?: number;
  message?: string;
  retrying?: boolean;
  data?: ImportResult;
}
