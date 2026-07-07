"use client";

import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import toast from "react-hot-toast";
import { WizardStep, ParsedCsv, ImportResult, SSEProgress } from "@/types/crm";
import { streamImport } from "@/lib/api";
import UploadStep from "@/components/UploadStep";
import PreviewStep from "@/components/PreviewStep";
import ConfirmStep from "@/components/ConfirmStep";
import ResultStep from "@/components/ResultStep";

const STEPS = [
  { id: "upload", label: "Upload CSV" },
  { id: "preview", label: "Preview Data" },
  { id: "confirm", label: "AI Extraction" },
  { id: "result", label: "Results" },
] as const;

function StepIndicator({ current }: { current: WizardStep }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 z-0"></div>

        {/* Active progress line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-violet-600 z-0 transition-all duration-300 ease-in-out"
          style={{ width: `${(currentIdx / (STEPS.length - 1)) * 100}%` }}
        ></div>

        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIdx;
          const isActive = idx === currentIdx;
          const isPending = idx > currentIdx;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-200 ${isActive
                    ? "bg-violet-600 text-white ring-4 ring-violet-50"
                    : isCompleted
                      ? "bg-violet-600 text-white"
                      : "bg-white text-slate-400 border-2 border-slate-200"
                  }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium absolute top-10 whitespace-nowrap ${isActive ? "text-violet-600" : isCompleted ? "text-slate-700" : "text-slate-400"
                  }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [parsedCsv, setParsedCsv] = useState<ParsedCsv | null>(null);
  const [sseEvents, setSseEvents] = useState<SSEProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleFileAccepted = useCallback((f: File) => {
    setFile(f);
    const id = toast.loading("Parsing CSV...");
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      transform: (v) => v.trim(),
      complete: (res) => {
        toast.dismiss(id);
        if (!res.data?.length) {
          toast.error("CSV has no data rows.");
          return;
        }
        const headers = res.meta.fields ?? Object.keys(res.data[0] ?? {});

        // Limit to 100 rows for the assignment demo to respect Groq free tier limits
        let finalRows = res.data;
        if (finalRows.length > 100) {
          toast.success(`Parsed ${res.data.length.toLocaleString()} rows. Limiting to 100 rows for free-tier demo.`);
          finalRows = finalRows.slice(0, 100);
        } else {
          toast.success(`Successfully parsed ${res.data.length.toLocaleString()} rows.`);
        }

        setParsedCsv({ headers, rows: finalRows, total: finalRows.length });
        setStep("preview");
      },
      error: (err) => {
        toast.dismiss(id);
        toast.error(`Parse error: ${err.message}`);
      },
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file || !parsedCsv) return;
    setStep("confirm");
    setSseEvents([]);
    setIsProcessing(true);
    const id = toast.loading("Connecting to AI service...");

    abortControllerRef.current = new AbortController();

    try {
      await streamImport(
        file,
        (ev) => setSseEvents((p) => [...p, ev]),
        (res) => {
          setResult(res);
          setIsProcessing(false);
          toast.dismiss(id);
          toast.success(`Successfully extracted ${res.stats.imported} records.`, { duration: 5000 });
          setStep("result");
        },
        (msg) => {
          setIsProcessing(false);
          toast.dismiss(id);
          toast.error(msg, { duration: 6000 });
        },
        abortControllerRef.current.signal
      );
    } catch (e: any) {
      setIsProcessing(false);
      toast.dismiss(id);
      if (e.name === 'AbortError') {
        toast.error("Import cancelled.");
      } else {
        toast.error(e instanceof Error ? e.message : "Unexpected error");
      }
    }
  }, [file, parsedCsv]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setStep("preview");
    setIsProcessing(false);
  }, []);

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setParsedCsv(null);
    setSseEvents([]);
    setIsProcessing(false);
    setResult(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-violet-500/20">
              GE
            </div>
            <div>
              <h1 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-700 to-fuchsia-700 leading-tight text-lg">GrowEasy</h1>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Intelligent Importer</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Header Section (Only visible on upload step for clean UI) */}
        {step === "upload" && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
              Import CRM Leads
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Upload your raw CSV exports. Our AI automatically maps your data into standard GrowEasy CRM fields.
            </p>
          </div>
        )}

        {/* Wizard Container */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden ring-1 ring-slate-900/5">
          {/* Step Indicator inside the card */}
          <div className="px-6 py-8 md:px-12 border-b border-slate-100 bg-slate-50/50">
            <StepIndicator current={step} />
            <div className="h-4"></div> {/* Spacing for the absolute labels */}
          </div>

          {/* Dynamic Step Content */}
          <div className="p-6 md:p-8">
            {step === "upload" && <UploadStep onFileAccepted={handleFileAccepted} />}
            {step === "preview" && parsedCsv && file && (
              <PreviewStep
                file={file}
                headers={parsedCsv.headers}
                rows={parsedCsv.rows}
                total={parsedCsv.total}
                onConfirm={handleConfirmImport}
                onBack={handleReset}
              />
            )}
            {step === "confirm" && (
              <ConfirmStep
                totalRows={parsedCsv?.total ?? 0}
                events={sseEvents}
                isProcessing={isProcessing}
                onCancel={handleCancel}
              />
            )}
            {step === "result" && result && (
              <ResultStep result={result} onReset={handleReset} />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-center text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} GrowEasy. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
