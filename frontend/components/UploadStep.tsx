"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface UploadStepProps {
  onFileAccepted: (file: File) => void;
}

export default function UploadStep({ onFileAccepted }: UploadStepProps) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    setError(null);
    if ((rejected as unknown[]).length > 0) {
      setError("Invalid file. Please upload a .csv file under 20MB.");
      return;
    }
    const file = accepted[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Invalid file type. Please upload a .csv file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File is too large. Maximum size is 20MB.");
      return;
    }
    onFileAccepted(file);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
    noClick: true,
  });

  return (
    <div className="w-full">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out py-20 px-6 text-center cursor-pointer group
          ${isDragActive 
            ? "border-violet-500 bg-violet-50/50 shadow-inner" 
            : "border-slate-300 bg-slate-50/30 hover:border-violet-400 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50"
          }`}
      >
        <input {...getInputProps()} />

        <div className="mx-auto w-16 h-16 mb-5 flex items-center justify-center rounded-full bg-violet-50 text-violet-500 group-hover:scale-110 group-hover:bg-violet-100 transition-transform duration-300">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        <p className="text-xl font-semibold text-slate-800 mb-2">
          {isDragActive ? "Drop your CSV here" : "Drag & drop your CSV file"}
        </p>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Supports standard comma-separated files up to 20MB. Data is processed locally in your browser before AI extraction.
        </p>
        
        <button
          onClick={open}
          className="inline-flex items-center justify-center px-6 py-2.5 shadow-sm text-sm font-semibold rounded-lg text-white bg-slate-900 hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 cursor-pointer transition-all duration-200"
        >
          Select File
        </button>
        
        <p className="mt-4 text-xs text-slate-400">
          Supports .csv only (max 20MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Supported Platforms (Subtle text list instead of big pastel blocks) */}
      <div className="mt-8 pt-8 border-t border-slate-100">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Seamlessly imports data from
        </h4>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
            Facebook Leads
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
            Google Ads
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
            Excel Spreadsheets
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
            Custom CRM Exports
          </div>
        </div>
      </div>
    </div>
  );
}
