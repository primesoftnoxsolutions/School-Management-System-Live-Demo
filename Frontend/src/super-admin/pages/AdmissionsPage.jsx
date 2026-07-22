import { useEffect, useState } from "react";
import api from "../services/api/client";
import FormModal from "../components/ui/FormModal";
import PageHeader from "../components/ui/PageHeader";
import TablePagination from "../components/ui/TablePagination";
import CreateStudentWizard, {
  buildStudentPayload,
  createAdmissionNumber,
  initialCreateStudentForm,
} from "../components/students/CreateStudentWizard";
import { CLASS_OPTIONS, SECTION_OPTIONS } from "../constants/classes";
import ModernDatePicker from "../components/ui/ModernDatePicker";
import ScrollableSelect from "../components/ui/ScrollableSelect";
import { withStudentBranchParams } from "../utils/branch";
import AdmissionFormPreview from "../components/students/AdmissionFormPreview";

export default function AdmissionsPage({ role, dark = false, branchSection = "Boys" }) {
  const canCreate = role === "SUPER_ADMIN";
  const [showModal, setShowModal] = useState(false);
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [form, setForm] = useState(() => ({
    ...initialCreateStudentForm,
    registrationNo: createAdmissionNumber(),
  }));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 10 });

  const loadAdmissions = async (
    nextPage = page,
    nextSearch = search,
    filters = {
      fromDate,
      toDate,
      classFilter,
      sectionFilter,
    }
  ) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admissions", {
        params: withStudentBranchParams(
          {
            page: nextPage,
            limit: pagination.limit,
            search: nextSearch,
            from: filters.fromDate || "",
            to: filters.toDate || "",
            className: filters.classFilter || "",
            section: filters.sectionFilter || "",
          },
          branchSection
        ),
      });
      setItems(data.data.items || []);
      setPagination({
        total: data.data.total || 0,
        totalPages: data.data.totalPages || 1,
        limit: data.data.limit,
      });
      setPage(data.data.page);
    } catch (err) {
      setItems([]);
      setPagination({ total: 0, totalPages: 1, limit: 10 });
      setError(err.response?.data?.message || "Failed to load admissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchSection]);

  const openCreateModal = async () => {
    setError("");
    let admissionNo = createAdmissionNumber();
    try {
      const { data } = await api.get("/admissions/next-number");
      if (data?.data?.admissionNo) admissionNo = data.data.admissionNo;
    } catch {
      // keep sequential preview fallback
    }
    setForm({
      ...initialCreateStudentForm,
      registrationNo: admissionNo,
    });
    setShowModal(true);
  };

  const closeCreateModal = () => {
    setShowModal(false);
    setError("");
  };

  const applyFilterChange = (patch) => {
    const nextFilters = {
      fromDate: patch.fromDate !== undefined ? patch.fromDate : fromDate,
      toDate: patch.toDate !== undefined ? patch.toDate : toDate,
      classFilter: patch.classFilter !== undefined ? patch.classFilter : classFilter,
      sectionFilter: patch.sectionFilter !== undefined ? patch.sectionFilter : sectionFilter,
    };

    if (patch.fromDate !== undefined) setFromDate(patch.fromDate);
    if (patch.toDate !== undefined) setToDate(patch.toDate);
    if (patch.classFilter !== undefined) setClassFilter(patch.classFilter);
    if (patch.sectionFilter !== undefined) setSectionFilter(patch.sectionFilter);

    loadAdmissions(1, search, nextFilters);
  };

  const branchLabel = (student) => {
    if (student?.gender === "FEMALE") return "Girls";
    if (student?.gender === "MALE") return "Boys";
    return student?.gender || "-";
  };

  const formatFee = (value) => (Number(value || 0) > 0 ? `Rs. ${Number(value).toLocaleString()}` : "-");
  const filterSummary = `${fromDate ? new Date(fromDate).toLocaleDateString() : "All Dates"} - ${
    toDate ? new Date(toDate).toLocaleDateString() : "All Dates"
  } - ${classFilter || "All Classes"} - ${sectionFilter ? `Section ${sectionFilter}` : "All Sections"}`;

  const onCreate = async (studentForm) => {
    setSaving(true);
    setError("");
    try {
      await api.post("/admissions", buildStudentPayload(studentForm));
      setForm({
        ...initialCreateStudentForm,
        registrationNo: createAdmissionNumber(),
      });
      closeCreateModal();
      await loadAdmissions(1, search);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create admission");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <PageHeader
        title="Admissions"
        subtitle="Registration workflow, class assignment and searchable admissions register."
        actionLabel={canCreate ? "Create Admission" : null}
        onAction={canCreate ? openCreateModal : null}
        afterAction={
          <button
            type="button"
            className="ref-btn-outline whitespace-nowrap"
            onClick={() => setShowAdmissionForm(true)}
          >
            Admission Form
          </button>
        }
        dark={dark}
      />

      <div className={`space-y-4 rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[190px] flex-1">
            <ModernDatePicker
              label="From date"
              value={fromDate}
              max={toDate || undefined}
              dark={dark}
              onChange={(value) => applyFilterChange({ fromDate: value })}
            />
          </div>
          <div className="min-w-[190px] flex-1">
            <ModernDatePicker
              label="To date"
              value={toDate}
              min={fromDate || undefined}
              dark={dark}
              onChange={(value) => applyFilterChange({ toDate: value })}
            />
          </div>
          <div className="min-w-[190px] flex-1">
            <ScrollableSelect
              label="Class"
              placeholder="All Classes"
              value={classFilter}
              options={[{ value: "", label: "All Classes" }, ...CLASS_OPTIONS.map((cls) => ({ value: cls, label: cls }))]}
              onChange={(value) => applyFilterChange({ classFilter: value })}
              portal
              menuMaxHeight={320}
              dark={dark}
            />
          </div>
          <div className="min-w-[190px] flex-1">
            <ScrollableSelect
              label="Section"
              placeholder="All Sections"
              value={sectionFilter}
              options={[{ value: "", label: "All Sections" }, ...SECTION_OPTIONS.map((section) => ({ value: section, label: section }))]}
              onChange={(value) => applyFilterChange({ sectionFilter: value })}
              portal
              menuMaxHeight={320}
              dark={dark}
            />
          </div>
          <div className="ml-auto flex min-w-[260px] gap-2">
            <input
              placeholder="Search by admission no or name"
              className="ref-input w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadAdmissions(1, e.target.value)}
            />
            <button type="button" onClick={() => loadAdmissions(1, search)} className="ref-btn-outline whitespace-nowrap">
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{filterSummary}</p>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className={`overflow-hidden rounded-2xl border p-0 ${dark ? "border-white/[0.06] bg-[#161722]" : "border-slate-200 bg-white shadow-sm"}`}>
        <div className={`border-b px-4 py-3 text-sm ${dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-100 text-slate-600"}`}>
          {pagination.total} admissions found
        </div>
        <table className="min-w-full text-sm">
          <thead className={`text-left ${dark ? "bg-[#1a1b26] text-[#9e9e9e]" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-4 py-3 font-medium">Admission Date</th>
              <th className="px-4 py-3 font-medium">Admission No</th>
              <th className="px-4 py-3 font-medium">Student Name</th>
              <th className="px-4 py-3 font-medium">Class+Section</th>
              <th className="px-4 py-3 font-medium">Branch</th>
              <th className="px-4 py-3 font-medium">Admission fee</th>
              <th className="px-4 py-3 font-medium">Annual fee</th>
              <th className="px-4 py-3 font-medium">Monthly Fee</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className={`px-4 py-8 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`} colSpan={8}>
                  Loading admissions...
                </td>
              </tr>
            ) : items.length ? (
              items.map((item) => (
                <tr key={item._id} className={`border-t ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
                  <td className={`px-4 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.admissionDate ? new Date(item.admissionDate).toLocaleDateString() : "-"}</td>
                  <td className={`px-4 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{item.admissionNo || "-"}</td>
                  <td className={`px-4 py-3 ${dark ? "text-white" : ""}`}>
                    {item.firstName || item.lastName ? `${item.firstName || ""} ${item.lastName || ""}`.trim() : "-"}
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>
                    {item.className ? `${item.className}${item.section ? ` - ${item.section}` : ""}` : "-"}
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{branchLabel(item)}</td>
                  <td className={`px-4 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{formatFee(item.admissionFee)}</td>
                  <td className={`px-4 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{formatFee(item.annualFee)}</td>
                  <td className={`px-4 py-3 ${dark ? "text-[#e2e8f0]" : ""}`}>{formatFee(item.monthlyFee)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={`px-4 py-8 ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`} colSpan={8}>
                  No admissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          dark={dark}
          onPrev={() => loadAdmissions(Math.max(page - 1, 1), search)}
          onNext={() => loadAdmissions(Math.min(page + 1, pagination.totalPages), search)}
        />
      </div>

      <FormModal
        open={showModal}
        title="Add Student"
        onClose={closeCreateModal}
        wide
        dark={dark}
        scrollBody={false}
      >
        <CreateStudentWizard
          form={form}
          setForm={setForm}
          onSubmit={onCreate}
          saving={saving}
          onCancel={closeCreateModal}
          submitError={error}
          onDismissError={() => setError("")}
          mode="create"
          identifierMode="admissionNo"
          dark={dark}
        />
      </FormModal>

      <AdmissionFormPreview open={showAdmissionForm} onClose={() => setShowAdmissionForm(false)} />
    </section>
  );
}
