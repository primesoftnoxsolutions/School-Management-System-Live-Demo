import { useEffect, useMemo, useRef, useState } from "react";
import { BRANCH_OPTIONS, CLASS_OPTIONS, SECTION_OPTIONS, SUBJECT_OPTIONS } from "../../constants/classes";
import ScrollableMultiSelect from "../ui/ScrollableMultiSelect";
import ScrollableSelect from "../ui/ScrollableSelect";
import SubjectManager from "./SubjectManager";

const STEPS = [
  { id: 1, title: "Personal Info" },
  { id: 2, title: "Class Assignments" },
  { id: 3, title: "Teacher Login Details" },
];

export const NO_ASSIGN_CLASS = "NO ASSIGN";

export function isNoAssignClass(className) {
  return className === NO_ASSIGN_CLASS;
}

export const initialCreateTeacherForm = {
  fullName: "",
  cnic: "",
  address: "",
  phoneNumber: "",
  designation: "",
  qualification: "",
  expertise: "",
  salary: "",
  branch: "",
  classInchargeClasses: [],
  className: "",
  classNames: [],
  classAssignments: [],
  sections: [],
  sectionSubjects: {},
  sectionSubjectPools: {},
  email: "",
  password: "",
  confirmPassword: "",
  allowPasswordReset: true,
  documentFiles: [],
};

function Field({ label, required, children, dark = false, error = "", showTooltip = true }) {
  return (
    <div className="relative">
      <label className={`mb-1.5 block text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
      {error && showTooltip ? (
        <p className="pointer-events-none absolute left-0 top-full z-20 mt-1 rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function buildTeacherEmail(fullName = "") {
  const slug = String(fullName)
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  return slug ? `${slug}@insaf.com` : "";
}

function sanitizeEmailValue(value = "") {
  const lower = String(value).toLowerCase();
  const atIndex = lower.indexOf("@");
  if (atIndex === -1) {
    return lower.replace(/[^a-z]/g, "");
  }
  const local = lower.slice(0, atIndex).replace(/[^a-z]/g, "");
  const domain = lower.slice(atIndex + 1).replace(/[^a-z.]/g, "");
  return `${local}@${domain}`;
}

function digitsOnly(value = "") {
  return String(value).replace(/\D/g, "");
}

function formatCnicInput(value = "") {
  const digits = digitsOnly(value).slice(0, 13);
  const part1 = digits.slice(0, 5);
  const part2 = digits.slice(5, 12);
  const part3 = digits.slice(12, 13);
  if (digits.length <= 5) return part1;
  if (digits.length <= 12) return `${part1}-${part2}`;
  return `${part1}-${part2}-${part3}`;
}

function formatPhoneInput(value = "") {
  const digits = digitsOnly(value).slice(0, 11);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function inputClass(dark = false, extra = "", hasError = false) {
  const errorBorder = hasError
    ? dark
      ? "border-rose-500 ring-2 ring-rose-500/30 focus:border-rose-500 focus:ring-rose-500/30"
      : "border-rose-500 ring-2 ring-rose-200 focus:border-rose-500 focus:ring-rose-200"
    : dark
      ? "border-white/[0.06] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
      : "border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";
  return dark
    ? `w-full rounded-xl border bg-[#1a1b26] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-[#9e9e9e] ${errorBorder} ${extra}`
    : `w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition ${errorBorder} ${extra}`;
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

function EyeIcon({ open = false }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />
        <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c5 0 9.3 3.1 11 7-.5 1.2-1.2 2.3-2.1 3.2M6.1 6.1C4.2 7.4 2.7 9.2 2 12c1.7 3.9 6 7 10 7 1.4 0 2.7-.3 3.9-.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  dark = false,
  error = "",
  required = false,
  dataField = "",
  showTooltip = true,
}) {
  const [show, setShow] = useState(false);
  return (
    <Field label={label} required={required} dark={dark} error={error} showTooltip={showTooltip}>
      <div className="relative">
        <input
          data-field={dataField || undefined}
          type={show ? "text" : "password"}
          className={inputClass(dark, "pr-10", Boolean(error))}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          title={error || undefined}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 ${
            dark ? "text-[#9e9e9e] hover:bg-white/[0.06] hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          }`}
          title={show ? "Hide password" : "Show password"}
          aria-label={show ? "Hide password" : "Show password"}
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </Field>
  );
}

function DocumentPreviewModal({ file, onClose, dark = false }) {
  const [objectUrl, setObjectUrl] = useState("");

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!file || !objectUrl) return null;

  const isImage = String(file.type || "").startsWith("image/");
  const isPdf = String(file.type || "").includes("pdf") || String(file.name || "").toLowerCase().endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${
          dark ? "border-white/[0.08] bg-[#161722]" : "border-slate-200 bg-white"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div className="min-w-0">
            <p className={`truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{file.name}</p>
            <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{formatFileSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              dark ? "bg-white/[0.06] text-white hover:bg-white/[0.1]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Close
          </button>
        </div>
        <div className={`flex min-h-[320px] flex-1 items-center justify-center overflow-auto p-4 ${dark ? "bg-[#1a1b26]" : "bg-slate-50"}`}>
          {isImage ? (
            <img src={objectUrl} alt={file.name} className="max-h-[70vh] max-w-full rounded-lg object-contain" />
          ) : isPdf ? (
            <iframe title={file.name} src={objectUrl} className="h-[70vh] w-full rounded-lg border-0 bg-white" />
          ) : (
            <div className="space-y-3 text-center">
              <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>Preview not available for this file type.</p>
              <a
                href={objectUrl}
                download={file.name}
                className={`inline-flex rounded-xl px-4 py-2 text-sm font-medium text-white ${
                  dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TeacherDocumentUploadCard({ files = [], onChange, dark = false, required = false, error = "", showTooltip = true }) {
  const fileCount = files.length;
  const [previewFile, setPreviewFile] = useState(null);

  const handleFileInput = (event) => {
    const selected = Array.from(event.target.files || []);
    const merged = [...files, ...selected];
    const deduped = merged.filter(
      (file, index, list) =>
        index === list.findIndex((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified)
    );
    onChange(deduped);
    event.target.value = "";
  };

  return (
    <div
      className={`relative rounded-2xl border p-4 ${
        error
          ? dark
            ? "border-rose-500 bg-[#161722] ring-2 ring-rose-500/30"
            : "border-rose-500 bg-slate-50 ring-2 ring-rose-200"
          : dark
            ? "border-white/[0.06] bg-[#161722]"
            : "border-slate-200 bg-slate-50"
      }`}
      title={error || undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
            Upload Documents
            {required ? <span className="text-rose-500"> *</span> : null}
          </p>
          <p className={`mt-1 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Attach multiple files like CNIC, certificates, or experience letters.
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${dark ? "bg-white/[0.06] text-[#9e9e9e]" : "bg-white text-slate-600"}`}>
          {fileCount} file{fileCount === 1 ? "" : "s"}
        </span>
      </div>

      <label
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition ${
          dark
            ? "border-white/[0.10] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.03]"
            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
        }`}
      >
        <span className="text-sm font-medium">Choose multiple documents</span>
        <span className={`mt-1 text-xs ${dark ? "text-[#7f8197]" : "text-slate-500"}`}>PDF, JPG, PNG, DOC, DOCX up to 5 MB each</span>
        <input type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={handleFileInput} />
      </label>

      {fileCount ? (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm ${
                dark ? "border-white/[0.06] bg-[#1a1b26] text-white" : "border-slate-200 bg-white text-slate-800"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{file.name}</p>
                <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{formatFileSize(file.size)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewFile(file)}
                  className={`rounded-full p-1.5 ${
                    dark ? "bg-white/[0.06] text-[#9e9e9e] hover:bg-white/[0.1] hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="View document"
                  aria-label={`View ${file.name}`}
                >
                  <EyeIcon />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))}
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    dark ? "bg-white/[0.06] text-[#e91e63] hover:bg-white/[0.1]" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  }`}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error && showTooltip ? (
        <p className="pointer-events-none absolute left-3 top-full z-20 mt-1 rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
          {error}
        </p>
      ) : null}

      {previewFile ? <DocumentPreviewModal file={previewFile} onClose={() => setPreviewFile(null)} dark={dark} /> : null}
    </div>
  );
}

function createEmptyClassAssignment(className) {
  const defaultSection = SECTION_OPTIONS[0] || "A";
  return {
    className,
    classSubjects: [],
    sections: [defaultSection],
    sectionSubjects: { [defaultSection]: [] },
    sectionSubjectPools: { [defaultSection]: [...SUBJECT_OPTIONS] },
  };
}

function collectClassSubjects(sectionSubjects = {}) {
  const subjects = [];
  Object.values(sectionSubjects || {}).forEach((list) => {
    (Array.isArray(list) ? list : []).forEach((subject) => {
      if (!subjects.includes(subject)) {
        subjects.push(subject);
      }
    });
  });
  return subjects;
}

function syncSectionData(sections, subjectsMap = {}, poolsMap = {}, fallbackSubjects = []) {
  const sectionSubjects = {};
  const sectionSubjectPools = {};
  sections.forEach((section, index) => {
    const existingSubjects = Array.isArray(subjectsMap[section]) ? subjectsMap[section] : [];
    sectionSubjects[section] = existingSubjects.length ? existingSubjects : index === 0 ? [...fallbackSubjects] : [];
    sectionSubjectPools[section] = poolsMap[section]?.length ? poolsMap[section] : [...SUBJECT_OPTIONS];
  });
  return { sectionSubjects, sectionSubjectPools };
}

function syncClassAssignments(selectedClasses, existingAssignments = []) {
  const lookup = new Map((existingAssignments || []).map((item) => [item.className, item]));
  return selectedClasses.map((className) => {
    const existing = lookup.get(className);
    return existing
      ? {
          className,
          classSubjects: existing.classSubjects || [],
          sections: existing.sections || [],
          sectionSubjects: existing.sectionSubjects || {},
          sectionSubjectPools: existing.sectionSubjectPools || {},
        }
      : createEmptyClassAssignment(className);
  });
}

function getNextAvailableSection(selectedSections = []) {
  return SECTION_OPTIONS.find((section) => !selectedSections.includes(section)) || "";
}

function ClassAssignmentCard({
  assignment,
  sectionOptions,
  subjectOptions,
  dark,
  classIndex = 0,
  fieldErrors = {},
  firstErrorKey = "",
  onSectionsChange,
  onSectionSubjectsChange,
  onSectionSubjectPoolChange,
  onAddSection,
  onRemoveSection,
}) {
  const sections = assignment.sections || [];
  const sectionCount = sections.length;

  return (
    <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/[0.08] bg-[#161722]" : "border-slate-200 bg-white"}`}>
      <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <div className="min-w-0">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Class
          </p>
          <h5 className={`truncate text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{assignment.className}</h5>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${dark ? "bg-white/[0.06] text-[#9e9e9e]" : "bg-slate-50 text-slate-600"}`}>
          {sectionCount} Section{sectionCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="px-4 py-4">
        <div className={`grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b pb-2 text-xs font-semibold ${dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-100 text-slate-500"}`}>
          <div>
            Section<span className="text-rose-500"> *</span>
          </div>
          <div>
            Assign Subjects<span className="text-rose-500"> *</span>
          </div>
        </div>
        <div className="space-y-3 pt-3">
          {sections.length ? (
            [...sections]
              .sort(
                (a, b) => sectionOptions.findIndex((opt) => opt.value === a) - sectionOptions.findIndex((opt) => opt.value === b)
              )
              .map((section) => {
              const sectionSubjects = assignment.sectionSubjects?.[section] || [];
              const sectionSubjectOptions = assignment.sectionSubjectPools?.[section]?.length
                ? assignment.sectionSubjectPools[section].map((item) => ({ value: item, label: item }))
                : subjectOptions;
              const subjectErrorKey = `subjects:${assignment.className}:${section}`;
              const sectionErrorKey = `sections:${assignment.className}`;
              const subjectError = fieldErrors[subjectErrorKey] || "";
              const sectionError = fieldErrors[sectionErrorKey] || "";

              return (
                <div key={section} className="relative grid grid-cols-[72px_minmax(0,1fr)_24px] items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold ${
                        sectionError
                          ? "border border-rose-500 text-rose-600"
                          : dark
                            ? "bg-white/[0.06] text-white"
                            : "bg-slate-50 text-slate-700"
                      }`}
                      title={sectionError || undefined}
                    >
                      {section}
                    </div>
                  </div>

                  <div className="relative" title={subjectError || undefined}>
                    <div className={subjectError ? "rounded-xl ring-2 ring-rose-300" : ""}>
                      <SubjectManager
                        label=""
                        placeholder={`Select subjects for Section ${section}`}
                        subjects={sectionSubjectOptions.map((item) => item.value)}
                        selected={sectionSubjects}
                        onSubjectsChange={(subjects) => onSectionSubjectPoolChange?.(section, subjects)}
                        onSelectedChange={(subjects) => onSectionSubjectsChange(section, subjects)}
                        dark={dark}
                      />
                    </div>
                    {subjectError && firstErrorKey === subjectErrorKey ? (
                      <p className="pointer-events-none absolute left-0 top-full z-20 mt-1 rounded-md bg-rose-600 px-2 py-1 text-[11px] font-medium text-white shadow-lg">
                        {subjectError}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveSection?.(section)}
                    disabled={sections.length <= 1}
                    className={`flex h-7 w-7 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-30 ${
                      dark ? "text-rose-300 hover:bg-rose-500/10" : "text-rose-500 hover:bg-rose-50"
                    }`}
                    aria-label={`Remove section ${section}`}
                    title={`Remove section ${section}`}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7L5 21M5 7l14 14" />
                    </svg>
                  </button>
                </div>
              );
            })
          ) : null}
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              const nextSection = getNextAvailableSection(sections);
              if (nextSection) onAddSection?.(nextSection);
            }}
            disabled={sections.length >= SECTION_OPTIONS.length}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              dark
                ? "border-white/[0.14] text-[#9e9e9e] hover:bg-white/[0.04]"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="text-lg leading-none">+</span>
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
}

function ClassAssignmentFields({
  form,
  classOptions,
  branchOptions,
  sectionOptions,
  subjectOptions,
  hasNoAssignment,
  fieldErrors = {},
  firstErrorKey = "",
  onClassNamesChange,
  onBranchChange,
  onClassInchargeChange,
  onClassAssignmentSectionsChange,
  onClassAssignmentSectionSubjectsChange,
  onClassAssignmentSectionPoolChange,
  onClassAssignmentAddSection,
  onClassAssignmentRemoveSection,
  dark,
}) {
  const assignments = form.classAssignments || [];
  const inchargeOptions = (form.classNames || [])
    .filter((item) => !isNoAssignClass(item))
    .map((cls) => ({ value: cls, label: cls }));

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ScrollableMultiSelect
          label="Classes"
          placeholder="Select classes"
          values={form.classNames}
          options={classOptions}
          onChange={onClassNamesChange}
          required
          openUpward
          dark={dark}
          dataField="classNames"
          error={Boolean(fieldErrors.classNames)}
          errorMessage={fieldErrors.classNames || ""}
          showTooltip={firstErrorKey === "classNames"}
        />
        <ScrollableSelect
          label="Branch"
          placeholder="Select branch"
          value={form.branch}
          options={branchOptions}
          onChange={onBranchChange}
          required
          disabled={hasNoAssignment}
          openUpward
          dark={dark}
          dataField="branch"
          error={Boolean(fieldErrors.branch)}
          errorMessage={fieldErrors.branch || ""}
          showTooltip={firstErrorKey === "branch"}
        />
        <ScrollableMultiSelect
          label="Class-Incharge"
          placeholder="Select class incharge"
          values={form.classInchargeClasses || []}
          options={inchargeOptions}
          onChange={onClassInchargeChange}
          required={!hasNoAssignment}
          disabled={hasNoAssignment || !inchargeOptions.length}
          openUpward
          dark={dark}
          dataField="classInchargeClasses"
          error={Boolean(fieldErrors.classInchargeClasses)}
          errorMessage={fieldErrors.classInchargeClasses || ""}
          showTooltip={firstErrorKey === "classInchargeClasses"}
        />
      </div>

      {hasNoAssignment ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          No class assignment selected. You can assign classes later from Edit.
        </div>
      ) : null}

      {!hasNoAssignment && assignments.length ? (
        <div className="scrollbar-app max-h-[46vh] space-y-5 overflow-y-auto pr-2">
          {assignments.map((assignment, index) => (
            <ClassAssignmentCard
              key={assignment.className}
              assignment={assignment}
              sectionOptions={sectionOptions}
              subjectOptions={subjectOptions}
              dark={dark}
              classIndex={index}
              fieldErrors={fieldErrors}
              firstErrorKey={firstErrorKey}
              onSectionsChange={(sections) => onClassAssignmentSectionsChange(assignment.className, sections)}
              onSectionSubjectsChange={(section, subjects) =>
                onClassAssignmentSectionSubjectsChange(assignment.className, section, subjects)
              }
              onSectionSubjectPoolChange={(section, subjects) =>
                onClassAssignmentSectionPoolChange(assignment.className, section, subjects)
              }
              onAddSection={(section) => onClassAssignmentAddSection(assignment.className, section)}
              onRemoveSection={(section) => onClassAssignmentRemoveSection(assignment.className, section)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

export function buildAssignmentsFromSelection(classNameOrAssignments, branch, sections, sectionSubjects) {
  const normalizedBranch = branch === "Boys" ? "Boys" : "Girls";
  const assignments = [];

  if (Array.isArray(classNameOrAssignments) && classNameOrAssignments.length && typeof classNameOrAssignments[0] === "object") {
    for (const block of classNameOrAssignments) {
      const className = String(block.className || "").trim();
      if (!className || isNoAssignClass(className)) continue;
      for (const section of block.sections || []) {
        const subjects = block.sectionSubjects?.[section]?.length
          ? block.sectionSubjects[section]
          : block.classSubjects?.length
            ? block.classSubjects
            : [];
        for (const subject of subjects) {
          assignments.push({ className, branch: normalizedBranch, section, subject });
        }
      }
    }
    return assignments;
  }

  const classNames = Array.isArray(classNameOrAssignments) ? classNameOrAssignments : [classNameOrAssignments];
  const selectedClasses = classNames.map((item) => String(item || "").trim()).filter(Boolean);
  if (!selectedClasses.length || selectedClasses.every(isNoAssignClass)) return [];

  for (const selectedClass of selectedClasses) {
    if (isNoAssignClass(selectedClass)) continue;
    for (const section of sections || []) {
      const subjects = sectionSubjects?.[section] || [];
      for (const subject of subjects) {
        assignments.push({ className: selectedClass, branch: normalizedBranch, section, subject });
      }
    }
  }
  return assignments;
}

export function assignedClassesToFormState(assignedClasses = [], teacher = {}) {
  const profile = teacher.profile || {};
  const base = {
    ...initialCreateTeacherForm,
    fullName: teacher.fullName || "",
    email: teacher.email || "",
    cnic: profile.cnic || "",
    address: profile.address || "",
    phoneNumber: profile.phoneNumber || "",
    designation: profile.designation || "",
    qualification: profile.qualification || "",
    expertise: profile.expertise || "",
    salary: profile.salary != null && profile.salary !== "" ? String(profile.salary) : "",
    documentFiles: [],
  };

  if (!assignedClasses.length) {
    return {
      ...base,
      className: NO_ASSIGN_CLASS,
      classNames: [NO_ASSIGN_CLASS],
      classAssignments: [],
      classSubjects: [],
      sections: [],
      sectionSubjects: {},
      sectionSubjectPools: {},
      classInchargeClasses: Array.isArray(teacher.classInchargeClasses)
        ? teacher.classInchargeClasses
        : Array.isArray(profile.classInchargeClasses)
          ? profile.classInchargeClasses
          : [],
      branch: profile.branch === "Boys" || profile.branch === "Girls" ? profile.branch : "",
    };
  }

  const classNames = [...new Set(assignedClasses.map((row) => row.className || "").filter(Boolean))].sort(
    (a, b) => CLASS_OPTIONS.indexOf(a) - CLASS_OPTIONS.indexOf(b)
  );
  const branch = assignedClasses[0].branch === "Boys" ? "Boys" : "Girls";
  const classAssignments = classNames.map((className) => {
    const rows = assignedClasses.filter((row) => (row.className || "") === className);
    const sections = [...new Set(rows.map((row) => row.section || "A"))].sort(
      (a, b) => SECTION_OPTIONS.indexOf(a) - SECTION_OPTIONS.indexOf(b)
    );
    const sectionSubjects = {};
    const sectionSubjectPools = {};

    sections.forEach((section) => {
      const subjects = rows
        .filter((row) => (row.section || "A") === section)
        .map((row) => row.subject || "Class Teacher")
        .filter(Boolean);
      sectionSubjects[section] = subjects;
      const pool = [...SUBJECT_OPTIONS];
      subjects.forEach((subject) => {
        if (!pool.some((item) => item.toLowerCase() === subject.toLowerCase())) {
          pool.push(subject);
        }
      });
      sectionSubjectPools[section] = pool;
    });

    return {
      className,
      classSubjects: [...new Set(rows.map((row) => row.subject || "Class Teacher").filter(Boolean))],
      sections,
      sectionSubjects,
      sectionSubjectPools,
    };
  });

  const firstClass = classNames[0] || "";
  const firstAssignment = classAssignments[0] || createEmptyClassAssignment(firstClass);

  return {
    ...base,
    branch,
    classInchargeClasses: Array.isArray(teacher.classInchargeClasses)
      ? teacher.classInchargeClasses
      : Array.isArray(profile.classInchargeClasses)
        ? profile.classInchargeClasses
        : [],
    className: firstClass || NO_ASSIGN_CLASS,
    classNames: classNames.length ? classNames : [NO_ASSIGN_CLASS],
    classAssignments,
    sections: firstAssignment.sections || [],
    sectionSubjects: firstAssignment.sectionSubjects || {},
    sectionSubjectPools: firstAssignment.sectionSubjectPools || {},
  };
}

export default function CreateTeacherWizard({
  form,
  setForm,
  onSubmit,
  saving,
  onCancel,
  onTitleChange,
  dark = false,
  mode = "create",
  submitError = "",
  onDismissError,
  assignPanel = "classes",
  assignTeacher = null,
}) {
  const isAssignMode = mode === "assign";
  const isImportMode = mode === "import";
  const [step, setStep] = useState(isAssignMode ? 2 : 1);
  const [stepDirection, setStepDirection] = useState("forward");
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailManuallyEdited, setEmailManuallyEdited] = useState(false);
  const skipErrorDismissRef = useRef(false);
  const firstErrorKey = Object.keys(fieldErrors)[0] || "";
  const activeAssignPanel = assignPanel === "profile" || assignPanel === "documents" ? assignPanel : "classes";

  const dismissFieldErrors = () => {
    if (skipErrorDismissRef.current) return;
    setFieldErrors((prev) => (Object.keys(prev).length ? {} : prev));
  };

  useEffect(() => {
    setFieldErrors({});
  }, [step]);

  useEffect(() => {
    if (!onTitleChange) return;
    const name = form.fullName?.trim() || "";
    onTitleChange(isAssignMode || step >= 2 ? name : "");
  }, [step, form.fullName, onTitleChange, isAssignMode]);

  useEffect(() => {
    if (!isAssignMode) return;
    setFieldErrors({});
  }, [activeAssignPanel, isAssignMode]);

  useEffect(() => {
    if (isAssignMode || step !== 3 || emailManuallyEdited) return;
    const nextEmail = buildTeacherEmail(form.fullName);
    if (!nextEmail || form.email === nextEmail) return;
    setForm((prev) => ({ ...prev, email: nextEmail }));
  }, [step, form.fullName, form.email, emailManuallyEdited, isAssignMode, setForm]);

  const classOptions = useMemo(() => {
    const options = CLASS_OPTIONS.map((cls) => ({ value: cls, label: cls }));
    return [{ value: NO_ASSIGN_CLASS, label: "NO ASSIGN" }, ...options];
  }, []);
  const branchOptions = useMemo(() => BRANCH_OPTIONS.map((branch) => ({ value: branch, label: branch })), []);
  const sectionOptions = useMemo(
    () => SECTION_OPTIONS.map((sec) => ({ value: sec, label: `Section ${sec}` })),
    []
  );
  const subjectOptions = useMemo(() => SUBJECT_OPTIONS.map((subject) => ({ value: subject, label: subject })), []);

  const selectedClassNames = Array.isArray(form.classNames) ? form.classNames : form.className ? [form.className] : [];
  const activeAssignments = Array.isArray(form.classAssignments) ? form.classAssignments : [];
  const hasNoAssignment = selectedClassNames.includes(NO_ASSIGN_CLASS);

  const clearFieldError = (key) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const update = (patch, clearKeys = []) => {
    onDismissError?.();
    clearKeys.forEach((key) => clearFieldError(key));
    Object.keys(patch).forEach((key) => clearFieldError(key));
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleClassNamesChange = (classNames) => {
    const normalized = Array.isArray(classNames)
      ? classNames.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    const actualClasses = normalized.filter((item) => !isNoAssignClass(item));
    clearFieldError("classNames");
    clearFieldError("classInchargeClasses");

    if (actualClasses.length) {
      setForm((prev) => ({
        ...prev,
        className: actualClasses[0] || "",
        classNames: actualClasses,
        classAssignments: syncClassAssignments(actualClasses, prev.classAssignments),
        classInchargeClasses: (prev.classInchargeClasses || []).filter((item) => actualClasses.includes(item)),
      }));
      onDismissError?.();
      return;
    }

    if (normalized.includes(NO_ASSIGN_CLASS)) {
      setForm((prev) => ({
        ...prev,
        className: NO_ASSIGN_CLASS,
        classNames: [NO_ASSIGN_CLASS],
        classAssignments: [],
        classInchargeClasses: [],
        branch: "",
        sections: [],
        sectionSubjects: {},
        sectionSubjectPools: {},
      }));
      onDismissError?.();
      return;
    }

    setForm((prev) => ({
      ...prev,
      className: "",
      classNames: [],
      classAssignments: [],
      classInchargeClasses: [],
      branch: "",
      sections: [],
      sectionSubjects: {},
      sectionSubjectPools: {},
    }));
    onDismissError?.();
  };

  const handleBranchChange = (branch) => {
    clearFieldError("branch");
    setForm((prev) => ({
      ...prev,
      branch,
      classAssignments: (prev.classAssignments || []).map((assignment) => {
        const defaultSection = SECTION_OPTIONS[0] || "A";
        return {
          ...assignment,
          sections: [defaultSection],
          sectionSubjects: { [defaultSection]: [] },
          sectionSubjectPools: { [defaultSection]: [...SUBJECT_OPTIONS] },
        };
      }),
    }));
    onDismissError?.();
  };

  const handleClassInchargeChange = (values) => {
    clearFieldError("classInchargeClasses");
    update({ classInchargeClasses: values });
  };

  const handleClassAssignmentSectionsChange = (className, sections) => {
    clearFieldError(`sections:${className}`);
    setForm((prev) => ({
      ...prev,
      classAssignments: (prev.classAssignments || []).map((assignment) => {
        if (assignment.className !== className) return assignment;
        const { sectionSubjects, sectionSubjectPools } = syncSectionData(
          sections,
          assignment.sectionSubjects,
          assignment.sectionSubjectPools,
          assignment.classSubjects
        );
        return {
          ...assignment,
          sections,
          sectionSubjects,
          sectionSubjectPools,
          classSubjects: collectClassSubjects(sectionSubjects),
        };
      }),
    }));
    onDismissError?.();
  };

  const handleClassAssignmentAddSection = (className, section) => {
    clearFieldError(`sections:${className}`);
    setForm((prev) => ({
      ...prev,
      classAssignments: (prev.classAssignments || []).map((assignment) =>
        assignment.className === className
          ? {
              ...assignment,
              sections: [...new Set([...(assignment.sections || []), section])],
              sectionSubjects: {
                ...(assignment.sectionSubjects || {}),
                [section]: assignment.sectionSubjects?.[section] || [],
              },
              sectionSubjectPools: {
                ...(assignment.sectionSubjectPools || {}),
                [section]: assignment.sectionSubjectPools?.[section] || [...SUBJECT_OPTIONS],
              },
            }
          : assignment
      ),
    }));
    onDismissError?.();
  };

  const handleClassAssignmentRemoveSection = (className, section) => {
    clearFieldError(`subjects:${className}:${section}`);
    setForm((prev) => ({
      ...prev,
      classAssignments: (prev.classAssignments || []).map((assignment) =>
        assignment.className === className
          ? {
              ...assignment,
              sections: (assignment.sections || []).filter((item) => item !== section),
              sectionSubjects: Object.fromEntries(
                Object.entries(assignment.sectionSubjects || {}).filter(([key]) => key !== section)
              ),
              sectionSubjectPools: Object.fromEntries(
                Object.entries(assignment.sectionSubjectPools || {}).filter(([key]) => key !== section)
              ),
            }
          : assignment
      ),
    }));
    onDismissError?.();
  };

  const handleClassAssignmentSectionSubjectsChange = (className, section, subjects) => {
    clearFieldError(`subjects:${className}:${section}`);
    setForm((prev) => ({
      ...prev,
      classAssignments: (prev.classAssignments || []).map((assignment) =>
        assignment.className === className
          ? {
              ...assignment,
              sectionSubjects: {
                ...assignment.sectionSubjects,
                [section]: subjects,
              },
              classSubjects: collectClassSubjects({
                ...(assignment.sectionSubjects || {}),
                [section]: subjects,
              }),
            }
          : assignment
      ),
    }));
    onDismissError?.();
  };

  const handleClassAssignmentSectionPoolChange = (className, section, subjects) => {
    setForm((prev) => ({
      ...prev,
      classAssignments: (prev.classAssignments || []).map((assignment) =>
        assignment.className === className
          ? {
              ...assignment,
              sectionSubjectPools: {
                ...assignment.sectionSubjectPools,
                [section]: subjects,
              },
              sectionSubjects: {
                ...assignment.sectionSubjects,
                [section]: (assignment.sectionSubjects[section] || []).filter((item) => subjects.includes(item)),
              },
            }
          : assignment
      ),
    }));
    onDismissError?.();
  };

  const collectStepErrors = (currentStep) => {
    const errors = {};
    if (currentStep === 1) {
      if (!form.fullName.trim()) errors.fullName = "Full Name is required.";
      if (!form.cnic.trim()) errors.cnic = "CNIC is required.";
      else if (digitsOnly(form.cnic).length !== 13) errors.cnic = "Enter a valid 13-digit CNIC.";
      if (!form.phoneNumber.trim()) errors.phoneNumber = "Phone Number is required.";
      else if (digitsOnly(form.phoneNumber).length < 11) errors.phoneNumber = "Enter a valid 11-digit phone number.";
      if (!form.address.trim()) errors.address = "Address is required.";
      if (!form.designation.trim()) errors.designation = "Designation is required.";
      if (!form.qualification.trim()) errors.qualification = "Qualification is required.";
      if (!String(form.salary ?? "").trim()) errors.salary = "Salary is required.";
    }
    if (currentStep === 2) {
      if (!selectedClassNames.length) errors.classNames = "Please select at least one class.";
      else if (selectedClassNames.includes(NO_ASSIGN_CLASS) && !isAssignMode) {
        errors.classNames = "Please select at least one class assignment.";
      } else if (!selectedClassNames.includes(NO_ASSIGN_CLASS)) {
        if (!form.branch) errors.branch = "Please select a branch.";
        if (!(form.classInchargeClasses || []).length) {
          errors.classInchargeClasses = "Please select Class-Incharge.";
        }
        if (!activeAssignments.length) errors.classNames = "Please configure at least one class assignment.";
        for (const assignment of activeAssignments) {
          if (!assignment.sections.length) {
            errors[`sections:${assignment.className}`] = `Add at least one section for ${assignment.className}.`;
            continue;
          }
          for (const section of assignment.sections) {
            if (!(assignment.sectionSubjects[section] || []).length) {
              errors[`subjects:${assignment.className}:${section}`] =
                `Assign at least one subject to ${assignment.className} - Section ${section}.`;
            }
          }
        }
      }
    }
    if (currentStep === 3) {
      if (!form.email.trim()) errors.email = "Email ID is required.";
      else {
        const local = form.email.split("@")[0] || "";
        if (!/^[a-z]+$/.test(local) || !form.email.includes("@")) {
          errors.email = "Email name can only contain small letters.";
        }
      }
      if (!form.password || form.password.length < 6) errors.password = "Password must be at least 6 characters.";
      if (!form.confirmPassword) errors.confirmPassword = "Confirm Password is required.";
      else if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match.";
      if (!(form.documentFiles || []).length) errors.documentFiles = "Please upload at least one document.";
    }
    return errors;
  };

  const focusFirstError = (errors) => {
    const firstKey = Object.keys(errors)[0];
    if (!firstKey) return;
    window.requestAnimationFrame(() => {
      const node = document.querySelector(`[data-field="${firstKey}"]`);
      node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });
  };

  const applyStepErrors = (currentStep) => {
    const errors = collectStepErrors(currentStep);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstError(errors);
      return false;
    }
    return true;
  };

  const runStepValidation = (currentStep) => {
    skipErrorDismissRef.current = true;
    const ok = applyStepErrors(currentStep);
    window.setTimeout(() => {
      skipErrorDismissRef.current = false;
    }, 0);
    return ok;
  };

  const goNext = () => {
    if (!runStepValidation(step)) return;
    setFieldErrors({});
    onDismissError?.();
    setStepDirection("forward");
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const goBack = () => {
    setFieldErrors({});
    onDismissError?.();
    setStepDirection("back");
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isAssignMode) {
      if (activeAssignPanel === "profile") {
        handleSaveProfile();
        return;
      }
      if (activeAssignPanel === "documents") {
        handleSaveDocuments();
        return;
      }
      handleSaveAssignments();
      return;
    }
    if (!runStepValidation(3)) return;
    setFieldErrors({});
    onSubmit(form);
  };

  const handleSaveAssignments = () => {
    if (!runStepValidation(2)) return;
    setFieldErrors({});
    onSubmit(form, { panel: "classes" });
  };

  const handleSaveProfile = () => {
    const errors = {};
    if (!(form.cnic || "").trim()) errors.cnic = "CNIC is required.";
    else if (digitsOnly(form.cnic).length !== 13) errors.cnic = "Enter a valid 13-digit CNIC.";
    if (!(form.phoneNumber || "").trim()) errors.phoneNumber = "Phone number is required.";
    if (!(form.address || "").trim()) errors.address = "Address is required.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    onSubmit(form, { panel: "profile" });
  };

  const handleSaveDocuments = () => {
    if (!(form.documentFiles || []).length) {
      setFieldErrors({ documentFiles: "Please upload at least one document." });
      return;
    }
    setFieldErrors({});
    onSubmit(form, { panel: "documents" });
  };

  const stepPanelClass = stepDirection === "back" ? "wizard-step-enter-back" : "wizard-step-enter";
  const assignTeacherProfile = assignTeacher?.profile || {};
  const assignCreatedDate = assignTeacher?.createdAt
    ? new Date(assignTeacher.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const assignJoiningDate = assignTeacherProfile.joiningDate
    ? new Date(assignTeacherProfile.joiningDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : assignCreatedDate;

  return (
    <form
      onSubmit={handleSubmit}
      onPointerDownCapture={(event) => {
        if (event.target.closest("[data-validate-action]")) return;
        dismissFieldErrors();
      }}
      className="space-y-5"
    >
      {!isAssignMode ? (
        <div className="flex items-center gap-2">
          {STEPS.map((item, index) => {
            const active = step === item.id;
            const done = step > item.id;
            return (
              <div key={item.id} className="flex flex-1 items-center gap-2">
                <div
                  className={`wizard-step-indicator flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    active ? "wizard-step-indicator-active" : ""
                  } ${
                    active || done
                      ? dark
                        ? "bg-[#7c4dff] text-white"
                        : "bg-indigo-600 text-white"
                      : dark
                        ? "bg-[#1a1b26] text-[#9e9e9e]"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.id}
                </div>
                <div className="min-w-0">
                  <p
                    className={`truncate text-xs font-semibold ${
                      active ? (dark ? "text-[#7c4dff]" : "text-indigo-700") : dark ? "text-[#9e9e9e]" : "text-slate-500"
                    }`}
                  >
                    Step {item.id}
                  </p>
                  <p
                    className={`truncate text-sm font-medium ${
                      active ? (dark ? "text-white" : "text-slate-900") : dark ? "text-[#9e9e9e]" : "text-slate-500"
                    }`}
                  >
                    {item.title}
                  </p>
                </div>
                {index < STEPS.length - 1 ? (
                  <div className={`mx-1 hidden h-px flex-1 sm:block ${dark ? "bg-white/[0.06]" : "bg-slate-200"}`} />
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="wizard-step-enter">
          {activeAssignPanel === "classes" ? (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>Step 2</p>
              <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Class Assignments</h4>
              {form.fullName ? (
                <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Assigning classes for {form.fullName}</p>
              ) : null}
            </>
          ) : activeAssignPanel === "profile" ? (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>
                Teacher Profile
              </p>
              <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                {form.fullName || "Teacher Profile"}
              </h4>
              {form.email ? <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{form.email}</p> : null}
            </>
          ) : (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>
                Upload Documents
              </p>
              <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Teacher Documents</h4>
              <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                Attach multiple files like CNIC, certificates, or experience letters.
              </p>
            </>
          )}
        </div>
      )}

      {!isAssignMode ? (
        <div key={`wizard-step-${step}`} className={stepPanelClass}>
          {step === 1 ? (
            <div className="space-y-4">
              <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Personal Info</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Full Name"
                  required
                  dark={dark}
                  error={fieldErrors.fullName || ""}
                  showTooltip={firstErrorKey === "fullName"}
                >
                  <input
                    data-field="fullName"
                    className={inputClass(dark, "", Boolean(fieldErrors.fullName))}
                    value={form.fullName}
                    onChange={(e) => update({ fullName: e.target.value })}
                    placeholder="Enter full name"
                    title={fieldErrors.fullName || undefined}
                  />
                </Field>
                <Field label="CNIC" required dark={dark} error={fieldErrors.cnic || ""} showTooltip={firstErrorKey === "cnic"}>
                  <input
                    data-field="cnic"
                    inputMode="numeric"
                    className={inputClass(dark, "", Boolean(fieldErrors.cnic))}
                    value={form.cnic}
                    onChange={(e) => update({ cnic: formatCnicInput(e.target.value) })}
                    placeholder="XXXXX-XXXXXXX-X"
                    title={fieldErrors.cnic || undefined}
                  />
                </Field>
                <Field
                  label="Phone Number"
                  required
                  dark={dark}
                  error={fieldErrors.phoneNumber || ""}
                  showTooltip={firstErrorKey === "phoneNumber"}
                >
                  <input
                    data-field="phoneNumber"
                    inputMode="numeric"
                    className={inputClass(dark, "", Boolean(fieldErrors.phoneNumber))}
                    value={form.phoneNumber}
                    onChange={(e) => update({ phoneNumber: formatPhoneInput(e.target.value) })}
                    placeholder="03XX-XXXXXXX"
                    title={fieldErrors.phoneNumber || undefined}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="Address"
                    required
                    dark={dark}
                    error={fieldErrors.address || ""}
                    showTooltip={firstErrorKey === "address"}
                  >
                    <input
                      data-field="address"
                      className={inputClass(dark, "", Boolean(fieldErrors.address))}
                      value={form.address}
                      onChange={(e) => update({ address: e.target.value })}
                      placeholder="Residential address"
                      title={fieldErrors.address || undefined}
                    />
                  </Field>
                </div>
                <Field
                  label="Designation"
                  required
                  dark={dark}
                  error={fieldErrors.designation || ""}
                  showTooltip={firstErrorKey === "designation"}
                >
                  <input
                    data-field="designation"
                    className={inputClass(dark, "", Boolean(fieldErrors.designation))}
                    value={form.designation}
                    onChange={(e) => update({ designation: e.target.value })}
                    placeholder="e.g. Senior Teacher"
                    title={fieldErrors.designation || undefined}
                  />
                </Field>
                <Field
                  label="Qualification"
                  required
                  dark={dark}
                  error={fieldErrors.qualification || ""}
                  showTooltip={firstErrorKey === "qualification"}
                >
                  <input
                    data-field="qualification"
                    className={inputClass(dark, "", Boolean(fieldErrors.qualification))}
                    value={form.qualification}
                    onChange={(e) => update({ qualification: e.target.value })}
                    placeholder="e.g. M.Ed, B.Ed"
                    title={fieldErrors.qualification || undefined}
                  />
                </Field>
                <Field label="Expertise / Favorite Subjects" dark={dark}>
                  <input
                    className={inputClass(dark)}
                    value={form.expertise}
                    onChange={(e) => update({ expertise: e.target.value })}
                    placeholder="e.g. Mathematics, Physics"
                  />
                </Field>
                <Field label="Salary" required dark={dark} error={fieldErrors.salary || ""} showTooltip={firstErrorKey === "salary"}>
                  <input
                    data-field="salary"
                    inputMode="numeric"
                    className={inputClass(dark, "", Boolean(fieldErrors.salary))}
                    value={form.salary}
                    onChange={(e) => update({ salary: digitsOnly(e.target.value) })}
                    placeholder="Monthly salary (Rs.)"
                    title={fieldErrors.salary || undefined}
                  />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div className={`rounded-[24px] border p-4 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
                <div className="mb-4">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${dark ? "text-[#7c4dff]" : "text-indigo-600"}`}>
                    Select Classes &amp; Branch
                  </p>
                </div>
                <ClassAssignmentFields
                  form={form}
                  classOptions={classOptions}
                  branchOptions={branchOptions}
                  sectionOptions={sectionOptions}
                  subjectOptions={subjectOptions}
                  hasNoAssignment={hasNoAssignment}
                  fieldErrors={fieldErrors}
                  firstErrorKey={firstErrorKey}
                  onClassNamesChange={handleClassNamesChange}
                  onBranchChange={handleBranchChange}
                  onClassInchargeChange={handleClassInchargeChange}
                  onClassAssignmentSectionsChange={handleClassAssignmentSectionsChange}
                  onClassAssignmentSectionSubjectsChange={handleClassAssignmentSectionSubjectsChange}
                  onClassAssignmentSectionPoolChange={handleClassAssignmentSectionPoolChange}
                  onClassAssignmentAddSection={handleClassAssignmentAddSection}
                  onClassAssignmentRemoveSection={handleClassAssignmentRemoveSection}
                  dark={dark}
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <h4 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>Teacher Login Details</h4>
              <Field label="Email ID" required dark={dark} error={fieldErrors.email || ""} showTooltip={firstErrorKey === "email"}>
                <input
                  data-field="email"
                  type="email"
                  className={inputClass(dark, "", Boolean(fieldErrors.email))}
                  value={form.email}
                  onChange={(e) => {
                    setEmailManuallyEdited(true);
                    update({ email: sanitizeEmailValue(e.target.value) });
                  }}
                  placeholder="teacher-name@insaf.com"
                  title={fieldErrors.email || undefined}
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PasswordField
                  label="Password"
                  required
                  dark={dark}
                  dataField="password"
                  error={fieldErrors.password || ""}
                  showTooltip={firstErrorKey === "password"}
                  value={form.password}
                  onChange={(e) => update({ password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
                <PasswordField
                  label="Confirm Password"
                  required
                  dark={dark}
                  dataField="confirmPassword"
                  error={fieldErrors.confirmPassword || ""}
                  showTooltip={firstErrorKey === "confirmPassword"}
                  value={form.confirmPassword}
                  onChange={(e) => update({ confirmPassword: e.target.value })}
                  placeholder="Re-enter password"
                />
              </div>
              <div data-field="documentFiles">
                <TeacherDocumentUploadCard
                  files={form.documentFiles || []}
                  onChange={(files) => update({ documentFiles: files }, ["documentFiles"])}
                  dark={dark}
                  required
                  error={fieldErrors.documentFiles || ""}
                  showTooltip={firstErrorKey === "documentFiles"}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div key={`wizard-assign-${activeAssignPanel}`} className="wizard-step-enter">
          {activeAssignPanel === "classes" ? (
            <div className="space-y-4">
              <ClassAssignmentFields
                form={form}
                classOptions={classOptions}
                branchOptions={branchOptions}
                sectionOptions={sectionOptions}
                subjectOptions={subjectOptions}
                hasNoAssignment={hasNoAssignment}
                fieldErrors={fieldErrors}
                firstErrorKey={firstErrorKey}
                onClassNamesChange={handleClassNamesChange}
                onBranchChange={handleBranchChange}
                onClassInchargeChange={handleClassInchargeChange}
                onClassAssignmentSectionsChange={handleClassAssignmentSectionsChange}
                onClassAssignmentSectionSubjectsChange={handleClassAssignmentSectionSubjectsChange}
                onClassAssignmentSectionPoolChange={handleClassAssignmentSectionPoolChange}
                onClassAssignmentAddSection={handleClassAssignmentAddSection}
                onClassAssignmentRemoveSection={handleClassAssignmentRemoveSection}
                dark={dark}
              />
            </div>
          ) : null}

          {activeAssignPanel === "profile" ? (
            <div className="space-y-4">
              <div className={`grid grid-cols-1 gap-3 border-b pb-4 sm:grid-cols-2 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    Qualification
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                    {form.qualification || assignTeacherProfile.qualification || "-"}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    Designation
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                    {form.designation || assignTeacherProfile.designation || "-"}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    Joining Date
                  </p>
                  <p className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{assignJoiningDate || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="CNIC" required dark={dark} error={fieldErrors.cnic || ""} showTooltip={firstErrorKey === "cnic"}>
                  <input
                    data-field="cnic"
                    inputMode="numeric"
                    className={inputClass(dark, "", Boolean(fieldErrors.cnic))}
                    value={form.cnic}
                    onChange={(e) => update({ cnic: formatCnicInput(e.target.value) })}
                    placeholder="XXXXX-XXXXXXX-X"
                    title={fieldErrors.cnic || undefined}
                  />
                </Field>
                <Field
                  label="Phone Number"
                  required
                  dark={dark}
                  error={fieldErrors.phoneNumber || ""}
                  showTooltip={firstErrorKey === "phoneNumber"}
                >
                  <input
                    data-field="phoneNumber"
                    inputMode="numeric"
                    className={inputClass(dark, "", Boolean(fieldErrors.phoneNumber))}
                    value={form.phoneNumber}
                    onChange={(e) => update({ phoneNumber: formatPhoneInput(e.target.value) })}
                    placeholder="03XX-XXXXXXX"
                    title={fieldErrors.phoneNumber || undefined}
                  />
                </Field>
                <Field label="Salary" dark={dark}>
                  <input
                    data-field="salary"
                    inputMode="numeric"
                    className={inputClass(dark)}
                    value={form.salary}
                    onChange={(e) => update({ salary: digitsOnly(e.target.value) })}
                    placeholder="Monthly salary (Rs.)"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="Address"
                    required
                    dark={dark}
                    error={fieldErrors.address || ""}
                    showTooltip={firstErrorKey === "address"}
                  >
                    <textarea
                      data-field="address"
                      rows={3}
                      className={inputClass(dark, "resize-none", Boolean(fieldErrors.address))}
                      value={form.address}
                      onChange={(e) => update({ address: e.target.value })}
                      placeholder="Residential address"
                      title={fieldErrors.address || undefined}
                    />
                  </Field>
                </div>
              </div>
            </div>
          ) : null}

          {activeAssignPanel === "documents" ? (
            <div data-field="documentFiles">
              <TeacherDocumentUploadCard
                files={form.documentFiles || []}
                onChange={(files) => update({ documentFiles: files }, ["documentFiles"])}
                dark={dark}
                required
                error={fieldErrors.documentFiles || ""}
                showTooltip={firstErrorKey === "documentFiles"}
              />
            </div>
          ) : null}
        </div>
      )}

      {submitError ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
          role="alert"
        >
          {submitError}
        </div>
      ) : null}

      <div
        className={`flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between ${
          dark ? "border-white/[0.06]" : "border-slate-100"
        }`}
      >
        <button
          type="button"
          onClick={onCancel}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            dark
              ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Cancel
        </button>
        <div className="flex gap-2">
          {!isAssignMode && step > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
                dark
                  ? "border-white/[0.06] bg-[#1a1b26] text-white hover:bg-white/[0.04]"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Back
            </button>
          ) : null}
          {isAssignMode ? (
            <button
              type="button"
              data-validate-action="true"
              onClick={
                activeAssignPanel === "profile"
                  ? handleSaveProfile
                  : activeAssignPanel === "documents"
                    ? handleSaveDocuments
                    : handleSaveAssignments
              }
              disabled={saving}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
                dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {saving
                ? "Saving..."
                : activeAssignPanel === "profile"
                  ? "Save Profile"
                  : activeAssignPanel === "documents"
                    ? "Upload Documents"
                    : "Save Assignments"}
            </button>
          ) : step < 3 ? (
            <button
              type="button"
              data-validate-action="true"
              onClick={goNext}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white ${
                dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              data-validate-action="true"
              disabled={saving}
              className={`rounded-xl px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
                dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {saving ? (isImportMode ? "Importing..." : "Creating...") : isImportMode ? "Import Teacher" : "Create Teacher"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
