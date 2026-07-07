import { z } from "zod";

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const DATA_SOURCE_VALUES = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];
export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

export const CrmRecordSchema = z.object({
  created_at: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  mobile_without_country_code: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  lead_owner: z.string().nullable().optional(),
  crm_status: z.enum(CRM_STATUS_VALUES).nullable().optional(),
  crm_note: z.string().nullable().optional(),
  data_source: z.enum(DATA_SOURCE_VALUES).nullable().optional(),
  possession_time: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type CrmRecord = z.infer<typeof CrmRecordSchema>;

export const GroqBatchOutputSchema = z.object({
  records: z.array(
    z.union([
      CrmRecordSchema,
      z.null(), // null = skip this record
    ])
  ),
});

export type AiBatchOutput = z.infer<typeof GroqBatchOutputSchema>;

export interface ImportResult {
  imported: CrmRecord[];
  skipped: Record<string, unknown>[];
  stats: {
    total: number;
    imported: number;
    skipped: number;
    batches_processed: number;
    batches_failed: number;
  };
}

export interface BatchProgress {
  type: "progress";
  batch: number;
  total_batches: number;
  processed: number;
  total_rows: number;
  message: string;
}

export interface BatchError {
  type: "error";
  batch: number;
  message: string;
  retrying: boolean;
}
