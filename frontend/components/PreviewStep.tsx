"use client";

interface PreviewStepProps {
  file: File;
  headers: string[];
  rows: Record<string, string>[];
  total: number;
  onConfirm: () => void;
  onBack: () => void;
}

const fmtSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 ** 2).toFixed(2)} MB`;

export default function PreviewStep({ file, headers, rows, total, onConfirm, onBack }: PreviewStepProps) {
  // Take only the first 50 rows for the preview to ensure robust rendering and layout.
  const previewRows = rows.slice(0, 50);

  return (
    <div className="w-full">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">Data Preview</h3>
          <p className="text-slate-500">
            Review your CSV data before AI processing. Showing first {previewRows.length} rows.
          </p>
        </div>
        
        {/* File Details Badge */}
        <div className="inline-flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 max-w-[200px] truncate" title={file.name}>
              {file.name}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>{fmtSize(file.size)}</span>
              <span>&bull;</span>
              <span>{total.toLocaleString()} rows</span>
            </div>
          </div>
        </div>
      </div>

      {/* Standard Table Container */}
      <div className="data-table-wrapper mb-8 rounded-xl border border-slate-200/60 shadow-sm overflow-hidden bg-white ring-1 ring-slate-900/5" style={{ maxHeight: '450px', overflowY: 'auto', overflowX: 'auto' }}>
        <table className="data-table min-w-full text-sm text-left whitespace-nowrap" style={{ tableLayout: "auto" }}>
          <thead className="bg-slate-50/80 sticky top-0 z-20 backdrop-blur-sm border-b border-slate-200">
            <tr>
              <th style={{ width: 48 }} className="font-semibold text-slate-600 px-4 py-3 border-r border-slate-200/60 sticky left-0 z-30 bg-slate-50/90 backdrop-blur-sm">#</th>
              {headers.map((h) => (
                <th key={h} style={{ minWidth: 150 }} className="font-semibold text-slate-600 px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {previewRows.map((row, i) => (
              <tr key={i} className="hover:bg-violet-50/30 transition-colors">
                <td className="text-slate-400 font-medium px-4 py-3 border-r border-slate-100 bg-white sticky left-0 z-10">
                  {i + 1}
                </td>
                {headers.map((h) => (
                  <td key={h} className="whitespace-normal break-words py-3 px-4 max-w-[300px] align-top text-slate-700">
                    {row[h] || <span className="text-slate-300 italic">Empty</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center px-6 py-2.5 shadow-sm text-sm font-semibold rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 cursor-pointer transition-all duration-200"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="inline-flex items-center justify-center px-6 py-2.5 shadow-md shadow-violet-500/20 text-sm font-semibold rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 gap-2 cursor-pointer transition-all duration-200"
        >
          Begin AI Import
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
