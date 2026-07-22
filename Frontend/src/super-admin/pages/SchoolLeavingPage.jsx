import { useEffect, useMemo, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import PageHeader from "../components/ui/PageHeader";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import LeavingCertificatePreview from "../components/certificates/LeavingCertificatePreview";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import { withStudentBranchParams } from "../utils/branch";

const ALL_CLASSES = "ALL_CLASSES";
const ALL_SECTIONS = "ALL_SECTIONS";
const CERTIFICATE_TYPES = {
  LEAVING: {
    title: "Leaving Certificate",
    buttonLabel: "Create Leaving Certificate",
  },
  CHARACTER: {
    title: "Character Certificate",
    buttonLabel: "Create Character Certificate",
  },
};

const REASON_OPTIONS = [
  "Transfer to Another School",
  "Family Relocation",
  "Completed Education",
  "Financial Reason",
  "Personal Reason",
  "Other",
];

const STATUS_OPTIONS = ["Average", "Good", "Excellent"];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return "Auto fetch";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Auto fetch";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStudentLabel(student) {
  if (!student) return "";
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Student";
  const roll = student.rollNumber ? `Roll ${student.rollNumber}` : "No roll";
  const admissionNo = student.admissionNo ? `ID ${student.admissionNo}` : "";
  const classSection = student.className ? `${student.className} ${student.section || "A"}` : "";
  return [fullName, classSection, roll, admissionNo].filter(Boolean).join(" - ");
}

function matchesFilter(student, className, section) {
  if (className !== ALL_CLASSES && student.className !== className) return false;
  if (section !== ALL_SECTIONS && (student.section || "A") !== section) return false;
  return true;
}

function createEmptyForm(certificateType = "LEAVING") {
  return {
    certificateType,
    className: ALL_CLASSES,
    section: ALL_SECTIONS,
    studentId: "",
    dateOfAdmission: "",
    dateOfLeaving: todayKey(),
    reasonForLeaving: "",
    conduct: "Good",
    remarks: "",
  };
}

function AutoInfoCard({ label, value, dark = false }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-200 bg-slate-50"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-1.5 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{value || "Auto fetch"}</p>
    </div>
  );
}

function SectionLabel({ children, dark = false }) {
  return <p className={`mb-2 text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-700"}`}>{children}</p>;
}

function CertificateRows({ items, dark, onView }) {
  if (!items.length) {
    return (
      <tr>
        <td colSpan={8} className={`px-5 py-8 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
          No certificates yet.
        </td>
      </tr>
    );
  }

  return items.map((item) => (
    <tr key={item._id} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
      <td className={`px-5 py-3 font-medium ${dark ? "text-white" : ""}`}>{item.certificateNo}</td>
      <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.studentName}</td>
      <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>
        {item.className} - {item.section}
      </td>
      <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.dateOfAdmission ? new Date(item.dateOfAdmission).toLocaleDateString() : "-"}</td>
      <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{new Date(item.dateOfLeaving).toLocaleDateString()}</td>
      <td className="px-5 py-3">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
            item.conduct === "Excellent"
              ? "bg-emerald-50 text-emerald-700"
              : item.conduct === "Good"
                ? "bg-blue-50 text-blue-700"
                : "bg-amber-50 text-amber-700"
          }`}
        >
          {item.conduct || "-"}
        </span>
      </td>
      <td className={`px-5 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.reasonForLeaving}</td>
      <td className="px-5 py-3">
        <button type="button" className="ref-btn-outline text-xs" onClick={() => onView(item._id)}>
          View Certificate
        </button>
      </td>
    </tr>
  ));
}

function CertificateSection({
  title,
  certificateType,
  items,
  loading,
  dark,
  onCreate,
  onView,
  classFilter,
  sectionFilter,
  classOptions,
  sectionOptions,
  onClassChange,
  onSectionChange,
}) {
  const heading = CERTIFICATE_TYPES[certificateType]?.title || title;
  const filteredItems = items.filter((item) => {
    if (classFilter !== ALL_CLASSES && item.className !== classFilter) return false;
    if (sectionFilter !== ALL_SECTIONS && (item.section || "A") !== sectionFilter) return false;
    return true;
  });

  return (
    <div className={`overflow-hidden rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
      <div className={`flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
        <div>
          <h3 className={`text-base font-semibold ${dark ? "text-white" : "text-slate-800"}`}>{heading}</h3>
          <p className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
            Issue, review, and print {heading.toLowerCase()} records for departing students.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ScrollableSelect
            label=""
            placeholder="All Classes"
            value={classFilter}
            options={classOptions}
            onChange={onClassChange}
            dark={dark}
            portal
            menuMaxHeight={220}
          />
          <ScrollableSelect
            label=""
            placeholder="All Sections"
            value={sectionFilter}
            options={sectionOptions}
            onChange={onSectionChange}
            dark={dark}
            portal
            menuMaxHeight={220}
          />
          <button type="button" className="ref-btn-primary whitespace-nowrap" onClick={onCreate}>
            + {CERTIFICATE_TYPES[certificateType]?.buttonLabel || "Create Certificate"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-5 py-3 font-medium">Certificate No</th>
              <th className="px-5 py-3 font-medium">Student</th>
              <th className="px-5 py-3 font-medium">Class</th>
              <th className="px-5 py-3 font-medium">Admission Date</th>
              <th className="px-5 py-3 font-medium">Leaving Date</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Reason</th>
              <th className="px-5 py-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className={`px-5 py-8 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  Loading...
                </td>
              </tr>
            ) : (
              <CertificateRows items={filteredItems} dark={dark} onView={onView} />
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SchoolLeavingPage({ role, dark = false, branchSection = "Boys" }) {
  const canCreate = role === "SUPER_ADMIN";
  const [form, setForm] = useState(() => createEmptyForm("LEAVING"));
  const [leavingClassFilter, setLeavingClassFilter] = useState(ALL_CLASSES);
  const [leavingSectionFilter, setLeavingSectionFilter] = useState(ALL_SECTIONS);
  const [characterClassFilter, setCharacterClassFilter] = useState(ALL_CLASSES);
  const [characterSectionFilter, setCharacterSectionFilter] = useState(ALL_SECTIONS);
  const [students, setStudents] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [activeType, setActiveType] = useState("LEAVING");
  const [preview, setPreview] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [certRes, studentRes] = await Promise.all([
        api.get("/school-leaving", { params: { page: 1, limit: 50 } }),
        api.get("/students", {
          params: withStudentBranchParams({ page: 1, limit: 300, status: "ACTIVE" }, branchSection),
        }),
      ]);
      setItems(certRes.data.data.items || []);
      setStudents(studentRes.data.data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchSection]);

  const classOptions = useMemo(
    () => [
      { value: ALL_CLASSES, label: "All Classes" },
      ...CLASS_OPTIONS.map((item) => ({ value: item, label: item })),
    ],
    []
  );

  const sectionOptions = useMemo(
    () => [
      { value: ALL_SECTIONS, label: "All Sections" },
      ...SECTION_OPTIONS.map((item) => ({ value: item, label: `Section ${item}` })),
    ],
    []
  );

  const reasonOptions = useMemo(() => REASON_OPTIONS.map((item) => ({ value: item, label: item })), []);
  const statusOptions = useMemo(() => STATUS_OPTIONS.map((item) => ({ value: item, label: item })), []);

  const filteredStudents = useMemo(
    () => students.filter((student) => matchesFilter(student, form.className, form.section)),
    [form.className, form.section, students]
  );

  const selectedStudent = useMemo(
    () => filteredStudents.find((student) => student._id === form.studentId) || null,
    [filteredStudents, form.studentId]
  );

  useEffect(() => {
    if (!showModal) return;
    if (!form.studentId) return;
    if (selectedStudent) return;
    setForm((current) => ({
      ...current,
      studentId: "",
      dateOfAdmission: "",
    }));
  }, [form.studentId, selectedStudent, showModal]);

  const openModal = (type = "LEAVING") => {
    setActiveType(type);
    setForm(createEmptyForm(type));
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setError("");
    setForm(createEmptyForm(activeType));
  };

  const selectStudent = (studentId) => {
    const student = filteredStudents.find((item) => item._id === studentId);
    setForm((current) => ({
      ...current,
      studentId,
      dateOfAdmission: student?.admissionDate ? new Date(student.admissionDate).toISOString().slice(0, 10) : "",
      dateOfLeaving: todayKey(),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        certificateType: activeType,
        studentId: form.studentId,
        dateOfLeaving: form.dateOfLeaving || todayKey(),
        dateOfAdmission: form.dateOfAdmission || undefined,
        reasonForLeaving: form.reasonForLeaving,
        conduct: form.conduct,
        remarks: form.remarks,
      };
      const { data } = await api.post("/school-leaving", payload);
      setItems((prev) => [data.data, ...prev]);
      setPreview(data.data);
      closeModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create certificate");
    } finally {
      setSaving(false);
    }
  };

  const viewCert = async (id) => {
    try {
      const { data } = await api.get(`/school-leaving/${id}`);
      setPreview(data.data);
    } catch {
      setError("Failed to load certificate");
    }
  };

  const leavingItems = useMemo(
    () => items.filter((item) => (item.certificateType || "LEAVING") === "LEAVING"),
    [items]
  );
  const characterItems = useMemo(
    () => items.filter((item) => (item.certificateType || "LEAVING") === "CHARACTER"),
    [items]
  );

  return (
    <section className="space-y-6">
      <PageHeader
        title="Leaving & Character"
        subtitle="Issue and manage leaving and character certificates for departing students."
        actionLabel={canCreate ? null : null}
        dark={dark}
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <CertificateSection
        title="Leaving Certificate"
        certificateType="LEAVING"
        items={leavingItems}
        loading={loading}
        dark={dark}
        onCreate={() => canCreate && openModal("LEAVING")}
        onView={viewCert}
        classFilter={leavingClassFilter}
        sectionFilter={leavingSectionFilter}
        classOptions={classOptions}
        sectionOptions={sectionOptions}
        onClassChange={setLeavingClassFilter}
        onSectionChange={setLeavingSectionFilter}
      />

      <CertificateSection
        title="Character Certificate"
        certificateType="CHARACTER"
        items={characterItems}
        loading={loading}
        dark={dark}
        onCreate={() => canCreate && openModal("CHARACTER")}
        onView={viewCert}
        classFilter={characterClassFilter}
        sectionFilter={characterSectionFilter}
        classOptions={classOptions}
        sectionOptions={sectionOptions}
        onClassChange={setCharacterClassFilter}
        onSectionChange={setCharacterSectionFilter}
      />

      <FormModal
        open={showModal}
        title={activeType === "CHARACTER" ? "Create Character Certificate" : "Create Leaving Certificate"}
        onClose={closeModal}
        maxWidthClass="max-w-3xl"
        dark={dark}
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <ScrollableSelect
              label="Class"
              value={form.className}
              options={classOptions}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  className: value,
                  studentId: "",
                  dateOfAdmission: "",
                }));
              }}
              dark={dark}
              portal
              menuMaxHeight={220}
            />
            <ScrollableSelect
              label="Section"
              value={form.section}
              options={sectionOptions}
              onChange={(value) => {
                setForm((current) => ({
                  ...current,
                  section: value,
                  studentId: "",
                  dateOfAdmission: "",
                }));
              }}
              dark={dark}
              portal
              menuMaxHeight={220}
            />
            <ScrollableSelect
              label="Select Student"
              placeholder="Select student"
              value={form.studentId}
              options={filteredStudents.map((student) => ({
                value: student._id,
                label: getStudentLabel(student),
              }))}
              onChange={selectStudent}
              dark={dark}
              portal
              menuMaxHeight={260}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AutoInfoCard label="Admission Date" value={formatDate(form.dateOfAdmission)} dark={dark} />
            <AutoInfoCard label="Leaving Date" value={formatDate(form.dateOfLeaving)} dark={dark} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScrollableSelect
              label="Character & Conduct"
              value={form.conduct}
              options={statusOptions}
              onChange={(value) => setForm((current) => ({ ...current, conduct: value }))}
              dark={dark}
              portal
              menuMaxHeight={180}
            />
            <ScrollableSelect
              label="Reason"
              placeholder="Select reason"
              value={form.reasonForLeaving}
              options={reasonOptions}
              onChange={(value) => setForm((current) => ({ ...current, reasonForLeaving: value }))}
              dark={dark}
              portal
              menuMaxHeight={240}
            />
          </div>

          <div>
            <SectionLabel dark={dark}>Remarks</SectionLabel>
            <textarea
              rows={3}
              className={`w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none transition ${
                dark
                  ? "border-white/[0.06] bg-[#1a1b26] text-white placeholder:text-[#9e9e9e] focus:border-[#7c4dff]/40 focus:ring-2 focus:ring-[#7c4dff]/15"
                  : "border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              }`}
              placeholder="Add remarks"
              value={form.remarks}
              onChange={(e) => setForm((current) => ({ ...current, remarks: e.target.value }))}
            />
          </div>

          <div className={`flex justify-end gap-2 border-t pt-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
            <button type="button" className="ref-btn-outline" onClick={closeModal}>
              Cancel
            </button>
            <button
              type="submit"
              className="ref-btn-primary"
              disabled={saving || !form.studentId || !form.reasonForLeaving || !form.conduct}
            >
              {saving ? "Creating..." : "Generate Certificate"}
            </button>
          </div>
        </form>
      </FormModal>

      {preview ? <LeavingCertificatePreview cert={preview} onClose={() => setPreview(null)} /> : null}
    </section>
  );
}
