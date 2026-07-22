import { useEffect, useState } from "react";
import api from "../services/api/client";
import PageHeader from "../components/ui/PageHeader";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import TablePagination from "../components/ui/TablePagination";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import { resolveStudentPhotoUrl } from "../utils/mediaUrl";
import { withStudentBranchParams } from "../utils/branch";

function StudentAvatar({ student }) {
  const initials = `${student?.firstName?.[0] || ""}${student?.lastName?.[0] || ""}`.toUpperCase();
  if (student?.studentPhotoUrl) {
    return (
      <img
        src={student.studentPhotoUrl}
        alt={initials}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
      />
    );
  }
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
      {initials || "?"}
    </div>
  );
}

function FeeStatusBadge({ status }) {
  const paid = status === "PAID";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paid ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
      {paid ? "Paid" : status === "PARTIAL" ? "Partial" : "Pending"}
    </span>
  );
}

function IconEye({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12s3.7-6.5 9.5-6.5S21.5 12 21.5 12 17.8 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconDocument({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l5 5v13H7z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  );
}

export default function StudentPortfoliosPage({ dark = false, branchSection = "Boys" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });
  const [documentModal, setDocumentModal] = useState(null);

  const load = async (nextPage = page) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/students", {
        params: withStudentBranchParams(
          {
            page: nextPage,
            limit: pagination.limit,
            search,
            className: classFilter,
            section: sectionFilter,
            status: "ACTIVE",
          },
          branchSection
        ),
      });
      setItems(data.data.items || []);
      setPagination({
        total: data.data.total || 0,
        totalPages: data.data.totalPages || 1,
        limit: data.data.limit || 10,
      });
      setPage(data.data.page || nextPage);
    } catch (err) {
      setItems([]);
      setError(err.response?.data?.message || "Failed to load student portfolios");
    } finally {
      setLoading(false);
    }
  };

  const getStudentDocuments = (student) => {
    const previousDocs = (student?.previousResults || [])
      .map((row, index) => ({
        key: `previous-${index}`,
        label: row.previousClass ? `${row.previousClass} Result Card` : `Previous Result Card ${index + 1}`,
        subtitle: [row.resultGrade, row.percentage].filter(Boolean).join(" | ") || "Uploaded document",
        url: resolveStudentPhotoUrl(row.documentUrl),
      }))
      .filter((row) => row.url);

    return [
      {
        key: "previousResults",
        label: "Previous Results Cards",
        subtitle: previousDocs.length ? `${previousDocs.length} file${previousDocs.length > 1 ? "s" : ""}` : "Not uploaded",
        items: previousDocs,
      },
      {
        key: "schoolLeavingCertificate",
        label: "School Leaving Certificate",
        subtitle: student?.schoolLeavingCertificate ? "Uploaded document" : "Not uploaded",
        items: student?.schoolLeavingCertificate
          ? [
              {
                key: "schoolLeavingCertificate",
                label: "School Leaving Certificate",
                subtitle: "Uploaded document",
                url: resolveStudentPhotoUrl(student.schoolLeavingCertificate),
              },
            ]
          : [],
      },
      {
        key: "characterCertificate",
        label: "Character Certificate",
        subtitle: student?.characterCertificate ? "Uploaded document" : "Not uploaded",
        items: student?.characterCertificate
          ? [
              {
                key: "characterCertificate",
                label: "Character Certificate",
                subtitle: "Uploaded document",
                url: resolveStudentPhotoUrl(student.characterCertificate),
              },
            ]
          : [],
      },
    ];
  };

  const openDocuments = (student, title, items) => {
    const docs = (items || []).filter((item) => item?.url);
    if (!docs.length) return;
    setDocumentModal({
      student,
      title,
      items: docs,
      activeIndex: 0,
    });
  };

  const activeDocument = documentModal?.items?.[documentModal.activeIndex] || null;
  const activeDocumentUrl = activeDocument?.url || "";
  const activeDocumentType =
    activeDocumentUrl.startsWith("data:application/pdf") || /\.pdf($|\?)/i.test(activeDocumentUrl) ? "pdf" : "image";

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classFilter, sectionFilter, branchSection]);

  const streamLabel = (student) => {
    if (!student?.academicStream) return "-";
    if (student.streamDetail) return `${student.academicStream} (${student.streamDetail})`;
    return student.academicStream;
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Students Portfolios"
        subtitle="Student profiles with fee status — monthly paid and pending fees."
        dark={dark}
        extra={
          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-auto xl:min-w-[440px]">
            <ScrollableSelect
              label="Select Class"
              placeholder="All Classes"
              value={classFilter}
              options={[{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((cls) => ({ value: cls, label: cls }))]}
              onChange={(value) => {
                setClassFilter(value);
                setPage(1);
              }}
              portal
              dark={dark}
            />
            <ScrollableSelect
              label="Select Section"
              placeholder="All Sections"
              value={sectionFilter}
              options={[{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((sec) => ({ value: sec, label: sec }))]}
              onChange={(value) => {
                setSectionFilter(value);
                setPage(1);
              }}
              portal
              dark={dark}
            />
          </div>
        }
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className={`overflow-hidden rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className={`flex flex-wrap items-center gap-3 border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>Portfolios ({pagination.total})</h3>
          <input
            className="ref-input ml-auto w-full max-w-sm"
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(1)}
          />
          <button type="button" className="ref-btn-outline" onClick={() => load(1)}>
            Search
          </button>
        </div>

        {loading ? (
          <p className={`px-5 py-10 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading portfolios...</p>
        ) : items.length ? (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((student) => (
              <div
                key={student._id}
                className={`flex min-h-[260px] items-stretch gap-4 rounded-2xl border p-4 text-left ${
                  dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-4">
                    <StudentAvatar student={student} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                        {student.firstName} {student.lastName}
                      </p>
                      <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{student.admissionNo}</p>
                      <p className={`mt-1 text-sm ${dark ? "text-[#e2e8f0]" : "text-slate-600"}`}>
                        {student.className} - {student.section || "A"}
                      </p>
                      {student.monthlyFee ? (
                        <p className={`mt-1 text-xs font-medium ${dark ? "text-blue-400" : "text-blue-600"}`}>
                          Monthly: Rs. {Number(student.monthlyFee).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className={`mt-4 rounded-2xl border p-3 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-100 bg-slate-50/70"}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Documents</p>
                    <div className="mt-3 space-y-2">
                      {getStudentDocuments(student).map((docGroup) => {
                        const hasDocs = docGroup.items.length > 0;
                        return (
                          <button
                            key={docGroup.key}
                            type="button"
                            disabled={!hasDocs}
                            onClick={(e) => {
                              e.stopPropagation();
                              openDocuments(student, docGroup.label, docGroup.items);
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                              hasDocs
                                ? dark
                                  ? "border-white/[0.06] bg-[#1a1b26] hover:border-blue-500/40 hover:bg-blue-500/10"
                                  : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/60"
                                : dark
                                  ? "cursor-not-allowed border-dashed border-white/[0.06] bg-[#161722] text-[#9e9e9e]"
                                  : "cursor-not-allowed border-dashed border-slate-200 bg-slate-100 text-slate-400"
                            }`}
                          >
                            <span className="min-w-0">
                              <span className={`flex items-center gap-2 text-sm font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                                <IconDocument className={`h-4 w-4 ${dark ? "text-blue-400" : "text-blue-600"}`} />
                                <span className="truncate">{docGroup.label}</span>
                              </span>
                              <span className={`mt-0.5 block text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{docGroup.subtitle}</span>
                            </span>
                            <span
                              className={`ml-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                                hasDocs
                                  ? dark
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                    : "border-blue-200 bg-blue-50 text-blue-700"
                                  : dark
                                    ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]"
                                    : "border-slate-200 bg-slate-50 text-slate-300"
                              }`}
                            >
                              <IconEye />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`px-5 py-10 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>No students found for this class.</p>
        )}

        <TablePagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onPrev={() => load(Math.max(page - 1, 1))}
          onNext={() => load(Math.min(page + 1, pagination.totalPages))}
          dark={dark}
        />
      </div>

      {documentModal ? (
        <div className="modal-backdrop-enter fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-[2px]">
          <div className={`modal-panel-enter w-full max-w-5xl overflow-hidden rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
            <div className={`border-b px-6 py-5 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${dark ? "text-blue-400" : "text-blue-600"}`}>Student Documents</p>
                  <h3 className={`mt-1 text-xl font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                    {documentModal.student?.firstName} {documentModal.student?.lastName}
                  </h3>
                  <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    {documentModal.student?.admissionNo || "-"} | {documentModal.student?.className || "-"} - {documentModal.student?.section || "A"}
                  </p>
                </div>
                <button
                  type="button"
                  className={`ref-btn-outline ${dark ? "border-white/[0.06] bg-[#1a1b26] text-[#e2e8f0] hover:bg-white/[0.04]" : ""}`}
                  onClick={() => setDocumentModal(null)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex min-h-[520px] flex-col p-4">
                {activeDocument ? (
                  <>
                    <div className={`flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-slate-50"}`}>
                      {activeDocumentType === "pdf" ? (
                        <iframe
                          title={activeDocument.label}
                          src={activeDocumentUrl}
                          className="h-full w-full min-h-[460px]"
                        />
                      ) : (
                        <img
                          src={activeDocumentUrl}
                          alt={activeDocument.label}
                          className="max-h-[72vh] max-w-full object-contain"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className={`flex flex-1 items-center justify-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    No document available.
                  </div>
                )}
              </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
