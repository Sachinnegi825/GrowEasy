import Groq from "groq-sdk";
import { CrmRecord, CrmRecordSchema, AiBatchOutput } from "../types/crm";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a CRM data extraction expert for GrowEasy, a real estate CRM platform.

Your job: Given a batch of raw CSV rows (with arbitrary column names), map each row to the GrowEasy CRM format.

## Output Format
Respond with ONLY a raw JSON object (no markdown, no code fences) in this exact schema:
{
  "records": [ /* one entry per input row, in order */ ]
}

Each entry is either:
- A CRM record object (if the row has at least an email OR a mobile number)
- null (if the row has NEITHER an email NOR a mobile number — skip it)

## CRM Fields to Extract
| Field | Description |
|-------|-------------|
| created_at | Lead creation date — use any recognisable date format, must be parseable by JS new Date() |
| name | Full name of the lead |
| email | Primary email (first one if multiple) |
| country_code | Country dialling code e.g. +91 |
| mobile_without_country_code | Mobile number without country code (first one if multiple) |
| company | Company or organisation name |
| city | City |
| state | State / Province |
| country | Country |
| lead_owner | Owner / assigned agent email or name |
| crm_status | Lead status — MUST be one of the allowed values or null |
| crm_note | Notes, remarks, follow-ups, extra emails, extra mobiles, any useful info that doesn't fit elsewhere |
| data_source | Source — MUST be one of the allowed values or null |
| possession_time | Property possession time |
| description | Any additional description |

## Strict Rules

### crm_status — ONLY use one of:
GOOD_LEAD_FOLLOW_UP | DID_NOT_CONNECT | BAD_LEAD | SALE_DONE
If none matches confidently, use null.

### data_source — ONLY use one of:
leads_on_demand | meridian_tower | eden_park | varah_swamy | sarjapur_plots
If none matches confidently, use null.

### Multiple emails:
- Use the FIRST email in the "email" field
- Append remaining emails to crm_note

### Multiple mobile numbers:
- Use the FIRST mobile in "mobile_without_country_code"
- Append remaining numbers to crm_note

### Skip a record (return null) if:
- The row has NO email AND NO mobile number

### date (created_at):
- Output dates in ISO 8601 format: YYYY-MM-DD HH:MM:SS or YYYY-MM-DDTHH:MM:SSZ
- If no date, use null

### CSV validity:
- Do NOT introduce line breaks inside field values
- If you must include a newline, escape it as \\n

### Field mapping intelligence:
- Be smart about column name variations:
  - "Phone", "Contact No", "Mobile", "Cell", "Tel" → mobile
  - "Mail", "Email Address", "E-mail" → email
  - "Lead Name", "Customer", "Client", "Contact Name", "Full Name" → name
  - "Organization", "Firm", "Employer", "Business" → company
  - "Status", "Stage", "Disposition" → crm_status
  - "Source", "Channel", "Campaign", "Ad Source" → data_source
  - "Remarks", "Notes", "Comment", "Follow-up" → crm_note
  - "Assigned To", "Owner", "Rep", "Agent" → lead_owner
- Use context clues from column values to infer field types
- For crm_status, intelligently map free-text values:
  - "interested", "hot", "follow up" → GOOD_LEAD_FOLLOW_UP
  - "not reachable", "no answer", "busy", "not picked" → DID_NOT_CONNECT
  - "not interested", "invalid", "junk", "spam" → BAD_LEAD
  - "won", "closed", "converted", "booked" → SALE_DONE

Respond ONLY with the JSON object. No explanation. No markdown.`;

/**
 * Extracts CRM records from a batch of raw CSV rows using Groq LLM.
 * Returns an array of CrmRecord | null (null means skip that row).
 */
export async function extractBatchWithAI(
  rows: Record<string, string>[]
): Promise<(CrmRecord | null)[]> {
  const userMessage = JSON.stringify(rows, null, 2);

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract CRM records from these ${rows.length} CSV rows:\n\n${userMessage}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });

  let jsonStr = completion.choices[0]?.message?.content || "";
  jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let parsed: AiBatchOutput;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(`AI returned invalid JSON: ${jsonStr.slice(0, 300)}`);
  }

  const finalRecords: (CrmRecord | null)[] = [];
  
  for (const rec of parsed.records) {
    if (rec === null || rec === undefined) {
      finalRecords.push(null);
      continue;
    }
    const result = CrmRecordSchema.safeParse(rec);
    if (result.success) {
      finalRecords.push(result.data);
    } else {
      finalRecords.push(null);
    }
  }

  while (finalRecords.length < rows.length) finalRecords.push(null);

  return finalRecords.slice(0, rows.length);
}
