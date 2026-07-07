"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ImportResult, CrmRecord } from "@/types/crm";
import { exportCsvFromServer } from "@/lib/api";

interface ResultStepProps {
  result: ImportResult;
  onReset: () => void;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  GOOD_LEAD_FOLLOW_UP: { label: "Good Lead", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  DID_NOT_CONNECT: { label: "No Connect", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  BAD_LEAD: { label: "Bad Lead", cls: "bg-red-100 text-red-700 border-red-200" },
  SALE_DONE: { label: "Sale Done", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

const FIELDS: { key: keyof CrmRecord; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country_code", label: "Code" },
  { key: "mobile_without_country_code", label: "Mobile" },
  { key: "company", label: "Company" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "lead_owner", label: "Owner" },
  { key: "crm_status", label: "Status" },
  { key: "data_source", label: "Source" },
  { key: "crm_note", label: "Notes" },
  { key: "created_at", label: "Created At" },
  { key: "possession_time", label: "Possession" },
  { key: "description", label: "Description" },
];

export default function ResultStep({ result, onReset }: ResultStepProps) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");
  const { imported, skipped, stats } = result;

  const doExport = async () => {
    if (!imported.length) {
      toast.error("No records to export");
      return;
    }
    try {
      await exportCsvFromServer(imported, "groweasy_crm_import.csv");
      toast.success(`Exported ${imported.length} records successfully.`);
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <div className="w-full">
      {/* Success Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-4 mb-8 shadow-sm">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="h-6 w-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-emerald-800">Import Completed Successfully</h3>
          <div className="mt-1 text-sm text-emerald-700">
            <p>
              Successfully extracted <span className="font-semibold">{stats.imported}</span> records from {stats.total} total rows.
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={doExport}
              className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer transition-colors"
            >
              Export to CSV
            </button>
            <button
              onClick={onReset}
              className="inline-flex items-center px-3 py-2 border border-emerald-200 shadow-sm text-xs font-medium rounded text-emerald-700 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 cursor-pointer transition-colors"
            >
              New Import
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Rows", value: stats.total, color: "text-slate-900" },
          { label: "Imported", value: stats.imported, color: "text-emerald-600" },
          { label: "Skipped", value: stats.skipped, color: "text-amber-600" },
          { label: "Failed Batches", value: stats.batches_failed, color: stats.batches_failed > 0 ? "text-red-600" : "text-slate-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm text-center">
            <div className={`text-3xl font-semibold mb-1 ${s.color}`}>{s.value.toLocaleString()}</div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setTab("imported")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer transition-colors
              ${tab === "imported"
                ? "border-violet-500 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
            `}
          >
            Imported Records
            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block ${
              tab === "imported" ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-900"
            }`}>
              {stats.imported}
            </span>
          </button>
          <button
            onClick={() => setTab("skipped")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer transition-colors
              ${tab === "skipped"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
            `}
          >
            Skipped Records
            <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block ${
              tab === "skipped" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-900"
            }`}>
              {stats.skipped}
            </span>
          </button>
        </nav>
      </div>

      {/* Table Data */}
      {tab === "imported" && (
        <div className="data-table-wrapper" style={{ maxHeight: '500px' }}>
          {imported.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No records were imported.</div>
          ) : (
            <table className="data-table" style={{ minWidth: Math.max(1200, FIELDS.length * 120) }}>
              <thead>
                <tr>
                  <th style={{ width: 48, position: 'sticky', top: 0, zIndex: 10 }}>#</th>
                  {FIELDS.map((f) => (
                    <th key={f.key} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {imported.map((rec, i) => (
                  <tr key={i}>
                    <td className="text-slate-400 text-xs">{i + 1}</td>
                    {FIELDS.map((f) => (
                      <td key={f.key} title={String(rec[f.key] ?? "")} className="max-w-xs truncate">
                        {f.key === "crm_status" && rec.crm_status ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_MAP[rec.crm_status]?.cls || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
                            {STATUS_MAP[rec.crm_status]?.label ?? rec.crm_status}
                          </span>
                        ) : f.key === "data_source" && rec.data_source ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {rec.data_source}
                          </span>
                        ) : rec[f.key] ? (
                          String(rec[f.key])
                        ) : (
                          <span className="text-slate-300 italic">Empty</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "skipped" && (
        <div className="data-table-wrapper" style={{ maxHeight: '500px' }}>
          {skipped.length === 0 ? (
            <div className="text-center py-16 text-slate-500">All records were successfully imported.</div>
          ) : (
            <table className="data-table" style={{ minWidth: Math.max(800, Object.keys(skipped[0] ?? {}).length * 150) }}>
              <thead>
                <tr>
                  <th style={{ width: 48, position: 'sticky', top: 0, zIndex: 10 }}>#</th>
                  {Object.keys(skipped[0] ?? {}).map((h) => (
                    <th key={h} style={{ position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                  ))}
                  <th style={{ position: 'sticky', top: 0, zIndex: 10 }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {skipped.map((row, i) => (
                  <tr key={i}>
                    <td className="text-slate-400 text-xs">{i + 1}</td>
                    {Object.keys(skipped[0] ?? {}).map((h) => (
                      <td key={h} className="max-w-xs truncate">{String(row[h] ?? "")}</td>
                    ))}
                    <td>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        Missing email & mobile
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
