import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

const STUDENT_IMPORT_HEADERS = [
  "Student Name",
  "Gender",
  "Class",
  "Section",
  "Roll No#",
  "Father Name",
  "Call Number",
  "WhatsApp Number",
  "Student CNIC",
  "Date of Birth",
  "Address",
  "Admission Fee",
  "Annual Fee",
  "Subjects",
  "Status",
];

function IconCloudUpload({ className = "h-16 w-16" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 18a4.5 4.5 0 1 1 0-9 5.5 5.5 0 0 1 10.55 1.68A3.75 3.75 0 1 1 18.5 18H7.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V8.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 11.5 12 9l2.5 2.5" />
    </svg>
  );
}

function IconImportAction({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 7.5 12 4l3.5 3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 20h14a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1Z" />
    </svg>
  );
}

function StudentImportIllustration() {
  return (
    <svg viewBox="0 0 360 380" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="student-imp-base" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#F2ECFF" />
          <stop offset="100%" stopColor="#DCD2FF" />
        </linearGradient>
        <linearGradient id="student-imp-card" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F6F3FF" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="380" rx="24" fill="url(#student-imp-base)" opacity="0.45" />
      <rect x="106" y="236" width="150" height="118" rx="16" fill="url(#student-imp-card)" stroke="#E4DDFF" />
      <rect x="150" y="42" width="44" height="44" rx="22" fill="#E2D9FF" />
      <path d="M160 60h10v12h-10z" fill="none" stroke="#5C43E6" strokeWidth="2.2" />
      <path d="M170 50v12h12" fill="none" stroke="#5C43E6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M172 64v14" fill="none" stroke="#5C43E6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M166 58l6-6 6 6" fill="none" stroke="#5C43E6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StudentImportModal({ open, dark = false, onClose, onImport, importing = false }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadNotice, setUploadNotice] = useState("");
  const [uploadTone, setUploadTone] = useState("neutral");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelectedFile(null);
      setDragActive(false);
      setUploadNotice("");
      setUploadTone("neutral");
    }
  }, [open]);

  if (!open) return null;

  const pickFile = () => fileInputRef.current?.click();

  const importSelectedFile = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    setUploadNotice("Importing file...");
    setUploadTone("neutral");
    try {
      await onImport(file);
      setUploadNotice("All student headers are available in uploaded file.");
      setUploadTone("success");
    } catch (error) {
      setUploadNotice(error?.message || "Failed to import file.");
      setUploadTone("error");
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await importSelectedFile(file);
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto px-4 py-8 backdrop-blur-[2px] ${
        dark ? "bg-slate-950/70" : "bg-slate-900/50"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !importing) onClose();
      }}
    >
      <div
        className={`modal-panel-enter w-full max-w-[1040px] overflow-hidden rounded-[28px] border ${
          dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)]">
          <div
            className={`relative overflow-hidden px-8 py-10 ${
              dark
                ? "bg-[linear-gradient(180deg,#151427_0%,#1c1734_56%,#241b43_100%)]"
                : "bg-[linear-gradient(180deg,#f7f3ff_0%,#f3efff_56%,#ece4ff_100%)]"
            }`}
          >
            <div className="relative z-10 flex h-full flex-col">
              <div className="max-w-[270px]">
                <h3 className={`text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] ${dark ? "text-white" : "text-slate-900"}`}>
                  Import Students
                  <br />
                  from <span className={dark ? "text-[#8b78ff]" : "text-[#5b46e5]"}>Excel</span>
                </h3>
                <div className="mt-3 h-1 w-10 rounded-full bg-[#7c4dff]" />
                <p className={`mt-4 text-[16px] leading-7 ${dark ? "text-[#c9c4f0]" : "text-slate-600"}`}>
                  Upload your Excel file to quickly add or update student records.
                </p>
              </div>

              <div className="mt-auto pt-8">
                <div className="relative mx-auto h-[260px] w-[240px]">
                  <StudentImportIllustration />
                </div>
              </div>
            </div>
          </div>

          <div className={`relative flex min-h-0 flex-col ${dark ? "bg-[#161722]" : "bg-white"}`}>
            <button
              type="button"
              onClick={onClose}
              disabled={importing}
              className={`absolute right-8 top-7 rounded-full p-1.5 transition disabled:opacity-50 ${
                dark
                  ? "text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              }`}
              aria-label="Close import modal"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={`flex min-h-0 flex-1 flex-col px-7 pb-5 pt-14 ${dark ? "bg-[#161722]" : "bg-white"}`}>
              <div
                role="button"
                tabIndex={0}
                onClick={pickFile}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    pickFile();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`flex min-h-[360px] w-full cursor-pointer flex-col items-center justify-center rounded-[30px] border-2 border-dashed px-7 text-center transition ${
                  dragActive
                    ? "border-[#8b78ff] bg-[#f6f2ff]"
                    : dark
                      ? "border-[#4f4688] bg-[#1a1b26] hover:bg-[#1d1e2b]"
                      : "border-[#c8beff] bg-white hover:bg-[#fcfbff]"
                }`}
              >
                <div className={`flex h-24 w-24 items-center justify-center rounded-full ${dark ? "bg-[#2a2447] text-[#8b78ff]" : "bg-[#e7e1ff] text-[#5b46e5]"}`}>
                  <IconCloudUpload className="h-12 w-12" />
                </div>
                <p className={`mt-8 text-[22px] font-semibold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>
                  Drag & drop your Excel file here
                </p>
                <p className={`mt-3 text-[18px] leading-none ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>or</p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    pickFile();
                  }}
                  className="mt-4 inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#6c58ef] to-[#5b35e5] px-12 py-3.5 text-[18px] font-semibold text-white shadow-[0_10px_24px_rgba(91,53,229,0.22)]"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/40">
                    <IconImportAction className="h-4 w-4" />
                  </span>
                  Browse File
                </button>
                <p className={`mt-3 text-[16px] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Supports .xlsx, .xls, .csv files</p>
                {selectedFile ? (
                  <div
                    className={`mt-5 inline-flex max-w-full items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-sm ${
                      dark ? "border-white/[0.08] bg-[#1a1b26] text-white" : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <IconImportAction className="h-4 w-4" />
                    <span className="max-w-[360px] truncate">{selectedFile.name}</span>
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] || null;
                    if (nextFile) {
                      importSelectedFile(nextFile);
                    }
                    event.target.value = "";
                  }}
                />
              </div>

              <div
                className={`mt-5 rounded-[24px] px-6 py-5 shadow-[0_0_0_1px_rgba(91,70,229,0.08)] ${
                  dark ? "bg-[#1a1b26] shadow-[0_0_0_1px_rgba(139,120,255,0.12)]" : "bg-[#f6f3ff]"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${dark ? "bg-[#2a2447] text-[#8b78ff]" : "bg-[#e8e2ff] text-[#5b46e5]"}`}>
                    <span className="text-2xl font-semibold">i</span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[18px] font-semibold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>Required details:</p>
                    <p className={`mt-2 text-[16px] leading-[1.6] ${dark ? "text-[#d7d2f3]" : "text-slate-800"}`}>
                      {STUDENT_IMPORT_HEADERS.join(", ")}.
                    </p>
                    <p className={`mt-3 text-[15px] leading-[1.55] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      First row should contain these exact headers, and each next row should contain student data.
                    </p>
                    {uploadNotice ? (
                      <p
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          uploadTone === "success"
                            ? "bg-emerald-50 text-emerald-700"
                            : uploadTone === "error"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-white text-slate-500"
                        }`}
                      >
                        {uploadNotice}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={`mt-6 flex items-center justify-end gap-3 border-t pt-5 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={importing}
                  className={`rounded-xl border px-5 py-2.5 text-sm font-medium ${
                    dark
                      ? "border-white/[0.08] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedFile) {
                      onClose();
                      return;
                    }
                    pickFile();
                  }}
                  disabled={importing}
                  className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#6c58ef] to-[#5b35e5] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(91,53,229,0.22)] disabled:opacity-60"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/40">
                    <IconImportAction className="h-4 w-4" />
                  </span>
                  Import Students
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
