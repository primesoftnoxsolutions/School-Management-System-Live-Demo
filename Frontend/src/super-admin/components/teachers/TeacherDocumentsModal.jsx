import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import FormModal from "../ui/FormModal";

function IconEye() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconDownload() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3v10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 15.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5V9h5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6M9 16h6" />
    </svg>
  );
}

function resolveDocumentUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/api/v1/")) return value;
  if (value.startsWith("/uploads/")) return `/api/v1${value}`;
  return value.startsWith("/") ? `/api/v1${value}` : `/api/v1/uploads/${value}`;
}

function formatFileSize(bytes = 0) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? Math.round(size) : size.toFixed(1)} ${units[unitIndex]}`;
}

function getDocumentBaseName(document) {
  const name = String(document?.originalName || document?.fileName || "teacher-document").trim();
  return name.replace(/\.[^.]+$/, "") || "teacher-document";
}

function isImageDocument(document) {
  return String(document?.mimeType || "").startsWith("image/");
}

function triggerBlobDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load file for export."));
    img.src = url;
  });
}

async function imageUrlToCanvas(url) {
  const img = await loadImageElement(url);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  canvas.getContext("2d").drawImage(img, 0, 0);
  return canvas;
}

async function downloadDocumentAsPng(documentItem, url) {
  const baseName = getDocumentBaseName(documentItem);
  if (!isImageDocument(documentItem)) {
    // Non-image files cannot be rasterized; download the original file instead.
    const response = await fetch(url);
    triggerBlobDownload(await response.blob(), documentItem?.originalName || documentItem?.fileName || baseName);
    return;
  }
  const canvas = await imageUrlToCanvas(url);
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Failed to export PNG."))), "image/png");
  });
  triggerBlobDownload(blob, `${baseName}.png`);
}

async function downloadDocumentAsPdf(documentItem, url) {
  const baseName = getDocumentBaseName(documentItem);
  if (!isImageDocument(documentItem)) {
    // Already a PDF/other file — download the original.
    const response = await fetch(url);
    triggerBlobDownload(await response.blob(), documentItem?.originalName || documentItem?.fileName || baseName);
    return;
  }
  const canvas = await imageUrlToCanvas(url);
  const imgData = canvas.toDataURL("image/png");
  const orientation = canvas.width > canvas.height ? "landscape" : "portrait";
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const ratio = Math.min((pageWidth - margin * 2) / canvas.width, (pageHeight - margin * 2) / canvas.height);
  const renderWidth = canvas.width * ratio;
  const renderHeight = canvas.height * ratio;
  pdf.addImage(imgData, "PNG", (pageWidth - renderWidth) / 2, (pageHeight - renderHeight) / 2, renderWidth, renderHeight);
  pdf.save(`${baseName}.pdf`);
}

async function printDocument(documentItem, url) {
  if (!isImageDocument(documentItem)) {
    // PDFs and other previewable files print from their own viewer tab.
    const win = window.open(url, "_blank");
    if (!win) throw new Error("Popup blocked. Allow popups to print the file.");
    return;
  }
  const canvas = await imageUrlToCanvas(url);
  const imgData = canvas.toDataURL("image/png");
  const printWindow = window.open("", "_blank", "width=1100,height=900");
  if (!printWindow) throw new Error("Popup blocked. Allow popups to print the file.");

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${getDocumentBaseName(documentItem)}</title>
    <style>
      @page { margin: 12mm; }
      html, body { margin: 0; padding: 0; background: #eef2ff; font-family: Arial, sans-serif; }
      .toolbar {
        position: sticky; top: 0; z-index: 2; display: flex; justify-content: flex-end; gap: 8px;
        padding: 12px 16px; background: rgba(255,255,255,0.96); border-bottom: 1px solid #dbe3f3;
      }
      .toolbar button {
        border: 1px solid #c7d2fe; background: #4f46e5; color: #fff; border-radius: 999px;
        padding: 8px 14px; font-size: 12px; font-weight: 700; cursor: pointer;
      }
      .toolbar button.secondary { background: #fff; color: #3730a3; }
      .preview-wrap { padding: 18px; display: flex; justify-content: center; }
      .preview-card { background: #fff; box-shadow: 0 18px 40px rgba(15,23,42,0.12); border-radius: 12px; overflow: hidden; }
      .preview-card img { display: block; max-width: 100%; height: auto; }
      @media print {
        html, body { background: #fff; }
        .toolbar { display: none !important; }
        .preview-wrap { padding: 0; }
        .preview-card { box-shadow: none; border-radius: 0; }
        .preview-card img { width: 100%; max-width: none; }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button type="button" class="secondary" onclick="window.close()">Close</button>
      <button type="button" onclick="window.print()">Print</button>
    </div>
    <div class="preview-wrap">
      <div class="preview-card">
        <img src="${imgData}" alt="Teacher document" />
      </div>
    </div>
  </body>
</html>`);
  printWindow.document.close();
}

async function exportTeacherDocument(documentItem, url, format) {
  if (format === "pdf") {
    await downloadDocumentAsPdf(documentItem, url);
    return;
  }
  if (format === "png") {
    await downloadDocumentAsPng(documentItem, url);
    return;
  }
  await printDocument(documentItem, url);
}

export default function TeacherDocumentsModal({ open, teacher, documents = [], dark = false, onClose }) {
  const safeTeacher = teacher || {};
  const fileList = Array.isArray(documents) ? documents : [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [exportOpenIndex, setExportOpenIndex] = useState(null);
  const [exportingIndex, setExportingIndex] = useState(null);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedIndex(0);
      setPreviewOpen(false);
      setExportOpenIndex(null);
      setExportingIndex(null);
      setExportError("");
      return;
    }
    setSelectedIndex((current) => (current < fileList.length ? current : 0));
  }, [fileList.length, open]);

  const selectedDocument = fileList[selectedIndex] || null;
  const selectedDocumentUrl = resolveDocumentUrl(selectedDocument?.url);

  const openPreview = (index) => {
    setSelectedIndex(index);
    setPreviewOpen(true);
  };

  const handleExport = async (documentItem, index, format) => {
    if (exportingIndex != null) return;
    const url = resolveDocumentUrl(documentItem?.url);
    if (!url) return;
    setExportingIndex(index);
    setExportOpenIndex(null);
    setExportError("");
    try {
      await exportTeacherDocument(documentItem, url, format);
    } catch (err) {
      setExportError(err?.message || "Failed to export file.");
    } finally {
      setExportingIndex(null);
    }
  };

  return (
    <FormModal
      open={open}
      title="Teacher Files"
      subtitle={safeTeacher.fullName || safeTeacher.teacherName || ""}
      onClose={onClose}
      wide
      dark={dark}
      scrollBody={false}
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-200 bg-slate-50"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${dark ? "bg-[#7c4dff]/15 text-[#7c4dff]" : "bg-indigo-50 text-indigo-600"}`}>
              <IconFile />
            </div>
            <div>
              <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{safeTeacher.fullName || "Teacher"}</p>
              <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                {fileList.length} uploaded file{fileList.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {exportError ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="alert"
          >
            {exportError}
          </div>
        ) : null}

        <div className="scrollbar-app min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {fileList.length ? (
            fileList.map((documentItem, index) => {
              const targetUrl = resolveDocumentUrl(documentItem?.url);
              const exportOpen = exportOpenIndex === index;
              const exporting = exportingIndex === index;
              return (
                <div
                  key={`${documentItem?.fileName || documentItem?.originalName || "file"}-${index}`}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 ${
                    dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                      {documentItem?.originalName || documentItem?.fileName || `File ${index + 1}`}
                    </p>
                    <div className={`mt-1 flex flex-wrap gap-3 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      <span>{documentItem?.mimeType || "Unknown type"}</span>
                      <span>{formatFileSize(documentItem?.size)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {exportOpen ? (
                      <div className="flex items-center gap-1.5">
                        {[
                          { key: "pdf", label: "PDF" },
                          { key: "png", label: "PNG" },
                          { key: "print", label: "Print" },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            disabled={exporting}
                            onClick={() => handleExport(documentItem, index, option.key)}
                            className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                              dark
                                ? "border-white/[0.08] bg-[#1a1b26] text-[#e8e8ef] hover:bg-white/[0.05]"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        setExportError("");
                        setExportOpenIndex(exportOpen ? null : index);
                      }}
                      disabled={!targetUrl || exporting}
                      title="Export file"
                      aria-label="Export file"
                      aria-expanded={exportOpen}
                      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                        dark
                          ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                          : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      }`}
                    >
                      <IconDownload />
                      <span className="ml-1">{exporting ? "Exporting..." : "Export"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPreview(index)}
                      disabled={!targetUrl}
                      title="View file"
                      className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-40 ${
                        dark
                          ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                          : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      }`}
                    >
                      <IconEye />
                      <span className="ml-1">View</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className={`rounded-2xl border px-4 py-10 text-center text-sm ${
                dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
              }`}
            >
              No files uploaded.
            </div>
          )}
        </div>
      </div>

      {previewOpen && selectedDocument ? (
        <FormModal
          open={previewOpen}
          title="File Preview"
          subtitle={selectedDocument.originalName || selectedDocument.fileName || ""}
          onClose={() => setPreviewOpen(false)}
          wide
          dark={dark}
          scrollBody={false}
        >
          <div className="flex h-full min-h-0 flex-col gap-4">
            <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {selectedDocument.originalName || selectedDocument.fileName || "File"}
              </p>
              <p className={`mt-1 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                {selectedDocument.mimeType || "Unknown type"} • {formatFileSize(selectedDocument.size)}
              </p>
            </div>

            <div className={`min-h-[420px] flex-1 overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white"}`}>
              {selectedDocumentUrl ? (
                selectedDocument.mimeType?.startsWith("image/") ? (
                  <img
                    src={selectedDocumentUrl}
                    alt={selectedDocument.originalName || selectedDocument.fileName || "File preview"}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <iframe
                    src={selectedDocumentUrl}
                    title={selectedDocument.originalName || selectedDocument.fileName || "File preview"}
                    className="h-full w-full"
                  />
                )
              ) : (
                <div className={`flex h-full items-center justify-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  This file cannot be previewed.
                </div>
              )}
            </div>
          </div>
        </FormModal>
      ) : null}
    </FormModal>
  );
}
