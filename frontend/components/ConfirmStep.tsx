"use client";

import { useEffect, useRef } from "react";
import { SSEProgress } from "@/types/crm";

interface ConfirmStepProps {
  totalRows: number;
  events: SSEProgress[];
  isProcessing: boolean;
  onCancel: () => void;
}

export default function ConfirmStep({ totalRows, events, isProcessing, onCancel }: ConfirmStepProps) {
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [events]);

  const latest = [...events].reverse().find((e) => e.type === "progress");
  const processed = latest?.processed ?? 0;
  const totalBatch = latest?.total_batches ?? 0;
  const curBatch = latest?.batch ?? 0;
  const pct = totalRows > 0 ? Math.min(100, Math.round((processed / totalRows) * 100)) : 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="text-left">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Importing Data...</h3>
          <p className="text-slate-500 text-sm">
            Please wait while the AI maps your CSV data into structured CRM records.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer transition-colors"
        >
          {isProcessing ? "Cancel Extraction" : "Go Back"}
        </button>
      </div>

      {/* Progress Section */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            {isProcessing ? "Processing" : "Complete"}
          </span>
          <span className="text-sm font-semibold text-violet-600">{pct}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
          <div
            className="bg-violet-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          ></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Processed</p>
            <p className="text-2xl font-semibold text-slate-900">{processed.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Batch</p>
            <p className="text-2xl font-semibold text-slate-900">{curBatch} / {totalBatch || '-'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Total Rows</p>
            <p className="text-2xl font-semibold text-slate-900">{totalRows.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Log Console */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">System Log</span>
          </div>
          {isProcessing && (
            <span className="flex items-center gap-2 text-xs text-violet-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
              Live
            </span>
          )}
        </div>
        
        <div
          ref={logRef}
          className="p-4 h-48 overflow-y-auto font-mono text-xs space-y-1.5"
        >
          {events.length === 0 ? (
            <div className="text-slate-400 text-center py-4">Waiting for process to start...</div>
          ) : (
            events.map((ev, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-slate-400 shrink-0 select-none">
                  [{String(i + 1).padStart(3, "0")}]
                </span>
                <span
                  className={
                    ev.type === "error"
                      ? "text-red-600"
                      : ev.type === "complete"
                      ? "text-emerald-600 font-medium"
                      : "text-slate-600"
                  }
                >
                  {ev.message || `System event: ${ev.type}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
