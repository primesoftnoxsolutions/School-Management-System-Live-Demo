import { createPortal } from "react-dom";
import { useMemo, useState } from "react";
import api from "../../services/api/client";
import { getClassSectionOptions } from "../../constants/classes";
import ModernDatePicker from "../ui/ModernDatePicker";
import ScrollableSelect from "../ui/ScrollableSelect";

function parseLocalDateInput(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDateKey(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseClassSection(value) {
  if (!value) return { className: "", section: "" };
  const [className, section] = String(value).split("|");
  return { className: className || "", section: section || "" };
}

function validateFilters(from, to) {
  if (!from || !to) return "From date and To date are both required.";
  const fromDate = parseLocalDateInput(from);
  const toDate = parseLocalDateInput(to);
  if (!fromDate || !toDate) return "Please enter valid dates.";
  if (fromDate > toDate) return "From date cannot be after To date.";
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (toDate > today) return "To date cannot be in the future.";
  return "";
}

function matchesTeacherCreatedDateRange(teacher, from, to) {
  const createdKey = toLocalDateKey(teacher?.createdAt);
  if (!createdKey) return false;
  return createdKey >= from && createdKey <= to;
}

function matchesTeacherClassSection(teacher, className, section) {
  if (!className && !section) return true;
  const assignedClasses = teacher?.assignedClasses || [];
  if (!assignedClasses.length) return false;
  return assignedClasses.some((item) => {
    const matchesClass = !className || item.className === className;
    const matchesSection = !section || (item.section || "A") === section;
    return matchesClass && matchesSection;
  });
}

function filterTeachers(items, from, to, className, section) {
  return items.filter(
    (teacher) =>
      matchesTeacherCreatedDateRange(teacher, from, to) && matchesTeacherClassSection(teacher, className, section)
  );
}

function formatDisplayDate(value) {
  const parsed = parseLocalDateInput(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCreatedDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function formatClassSection(teacher) {
  const assignedClasses = teacher?.assignedClasses || [];
  if (!assignedClasses.length) return "-";
  const first = assignedClasses[0];
  return `${first.className || "-"} - ${first.section || "A"}`;
}

function TeacherAvatar({ name, dark = false, size = "md" }) {
  const dim = size === "lg" ? "h-20 w-20 text-xl" : "h-10 w-10 text-sm";
  const initials =
    (String(name || "")
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?");

  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full font-semibold ${
        dark ? "bg-[#7c4dff]/20 text-[#d7d2ff]" : "bg-indigo-100 text-indigo-700"
      }`}
    >
      {initials}
    </div>
  );
}

function Field({ label, value, dark = false, mono = false, className = "" }) {
  return (
    <div className={className}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>{label}</p>
      <p className={`mt-2 text-sm font-medium ${mono ? "font-mono" : ""} ${dark ? "text-white" : "text-slate-800"}`}>
        {value || "-"}
      </p>
    </div>
  );
}

function StatusPill({ active, dark = false }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? dark
            ? "bg-[#4caf50]/15 text-[#4caf50]"
            : "bg-emerald-50 text-emerald-700"
          : dark
            ? "bg-white/[0.06] text-[#9e9e9e]"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : dark ? "bg-[#9e9e9e]" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function getTeacherField(teacher, primaryKey, secondaryKey = "") {
  const primary = teacher?.[primaryKey];
  if (primary !== undefined && primary !== null && String(primary).trim()) return primary;
  const secondary = teacher?.profile?.[secondaryKey || primaryKey];
  if (secondary !== undefined && secondary !== null && String(secondary).trim()) return secondary;
  return "";
}

function getTeacherLoginPassword(teacher) {
  return teacher?.profile?.loginPassword || "";
}

function IconEye() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 10-6 0" />
      <circle cx="12" cy="9" r="3" />
    </svg>
  );
}

function TeacherProfileOverlay({ teacher, dark, loading, onClose }) {
  if (!teacher && !loading) return null;
  const groupedAssignments = groupAssignments(teacher?.assignedClasses || []);
  const loginPassword = getTeacherLoginPassword(teacher);

  return createPortal(
    <div
      className={`fixed inset-0 z-[900] flex items-center justify-center px-4 ${
        dark ? "bg-[#0b0c15]/70 backdrop-blur-sm" : "bg-slate-900/45 backdrop-blur-[2px]"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal-panel-enter w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl ${
          dark
            ? "border-white/[0.06] bg-[#161722]"
            : "border-slate-200 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {loading ? (
          <div className={`px-6 py-12 text-center text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>Loading profile...</div>
        ) : (
          <>
            <div
              className={`border-b px-6 py-5 ${
                dark ? "border-white/[0.06] bg-[#1a1b26]" : "border-slate-100 bg-gradient-to-r from-slate-50 to-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <TeacherAvatar name={teacher?.fullName} dark={dark} size="lg" />
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${dark ? "text-[#cfc8ff]" : "text-indigo-600"}`}>
                    Teacher Profile
                  </p>
                  <h4 className={`mt-1 text-[22px] font-semibold leading-tight ${dark ? "text-white" : "text-slate-900"}`}>
                    {teacher?.fullName || "—"}
                  </h4>
                  <p className={`mt-1 text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-600"}`}>{teacher?.email || "—"}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatusPill active={teacher?.isActive} dark={dark} />
                <span className={`text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  Created {teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Phone Number" value={getTeacherField(teacher, "phoneNumber", "phoneNumber")} dark={dark} mono />
                <Field label="Qualification" value={getTeacherField(teacher, "qualification", "qualification")} dark={dark} />
                <Field label="Designation" value={getTeacherField(teacher, "designation", "designation")} dark={dark} />
                <Field label="Expertise" value={getTeacherField(teacher, "expertise", "expertise")} dark={dark} />
                <Field label="Salary" value={getTeacherField(teacher, "salary", "salary") ? `Rs. ${getTeacherField(teacher, "salary", "salary")}` : ""} dark={dark} />
                <Field label="Address" value={getTeacherField(teacher, "address", "address")} dark={dark} className="sm:col-span-2" />
              </div>

              <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#1a1b26]/70" : "border-slate-200 bg-slate-50/70"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                      Login Details
                    </p>
                    <p className={`mt-1 text-xs ${dark ? "text-[#7f8197]" : "text-slate-500"}`}>
                      Credentials are available from the stored teacher profile.
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      teacher?.isActive === false
                        ? dark
                          ? "bg-white/[0.06] text-[#9e9e9e]"
                          : "bg-slate-100 text-slate-600"
                        : dark
                          ? "bg-[#4caf50]/15 text-[#4caf50]"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${teacher?.isActive === false ? "bg-slate-400" : "bg-emerald-500"}`} />
                    {teacher?.isActive === false ? "Inactive" : "Active"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Email" value={teacher?.email || "â€”"} dark={dark} mono />
                  <Field label="Password" value={loginPassword ? "Stored in profile data" : "Not recorded"} dark={dark} mono />
                </div>
              </div>

              <div className={`rounded-2xl border p-4 ${dark ? "border-white/[0.06] bg-[#1a1b26]/70" : "border-slate-200 bg-slate-50/70"}`}>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  Assigned Classes
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {groupedAssignments.length ? (
                    groupedAssignments.map((group) => (
                      <span
                        key={`${group.className}|${group.section}`}
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                          dark ? "bg-[#7c4dff]/15 text-[#7c4dff]" : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {group.className} - {group.section}
                        {group.subjects.length ? `, ${group.subjects.join(", ")}` : ""}
                      </span>
                    ))
                  ) : (
                    <span className={`text-sm ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>No assigned classes recorded.</span>
                  )}
                </div>
              </div>
            </div>

            <div className={`flex justify-end border-t px-6 py-4 ${dark ? "border-white/[0.06]" : "border-slate-100"}`}>
              <button
                type="button"
                onClick={onClose}
                className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white ${
                  dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
                }`}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

export default function TeacherProfilesModal({ dark = false }) {
  const today = todayKey();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [classSection, setClassSection] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterError, setFilterError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [appliedFrom, setAppliedFrom] = useState("");
  const [appliedTo, setAppliedTo] = useState("");
  const [appliedClassSection, setAppliedClassSection] = useState("");
  const [profileTeacher, setProfileTeacher] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const classSectionOptions = useMemo(
    () => [
      { value: "", label: "All classes" },
      ...getClassSectionOptions().map((item) => ({ value: item.value, label: item.label })),
    ],
    []
  );

  const appliedClassLabel =
    classSectionOptions.find((item) => item.value === appliedClassSection)?.label || "All classes";

  const filterSummary =
    appliedFrom && appliedTo
      ? `${appliedClassLabel} · ${
          appliedFrom === appliedTo
            ? formatDisplayDate(appliedFrom)
            : `${formatDisplayDate(appliedFrom)} to ${formatDisplayDate(appliedTo)}`
        }`
      : "";

  const handleApplyFilter = async () => {
    const message = validateFilters(fromDate, toDate);
    if (message) {
      setFilterError(message);
      return;
    }

    setLoading(true);
    setFilterError("");
    setLoadError("");

    const { className, section } = parseClassSection(classSection);

    try {
      const { data } = await api.get("/teachers", { params: { page: 1, limit: 500 } });
      const filtered = filterTeachers(data.data?.items || [], fromDate, toDate, className, section);
      setTeachers(filtered);
      setAppliedFrom(fromDate);
      setAppliedTo(toDate);
      setAppliedClassSection(classSection);
    } catch (err) {
      setTeachers([]);
      setLoadError(err.response?.data?.message || "Failed to load teacher profiles");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (teacher) => {
    setProfileLoading(true);
    setProfileTeacher(teacher);
    setProfileLoading(false);
  };

  const thClass = dark
    ? "bg-[#1a1b26] px-4 py-3 font-medium text-[#9e9e9e]"
    : "bg-slate-50 px-4 py-3 font-medium text-slate-500";
  const tdClass = dark ? "px-4 py-3 text-[#e0e0e0]" : "px-4 py-3 text-slate-700";
  const rowHover = dark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50/50";
  const borderClass = dark ? "border-white/[0.06]" : "border-slate-100";

  return (
    <>
      <div className="space-y-5">
        <div
          className={`rounded-2xl border p-4 ${
            dark ? "border-white/[0.06] bg-[#1a1b26]/60" : "border-slate-200 bg-slate-50/70"
          }`}
        >
          <p className={`mb-3 flex items-center gap-2 text-sm font-semibold ${dark ? "text-white" : "text-slate-800"}`}>
            <IconProfile />
            Filter teacher profiles
          </p>
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <ModernDatePicker
              label="From date"
              value={fromDate}
              max={toDate || today}
              dark={dark}
              onChange={(value) => {
                setFromDate(value);
                setFilterError("");
              }}
            />
            <ModernDatePicker
              label="To date"
              value={toDate}
              min={fromDate || undefined}
              max={today}
              dark={dark}
              onChange={(value) => {
                setToDate(value);
                setFilterError("");
              }}
            />
            <ScrollableSelect
              label="Class & Section"
              placeholder="All classes"
              value={classSection}
              options={classSectionOptions}
              onChange={(value) => {
                setClassSection(value);
                setFilterError("");
              }}
              menuMaxHeight={320}
              dark={dark}
            />
            <button
              type="button"
              onClick={handleApplyFilter}
              disabled={loading}
              className={`h-[42px] w-full shrink-0 rounded-xl px-5 text-sm font-semibold text-white disabled:opacity-60 xl:w-auto ${
                dark ? "bg-[#7c4dff] hover:bg-[#6a3df0]" : "ref-btn-primary"
              }`}
            >
              {loading ? "Loading..." : "Apply Filter"}
            </button>
          </div>
          {filterError ? (
            <p className={`mt-3 text-sm ${dark ? "text-[#e91e63]" : "text-rose-600"}`} role="alert">
              {filterError}
            </p>
          ) : null}
          {filterSummary ? (
            <p className={`mt-3 text-xs ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
              Showing profiles for {filterSummary}
            </p>
          ) : null}
        </div>

        {loadError ? (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              dark ? "border-[#e91e63]/30 bg-[#e91e63]/10 text-[#e91e63]" : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
            role="alert"
          >
            {loadError}
          </div>
        ) : null}

        {!appliedFrom && !loading ? (
          <div
            className={`rounded-xl border px-4 py-10 text-center text-sm ${
              dark ? "border-white/[0.06] text-[#9e9e9e]" : "border-slate-200 text-slate-500"
            }`}
          >
            Select date range and class/section, then click Apply Filter to view teacher profiles.
          </div>
        ) : (
          <div className={`overflow-hidden rounded-2xl border ${dark ? "border-white/[0.06]" : "border-slate-200"}`}>
            <div
              className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm ${
                dark ? "border-white/[0.06] bg-[#1a1b26] text-[#9e9e9e]" : "border-slate-100 bg-slate-50 text-slate-600"
              }`}
            >
              <span>
                {teachers.length} teacher{teachers.length === 1 ? "" : "s"} found
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={`text-left ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                  <tr>
                    <th className={thClass}>S. No.</th>
                    <th className={thClass}>Teacher Name</th>
                    <th className={thClass}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className={`px-4 py-8 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                        Loading teacher profiles...
                      </td>
                    </tr>
                  ) : teachers.length ? (
                    teachers.map((teacher, index) => (
                      <tr key={teacher._id} className={`border-t ${borderClass} ${rowHover}`}>
                        <td className={tdClass}>{index + 1}</td>
                        <td className={`${tdClass} font-medium ${dark ? "text-white" : "text-slate-800"}`}>
                          <div className="flex items-center gap-3">
                            <TeacherAvatar name={teacher.fullName} dark={dark} />
                            <div>
                              <p className={`text-base font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                                {teacher.fullName}
                              </p>
                              <p className={`text-sm font-medium ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                                {formatCreatedDate(teacher.createdAt) ? `Created ${formatCreatedDate(teacher.createdAt)}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={tdClass}>
                          <button
                            type="button"
                            title="View full teacher profile"
                            onClick={() => handleViewProfile(teacher)}
                            className={`inline-flex items-center rounded-lg border p-1.5 transition ${
                              dark
                                ? "border-white/[0.06] text-[#9e9e9e] hover:bg-white/[0.04] hover:text-white"
                                : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            }`}
                          >
                            <IconEye />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className={`px-4 py-8 text-center ${dark ? "text-[#9e9e9e]" : "text-slate-500"}`}>
                        No teacher profiles found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <TeacherProfileOverlay
        teacher={profileTeacher}
        dark={dark}
        loading={profileLoading}
        onClose={() => {
          setProfileTeacher(null);
          setProfileLoading(false);
        }}
      />
    </>
  );
}
