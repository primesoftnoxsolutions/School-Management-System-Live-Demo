import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import PageHeader from "../components/ui/PageHeader";
import TablePagination from "../components/ui/TablePagination";
import CreateStudentWizard, {
  buildAssignmentUpdatePayload,
  buildStudentPayload,
  createRegistrationNumber,
  initialCreateStudentForm,
  mapStudentToAssignmentForm,
} from "../components/students/CreateStudentWizard";
import StudentRemoveModal from "../components/students/StudentRemoveModal";
import StudentProfilesModal from "../components/students/StudentProfilesModal";
import StudentImportModal from "../components/students/StudentImportModal";
import StudentLoginDetailsModal from "../components/students/StudentLoginDetailsModal";
import StudentProfileDetails, { StudentProfileHeaderMeta } from "../components/students/StudentProfileDetails";
import { resolveStudentPhotoUrl } from "../utils/mediaUrl";
import { formatStudentCreatedDate } from "../utils/studentFormat";
import { withStudentBranchParams } from "../utils/branch";

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

function MobileCell({ callNumber, whatsappNumber, dark = false }) {
  const call = String(callNumber || "").trim();
  const whatsapp = String(whatsappNumber || "").trim();
  if (!call && !whatsapp) {
    return <span className={dark ? "text-[#9e9e9e]" : "text-slate-400"}>—</span>;
  }

  const rowClass = `inline-flex items-center gap-1.5 text-xs leading-tight ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`;

  return (
    <div className="flex min-w-[7.5rem] flex-col gap-1">
      {call ? (
        <span className={rowClass} title="Call">
          <IconPhone dark={dark} />
          <span className="font-mono">{call}</span>
        </span>
      ) : null}
      {whatsapp ? (
        <span className={rowClass} title="WhatsApp">
          <IconWhatsApp />
          <span className="font-mono">{whatsapp}</span>
        </span>
      ) : null}
    </div>
  );
}

function IconPhone({ dark = false }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.81.36 1.6.7 2.34a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.34 1.53.57 2.34.7A2 2 0 0 1 22 16.92z"
        stroke={dark ? "#94a3b8" : "#64748b"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366" aria-hidden className="shrink-0">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

function mergeStudentInList(items, updated) {
  if (!updated?._id) return items;
  return items.map((item) =>
    item._id === updated._id
      ? {
          ...item,
          className: updated.className,
          section: updated.section,
          rollNumber: updated.rollNumber,
          subjects: updated.subjects,
          firstName: updated.firstName,
          lastName: updated.lastName,
        }
      : item
  );
}

function StatusBadge({ status, enrollmentStatus, dark = false }) {
  const active = status === "ACTIVE";
  const label = active
    ? "Active"
    : enrollmentStatus === "TERMINATED"
      ? "Inactive / Terminated"
      : enrollmentStatus === "LEFT_SCHOOL"
        ? "Inactive / Left School"
        : "Inactive";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? dark
            ? "bg-emerald-500/15 text-emerald-400"
            : "bg-emerald-50 text-emerald-700"
          : dark
            ? "bg-white/[0.06] text-[#9e9e9e]"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      {label}
    </span>
  );
}

function IconEye() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconKey() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 8a3.5 3.5 0 11-6.999.001A3.5 3.5 0 0115.5 8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.5l-7 7h-2v-2l7-7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 7.5L18 6l2 2-1.5 1.5" />
    </svg>
  );
}

function StudentAvatar({ student, size = "md" }) {
  const dim = size === "lg" ? "h-20 w-20 text-xl" : "h-10 w-10 text-sm";
  const initials = `${student?.firstName || ""}${student?.lastName || ""}`
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const photo = resolveStudentPhotoUrl(student?.studentPhotoUrl);

  if (photo) {
    return (
      <img
        src={photo}
        alt={`${student?.firstName || ""} ${student?.lastName || ""}`.trim() || initials}
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-white`}
      />
    );
  }

  return (
    <div className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700`}>
      {initials}
    </div>
  );
}

export default function StudentsPage({ role, dark = false, onToggleTheme, branchSection = "Boys" }) {
  const canManage = role === "SUPER_ADMIN";
  const [editId, setEditId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0, limit: 10 });
  const [profileStudent, setProfileStudent] = useState(null);
  const [profileEditingField, setProfileEditingField] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showProfilesModal, setShowProfilesModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [createForm, setCreateForm] = useState({ ...initialCreateStudentForm });
  const [createWizardKey, setCreateWizardKey] = useState(0);
  const [editWizardKey, setEditWizardKey] = useState(0);
  const [modalStudentName, setModalStudentName] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginStudent, setLoginStudent] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    loadStudents(1, search, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchSection]);

  const loadStudents = async (
    nextPage = page,
    nextSearch = search,
    nextStatus = statusFilter
  ) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/students", {
        params: withStudentBranchParams(
          {
            page: nextPage,
            limit: pagination.limit,
            search: nextSearch,
            status: nextStatus,
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
      setError(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setError("");
    setCreateForm({ ...initialCreateStudentForm, registrationNo: createRegistrationNumber() });
    setCreateWizardKey((key) => key + 1);
    setModalStudentName("");
    setShowStudentModal(true);
  };

  const resetForm = () => {
    setEditId(null);
    setShowStudentModal(false);
    setModalStudentName("");
    setError("");
    setCreateForm({ ...initialCreateStudentForm, registrationNo: createRegistrationNumber() });
  };

  const openProfile = async (item) => {
    setProfileSaveError("");
    setProfileEditingField(null);
    try {
      const { data } = await api.get(`/students/${item._id}`);
      setProfileStudent(data.data || item);
    } catch {
      setProfileStudent(item);
    }
  };

  const openLoginDetails = async (item) => {
    setShowLoginModal(true);
    setLoginLoading(true);
    setLoginStudent(null);
    try {
      const { data } = await api.get(`/students/${item._id}`);
      setLoginStudent(data.data || item);
    } catch {
      setLoginStudent(item);
    } finally {
      setLoginLoading(false);
    }
  };

  const saveStudentProfile = async (studentId, payload) => {
    setProfileSaving(true);
    setProfileSaveError("");
    try {
      const { data } = await api.put(`/students/${studentId}`, payload);
      const updated = data.data || null;
      if (updated) {
        setItems((prev) =>
          prev.map((item) =>
            item._id === studentId
              ? {
                  ...item,
                  ...updated,
                }
              : item
          )
        );
        setProfileStudent((current) => (current?._id === studentId ? { ...current, ...updated } : current));
        setProfileEditingField(null);
      }
      return updated;
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || "Failed to update student profile";
      setProfileSaveError(message);
      return null;
    } finally {
      setProfileSaving(false);
    }
  };

  const updateProfileDraftField = (field, value) => {
    setProfileStudent((current) => (current ? { ...current, [field]: value } : current));
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginStudent(null);
    setLoginLoading(false);
  };

  const onCreateStudent = async (wizardForm) => {
    if (!canManage) return;

    setSaving(true);
    setError("");
    try {
      const payload = buildStudentPayload(wizardForm);
      await api.post("/students", payload);
      resetForm();
      await loadStudents(1, search, statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  const onUpdateStudentAssignment = async (wizardForm) => {
    if (!canManage || !editId) return;

    setSaving(true);
    setError("");
    try {
      const payload = buildAssignmentUpdatePayload(wizardForm);
      const { data } = await api.put(`/students/${editId}`, payload);
      const updated = data.data;

      setItems((prev) => mergeStudentInList(prev, updated));
      if (profileStudent?._id === editId) {
        setProfileStudent((prev) => (prev ? { ...prev, ...updated } : prev));
      }

      const studentName = `${updated?.firstName || ""} ${updated?.lastName || ""}`.trim();
      resetForm();
      setSuccess(studentName ? `${studentName} updated successfully.` : "Student updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update student");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = async (item) => {
    if (!canManage) return;

    setError("");
    setSuccess("");
    setEditId(item._id);

    try {
      const { data } = await api.get(`/students/${item._id}`);
      const student = data.data || item;
      setCreateForm(mapStudentToAssignmentForm(student));
      setModalStudentName(`${student.firstName || ""} ${student.lastName || ""}`.trim());
    } catch {
      setCreateForm(mapStudentToAssignmentForm(item));
      setModalStudentName(`${item.firstName || ""} ${item.lastName || ""}`.trim());
    }

    setEditWizardKey((key) => key + 1);
    setShowStudentModal(true);
  };

  const onDelete = async (id) => {
    if (!canManage || !window.confirm("Are you sure you want to delete this student?")) return;
    setError("");
    try {
      await api.delete(`/students/${id}`);
      if (editId === id) resetForm();
      if (profileStudent?._id === id) setProfileStudent(null);
      await loadStudents(page, search, statusFilter);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete student");
    }
  };

  const normalizeImportHeader = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");

  const splitList = (value) =>
    String(value || "")
      .split(/[,;\n|]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const parseFlexibleDate = (value) => {
    const text = String(value || "").trim();
    if (!text) return "";
    const direct = new Date(text);
    if (!Number.isNaN(direct.getTime())) return direct.toISOString();
    const match = /^(\d{4})[-/](\d{2})[-/](\d{2})$/.exec(text);
    if (match) {
      const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      if (!Number.isNaN(date.getTime())) return date.toISOString();
    }
    return "";
  };

  const readRowValue = (raw, aliases = []) => {
    if (!raw || typeof raw !== "object") return "";
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(raw, alias)) return raw[alias];
    }
    const aliasSet = new Set(aliases.map(normalizeImportHeader));
    for (const [key, value] of Object.entries(raw)) {
      if (aliasSet.has(normalizeImportHeader(key))) return value;
    }
    return "";
  };

  const normalizeImportedStudentForm = (raw) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error("Each student entry must be a data row object.");
    }

    const fullName = String(readRowValue(raw, ["Student Name", "Full Name", "Name", "fullName", "name"]) || "").trim();
    const previousResults = Array.isArray(raw.previousResults)
      ? raw.previousResults.map((row) => ({
          previousClass: row?.previousClass || "",
          resultGrade: row?.resultGrade || "",
          percentage: row?.percentage || "",
          documentUrl: row?.documentUrl || "",
        }))
      : [];
    const subjectsValue = readRowValue(raw, ["Subjects", "Subject", "subject", "subjects"]);
    const subjects = Array.isArray(raw.subjects)
      ? raw.subjects
      : typeof subjectsValue === "string"
        ? splitList(subjectsValue)
        : [];

    return {
      ...initialCreateStudentForm,
      registrationNo:
        String(readRowValue(raw, ["Registration Number", "Admission No", "Admission Number", "Student ID", "registrationNo", "admissionNo", "studentId"]) || "").trim() ||
        createRegistrationNumber(),
      fullName,
      cnicBForm: String(readRowValue(raw, ["Student CNIC", "CNIC / B-Form", "CNIC", "B-Form", "cnicBForm", "cnic"]) || "").trim(),
      address: String(readRowValue(raw, ["Address", "address"]) || "").trim(),
      phoneNumber: String(readRowValue(raw, ["Student Mobile", "Mobile", "Phone Number", "Phone", "phoneNumber", "mobile"]) || "").trim(),
      gender: String(readRowValue(raw, ["Gender", "gender"]) || "MALE").trim().toUpperCase() || "MALE",
      dateOfBirth: parseFlexibleDate(readRowValue(raw, ["Date of Birth", "DOB", "dateOfBirth"])) || "",
      fatherName: String(readRowValue(raw, ["Father Name", "Guardian Name", "fatherName", "guardianName"]) || "").trim(),
      fatherCnic: String(readRowValue(raw, ["Father CNIC", "fatherCnic"]) || "").trim(),
      guardianPhone: String(
        readRowValue(raw, ["Call Number", "Father Mobile", "Guardian Phone", "Phone Number", "phoneNumber", "guardianPhone"]) || ""
      ).trim(),
      alternativePhone: String(readRowValue(raw, ["WhatsApp Number", "WhatsApp", "alternativePhone", "whatsappNumber"]) || "").trim(),
      fatherOccupation: String(readRowValue(raw, ["Father Occupation", "fatherOccupation"]) || "").trim(),
      previousResults,
      schoolLeavingCertificate: String(readRowValue(raw, ["School Leaving Certificate", "schoolLeavingCertificate"]) || "").trim(),
      characterCertificate: String(readRowValue(raw, ["Character Certificate", "characterCertificate"]) || "").trim(),
      className: String(readRowValue(raw, ["Class", "Class Name", "className"]) || "").trim(),
      section: String(readRowValue(raw, ["Section", "section"]) || "A").trim() || "A",
      rollNumber: String(readRowValue(raw, ["Roll No#", "Roll Number", "Roll #", "rollNumber"]) || "").trim(),
      subjects,
      subjectPool: Array.isArray(raw.subjectPool) && raw.subjectPool.length ? raw.subjectPool : [...new Set(subjects)],
      admissionFee: readRowValue(raw, ["Admission Fee", "admissionFee"]) ?? "",
      annualFee: readRowValue(raw, ["Annual Fee", "annualFee"]) ?? "",
      useInstallments:
        String(readRowValue(raw, ["Pay annual fee in installments", "Use Installments", "useInstallments"]) || "")
          .trim()
          .toLowerCase() === "true" ||
        String(readRowValue(raw, ["Pay annual fee in installments", "Use Installments", "useInstallments"]) || "")
          .trim()
          .toLowerCase() === "yes",
      installmentCount: String(readRowValue(raw, ["Number of Months", "Installment Count", "installmentCount"]) || "1").trim() || "1",
    };
  };

  const parseStudentImportFile = async (file) => {
    if (!file) {
      throw new Error("Please choose a file to import.");
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    let entries = [];

    if (["xlsx", "xls", "csv"].includes(extension)) {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("Import file is empty.");
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!rows.length) throw new Error("Import file is empty.");

      const [headerRow, ...dataRows] = rows;
      const headers = headerRow.map((header) => String(header || "").trim()).filter(Boolean);
      if (!headers.length) throw new Error("Import file is missing a header row.");

      entries = dataRows
        .filter((row) => row.some((cell) => String(cell ?? "").trim()))
        .map((row) =>
          headerRow.reduce((acc, header, index) => {
            acc[String(header || "").trim()] = row[index] ?? "";
            return acc;
          }, {})
        );
    } else if (extension === "json" || extension === "txt") {
      const text = await file.text();
      const trimmed = String(text || "").trim();
      const parsed = trimmed.startsWith("{") || trimmed.startsWith("[") ? JSON.parse(trimmed) : [];
      entries = Array.isArray(parsed) ? parsed : Array.isArray(parsed.students) ? parsed.students : [parsed];
    } else {
      throw new Error("Only .xlsx, .xls, .csv files are supported for student import.");
    }

    if (!entries.length) {
      throw new Error("Import file is empty.");
    }

    return entries.map((entry) => normalizeImportedStudentForm(entry)).filter((row) => row.fullName && row.className && row.fatherName && row.guardianPhone);
  };

  const importStudentsFromFile = async (file) => {
    if (!file) return;

    setImporting(true);
    setError("");
    setSuccess("");

    try {
      const forms = await parseStudentImportFile(file);
      if (!forms.length) {
        throw new Error("Import file must include at least one student row.");
      }

      let imported = 0;
      for (const form of forms) {
        const payload = buildStudentPayload(form);
        // eslint-disable-next-line no-await-in-loop
        await api.post("/students", payload);
        imported += 1;
      }

      setSuccess(imported === 1 ? "Student imported successfully." : `${imported} students imported successfully.`);
      await loadStudents(1, search, statusFilter);
      setShowImportModal(false);
    } catch (err) {
      setError(err.message || err.response?.data?.message || "Failed to import students");
      throw err;
    } finally {
      setImporting(false);
    }
  };

  const cardClass = dark
    ? "overflow-hidden rounded-2xl border border-white/[0.06] bg-[#161722]"
    : "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";

  return (
    <section className="space-y-6">
      <PageHeader
        title="Student Management"
        subtitle="Complete student profiles — add, edit, search and manage status."
        dark={dark}
        actionLabel={canManage ? "Add Student" : null}
        onAction={canManage ? openCreateModal : null}
        afterAction={
          canManage ? (
            <>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                disabled={importing}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                  dark
                    ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff] hover:bg-[#7c4dff]/15"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" />
                </svg>
                {importing ? "Importing..." : "Import Student"}
              </button>
              <button
                type="button"
                onClick={() => setShowRemoveModal(true)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-medium ${
                  dark
                    ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63] hover:bg-[#e91e63]/15"
                    : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 11h-6" />
                </svg>
                Student Remove at School
              </button>
            </>
          ) : null
        }
        extra={
          <button
            type="button"
            className="ref-btn-outline text-sm"
            onClick={() => setShowProfilesModal(true)}
          >
            View Students Profiles
          </button>
        }
      />

      {error && !showStudentModal && !showRemoveModal ? <p className="text-sm text-rose-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

      <div className={`overflow-hidden rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className={`flex flex-wrap items-center gap-3 border-b px-5 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
            Students ({pagination.total})
          </h3>
          <select
            className="ref-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              loadStudents(1, search, e.target.value);
            }}
          >
            <option value="">All status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <input
            className="ref-input ml-auto w-full max-w-sm"
            placeholder="Search name, ID, CNIC, mobile, father..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadStudents(1, search, statusFilter)}
          />
          <button type="button" className="ref-btn-outline" onClick={() => loadStudents(1, search, statusFilter)}>
            Search
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
              <tr>
                <th className="px-5 py-3 font-medium">Profile</th>
                <th className="px-5 py-3 font-medium">Roll No#</th>
                <th className="px-5 py-3 font-medium">Student ID</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Father</th>
                <th className="px-5 py-3 font-medium">Class</th>
                <th className="px-5 py-3 font-medium">Mobile</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className={`px-5 py-8 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    Loading students...
                  </td>
                </tr>
              ) : items.length ? (
                items.map((item) => {
                  const createdDate = formatStudentCreatedDate(item);
                  return (
                  <tr key={item._id} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                    <td className="px-5 py-3">
                      <StudentAvatar student={item} dark={dark} />
                    </td>
                    <td className={`px-5 py-3 font-mono text-base ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>{item.rollNumber || "—"}</td>
                    <td className={`px-5 py-3 font-mono text-base ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>{item.admissionNo}</td>
                    <td className="px-5 py-3">
                      <p className={`font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                        {item.firstName} {item.lastName}
                      </p>
                      {createdDate ? (
                        <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Created {createdDate}</p>
                      ) : null}
                    </td>
                    <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>{item.fatherName || item.guardianName || "-"}</td>
                    <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : "text-slate-700"}`}>
                      {item.className} - {item.section || "A"}
                    </td>
                    <td className="px-5 py-3">
                      <MobileCell
                        callNumber={item.guardianPhone}
                        whatsappNumber={item.alternativePhone}
                        dark={dark}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={item.status || "ACTIVE"} enrollmentStatus={item.enrollmentStatus} dark={dark} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          title="View student profile"
                          onClick={() => openProfile(item)}
                          className={`inline-flex items-center rounded-lg border p-1.5 transition ${
                            dark
                              ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:text-white"
                              : "border-slate-200 text-slate-500"
                          }`}
                        >
                          <IconEye />
                        </button>
                        {canManage ? (
                          <>
                            <button type="button" className="ref-btn-outline text-xs" onClick={() => onEdit(item)}>
                              Edit
                            </button>
                            <button
                              type="button"
                              title="View student login details"
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                                dark
                                  ? "border-[#7c4dff]/30 bg-[#7c4dff]/10 text-[#7c4dff]"
                                  : "border-indigo-200 bg-indigo-50 text-indigo-700"
                              }`}
                              onClick={() => openLoginDetails(item)}
                            >
                              <IconKey />
                              Login Details
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className={`px-5 py-8 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          dark={dark}
          onPrev={() => loadStudents(page - 1, search, statusFilter)}
          onNext={() => loadStudents(page + 1, search, statusFilter)}
        />
      </div>

      <FormModal
        open={showStudentModal}
        title={editId ? "Edit Student" : "Add Student"}
        subtitle={modalStudentName}
        onClose={resetForm}
        wide
        scrollBody={false}
        dark={dark}
        onToggleTheme={onToggleTheme}
      >
        {showStudentModal ? (
          <CreateStudentWizard
            key={editId ? `edit-${editId}-${editWizardKey}` : `create-${createWizardKey}`}
            mode={editId ? "assignment-edit" : "create"}
            form={createForm}
            setForm={setCreateForm}
            onSubmit={editId ? onUpdateStudentAssignment : onCreateStudent}
            saving={saving}
            onCancel={resetForm}
            onTitleChange={setModalStudentName}
            submitError={error}
            onDismissError={() => setError("")}
            dark={dark}
          />
        ) : null}
      </FormModal>

      <FormModal
        open={showProfilesModal}
        title="View Students Profiles"
        onClose={() => setShowProfilesModal(false)}
        extraWide
        dark={dark}
        onToggleTheme={onToggleTheme}
      >
        {showProfilesModal ? (
          <StudentProfilesModal
            dark={dark}
            onOpenLoginDetails={openLoginDetails}
            onEditStudent={onEdit}
          />
        ) : null}
      </FormModal>

      <FormModal
        open={showRemoveModal}
        title="Student Remove at School"
        onClose={() => setShowRemoveModal(false)}
        extraWide
        dark={dark}
        onToggleTheme={onToggleTheme}
      >
        {showRemoveModal ? (
          <StudentRemoveModal
            dark={dark}
            onRemoved={(name) => {
              setSuccess(`${name} removed from school successfully.`);
              loadStudents(page, search, statusFilter);
            }}
          />
        ) : null}
      </FormModal>

      <StudentImportModal
        open={showImportModal}
        dark={dark}
        onClose={() => setShowImportModal(false)}
        onImport={importStudentsFromFile}
        importing={importing}
      />

      <StudentLoginDetailsModal
        open={showLoginModal}
        student={loginStudent}
        loading={loginLoading}
        onClose={closeLoginModal}
        dark={dark}
      />

      {profileStudent ? (
        <div className="modal-backdrop-enter fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]">
          <div
            className={`modal-panel-enter w-full max-w-2xl overflow-hidden rounded-2xl border p-0 shadow-2xl ${
              dark
                ? "border-white/[0.06] bg-[#161722]"
                : "border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
            }`}
          >
            <div className={`border-b px-6 py-5 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-gradient-to-r from-slate-50 to-white"}`}>
              <div className="flex items-center gap-4">
                <StudentAvatar student={profileStudent} size="lg" dark={dark} />
                <div>
                  <h3 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
                    {profileStudent.firstName} {profileStudent.lastName}
                  </h3>
                  <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{profileStudent.admissionNo}</p>
                  <div className="mt-1">
                    <StatusBadge
                      status={profileStudent.status || "ACTIVE"}
                      enrollmentStatus={profileStudent.enrollmentStatus}
                      dark={dark}
                    />
                  </div>
                </div>
              </div>
              <StudentProfileHeaderMeta
                student={profileStudent}
                dark={dark}
                editingField={profileEditingField}
                onStartEdit={(field) => setProfileEditingField(field)}
                onChangeField={updateProfileDraftField}
                onCommitField={() => setProfileEditingField(null)}
                onCancelField={() => setProfileEditingField(null)}
              />
            </div>
            <StudentProfileDetails
              student={profileStudent}
              dark={dark}
              editingField={profileEditingField}
              onStartEdit={(field) => setProfileEditingField(field)}
              onChangeField={updateProfileDraftField}
              onCommitField={() => setProfileEditingField(null)}
              onCancelField={() => setProfileEditingField(null)}
            />
            <div className={`flex justify-end gap-2 border-t px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
              {profileSaveError ? (
                <div className={`mr-auto rounded-xl border px-4 py-2 text-sm ${dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
                  {profileSaveError}
                </div>
              ) : null}
              <button
                type="button"
                disabled={profileSaving}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60 ${
                  dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
                }`}
                onClick={async () => {
                  await saveStudentProfile(profileStudent._id, {
                    phoneNumber: profileStudent.phoneNumber || "",
                    guardianPhone: profileStudent.guardianPhone || "",
                    alternativePhone: profileStudent.alternativePhone || "",
                    address: profileStudent.address || "",
                  });
                }}
              >
                {profileSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className={`rounded-xl border px-5 py-2.5 text-sm font-medium ${
                  dark
                    ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => {
                  setProfileStudent(null);
                  setProfileSaveError("");
                  setProfileEditingField(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
